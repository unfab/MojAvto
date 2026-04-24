// serviceIcons.js — Icon pack for B2B services (Lucide names + Slovenian labels)
// Grouped by car-industry use-case. Used in services picker + public profile.

export const SERVICE_ICONS = [
    // ── Servis & vzdrževanje ──
    { id: 'oil-change',   name: 'Menjava olja',        icon: 'droplet',        group: 'Servis' },
    { id: 'filter',       name: 'Menjava filtrov',     icon: 'filter',         group: 'Servis' },
    { id: 'maintenance',  name: 'Redni servis',        icon: 'wrench',         group: 'Servis' },
    { id: 'engine',       name: 'Motor',               icon: 'cog',            group: 'Servis' },
    { id: 'transmission', name: 'Menjalnik',           icon: 'gauge',          group: 'Servis' },
    { id: 'timing-belt',  name: 'Zobati jermen',       icon: 'settings',       group: 'Servis' },
    { id: 'exhaust',      name: 'Izpušni sistem',      icon: 'wind',           group: 'Servis' },
    { id: 'cooling',      name: 'Hladilni sistem',     icon: 'thermometer',    group: 'Servis' },

    // ── Diagnostika ──
    { id: 'diagnostic',   name: 'Računalniška diag.',  icon: 'cpu',            group: 'Diagnostika' },
    { id: 'check-engine', name: 'Napaka na motorju',   icon: 'alert-triangle', group: 'Diagnostika' },
    { id: 'battery',      name: 'Akumulator',          icon: 'battery',        group: 'Diagnostika' },
    { id: 'electrical',   name: 'Elektrika',           icon: 'zap',            group: 'Diagnostika' },
    { id: 'ac',           name: 'Klima',               icon: 'snowflake',      group: 'Diagnostika' },

    // ── Pnevmatike ──
    { id: 'tire-change',  name: 'Menjava gum',         icon: 'circle',         group: 'Pnevmatike' },
    { id: 'tire-balance', name: 'Centriranje',         icon: 'circle-dot',     group: 'Pnevmatike' },
    { id: 'tire-repair',  name: 'Krpanje pnevmatike',  icon: 'bandage',        group: 'Pnevmatike' },
    { id: 'tire-storage', name: 'Hotel za gume',       icon: 'archive',        group: 'Pnevmatike' },
    { id: 'alignment',    name: 'Geometrija',          icon: 'move-3d',        group: 'Pnevmatike' },

    // ── Zavore & podvozje ──
    { id: 'brakes',       name: 'Zavore',              icon: 'disc',           group: 'Zavore' },
    { id: 'suspension',   name: 'Vzmetenje',           icon: 'activity',       group: 'Zavore' },
    { id: 'steering',     name: 'Volanski sistem',     icon: 'steering-wheel', group: 'Zavore' },

    // ── Karoserija & lak ──
    { id: 'bodywork',     name: 'Karoserija',          icon: 'car',            group: 'Karoserija' },
    { id: 'paint',        name: 'Lakiranje',           icon: 'palette',        group: 'Karoserija' },
    { id: 'polish',       name: 'Poliranje',           icon: 'sparkles',       group: 'Karoserija' },
    { id: 'glass',        name: 'Stekla',              icon: 'square',         group: 'Karoserija' },

    // ── Pranje & nega ──
    { id: 'wash',         name: 'Ročno pranje',        icon: 'shower-head',    group: 'Nega' },
    { id: 'detailing',    name: 'Detailing',           icon: 'star',           group: 'Nega' },
    { id: 'interior',     name: 'Čiščenje notranjosti', icon: 'sofa',          group: 'Nega' },
    { id: 'ceramic',      name: 'Keramična zaščita',   icon: 'shield',         group: 'Nega' },

    // ── Prodaja & ostalo ──
    { id: 'sale',         name: 'Prodaja vozila',      icon: 'tag',            group: 'Ostalo' },
    { id: 'inspection',   name: 'Tehnični pregled',    icon: 'clipboard-check', group: 'Ostalo' },
    { id: 'towing',       name: 'Šlepanje',            icon: 'truck',          group: 'Ostalo' },
    { id: 'rental',       name: 'Najem vozila',        icon: 'key-round',      group: 'Ostalo' },
    { id: 'other',        name: 'Drugo',               icon: 'more-horizontal', group: 'Ostalo' },
];

export function findIcon(id) {
    return SERVICE_ICONS.find(i => i.id === id);
}

export function getIconLucide(id) {
    return findIcon(id)?.icon || 'wrench';
}

export function groupedIcons() {
    const groups = {};
    for (const i of SERVICE_ICONS) {
        (groups[i.group] = groups[i.group] || []).push(i);
    }
    return groups;
}
