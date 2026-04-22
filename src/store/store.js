// store.js — Global state management for MojAvto Business Discovery
// Simple reactive store pattern, no external dependencies

export const store = {
    // All businesses (loaded once)
    businesses: [],

    // Currently filtered/displayed businesses
    filteredBusinesses: [],

    // The business whose profile is open
    selectedBusiness: null,

    // User's detected geolocation { lat, lng }
    userLocation: null,

    // Active filter state
    filters: {
        types: ['dealer', 'service', 'vulcanizer'], // Default: show all main types
        brands: [],          // [] = all, or ['BMW','Audi',...]
        authorized: false,   // true = only authorized businesses
        leasing: false,      // true = only businesses offering leasing
        tyreStorage: false,  // true = only businesses with tyre storage
        minRating: 0,        // 0–5
        radius: 20           // km from userLocation
    },

    // Listeners for state changes
    _listeners: [],

    subscribe(fn) {
        this._listeners.push(fn);
        return () => { this._listeners = this._listeners.filter(l => l !== fn); };
    },

    notify() {
        this._listeners.forEach(fn => fn(this));
    },

    setBusinesses(list) {
        this.businesses = list;
        this.filteredBusinesses = list;
        this.notify();
    },

    setFilteredBusinesses(list) {
        this.filteredBusinesses = list;
        this.notify();
    },

    setSelectedBusiness(biz) {
        this.selectedBusiness = biz;
        this.notify();
    },

    setUserLocation(loc) {
        this.userLocation = loc;
        this.notify();
    },

    updateFilters(partial) {
        this.filters = { ...this.filters, ...partial };
        this.notify();
    },

    // ── Booking system state ──────────────────────────────────

    // User's saved vehicles
    vehicles: [],

    // All bookings for current user
    bookings: [],

    setVehicles(list) {
        this.vehicles = list;
        this.notify();
    },

    addVehicle(vehicle) {
        this.vehicles = [...this.vehicles, vehicle];
        this.notify();
    },

    setBookings(list) {
        this.bookings = list;
        this.notify();
    },

    addBooking(booking) {
        this.bookings = [...this.bookings, booking];
        this.notify();
    },
};
