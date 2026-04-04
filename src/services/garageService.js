// Garage Service — MojAvto.si
// CRUD for user vehicles stored in Firestore subcollection: users/{uid}/vehicles

import {
    collection, addDoc, getDocs, doc, updateDoc, deleteDoc, setDoc, getDoc,
    serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase.js';

function vehiclesRef(uid) {
    return collection(db, 'users', uid, 'vehicles');
}

// Add vehicle
export async function addVehicle(uid, vehicle) {
    const data = {
        ...vehicle,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(vehiclesRef(uid), data);
    return docRef.id;
}

// Get all vehicles for user
export async function getVehicles(uid) {
    const q = query(vehiclesRef(uid), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Update vehicle
export async function updateVehicle(uid, vehicleId, updates) {
    const ref = doc(db, 'users', uid, 'vehicles', vehicleId);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
}

// Delete vehicle
export async function deleteVehicle(uid, vehicleId) {
    const ref = doc(db, 'users', uid, 'vehicles', vehicleId);
    await deleteDoc(ref);
}

// ── Favourites (liked listings) ──────────────────────────────────────────────
// Stored in Firestore: users/{uid}/favourites/{listingId}

function favouritesRef(uid) {
    return collection(db, 'users', uid, 'favourites');
}

export async function addToFavourites(uid, listing) {
    const ref = doc(db, 'users', uid, 'favourites', listing.id);
    await setDoc(ref, {
        listingId: listing.id,
        title: listing.title || '',
        price: listing.price || '',
        image: listing.images?.exterior?.[0] || listing.image || '',
        savedAt: serverTimestamp(),
    });
}

export async function removeFromFavourites(uid, listingId) {
    const ref = doc(db, 'users', uid, 'favourites', listingId);
    await deleteDoc(ref);
}

export async function getFavourites(uid) {
    const q = query(favouritesRef(uid), orderBy('savedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function isFavourite(uid, listingId) {
    const ref = doc(db, 'users', uid, 'favourites', listingId);
    const snap = await getDoc(ref);
    return snap.exists();
}
