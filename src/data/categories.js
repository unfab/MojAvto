// ═══════════════════════════════════════════════════════════════════════════════
// Category hierarchy data — MojAvto.si
// Defines the full navigation tree: mainCategory → subcategory → vehicleType
// Each leaf category maps to search filters that get applied on the search page.
// ═══════════════════════════════════════════════════════════════════════════════

export const MAIN_CATEGORIES = {
    avto: {
        label: 'Avto',
        icon: 'car',
        slug: 'avto',
        // Avto goes directly to advanced search (existing flow)
        directSearch: true,
    },
    moto: {
        label: 'Moto',
        icon: 'bike',
        slug: 'moto',
        subcategories: {
            motorno_kolo: {
                label: 'Motorno kolo',
                icon: 'bike',
                slug: 'motorno-kolo',
                searchType: 'vozilo', // default — searching for the vehicle itself
                vehicleTypes: [
                    { value: 'SportniMotor', label: 'Športni motor' },
                    { value: 'NakedBike', label: 'Naked bike' },
                    { value: 'Enduro', label: 'Enduro' },
                    { value: 'Chopper', label: 'Chopper' },
                    { value: 'Tourer', label: 'Tourer' },
                    { value: 'Supermoto', label: 'Supermoto' },
                    { value: 'Trial', label: 'Trial' },
                    { value: 'Cross', label: 'Cross' },
                    { value: 'Skuter', label: 'Skuter' },
                    { value: 'Minimoto', label: 'Minimoto' },
                    { value: 'Gocart', label: 'Gocart' },
                    { value: 'MotorneSani', label: 'Motorne sani' },
                    { value: 'EMoto', label: 'E-Moto' },
                    { value: 'ESkiro', label: 'E-Skiro' },
                    { value: 'EKolo', label: 'E-Kolo' },
                ],
            },
            atv_utv: {
                label: 'ATV / UTV',
                icon: 'tractor',
                slug: 'atv-utv',
                searchType: 'vozilo',
                vehicleTypes: [],
            },
            motorne_sani: {
                label: 'Motorne sani',
                icon: 'snowflake',
                slug: 'motorne-sani',
                searchType: 'vozilo',
                vehicleTypes: [],
            },
            moto_oprema_deli: {
                label: 'Moto oprema in deli',
                icon: 'wrench',
                slug: 'moto-oprema-deli',
                searchType: 'deli',
                vehicleTypes: [],
            },
            moto_pnevmatike: {
                label: 'Pnevmatike',
                icon: 'circle-dot',
                slug: 'moto-pnevmatike',
                searchType: 'pnevmatike',
                vehicleTypes: [],
            },
            moto_najem: {
                label: 'Najem',
                icon: 'calendar',
                slug: 'moto-najem',
                searchType: 'najem',
                vehicleTypes: [],
            },
        },
    },
    gospodarska: {
        label: 'Gospodarska vozila',
        icon: 'truck',
        slug: 'gospodarska',
        subcategories: {
            dostavna: {
                label: 'Dostavna vozila',
                icon: 'truck',
                slug: 'dostavna',
                // When user clicks, they are asked: Vozilo, Deli in opremo, Pnevmatike
                askSearchType: true,
                vehicleTypes: [],
            },
            tovorna: {
                label: 'Tovorna vozila',
                icon: 'truck',
                slug: 'tovorna',
                askSearchType: true,
                vehicleTypes: [],
            },
            avtobus: {
                label: 'Avtobus',
                icon: 'bus-front',
                slug: 'avtobus',
                askSearchType: true,
                vehicleTypes: [],
            },
            tovorne_prikolice: {
                label: 'Tovorne prikolice',
                icon: 'container',
                slug: 'tovorne-prikolice',
                askSearchType: true,
                vehicleTypes: [],
            },
            gradbena: {
                label: 'Gradbena mehanizacija',
                icon: 'hard-hat',
                slug: 'gradbena',
                askSearchType: true,
                vehicleTypes: [],
            },
            kmetijska: {
                label: 'Kmetijska mehanizacija',
                icon: 'wheat',
                slug: 'kmetijska',
                askSearchType: true,
                vehicleTypes: [],
            },
            komunalna: {
                label: 'Komunalna mehanizacija',
                icon: 'recycle',
                slug: 'komunalna',
                askSearchType: true,
                vehicleTypes: [],
            },
            gozdarska: {
                label: 'Gozdarska mehanizacija',
                icon: 'tree-pine',
                slug: 'gozdarska',
                askSearchType: true,
                vehicleTypes: [],
            },
            vilicarji: {
                label: 'Viličarji',
                icon: 'forklift',
                slug: 'vilicarji',
                askSearchType: true,
                vehicleTypes: [],
            },
        },
    },
    prosti_cas: {
        label: 'Prosti čas',
        icon: 'palmtree',
        slug: 'prosti-cas',
        hasRentalToggle: true,
        subcategories: {
            avtodom: {
                label: 'Avtodom',
                icon: 'caravan',
                slug: 'avtodom',
                searchType: 'vozilo',
                vehicleTypes: [],
            },
            pocitniiska_prikolica: {
                label: 'Počitniška prikolica',
                icon: 'tent',
                slug: 'pocitniiska-prikolica',
                searchType: 'vozilo',
                vehicleTypes: [],
            },
            mobilna_hisica: {
                label: 'Mobilna hišica',
                icon: 'home',
                slug: 'mobilna-hisica',
                searchType: 'vozilo',
                vehicleTypes: [],
            },
            snemljiv_bivalnik: {
                label: 'Snemljiv bivalnik',
                icon: 'box',
                slug: 'snemljiv-bivalnik',
                searchType: 'vozilo',
                vehicleTypes: [],
            },
            sotorska_prikolica: {
                label: 'Šotorska prikolica',
                icon: 'tent',
                slug: 'sotorska-prikolica',
                searchType: 'vozilo',
                vehicleTypes: [],
            },
        },
    },
};

// Search type options shown when askSearchType === true (gospodarska subcategories)
export const SEARCH_TYPE_OPTIONS = [
    { value: 'vozilo', label: 'Vozilo', icon: 'truck' },
    { value: 'deli', label: 'Dele in opremo', icon: 'wrench' },
    { value: 'pnevmatike', label: 'Pnevmatike', icon: 'circle-dot' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: resolve a category path from URL params
// e.g. cat=moto&sub=motorno-kolo → { main: {...}, sub: {...} }
// ═══════════════════════════════════════════════════════════════════════════════
export function resolveCategory(catSlug, subSlug) {
    const main = Object.values(MAIN_CATEGORIES).find(c => c.slug === catSlug);
    if (!main) return null;
    if (!subSlug || !main.subcategories) return { main, sub: null };
    const sub = Object.values(main.subcategories).find(s => s.slug === subSlug);
    return { main, sub: sub || null };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: get all vehicle types for a subcategory
// ═══════════════════════════════════════════════════════════════════════════════
export function getVehicleTypes(catSlug, subSlug) {
    const resolved = resolveCategory(catSlug, subSlug);
    if (!resolved || !resolved.sub) return [];
    return resolved.sub.vehicleTypes || [];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: build URL hash for navigating to search with category context
// ═══════════════════════════════════════════════════════════════════════════════
export function buildSearchUrl(catSlug, subSlug, searchType, vehicleType, rental) {
    const params = new URLSearchParams();
    if (catSlug) params.set('cat', catSlug);
    if (subSlug) params.set('sub', subSlug);
    if (searchType) params.set('searchType', searchType);
    if (vehicleType) params.set('vtype', vehicleType);
    if (rental) params.set('najem', '1');
    return `#/iskanje?${params.toString()}`;
}
