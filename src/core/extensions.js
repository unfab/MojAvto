// extensions.js — Plugin / Extension registry for B2B modules
// Lets dealer/mechanic/vulcanizer tools register themselves declaratively.

const _registry = new Map(); // id → extension definition

/**
 * Register a new extension.
 * @param {{
 *   id: string,                 // unique ID
 *   name: string,               // display label
 *   role: 'dealer'|'mechanic'|'vulcanizer'|'any',
 *   icon: string,               // lucide icon name
 *   route: string,              // hash route e.g. '/b2b/inventory'
 *   description?: string,
 *   order?: number,
 *   external?: boolean          // true = opens in new tab / chrome extension
 * }} ext
 */
export function registerExtension(ext) {
    if (!ext?.id) throw new Error('Extension requires id');
    _registry.set(ext.id, { order: 100, ...ext });
}

export function getExtensionsForRoles(roles) {
    const all = [..._registry.values()];
    return all
        .filter(e => e.role === 'any' || roles.includes(e.role))
        .sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

export function getAllExtensions() {
    return [..._registry.values()];
}

// ── Default B2B extensions ────────────────────────────────────
// Registered once at app boot.
export function registerDefaultExtensions() {
    // Common — every business
    registerExtension({ id: 'b2b-dashboard', name: 'Pregled', icon: 'layout-dashboard', role: 'any', route: '/b2b', order: 0 });
    registerExtension({ id: 'b2b-reservations', name: 'Rezervacije', icon: 'calendar-check', role: 'any', route: '/b2b/rezervacije', order: 10 });
    registerExtension({ id: 'b2b-services', name: 'Storitve in cenik', icon: 'tags', role: 'any', route: '/b2b/storitve', order: 20 });
    registerExtension({ id: 'b2b-profile', name: 'Javni profil', icon: 'building-2', role: 'any', route: '/b2b/profil', order: 30 });

    // Dealer
    registerExtension({ id: 'b2b-inventory', name: 'Zaloga vozil', icon: 'warehouse', role: 'dealer', route: '/b2b/zaloga', order: 40 });
    registerExtension({ id: 'b2b-leads', name: 'Povpraševanja (CRM)', icon: 'inbox', role: 'dealer', route: '/b2b/leads', order: 50 });
    registerExtension({ id: 'b2b-import', name: 'Orodje za uvoz', icon: 'download', role: 'dealer', route: '/b2b/orodja', order: 60 });

    // Mechanic
    registerExtension({ id: 'b2b-workshop', name: 'Delavnica', icon: 'wrench', role: 'mechanic', route: '/b2b/delavnica', order: 40 });
    registerExtension({ id: 'b2b-service-entry', name: 'VIN vnos servisa', icon: 'clipboard-list', role: 'mechanic', route: '/b2b/servis-vnos', order: 50 });

    // Vulcanizer
    registerExtension({ id: 'b2b-tire-hotel', name: 'Hotel za gume', icon: 'circle-dot', role: 'vulcanizer', route: '/b2b/hotel-gum', order: 40 });
}
