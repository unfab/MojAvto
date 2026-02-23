import { collection, addDoc, getDocs, doc, setDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase.js';

/**
 * Uploads an array of image files to Firebase Storage
 * @param {File[]} files 
 * @param {string} userId 
 * @returns {Promise<string[]>} Array of download URLs
 */
export async function uploadImages(files, userId) {
    const urls = [];
    for (const file of files) {
        const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`;
        const fileRef = ref(storage, `listings/${userId}/${uniqueName}`);

        // Upload the file
        await uploadBytes(fileRef, file);

        // Get the accessible download URL
        const url = await getDownloadURL(fileRef);
        urls.push(url);
    }
    return urls;
}

/**
 * Creates a new listing in Firestore
 * @param {Object} listingData 
 * @param {File[]} imageFiles 
 * @param {Object} user - Firebase Auth user 
 * @returns {Promise<string>} Created listing ID
 */
export async function createListing(listingData, imageFiles, user) {
    if (!user) throw new Error("User must be authenticated to create a listing.");

    // 1. Upload images
    const imageUrls = await uploadImages(imageFiles, user.uid);

    // 2. Prepare listing object
    const newListing = {
        ...listingData,
        images: {
            exterior: imageUrls,
            interior: []
        },
        authorId: user.uid,
        status: 'active',
        isPremium: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        viewCount: 0
    };

    // 3. Save to Firestore
    const listingRef = collection(db, 'listings');
    const newDoc = await addDoc(listingRef, newListing);

    return newDoc.id;
}

/**
 * Gets all active listings from Firestore
 * @returns {Promise<Object[]>} Array of listings
 */
export async function getListings() {
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

/**
 * Gets listings for a specific user
 * @param {string} userId 
 * @returns {Promise<Object[]>} Array of user's listings
 */
export async function getUserListings(userId) {
    // Note: This requires a composite index in Firestore if combined with orderBy on other fields.
    // For now we get all and filter in memory, or just get user's and sort in memory if needed.
    // To do it properly in Firestore: query(collection(db, 'listings'), where('authorId', '==', userId))
    // we need to import `where`
    const { where } = await import('firebase/firestore');
    const q = query(collection(db, 'listings'), where('authorId', '==', userId));
    const snapshot = await getDocs(q);
    const listings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    return listings.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
}

/**
 * Deletes a listing from Firestore
 * Note: Should also delete associated images from Storage in a complete implementation
 * @param {string} listingId 
 */
export async function deleteListing(listingId) {
    const { deleteDoc, doc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'listings', listingId));
}

/**
 * Gets a single listing by ID
 * @param {string} listingId 
 * @returns {Promise<Object>} Listing data
 */
export async function getListingById(listingId) {
    const { getDoc, doc } = await import('firebase/firestore');
    const docRef = doc(db, 'listings', listingId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        throw new Error("Listing not found.");
    }
}



