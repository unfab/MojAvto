// Authentication module — MojAvto.si
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase.js';

// ── Create or update user document in Firestore ──────────────────────────────
async function ensureUserDoc(user) {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        await setDoc(ref, {
            displayName: user.displayName || '',
            email: user.email,
            photoURL: user.photoURL || '',
            region: '',
            phone: '',
            sellerType: 'private',
            businessTier: null,
            companyDetails: null,
            businessRoles: [],
            membershipTier: 'free',
            membershipExpiry: null,
            createdAt: serverTimestamp(),
            averageRating: 0,
            reviewCount: 0,
        });
    }
}

// ── Email / Password Registration ─────────────────────────────────────────────
export async function registerWithEmail({ fullname, email, password, region, isBusiness, companyName, taxId, address, roles }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: fullname });
    const ref = doc(db, 'users', cred.user.uid);
    await setDoc(ref, {
        displayName: fullname,
        email,
        photoURL: '',
        region: region || '',
        phone: '',
        sellerType: isBusiness ? 'business' : 'private',
        businessTier: isBusiness ? 'unverified' : null,
        companyDetails: isBusiness ? { companyName, taxId, address } : null,
        businessRoles: isBusiness ? (roles || []) : [],
        membershipTier: 'free',
        membershipExpiry: null,
        createdAt: serverTimestamp(),
        averageRating: 0,
        reviewCount: 0,
    });
    return cred.user;
}

// ── Email / Password Login ────────────────────────────────────────────────────
export async function loginWithEmail(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
}

// ── Google Login ─────────────────────────────────────────────────────────────
export async function loginWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider);
    await ensureUserDoc(cred.user);
    return cred.user;
}

// ── Logout ────────────────────────────────────────────────────────────────────
export async function logout() {
    await signOut(auth);
}

// ── Auth state observer ───────────────────────────────────────────────────────
export function onAuth(callback) {
    return onAuthStateChanged(auth, callback);
}

// ── Get current user Firestore doc ───────────────────────────────────────────
export async function getCurrentUserDoc() {
    const user = auth.currentUser;
    if (!user) return null;
    const snap = await getDoc(doc(db, 'users', user.uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
