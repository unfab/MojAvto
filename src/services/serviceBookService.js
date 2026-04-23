// Digital Service Book — Firestore data layer
import { db } from '../firebase.js';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    serverTimestamp,
} from 'firebase/firestore';

const COL = 'service_records';

export async function addServiceRecord(recordData) {
    const { vin, date, mileage, serviceType, description, mechanicId, mechanicName } = recordData;
    if (!vin) throw new Error('VIN je obvezen.');

    return addDoc(collection(db, COL), {
        vin: vin.trim().toUpperCase(),
        date: date || null,
        mileage: mileage ? Number(mileage) : null,
        serviceType: serviceType || 'drugo',
        description: description || '',
        mechanicId: mechanicId || null,
        mechanicName: mechanicName || '',
        createdAt: serverTimestamp(),
    });
}

export async function getServiceHistoryByVin(vin) {
    if (!vin) return [];
    try {
        const q = query(
            collection(db, COL),
            where('vin', '==', vin.trim().toUpperCase()),
            orderBy('date', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
        if (err.code === 'failed-precondition') {
            console.error('[ServiceBook] Manjka Firestore indeks. Ustvari ga na:', err.message);
        } else {
            console.error('[ServiceBook] getServiceHistoryByVin:', err);
        }
        return [];
    }
}
