import {
    collection, addDoc, getDocs, doc, setDoc, updateDoc,
    query, orderBy, serverTimestamp, increment,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase.js';
import { ALL_EQUIPMENT_VALUES } from '../data/equipment.js';

// ── Image upload ──────────────────────────────────────────────────────────────
export async function uploadImages(files, userId) {
    const urls = [];
    for (const file of files) {
        const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`;
        const fileRef = ref(storage, `listings/${userId}/${uniqueName}`);
        await uploadBytes(fileRef, file);
        urls.push(await getDownloadURL(fileRef));
    }
    return urls;
}

// ── Create listing ────────────────────────────────────────────────────────────
/**
 * Creates a new listing in Firestore.
 * @param {Object} draft          — full draft object from sessionStorage
 * @param {File[]} exteriorFiles  — exterior photo files
 * @param {File[]} interiorFiles  — interior photo files
 * @param {Object} user           — Firebase Auth user
 * @returns {Promise<string>} listing ID
 */
export async function createListing(draft, exteriorFiles, interiorFiles, user) {
    if (!user) throw new Error('Prijava je obvezna za objavo oglasa.');

    const missing = ['priceEur', 'make', 'model', 'fuel'].filter(k => !draft[k]);
    if (missing.length) throw new Error(`Manjkajo ključni tehnični podatki: ${missing.join(', ')}.`);

    const [exteriorUrls, interiorUrls] = await Promise.all([
        exteriorFiles.length > 0 ? uploadImages(exteriorFiles, user.uid) : Promise.resolve([]),
        interiorFiles.length > 0 ? uploadImages(interiorFiles, user.uid) : Promise.resolve([]),
    ]);

    // Cover is first image unless user explicitly set coverIndex
    const coverIndex = draft.coverIndex || 0;

    const listing = {
        // Identity
        authorId: user.uid,
        authorName: user.displayName || 'Uporabnik',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        viewCount: 0,
        favoriteCount: 0,
        contactCount: 0,

        // Entry type
        entryType: draft.entryType || 'classic',
        vin: draft.vin || null,
        vinVerified: draft.vinVerified || false,
        vinDetails: draft.vinData ? { ...draft.vinData } : null,
        vinOverrides: draft.vinOverrides || {},

        // Category
        category: draft.category || 'avto',
        subcategory: draft.subcategory || '',

        // Basic
        make: draft.make || '',
        model: draft.model || '',
        variant: draft.variant || '',
        year: Number(draft.year) || new Date().getFullYear(),
        mileageKm: Number(draft.mileageKm) || 0,
        color: draft.color || '',
        colorType: draft.colorType || 'solid',
        doorsCount: Number(draft.doorsCount) || 0,
        seatsCount: Number(draft.seatsCount) || 0,
        condition: draft.condition || 'Rabljeno',
        firstRegistration: draft.firstRegistration || '',
        registeredUntil: draft.registeredUntil || '',

        // Technical
        fuel: draft.fuel || '',
        hybridType: draft.hybridType || null,
        transmission: draft.transmission || '',
        driveType: draft.driveType || '',
        engineCc: Number(draft.engineCc) || 0,
        powerKw: Number(draft.powerKw) || 0,
        co2: Number(draft.co2) || 0,
        emissionClass: draft.emissionClass || '',
        fuelL100km: draft.fuelL100kmCombined ? Number(draft.fuelL100kmCombined) : null,
        fuelL100kmCity: draft.fuelL100kmCity ? Number(draft.fuelL100kmCity) : null,
        fuelL100kmHighway: draft.fuelL100kmHighway ? Number(draft.fuelL100kmHighway) : null,
        batteryKwh: draft.batteryKwh ? Number(draft.batteryKwh) : null,
        rangeKm: draft.rangeKm ? Number(draft.rangeKm) : null,
        towingKg: draft.towingKg ? Number(draft.towingKg) : null,

        // Equipment (array of feature value strings) — only allow known slugs
        equipment: Array.isArray(draft.equipment)
            ? draft.equipment.filter(v => v && ALL_EQUIPMENT_VALUES.includes(v))
            : [],

        // Media
        images: {
            exterior: exteriorUrls,
            interior: interiorUrls,
        },
        coverIndex,

        // Description
        description: draft.description || '',

        // Price
        priceEur: Number(draft.priceEur) || 0,
        callForPrice: draft.callForPrice || false,
        priceNegotiable: draft.priceNegotiable || false,
        priceInclVat: draft.priceInclVat || false,
        leaseAvailable: draft.leaseAvailable || false,
        sellerType: draft.sellerType || 'private',
        leasingConditions: draft.leasingConditions || '',

        // Location
        location: {
            city: draft.location?.city || '',
            postalCode: draft.location?.postalCode || '',
            region: draft.location?.region || '',
            lat: draft.location?.lat || null,
            lng: draft.location?.lng || null,
        },

        // Contact
        contact: {
            name: draft.contact?.name || user.displayName || '',
            phone: draft.contact?.phone || null,
            showPhone: draft.contact?.showPhone || false,
            email: draft.contact?.email || user.email || '',
        },

        // Promotion
        promotion: {
            tier: draft.promotionTier || 'free',
            activatedAt: draft.promotionTier !== 'free' ? serverTimestamp() : null,
            expiresAt: null,
            paidAmount: null,
            paymentRef: null,
        },

        // Legacy fields (backwards compatibility with existing listings)
        title: `${draft.make || ''} ${draft.model || ''} ${draft.variant || ''}`.trim(),
        price: Number(draft.priceEur) || 0,
        mileage: Number(draft.mileageKm) || 0,
        power: Number(draft.powerKw) || 0,
        transmission: draft.transmission || '',
        isPremium: draft.promotionTier === 'homepage',
    };

    const newDoc = await addDoc(collection(db, 'listings'), listing);
    return newDoc.id;
}

// ── Update listing ────────────────────────────────────────────────────────────
export async function updateListing(listingId, updates) {
    const docRef = doc(db, 'listings', listingId);
    await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
}

// ── Increment view count ──────────────────────────────────────────────────────
export async function incrementViewCount(listingId) {
    try {
        const docRef = doc(db, 'listings', listingId);
        await updateDoc(docRef, { viewCount: increment(1) });
    } catch {
        // Non-critical, ignore errors
    }
}

// ── Get all listings (with promotion-aware sorting) ───────────────────────────
export async function getListings() {
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const listings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return sortByPromotion(listings);
}

// ── Get user listings ─────────────────────────────────────────────────────────
export async function getUserListings(userId) {
    const { where } = await import('firebase/firestore');
    const q = query(collection(db, 'listings'), where('authorId', '==', userId));
    const snapshot = await getDocs(q);
    const listings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return listings.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}

// ── Delete listing ────────────────────────────────────────────────────────────
export async function deleteListing(listingId) {
    const { deleteDoc, doc: docFn } = await import('firebase/firestore');
    await deleteDoc(docFn(db, 'listings', listingId));
}

import { sampleCars } from '../data/sampleListings.js';

// ── Get single listing ────────────────────────────────────────────────────────
export async function getListingById(listingId) {
    // Check sample cars first (for demo/development)
    if (listingId.startsWith('car-')) {
        const sample = sampleCars.find(c => c.id === listingId);
        if (sample) return sample;
    }

    const { getDoc, doc: docFn } = await import('firebase/firestore');
    const docRef = docFn(db, 'listings', listingId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Oglas ne obstaja.');
    return { id: snap.id, ...snap.data() };
}

// ── Promotion-aware sort ──────────────────────────────────────────────────────
const TIER_WEIGHT = { sponsored: 2, homepage: 1, free: 0 };
const SPONSORED_MAX = 3; // max sponsored cards shown at top

export function sortByPromotion(listings) {
    const sponsored = listings
        .filter(l => l.promotion?.tier === 'sponsored')
        .slice(0, SPONSORED_MAX);

    const rest = listings
        .filter(l => l.promotion?.tier !== 'sponsored')
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

    return [...sponsored, ...rest];
}

// ── Format helpers ────────────────────────────────────────────────────────────
export function formatPrice(val, callForPrice) {
    if (callForPrice) return 'Pokliči za ceno';
    
    // Handle strings, nulls, etc.
    let num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
    
    if (isNaN(num) || num <= 0) return 'Pokliči za ceno';
    
    return new Intl.NumberFormat('sl-SI', {
        style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
    }).format(num);
}

export function formatMileage(km) {
    return new Intl.NumberFormat('sl-SI').format(km) + ' km';
}
