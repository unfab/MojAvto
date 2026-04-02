// bookingData.js — Mock data for Booking & Service System — MojAvto.si

// ── Car brands and models for vehicle form ────────────────────
export const carBrands = [
    'Audi', 'BMW', 'Citroën', 'Dacia', 'Fiat', 'Ford', 'Honda',
    'Hyundai', 'Kia', 'Mazda', 'Mercedes-Benz', 'Mitsubishi',
    'Nissan', 'Opel', 'Peugeot', 'Renault', 'Škoda', 'Toyota',
    'Volkswagen', 'Volvo'
];

export const carModels = {
    'Audi':          ['A3', 'A4', 'A6', 'Q3', 'Q5'],
    'BMW':           ['1', '3', '5', 'X1', 'X3'],
    'Citroën':       ['C3', 'C4', 'C5 Aircross', 'Berlingo'],
    'Dacia':         ['Sandero', 'Duster', 'Logan', 'Jogger'],
    'Fiat':          ['500', 'Panda', 'Tipo', 'Punto'],
    'Ford':          ['Fiesta', 'Focus', 'Kuga', 'Puma'],
    'Honda':         ['Civic', 'CR-V', 'HR-V', 'Jazz'],
    'Hyundai':       ['i20', 'i30', 'Tucson', 'Kona'],
    'Kia':           ['Ceed', 'Sportage', 'Stonic', 'Picanto'],
    'Mazda':         ['2', '3', '6', 'CX-5', 'MX-5'],
    'Mercedes-Benz': ['A-razred', 'C-razred', 'E-razred', 'GLC', 'GLA'],
    'Mitsubishi':    ['ASX', 'Eclipse Cross', 'Outlander', 'Colt'],
    'Nissan':        ['Micra', 'Juke', 'Qashqai', 'X-Trail'],
    'Opel':          ['Corsa', 'Astra', 'Mokka', 'Crossland'],
    'Peugeot':       ['208', '308', '3008', '5008'],
    'Renault':       ['Clio', 'Megane', 'Captur', 'Kadjar'],
    'Škoda':         ['Fabia', 'Octavia', 'Superb', 'Karoq', 'Kodiaq'],
    'Toyota':        ['Yaris', 'Corolla', 'RAV4', 'C-HR', 'Aygo X'],
    'Volkswagen':    ['Polo', 'Golf', 'Passat', 'Tiguan', 'T-Roc'],
    'Volvo':         ['V60', 'V90', 'XC40', 'XC60', 'XC90'],
};

// ── Time slots ────────────────────────────────────────────────
export const timeSlots = [
    '07:30', '08:00', '08:30', '09:00', '09:30', '10:00',
    '10:30', '11:00', '11:30', '12:00', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00'
];

// Slots marked as "unavailable" for demo purposes (simulate full booking)
export const unavailableSlots = ['08:30', '10:00', '13:30', '15:00'];

// ── Service prices (EUR, numeric) ─────────────────────────────
// 0 = "po ogledu" (quote only)
export const servicePrices = {
    tyre_change:       15,   // per tyre × 4
    tyre_storage:      45,   // per season
    tyre_repair:        8,
    oil_change:        49,
    brake_service:     79,
    diagnostics:       29,
    inspection:        65,
    air_conditioning:  59,
    wheel_alignment:   39,
    wheel_balancing:    8,   // per tyre × 4
    clutch_repair:    320,
    body_repair:        0,   // quote only
    electrical_repair: 49,
    battery_service:    0,   // quote only
    software_update:   99,
    hybrid_service:   119,
    washing:           12,
};

// Services where price is multiplied × 4 (per tyre)
export const perTyreServices = ['tyre_change', 'wheel_balancing'];

// ── Service icons (Lucide icon names) ────────────────────────
export const serviceIcons = {
    tyre_change:       'circle',
    tyre_storage:      'archive',
    tyre_repair:       'wrench',
    oil_change:        'droplets',
    brake_service:     'disc',
    diagnostics:       'activity',
    inspection:        'clipboard-check',
    air_conditioning:  'wind',
    wheel_alignment:   'settings',
    wheel_balancing:   'loader',
    clutch_repair:     'settings-2',
    body_repair:       'shield',
    electrical_repair: 'zap',
    battery_service:   'battery-charging',
    software_update:   'cpu',
    hybrid_service:    'leaf',
    washing:           'sparkles',
};

// ── Mock products ─────────────────────────────────────────────
// serviceId: which service triggers display of this product
export const mockProducts = [
    // Tyres (shown with tyre_change)
    {
        id: 'prod-1',
        serviceId: 'tyre_change',
        name: 'Michelin Pilot Sport 5 — 205/55 R16',
        brand: 'Michelin',
        price: 89,
        unit: 'guma',
        defaultQty: 4,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80',
        tag: 'Poletna'
    },
    {
        id: 'prod-2',
        serviceId: 'tyre_change',
        name: 'Continental PremiumContact 7 — 205/55 R16',
        brand: 'Continental',
        price: 79,
        unit: 'guma',
        defaultQty: 4,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80',
        tag: 'Poletna'
    },
    {
        id: 'prod-3',
        serviceId: 'tyre_change',
        name: 'Bridgestone Turanza T005 — 205/55 R16',
        brand: 'Bridgestone',
        price: 75,
        unit: 'guma',
        defaultQty: 4,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80',
        tag: 'Poletna'
    },
    {
        id: 'prod-4',
        serviceId: 'tyre_change',
        name: 'Nokian Snowproof P — 205/55 R16',
        brand: 'Nokian',
        price: 69,
        unit: 'guma',
        defaultQty: 4,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80',
        tag: 'Zimska'
    },
    {
        id: 'prod-5',
        serviceId: 'tyre_change',
        name: 'Goodyear EfficientGrip — 195/65 R15',
        brand: 'Goodyear',
        price: 59,
        unit: 'guma',
        defaultQty: 4,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80',
        tag: 'Poletna'
    },
    {
        id: 'prod-6',
        serviceId: 'tyre_change',
        name: 'BF Goodrich Advantage — 195/65 R15',
        brand: 'BF Goodrich',
        price: 49,
        unit: 'guma',
        defaultQty: 4,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80',
        tag: 'Poletna'
    },
    // Engine oils (shown with oil_change)
    {
        id: 'prod-7',
        serviceId: 'oil_change',
        name: 'Castrol EDGE 5W-30 LL — 5L',
        brand: 'Castrol',
        price: 39,
        unit: 'kos',
        defaultQty: 1,
        image: 'https://images.unsplash.com/photo-1635273051868-4e0e19c6de85?auto=format&fit=crop&w=400&q=80',
        tag: 'Priporočeno'
    },
    {
        id: 'prod-8',
        serviceId: 'oil_change',
        name: 'Mobil 1 ESP 5W-30 — 5L',
        brand: 'Mobil',
        price: 45,
        unit: 'kos',
        defaultQty: 1,
        image: 'https://images.unsplash.com/photo-1635273051868-4e0e19c6de85?auto=format&fit=crop&w=400&q=80',
        tag: 'Premium'
    },
    {
        id: 'prod-9',
        serviceId: 'oil_change',
        name: 'Shell Helix Ultra 5W-40 — 5L',
        brand: 'Shell',
        price: 35,
        unit: 'kos',
        defaultQty: 1,
        image: 'https://images.unsplash.com/photo-1635273051868-4e0e19c6de85?auto=format&fit=crop&w=400&q=80',
        tag: 'Akcija'
    },
];

// ── Mock vehicles (demo user) ─────────────────────────────────
export const mockVehicles = [
    {
        id: 'v-1',
        userId: 'mock-user',
        brand: 'Volkswagen',
        model: 'Golf',
        year: 2019,
        licensePlate: 'LJ A1-234'
    },
    {
        id: 'v-2',
        userId: 'mock-user',
        brand: 'BMW',
        model: '3',
        year: 2021,
        licensePlate: 'MB B5-678'
    },
    {
        id: 'v-3',
        userId: 'mock-user',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2017,
        licensePlate: 'CE C9-012'
    },
];

// ── Mock bookings ─────────────────────────────────────────────
export const mockBookings = [
    {
        id: 'bk-1',
        userId: 'mock-user',
        businessId: 'biz-21',
        businessName: 'Gumiteh Ljubljana',
        vehicleId: 'v-1',
        vehicleLabel: 'VW Golf 2019 · LJ A1-234',
        services: ['tyre_change'],
        products: [{ productId: 'prod-2', qty: 4 }],
        bookingType: 'buy_new',
        totalPrice: 375,
        date: '2026-04-15',
        time: '09:00',
        status: 'confirmed',
        notes: '',
        createdAt: '2026-04-02T10:15:00Z'
    },
    {
        id: 'bk-2',
        userId: 'mock-user',
        businessId: 'biz-11',
        businessName: 'Servis Kovač Ljubljana',
        vehicleId: 'v-2',
        vehicleLabel: 'BMW 3 2021 · MB B5-678',
        services: ['oil_change', 'brake_service'],
        products: [{ productId: 'prod-7', qty: 1 }],
        bookingType: null,
        totalPrice: 167,
        date: '2026-04-20',
        time: '10:30',
        status: 'pending',
        notes: 'Prosim pokličite dan pred terminom.',
        createdAt: '2026-04-01T14:30:00Z'
    },
    {
        id: 'bk-3',
        userId: 'mock-user',
        businessId: 'biz-2',
        businessName: 'AutoCentrum Maribor',
        vehicleId: 'v-1',
        vehicleLabel: 'VW Golf 2019 · LJ A1-234',
        services: ['diagnostics'],
        products: [],
        bookingType: null,
        totalPrice: 29,
        date: '2026-02-10',
        time: '14:00',
        status: 'completed',
        notes: '',
        createdAt: '2026-02-05T09:00:00Z'
    },
    {
        id: 'bk-4',
        userId: 'mock-user',
        businessId: 'biz-13',
        businessName: 'Quick Fix Celje',
        vehicleId: 'v-3',
        vehicleLabel: 'Toyota Corolla 2017 · CE C9-012',
        services: ['tyre_change', 'wheel_balancing'],
        products: [{ productId: 'prod-5', qty: 4 }],
        bookingType: 'buy_new',
        totalPrice: 328,
        date: '2026-03-05',
        time: '11:00',
        status: 'cancelled',
        notes: '',
        createdAt: '2026-02-28T11:45:00Z'
    },
];
