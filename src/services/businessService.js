// businessService.js — Business data access and filtering logic
// Prepared for Firebase Firestore integration (currently uses mock data)

import { mockBusinesses } from '../data/businesses.js';

// ── Cache ────────────────────────────────────────────────────
let _cache = null;

/**
 * Returns all businesses (cached after first call)
 * @returns {Object[]}
 */
export function getAllBusinesses() {
    if (!_cache) _cache = [...mockBusinesses];
    return _cache;
}

/**
 * Returns a single business by ID
 * @param {string} id
 * @returns {Object|null}
 */
export function getBusinessById(id) {
    return getAllBusinesses().find(b => b.id === id) || null;
}

/**
 * Haversine formula — distance between two lat/lng points in km
 * @param {number} lat1 @param {number} lng1
 * @param {number} lat2 @param {number} lng2
 * @returns {number} Distance in km
 */
export function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Returns businesses within radius km of userLocation
 * @param {{ lat: number, lng: number }} userLocation
 * @param {number} radiusKm
 * @returns {Object[]}
 */
export function getBusinessesNearby(userLocation, radiusKm) {
    if (!userLocation) return getAllBusinesses();
    return getAllBusinesses().filter(b => {
        const d = getDistance(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng);
        return d <= radiusKm;
    });
}

/**
 * Returns true if business has at least one of the given types
 * @param {Object} business
 * @param {string|string[]} types
 */
export function hasType(business, types) {
    const typeArr = Array.isArray(types) ? types : [types];
    return typeArr.some(t => business.businessTypes.includes(t));
}

/**
 * Main filter function — AND logic across categories, OR inside arrays
 * @param {Object[]} businesses
 * @param {Object} filters
 * @param {{ lat: number, lng: number }|null} userLocation
 * @returns {Object[]}
 */
export function filterBusinesses(businesses, filters, userLocation) {
    return businesses.filter(b => {
        // 1. Business type filter (OR within selected types)
        if (filters.types && filters.types.length > 0) {
            if (!hasType(b, filters.types)) return false;
        }

        // 2. Brand filter (OR within selected brands — checks both authorizedBrands and supportedBrands)
        if (filters.brands && filters.brands.length > 0) {
            const allBiz = [...b.authorizedBrands, ...b.supportedBrands];
            if (!filters.brands.some(brand => allBiz.includes(brand))) return false;
        }

        // 3. Authorized only
        if (filters.authorized && !b.verified) return false;

        // 4. Leasing
        if (filters.leasing && !b.offersLeasing) return false;

        // 5. Tyre storage
        if (filters.tyreStorage && !b.offersTyreStorage) return false;

        // 6. Minimum rating
        if (filters.minRating > 0 && b.rating < filters.minRating) return false;

        // 7. Distance (only if userLocation available)
        if (userLocation && filters.radius > 0) {
            const d = getDistance(userLocation.lat, userLocation.lng, b.location.lat, b.location.lng);
            if (d > filters.radius) return false;
            b._distance = Math.round(d * 10) / 10; // attach distance for display
        }

        return true;
    });
}

/**
 * Get primary type color for markers and UI
 * @param {Object} business
 * @returns {{ color: string, label: string }}
 */
export function getBusinessTypeInfo(business) {
    const types = business.businessTypes;
    if (types.length > 1) return { color: '#7c3aed', label: 'Večnamenski', markerClass: 'marker-multi' };
    switch (types[0]) {
        case 'dealer': return { color: '#2563eb', label: 'Avto hiša', markerClass: 'marker-dealer' };
        case 'service': return { color: '#16a34a', label: 'Servis', markerClass: 'marker-service' };
        case 'vulcanizer': return { color: '#ea580c', label: 'Vulkanizer', markerClass: 'marker-vulcanizer' };
        default: return { color: '#64748b', label: 'Podjetje', markerClass: 'marker-other' };
    }
}

/**
 * Get all type labels for a business (for badge display)
 * @param {Object} business
 * @returns {string[]}
 */
export function getTypeLabels(business) {
    const map = { dealer: 'Avto hiša', service: 'Servis', vulcanizer: 'Vulkanizer' };
    return business.businessTypes.map(t => map[t] || t);
}

/**
 * Sort businesses by distance (if available) or rating
 * @param {Object[]} businesses
 * @param {'distance'|'rating'|'name'} by
 */
export function sortBusinesses(businesses, by = 'distance') {
    return [...businesses].sort((a, b) => {
        if (by === 'distance') {
            if (a._distance != null && b._distance != null) return a._distance - b._distance;
            return b.rating - a.rating;
        }
        if (by === 'rating') return b.rating - a.rating;
        if (by === 'name') return a.name.localeCompare(b.name);
        return 0;
    });
}
