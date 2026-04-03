// ═══════════════════════════════════════════════════════════════════════════════
// Equipment data — MojAvto.si
// Single source of truth for equipment/features.
// Values MUST match `name="features"` checkboxes in advanced-search.html
// Used by: create-listing (step 4) + advanced-search filters
// ═══════════════════════════════════════════════════════════════════════════════

export const EQUIPMENT_GROUPS = [
    {
        id: 'varnost',
        label: 'Varnost',
        icon: 'shield-check',
        categories: ['avto'],
        items: [
            { value: 'ABS',       label: 'ABS' },
            { value: 'ESP',       label: 'ESP / stabilizacijski sistem' },
            { value: 'Alarm',     label: 'Alarmni sistem' },
            { value: 'BlindSpot', label: 'Asistenca mrtvega kota' },
            { value: 'RoadSign',  label: 'Prepoznavanje prometnih znakov' },
            { value: 'LaneDep',   label: 'Opozorilnik zapustitve pasu' },
            { value: 'LaneAssist',label: 'Asistenca ohranjanja pasu' },
            { value: 'AutoBrake', label: 'Avtomatsko zaviranje (AEB)' },
            { value: 'CrossTraffic', label: 'Opozorilo na prečni promet' },
        ],
    },
    {
        id: 'razsvetljava',
        label: 'Razsvetljava',
        icon: 'sun',
        categories: ['avto'],
        items: [
            { value: 'LED',    label: 'LED luči' },
            { value: 'Xenon',  label: 'Ksenonski žarometi' },
            { value: 'Matrix', label: 'Matrični / laserski žarometi' },
            { value: 'DRL',    label: 'Dnevne luči (DRL)' },
            { value: 'Fog',    label: 'Meglenke' },
        ],
    },
    {
        id: 'udobje',
        label: 'Udobje',
        icon: 'sofa',
        categories: ['avto'],
        items: [
            { value: 'Climate',        label: 'Klimatska naprava' },
            { value: 'Climate2Zone',   label: 'Dvoconska klima' },
            { value: 'ElectricSeats',  label: 'Električni sedeži' },
            { value: 'HeatedSeats',    label: 'Ogrevanje sedežev (spredaj)' },
            { value: 'HeatedSeatsRear',label: 'Ogrevanje sedežev (zadaj)' },
            { value: 'MassageSeats',   label: 'Masažni sedeži' },
            { value: 'CooledSeats',    label: 'Hlajenje sedežev' },
            { value: 'Panorama',       label: 'Panoramska streha' },
            { value: 'Sibedah',        label: 'Šibedah / odprta streha' },
            { value: 'ElecTrunk',      label: 'Električna prtljažna vrata' },
            { value: 'HeatedWheel',    label: 'Ogrevani volan' },
            { value: 'Keyless',        label: 'Keyless start / vstop' },
            { value: 'MemorySeats',    label: 'Pomnilnik položaja sedežev' },
            { value: 'AirSuspension',  label: 'Zračno vzmetenje' },
        ],
    },
    {
        id: 'parkiranje',
        label: 'Parkiranje & kamera',
        icon: 'parking-square',
        categories: ['avto'],
        items: [
            { value: 'ParkSensorFront', label: 'Parkirni senzorji (spredaj)' },
            { value: 'ParkSensorRear',  label: 'Parkirni senzorji (zadaj)' },
            { value: 'RearCamera',      label: 'Vzvratna kamera' },
            { value: 'Camera360',       label: '360° kamera' },
            { value: 'AutoParking',     label: 'Avtopark / samodejno parkiranje' },
        ],
    },
    {
        id: 'multimedija',
        label: 'Multimedija',
        icon: 'monitor-smartphone',
        categories: ['avto'],
        items: [
            { value: 'Navigation',     label: 'Navigacijski sistem' },
            { value: 'Bluetooth',      label: 'Bluetooth' },
            { value: 'Handsfree',      label: 'Prostoročno telefoniranje' },
            { value: 'CarPlay',        label: 'Apple CarPlay / Android Auto' },
            { value: 'HifiSound',      label: 'Premium ozvočenje (Bose/Burmester)' },
            { value: 'DigitalCockpit', label: 'Digitalni števec (Virtual Cockpit)' },
            { value: 'HUD',            label: 'Head-up display' },
            { value: 'WiFi',           label: 'Vgrajen Wi-Fi / hotspot' },
            { value: 'Wireless',       label: 'Brezžično polnjenje telefona' },
        ],
    },
    {
        id: 'asistenti',
        label: 'Asistenčni sistemi',
        icon: 'cpu',
        categories: ['avto'],
        items: [
            { value: 'CruiseControl',     label: 'Tempomat' },
            { value: 'AdaptiveCruise',    label: 'Adaptivni tempomat (ACC)' },
            { value: 'TrafficJamAssist',  label: 'Asistenca v zastoju' },
            { value: 'NightVision',       label: 'Nočni vid' },
            { value: 'FatigueAlert',      label: 'Opozorilnik utrujenosti' },
        ],
    },
    {
        id: 'prtljaga',
        label: 'Prtljaga & vleka',
        icon: 'package',
        categories: ['avto'],
        items: [
            { value: 'TowBar',       label: 'Kljuka za prikolico' },
            { value: 'RoofRails',    label: 'Strešni nosilci' },
            { value: 'FoldSeat',     label: 'Zložljivi zadnji sedeži' },
        ],
    },
    {
        id: 'garancija',
        label: 'Garancija in servis',
        icon: 'badge-check',
        categories: ['all'],
        items: [
            { value: 'ServiceBook',  label: 'Potrjena servisna knjiga' },
            { value: 'Warranty',     label: 'Z garancijo' },
            { value: 'NonSmoking',   label: 'Nekadilsko vozilo' },
        ],
    },
    {
        id: 'moto',
        label: 'Moto oprema',
        icon: 'bike',
        categories: ['moto'],
        items: [
            { value: 'MotoABS',        label: 'ABS zavore' },
            { value: 'MotoCruise',     label: 'Tempomat' },
            { value: 'ElecSuspension', label: 'El. nastavljivo vzmetenje' },
            { value: 'MotoNavigation', label: 'Navigacija' },
            { value: 'Panniers',       label: 'Kovček / stranske torbice' },
            { value: 'SportExhaust',   label: 'Športni izpuh' },
            { value: 'TPMS',           label: 'TPMS (senzor tlaka)' },
            { value: 'Quickshifter',   label: 'Quickshifter' },
            { value: 'HeatedGrips',    label: 'Ogrevanje ročic' },
            { value: 'TractionControl','label': 'Kontrola vleke (TC)' },
        ],
    },
];

// Get equipment items for a specific category (avto/moto/etc.)
export function getEquipmentForCategory(category) {
    const cat = (category || 'avto').toLowerCase();
    return EQUIPMENT_GROUPS.filter(g =>
        g.categories.includes(cat) || g.categories.includes('all')
    );
}

// Flat list of all values (for search filtering)
export const ALL_EQUIPMENT_VALUES = EQUIPMENT_GROUPS.flatMap(g => g.items.map(i => i.value));

// Lookup: value → label
export function getEquipmentLabel(value) {
    for (const group of EQUIPMENT_GROUPS) {
        const item = group.items.find(i => i.value === value);
        if (item) return item.label;
    }
    return value;
}
