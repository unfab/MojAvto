// b2bService.js — All Firestore queries scoped to currentUser.uid (providerId)
// Security model: every read/write enforces providerId == auth.currentUser.uid

import { db, auth, storage } from '../firebase.js';
import {
    collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
    getDoc, getDocs, query, where, orderBy, limit, serverTimestamp
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// ── Guard helper ─────────────────────────────────────────────
function requireProvider() {
    const u = auth.currentUser;
    if (!u) throw new Error('Potrebna prijava.');
    return u.uid;
}

// ════════════════════════════════════════════════════════════════════════════
// BUSINESS / PROFILE (businesses/{providerId})
// ════════════════════════════════════════════════════════════════════════════
export async function getMyBusiness() {
    const uid = requireProvider();
    const snap = await getDoc(doc(db, 'businesses', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveMyBusiness(data) {
    const uid = requireProvider();
    await setDoc(doc(db, 'businesses', uid), {
        ...data,
        providerId: uid,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

export async function uploadBusinessAsset(file, kind /* 'logo'|'cover'|'gallery' */) {
    const uid = requireProvider();
    const path = `businesses/${uid}/${kind}/${Date.now()}_${file.name}`;
    const r = storageRef(storage, path);
    await uploadBytes(r, file);
    return await getDownloadURL(r);
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICES / PRICING (businesses/{providerId}/services/{id})
// ════════════════════════════════════════════════════════════════════════════
export async function listServices() {
    const uid = requireProvider();
    const snap = await getDocs(collection(db, 'businesses', uid, 'services'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveService(data) {
    const uid = requireProvider();
    const col = collection(db, 'businesses', uid, 'services');
    if (data.id) {
        await setDoc(doc(col, data.id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
        return data.id;
    }
    const ref = await addDoc(col, { ...data, createdAt: serverTimestamp() });
    return ref.id;
}

export async function deleteService(id) {
    const uid = requireProvider();
    await deleteDoc(doc(db, 'businesses', uid, 'services', id));
}

// ════════════════════════════════════════════════════════════════════════════
// BOOKINGS (bookings/{id}) — filter by providerId
// ════════════════════════════════════════════════════════════════════════════
export async function listMyBookings(filters = {}) {
    const uid = requireProvider();
    const clauses = [where('providerId', '==', uid)];
    if (filters.status) clauses.push(where('status', '==', filters.status));
    const q = query(collection(db, 'bookings'), ...clauses);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export async function updateBookingStatus(id, status) {
    const uid = requireProvider();
    const ref = doc(db, 'bookings', id);
    const snap = await getDoc(ref);
    if (!snap.exists() || snap.data().providerId !== uid) {
        throw new Error('Dostop zavrnjen.');
    }
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
}

export async function blockSlot(date, time, reason) {
    const uid = requireProvider();
    await addDoc(collection(db, 'bookings'), {
        providerId: uid,
        date, time,
        status: 'blocked',
        notes: reason || 'Blokiran termin',
        createdAt: serverTimestamp(),
    });
}

// ════════════════════════════════════════════════════════════════════════════
// INVENTORY (inventory/{id}) — dealer
// ════════════════════════════════════════════════════════════════════════════
export async function listInventory(statusFilter) {
    const uid = requireProvider();
    const clauses = [where('providerId', '==', uid)];
    if (statusFilter) clauses.push(where('status', '==', statusFilter));
    const snap = await getDocs(query(collection(db, 'inventory'), ...clauses));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveInventoryItem(data) {
    const uid = requireProvider();
    if (data.id) {
        const ref = doc(db, 'inventory', data.id);
        const existing = await getDoc(ref);
        if (existing.exists() && existing.data().providerId !== uid) throw new Error('Dostop zavrnjen.');
        await setDoc(ref, { ...data, providerId: uid, updatedAt: serverTimestamp() }, { merge: true });
        return data.id;
    }
    const ref = await addDoc(collection(db, 'inventory'), {
        ...data,
        providerId: uid,
        status: data.status || 'draft',
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

export async function deleteInventoryItem(id) {
    const uid = requireProvider();
    const ref = doc(db, 'inventory', id);
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().providerId !== uid) throw new Error('Dostop zavrnjen.');
    await deleteDoc(ref);
}

// ════════════════════════════════════════════════════════════════════════════
// LEADS (leads/{id}) — dealer CRM
// ════════════════════════════════════════════════════════════════════════════
export async function listLeads(statusFilter) {
    const uid = requireProvider();
    const clauses = [where('providerId', '==', uid)];
    if (statusFilter) clauses.push(where('status', '==', statusFilter));
    const snap = await getDocs(query(collection(db, 'leads'), ...clauses));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function updateLead(id, data) {
    const uid = requireProvider();
    const ref = doc(db, 'leads', id);
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().providerId !== uid) throw new Error('Dostop zavrnjen.');
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

// ════════════════════════════════════════════════════════════════════════════
// TIRE STORAGE (tire_storage/{id}) — vulcanizer "hotel za gume"
// ════════════════════════════════════════════════════════════════════════════
export async function listTireStorage(statusFilter) {
    const uid = requireProvider();
    const clauses = [where('providerId', '==', uid)];
    if (statusFilter) clauses.push(where('status', '==', statusFilter));
    const snap = await getDocs(query(collection(db, 'tire_storage'), ...clauses));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveTireStorage(data) {
    const uid = requireProvider();
    if (data.id) {
        const ref = doc(db, 'tire_storage', data.id);
        const existing = await getDoc(ref);
        if (existing.exists() && existing.data().providerId !== uid) throw new Error('Dostop zavrnjen.');
        await setDoc(ref, { ...data, providerId: uid, updatedAt: serverTimestamp() }, { merge: true });
        return data.id;
    }
    const ref = await addDoc(collection(db, 'tire_storage'), {
        ...data,
        providerId: uid,
        status: data.status || 'stored',
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

export async function deleteTireStorageItem(id) {
    const uid = requireProvider();
    const ref = doc(db, 'tire_storage', id);
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().providerId !== uid) throw new Error('Dostop zavrnjen.');
    await deleteDoc(ref);
}

// ════════════════════════════════════════════════════════════════════════════
// ANALYTICS SUMMARY — counts for dashboard
// ════════════════════════════════════════════════════════════════════════════
export async function getDashboardStats() {
    const uid = requireProvider();
    const [bookings, services, inventory, leads] = await Promise.all([
        getDocs(query(collection(db, 'bookings'), where('providerId', '==', uid))),
        getDocs(collection(db, 'businesses', uid, 'services')),
        getDocs(query(collection(db, 'inventory'), where('providerId', '==', uid))).catch(() => ({ docs: [] })),
        getDocs(query(collection(db, 'leads'), where('providerId', '==', uid))).catch(() => ({ docs: [] })),
    ]);

    const bookingsArr = bookings.docs.map(d => d.data());
    return {
        bookings: {
            total: bookingsArr.length,
            pending: bookingsArr.filter(b => b.status === 'pending').length,
            confirmed: bookingsArr.filter(b => b.status === 'confirmed').length,
            completed: bookingsArr.filter(b => b.status === 'completed').length,
            revenue: bookingsArr
                .filter(b => b.status === 'completed')
                .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0),
        },
        services: services.docs.length,
        inventory: inventory.docs.length,
        leads: {
            total: leads.docs.length,
            new: leads.docs.filter(d => d.data().status === 'new').length,
        },
    };
}
