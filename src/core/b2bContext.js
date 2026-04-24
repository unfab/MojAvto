// b2bContext.js — Global B2B mode detection + role gating
// Single source of truth for "am I a business user?" across the app.

import { auth, db } from '../firebase.js';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const LS_KEY = 'mojavto_b2b_profile_cache';

let _profile = null;         // Firestore user doc (cached)
let _unsub = null;           // snapshot unsubscriber
const _listeners = new Set();

// ── Public API ────────────────────────────────────────────────
export function getB2BProfile() {
    return _profile;
}

export function isBusiness() {
    return _profile?.sellerType === 'business';
}

export function hasRole(role) {
    if (!isBusiness()) return false;
    const roles = _profile.businessRoles || [];
    return roles.includes(role);
}

export function getRoles() {
    return _profile?.businessRoles || [];
}

export function isVerifiedBusiness() {
    return isBusiness() && _profile.businessTier === 'verified';
}

export function onB2BChange(cb) {
    _listeners.add(cb);
    cb(_profile);
    return () => _listeners.delete(cb);
}

function _emit() {
    _listeners.forEach(cb => {
        try { cb(_profile); } catch (e) { console.warn('[b2b] listener error', e); }
    });
}

// ── Bind to auth ──────────────────────────────────────────────
// Call once at app boot; re-subscribes whenever auth user changes.
export function bindB2BContext(user) {
    // Clean previous subscription
    if (_unsub) { _unsub(); _unsub = null; }

    if (!user) {
        _profile = null;
        localStorage.removeItem(LS_KEY);
        _emit();
        return;
    }

    // Load cached profile for instant mode switch on page load
    try {
        const cached = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
        if (cached && cached.uid === user.uid) {
            _profile = cached;
            _emit();
        }
    } catch {}

    // Live Firestore snapshot — keeps tier/role updates in sync
    const ref = doc(db, 'users', user.uid);
    _unsub = onSnapshot(ref, snap => {
        if (!snap.exists()) {
            _profile = null;
            _emit();
            return;
        }
        _profile = { uid: user.uid, ...snap.data() };
        try { localStorage.setItem(LS_KEY, JSON.stringify(_profile)); } catch {}
        // Keep window globals fresh for legacy pages
        window.__currentUserProfile = _profile;
        _emit();
    }, err => {
        console.warn('[b2b] snapshot error', err);
    });
}

// ── One-shot fetch (used during guarded routes) ───────────────
export async function fetchB2BProfile(user) {
    if (!user) return null;
    if (_profile && _profile.uid === user.uid) return _profile;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) return null;
    _profile = { uid: user.uid, ...snap.data() };
    window.__currentUserProfile = _profile;
    return _profile;
}
