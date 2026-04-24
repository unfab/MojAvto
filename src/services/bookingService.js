// bookingService.js — Booking & Service business logic — MojAvto.si
// Pure functions. No DOM. localStorage for persistence.
// TODO: Replace localStorage calls with Firestore when backend is ready.

import {
    mockVehicles,
    mockBookings,
    mockProducts,
    servicePrices,
    perTyreServices,
    serviceIcons,
} from '../data/bookingData.js';
import { serviceLabels } from '../data/businesses.js';

// ── ID generator ──────────────────────────────────────────────
function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Format price label ────────────────────────────────────────
function formatPriceLabel(serviceId) {
    const price = servicePrices[serviceId];
    if (price === undefined || price === 0) return 'Po ogledu';
    if (perTyreServices.includes(serviceId)) return `od ${price * 4} € (4 gume)`;
    return `od ${price} €`;
}

// ── Get services for a business ───────────────────────────────
/**
 * Returns enriched service objects for a business's servicesOffered array.
 * @param {Object} business
 * @returns {{ id, label, icon, price, priceLabel, isQuoteOnly }[]}
 */
export function getServicesForBusiness(business) {
    return (business.servicesOffered || []).map(id => {
        const price = servicePrices[id] ?? 0;
        const isQuoteOnly = price === 0;
        const effectivePrice = perTyreServices.includes(id) ? price * 4 : price;
        return {
            id,
            label: serviceLabels[id] || id,
            icon: serviceIcons[id] || 'settings',
            price: effectivePrice,
            priceLabel: formatPriceLabel(id),
            isQuoteOnly,
        };
    });
}

// ── Get products relevant to selected services ────────────────
/**
 * Returns products whose serviceId is in the selectedServiceIds list.
 * @param {string[]} serviceIds
 * @returns {Object[]}
 */
export function getProductsForServices(serviceIds) {
    return mockProducts.filter(p => serviceIds.includes(p.serviceId));
}

// ── Calculate booking total ───────────────────────────────────
/**
 * Calculates total price from selected services and products.
 * @param {string[]} serviceIds
 * @param {{ productId: string, qty: number }[]} selectedProducts
 * @returns {{ lineItems: {label: string, price: number, isQuote: boolean}[], total: number, hasQuoteItems: boolean }}
 */
export function calculateTotal(serviceIds, selectedProducts) {
    const lineItems = [];
    let total = 0;
    let hasQuoteItems = false;

    for (const id of serviceIds) {
        const price = servicePrices[id] ?? 0;
        const label = serviceLabels[id] || id;

        if (price === 0) {
            hasQuoteItems = true;
            lineItems.push({ label, price: 0, isQuote: true });
        } else {
            const effectivePrice = perTyreServices.includes(id) ? price * 4 : price;
            lineItems.push({ label, price: effectivePrice, isQuote: false });
            total += effectivePrice;
        }
    }

    for (const { productId, qty } of selectedProducts) {
        const product = mockProducts.find(p => p.id === productId);
        if (!product) continue;
        const lineTotal = product.price * qty;
        lineItems.push({
            label: `${product.name} × ${qty}`,
            price: lineTotal,
            isQuote: false
        });
        total += lineTotal;
    }

    return { lineItems, total, hasQuoteItems };
}

// ── Vehicle persistence ───────────────────────────────────────
/**
 * Returns vehicles for a user. Falls back to mockVehicles for demo user.
 * @param {string} userId
 * @returns {Object[]}
 */
export function getVehiclesForUser(userId) {
    try {
        const stored = localStorage.getItem(`mojavto_vehicles_${userId}`);
        const vehicles = stored ? JSON.parse(stored) : [];
        // Always include mock vehicles for the demo user
        if (!userId || userId === 'mock-user') {
            const storedIds = vehicles.map(v => v.id);
            const extras = mockVehicles.filter(v => !storedIds.includes(v.id));
            return [...extras, ...vehicles];
        }
        return vehicles;
    } catch {
        return userId === 'mock-user' ? mockVehicles : [];
    }
}

/**
 * Saves a new vehicle to localStorage. Returns saved vehicle with id.
 * @param {string} userId
 * @param {{ brand: string, model: string, year: number, licensePlate: string }} vehicleData
 * @returns {Object}
 */
export function saveVehicle(userId, vehicleData) {
    const vehicle = { ...vehicleData, id: generateId('v'), userId };
    try {
        const existing = getVehiclesForUser(userId).filter(v => v.userId === userId);
        const updated = [...existing, vehicle];
        localStorage.setItem(`mojavto_vehicles_${userId}`, JSON.stringify(updated));
    } catch {
        console.warn('[BookingService] Could not save vehicle to localStorage');
    }
    // TODO: replace with Firestore setDoc
    return vehicle;
}

// ── Booking persistence ───────────────────────────────────────
/**
 * Returns all bookings for a user. Falls back to mockBookings for demo user.
 * @param {string} userId
 * @returns {Object[]}
 */
export function getBookingsForUser(userId) {
    try {
        const stored = localStorage.getItem(`mojavto_bookings_${userId}`);
        const bookings = stored ? JSON.parse(stored) : [];
        if (!userId || userId === 'mock-user') {
            const storedIds = bookings.map(b => b.id);
            const extras = mockBookings.filter(b => !storedIds.includes(b.id));
            return [...extras, ...bookings];
        }
        return bookings;
    } catch {
        return userId === 'mock-user' ? mockBookings : [];
    }
}

/**
 * Saves a booking to localStorage. Returns saved booking with id, status:'pending', createdAt.
 * @param {Object} bookingData
 * @returns {Object}
 */
export function saveBooking(bookingData) {
    const booking = {
        ...bookingData,
        id: generateId('bk'),
        status: 'pending',
        createdAt: new Date().toISOString(),
        ...(bookingData.tireHandoff ? { linkedTireOrder: true, tireHandoff: bookingData.tireHandoff } : {}),
    };
    try {
        const userId = bookingData.userId || 'mock-user';
        const existing = getBookingsForUser(userId).filter(b => b.userId === userId);
        const updated = [...existing, booking];
        localStorage.setItem(`mojavto_bookings_${userId}`, JSON.stringify(updated));
    } catch {
        console.warn('[BookingService] Could not save booking to localStorage');
    }
    // TODO: replace with Firestore addDoc
    return booking;
}

/**
 * Cancels a booking by id for a user.
 * @param {string} userId
 * @param {string} bookingId
 * @returns {boolean} success
 */
export function cancelBooking(userId, bookingId) {
    try {
        const all = getBookingsForUser(userId);
        const updated = all.map(b =>
            b.id === bookingId ? { ...b, status: 'cancelled' } : b
        ).filter(b => b.userId === userId);
        localStorage.setItem(`mojavto_bookings_${userId}`, JSON.stringify(updated));
        return true;
    } catch {
        return false;
    }
}

// ── Format booking date for display ──────────────────────────
/**
 * Formats ISO date string to Slovenian readable format.
 * @param {string} dateStr — 'YYYY-MM-DD'
 * @returns {string} e.g. '15. april 2026'
 */
export function formatBookingDate(dateStr) {
    if (!dateStr) return '';
    const months = ['januar', 'februar', 'marec', 'april', 'maj', 'junij',
        'julij', 'avgust', 'september', 'oktober', 'november', 'december'];
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${day}. ${months[month - 1]} ${year}`;
}

/**
 * Returns status label in Slovenian.
 * @param {string} status
 * @returns {{ label: string, cls: string }}
 */
export function getStatusInfo(status) {
    return {
        pending:   { label: 'Čaka potrditve', cls: 'status-pending' },
        confirmed: { label: 'Potrjeno',       cls: 'status-confirmed' },
        completed: { label: 'Zaključeno',      cls: 'status-completed' },
        cancelled: { label: 'Preklicano',      cls: 'status-cancelled' },
    }[status] || { label: status, cls: '' };
}
