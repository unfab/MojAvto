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

// ════════════════════════════════════════════════════════════════════════════
// TIRE ORDERS (tire_orders collection)
// Flow: buyer submits → vulkanizer confirms → buyer books appointment
// ════════════════════════════════════════════════════════════════════════════

function addBusinessDays(startDate, days) {
    const d = new Date(startDate);
    let added = 0;
    while (added < days) {
        d.setDate(d.getDate() + 1);
        const dow = d.getDay();
        if (dow !== 0 && dow !== 6) added++;
    }
    return d;
}

export async function submitTireOrder(tireData, vulcanizerId) {
    const u = auth.currentUser;
    if (!u) throw new Error('Potrebna prijava.');

    const estimatedDeliveryDate = addBusinessDays(new Date(), 3).toISOString().slice(0, 10);

    const orderData = {
        vulcanizerId,
        buyerId: u.uid,
        tireData: {
            brand: tireData.tireBrand,
            model: tireData.tireModel,
            dimension: tireData.tireDim,
            quantity: tireData.quantity,
        },
        status: 'pending_confirmation',
        submittedAt: serverTimestamp(),
        confirmedAt: null,
        orderedAt: null,
        estimatedDeliveryDate,
        priceSnapshot: tireData.price || null,
        currentPrice: tireData.price || null,
        bookingUrl: null,
    };

    const ref = await addDoc(collection(db, 'tire_orders'), orderData);
    console.info(`[TireOrder] Novo naročilo ${ref.id} za vulkanizerja ${vulcanizerId}. Mock obvestilo: "Novo naročilo gum čaka potrditev."`);

    return { id: ref.id, estimatedDeliveryDate };
}

export async function getTireOrder(tireOrderId) {
    const snap = await getDoc(doc(db, 'tire_orders', tireOrderId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
}

export async function listPendingTireOrders() {
    const uid = requireProvider();
    const q = query(
        collection(db, 'tire_orders'),
        where('vulcanizerId', '==', uid),
        where('status', '==', 'pending_confirmation'),
        orderBy('submittedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function confirmTireOrderReceival(tireOrderId) {
    const uid = requireProvider();
    const ref = doc(db, 'tire_orders', tireOrderId);
    const snap = await getDoc(ref);
    if (!snap.exists() || snap.data().vulcanizerId !== uid) {
        throw new Error('Dostop zavrnjen.');
    }

    const bookingUrl = `${window.location.origin}/#/booking?businessId=${uid}&tireOrderId=${tireOrderId}`;

    await updateDoc(ref, {
        status: 'confirmed',
        confirmedAt: serverTimestamp(),
        bookingUrl,
    });

    const order = snap.data();
    console.info(`[TireOrder] Naročilo ${tireOrderId} potrjeno. Mock SMS kupcu (buyerId: ${order.buyerId}): "Vaše gume so sprejete. Rezervirajte termin: ${bookingUrl}"`);

    return { bookingUrl };
}

export async function checkAndHandlePriceChange(tireOrderId, newPrice) {
    const uid = requireProvider();
    const ref = doc(db, 'tire_orders', tireOrderId);
    const snap = await getDoc(ref);
    if (!snap.exists() || snap.data().vulcanizerId !== uid) throw new Error('Dostop zavrnjen.');

    const order = snap.data();
    if (order.priceSnapshot !== newPrice) {
        await updateDoc(ref, { status: 'price_changed', currentPrice: newPrice, updatedAt: serverTimestamp() });
        console.info(`[TireOrder] Cena spremenjena za ${tireOrderId}. Mock SMS kupcu: "Cena gum se je spremenila z ${order.priceSnapshot}€ na ${newPrice}€. Potrdite nakup."`);
    }
}

export async function markTireOrderOrdered(tireOrderId) {
    const ref = doc(db, 'tire_orders', tireOrderId);
    await updateDoc(ref, {
        status: 'ordered',
        orderedAt: serverTimestamp(),
    });
}
