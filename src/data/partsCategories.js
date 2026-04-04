// ═══════════════════════════════════════════════════════════════════════════════
// Parts & Equipment Category Hierarchy — MojAvto.si
// 3–5 level deep structure with dynamic filters per subcategory.
// Used by: parts search page, create-listing (parts type), listing detail
// ═══════════════════════════════════════════════════════════════════════════════

// ── Shared brand lists (reused across subcategories) ─────────────────────────
export const PARTS_BRANDS = {
    exhaust:    ['Akrapovič', 'Remus', 'Supersprint', 'Milltek', 'MagnaFlow', 'Borla', 'Capristo', 'Fi Exhaust'],
    brakes:     ['Brembo', 'EBC Brakes', 'Ferodo', 'Textar', 'ATE', 'Ate', 'Pagid', 'Hawk', 'StopTech'],
    suspension: ['Bilstein', 'KW', 'Öhlins', 'Eibach', 'H&R', 'Tein', 'BC Racing', 'MeisterR', 'Whiteline'],
    engine:     ['Mahle', 'Elring', 'Victor Reinz', 'Goetze', 'Total Seal', 'Wiseco'],
    filters:    ['K&N', 'BMC', 'Pipercross', 'Mann', 'Mahle', 'Fram', 'WIX'],
    turbo:      ['Garrett', 'BorgWarner', 'Mitsubishi Turbo', 'IHI', 'Holset', 'TTE', 'Pure Turbos'],
    wheels:     ['BBS', 'OZ Racing', 'Enkei', 'Rays', 'Vossen', 'Rotiform', 'HRE', 'Borbet', 'Rial'],
    tyres:      ['Michelin', 'Pirelli', 'Continental', 'Bridgestone', 'Dunlop', 'Goodyear', 'Yokohama', 'Hankook', 'Falken', 'Toyo'],
    electronics:['Bosch', 'Denso', 'Delphi', 'Siemens VDO', 'Hella', 'Valeo', 'Continental'],
    bodykit:    ['Maxton Design', 'Prior Design', 'Rieger', 'RDX', 'Caractere', 'AC Schnitzer', 'Hamann'],
    oils:       ['Castrol', 'Mobil 1', 'Shell Helix', 'Motul', 'Liqui Moly', 'Total', 'Gulf', 'Fuchs'],
    lights:     ['Hella', 'Valeo', 'Osram', 'Philips', 'Magneti Marelli', 'Depo', 'TYC'],
    multimedia: ['Pioneer', 'Kenwood', 'Alpine', 'Sony', 'JVC', 'Blaupunkt', 'Focal'],
};

// ── Dynamic filter definitions per subcategory ────────────────────────────────
// type: 'select' | 'checkbox' | 'range' | 'multi'
const FILTERS = {
    exhaust: [
        { id: 'material',      label: 'Material',       type: 'select', options: ['Inox', 'Titan', 'Jeklo', 'Carbon'] },
        { id: 'homologacija',  label: 'Homologiran',    type: 'checkbox' },
        { id: 'glasnost',      label: 'Glasnost',       type: 'select', options: ['Street (tiho)', 'Sport (srednje)', 'Race (glasno)'] },
        { id: 'tip',           label: 'Tip sistema',    type: 'select', options: ['Zadnji lonec', 'Srednji lonec', 'Downpipe', 'Kolektor', 'Celoten sistem'] },
        { id: 'valvtronic',    label: 'Valvetronic',    type: 'checkbox' },
    ],
    brakes: [
        { id: 'premer',        label: 'Premer diska (mm)', type: 'range', min: 240, max: 420, step: 5 },
        { id: 'tip_diska',     label: 'Tip diska',      type: 'select', options: ['Ventilirani', 'Polni', 'Žlebljeni', 'Preluknjani', 'Žlebljeni + preluknjani'] },
        { id: 'tip_dela',      label: 'Del',            type: 'select', options: ['Disk', 'Ploščica', 'Čeljust', 'Komplet (disk + ploščica)', 'Cev', 'Tekočina'] },
        { id: 'os',            label: 'Os',             type: 'select', options: ['Spredaj', 'Zadaj', 'Spredaj + zadaj'] },
        { id: 'compound',      label: 'Compound',       type: 'select', options: ['Street', 'Street/Track', 'Track', 'Race'] },
    ],
    suspension: [
        { id: 'tip',           label: 'Tip',            type: 'select', options: ['Amortizer', 'Vzmetni komplet', 'Coilover', 'Vzmeti', 'Roke in stabilizatorji', 'Blažilci'] },
        { id: 'spust',         label: 'Spust (mm)',     type: 'range', min: 0, max: 100, step: 5 },
        { id: 'nastavljivo',   label: 'Nastavljivo',    type: 'checkbox' },
        { id: 'os',            label: 'Os',             type: 'select', options: ['Spredaj', 'Zadaj', 'Komplet'] },
    ],
    turbo: [
        { id: 'tip',           label: 'Tip',            type: 'select', options: ['Turbokompresor', 'Supercharger', 'Hladilnik polnilnega zraka', 'Wastegate', 'BOV', 'Downpipe'] },
        { id: 'moc_min',       label: 'Ciljna moč (HP) od', type: 'select', options: ['200+', '300+', '400+', '500+', '600+', '800+'] },
    ],
    intake: [
        { id: 'tip',           label: 'Tip',            type: 'select', options: ['Sportni filter', 'Short ram intake', 'Cold air intake', 'Dolg sesalnik (CAI)', 'MAF senzor', 'Throttle body'] },
        { id: 'material',      label: 'Material',       type: 'select', options: ['Guma', 'Silikon', 'Karbonska vlakna', 'Aluminij'] },
    ],
    wheels: [
        { id: 'premer',        label: 'Premer (palci)', type: 'select', options: ['15"', '16"', '17"', '18"', '19"', '20"', '21"', '22"', '23"'] },
        { id: 'sirina',        label: 'Širina (J)',     type: 'range', min: 6, max: 12, step: 0.5 },
        { id: 'et',            label: 'ET (odmik)',     type: 'range', min: 10, max: 60, step: 1 },
        { id: 'izvrt',         label: 'Izvrtina (mm)',  type: 'select', options: ['57.1', '60.1', '63.4', '66.6', '67.1', '70.1', '72.6'] },
        { id: 'pcd',           label: 'PCD (vijaki)',   type: 'select', options: ['4x98', '4x100', '4x108', '4x114.3', '5x100', '5x108', '5x110', '5x112', '5x114.3', '5x120', '5x130'] },
        { id: 'material',      label: 'Material',       type: 'select', options: ['Aluminijeva zlitina', 'Kovanje', 'Jeklo'] },
        { id: 'tip',           label: 'Tip',            type: 'select', options: ['Platišče (1 kos)', 'Komplet (4 kosi)', 'Rezervno platišče'] },
    ],
    tyres: [
        { id: 'sirina',        label: 'Širina',         type: 'select', options: ['155', '165', '175', '185', '195', '205', '215', '225', '235', '245', '255', '265', '275', '285', '295', '305', '315', '325'] },
        { id: 'profil',        label: 'Profil',         type: 'select', options: ['25', '30', '35', '40', '45', '50', '55', '60', '65', '70'] },
        { id: 'premer',        label: 'Premer',         type: 'select', options: ['14', '15', '16', '17', '18', '19', '20', '21', '22'] },
        { id: 'sezona',        label: 'Sezona',         type: 'select', options: ['Letne', 'Zimske', 'Celoletne', 'Štiri letne'] },
        { id: 'tip',           label: 'Tip',            type: 'select', options: ['Cestne', 'Športne', 'Terenske', 'Run-flat', 'Dirkaške'] },
        { id: 'kolicina',      label: 'Količina',       type: 'select', options: ['1 kos', '2 kosa', '4 kosi'] },
    ],
    lights: [
        { id: 'tip',           label: 'Tip',            type: 'select', options: ['Žarometov (levi)', 'Žarometov (desni)', 'Žarometov (komplet)', 'Zadnje luči', 'Meglenke', 'DRL', 'Dnevne luči'] },
        { id: 'tehnologija',   label: 'Tehnologija',    type: 'select', options: ['LED', 'Xenon', 'Halogene', 'Laserske'] },
        { id: 'stran',         label: 'Stran',          type: 'select', options: ['Leva', 'Desna', 'Komplet'] },
    ],
    ecu: [
        { id: 'tip',           label: 'Tip',            type: 'select', options: ['ECU (originalni)', 'Remap / Stage 1', 'Remap / Stage 2', 'Remap / Stage 3', 'Piggyback modul', 'TCU (menjalnk)'] },
    ],
    service: [
        { id: 'tip',           label: 'Tip',            type: 'select', options: ['Motorno olje', 'Menjalniško olje', 'Filter olja', 'Filter zraka', 'Svečke', 'Jermenica', 'Hladilna tekočina', 'Zavorna tekočina', 'Brisalci'] },
        { id: 'viskoznost',    label: 'Viskoznost olja', type: 'select', options: ['0W-20', '0W-30', '5W-30', '5W-40', '10W-40', '10W-60', '15W-50'] },
    ],
};

// ── Full category tree ─────────────────────────────────────────────────────────
export const PARTS_CATEGORIES = {
    motor_pogon: {
        label: 'Motor & pogon',
        icon: 'cog',
        slug: 'motor-pogon',
        color: '#ef4444',
        subcategories: {
            motor_deli: {
                label: 'Deli motorja',
                slug: 'deli-motorja',
                icon: 'cpu',
                brands: PARTS_BRANDS.engine,
                filters: [],
                children: {
                    bati:       { label: 'Bati in odmične gredi', slug: 'bati' },
                    tesnila:    { label: 'Tesnila in plošče', slug: 'tesnila' },
                    ojnica:     { label: 'Ojnice in ročična gred', slug: 'ojnice' },
                    glava:      { label: 'Glava motorja', slug: 'glava-motorja' },
                    voda:       { label: 'Vodna / oljna črpalka', slug: 'crpalke' },
                    timing:     { label: 'Timing kit', slug: 'timing-kit' },
                },
            },
            turbo: {
                label: 'Turbo & kompresorji',
                slug: 'turbo',
                icon: 'wind',
                brands: PARTS_BRANDS.turbo,
                filters: FILTERS.turbo,
                children: {
                    turbocharger: { label: 'Turbokompresor', slug: 'turbokompresor' },
                    supercharger: { label: 'Supercharger', slug: 'supercharger' },
                    intercooler:  { label: 'Hladilnik polnilnega zraka', slug: 'intercooler' },
                    wastegate:    { label: 'Wastegate / BOV', slug: 'wastegate' },
                },
            },
            sesalni: {
                label: 'Sesalni sistem',
                slug: 'sesalni-sistem',
                icon: 'filter',
                brands: PARTS_BRANDS.filters,
                filters: FILTERS.intake,
                children: {
                    filter:   { label: 'Sportni filter', slug: 'sportni-filter' },
                    intake:   { label: 'Intake kit', slug: 'intake-kit' },
                    maf:      { label: 'MAF / MAP senzor', slug: 'maf-senzor' },
                    throttle: { label: 'Throttle body', slug: 'throttle-body' },
                },
            },
            izpusni: {
                label: 'Izpušni sistem',
                slug: 'izpusni-sistem',
                icon: 'flame',
                brands: PARTS_BRANDS.exhaust,
                filters: FILTERS.exhaust,
                children: {
                    kolektor:  { label: 'Kolektor / Manifold', slug: 'kolektor' },
                    downpipe:  { label: 'Downpipe / Katalizator', slug: 'downpipe' },
                    srednji:   { label: 'Srednji lonec', slug: 'srednji-lonec' },
                    zadnji:    { label: 'Zadnji lonec', slug: 'zadnji-lonec' },
                    celoten:   { label: 'Celoten sistem', slug: 'celoten-sistem' },
                },
            },
            menjalnik: {
                label: 'Menjalnik & pogon',
                slug: 'menjalnik',
                icon: 'settings-2',
                brands: [],
                filters: [],
                children: {
                    sklopka:   { label: 'Sklopka & disk', slug: 'sklopka' },
                    pogonska:  { label: 'Pogonska gred & kardanska', slug: 'pogonska-gred' },
                    diferencial:{ label: 'Diferencial', slug: 'diferencial' },
                    lsd:       { label: 'LSD / sportni diferencial', slug: 'lsd' },
                },
            },
        },
    },

    podvozje_zavore: {
        label: 'Podvozje & zavore',
        icon: 'circle-dot',
        slug: 'podvozje-zavore',
        color: '#f97316',
        subcategories: {
            zavore: {
                label: 'Zavore',
                slug: 'zavore',
                icon: 'disc-3',
                brands: PARTS_BRANDS.brakes,
                filters: FILTERS.brakes,
                children: {
                    diski:     { label: 'Zavorni diski', slug: 'zavorni-diski' },
                    ploscice:  { label: 'Zavorné ploščice', slug: 'zavorne-ploscice' },
                    celjusti:  { label: 'Zavorné čeljusti', slug: 'zavorne-celjusti' },
                    komplet:   { label: 'Komplet disk + ploščica', slug: 'komplet-zavore' },
                    cevi:      { label: 'Zavorné cevi (Braided)', slug: 'zavorne-cevi' },
                    tecnost:   { label: 'Zavorna tekočina', slug: 'zavorna-tecnost' },
                },
            },
            vzmetenje: {
                label: 'Vzmetenje',
                slug: 'vzmetenje',
                icon: 'chevrons-down',
                brands: PARTS_BRANDS.suspension,
                filters: FILTERS.suspension,
                children: {
                    amortizer:   { label: 'Amortizer', slug: 'amortizer' },
                    vzmetni_k:   { label: 'Vzmetni kompleti', slug: 'vzmetni-komplet' },
                    coilover:    { label: 'Coilover', slug: 'coilover' },
                    vzmeti:      { label: 'Vzmetí', slug: 'vzmeti' },
                },
            },
            roke_stab: {
                label: 'Roke & stabilizatorji',
                slug: 'roke-stabilizatorji',
                icon: 'move-horizontal',
                brands: PARTS_BRANDS.suspension,
                filters: [
                    { id: 'tip', label: 'Tip', type: 'select', options: ['Sprednja roka', 'Zadnja roka', 'Stabilizator', 'Blok stabilizatorja', 'Spojna cev'] },
                ],
                children: {
                    sprednje: { label: 'Sprednje roke', slug: 'sprednje-roke' },
                    zadnje:   { label: 'Zadnje roke', slug: 'zadnje-roke' },
                    stab:     { label: 'Stabilizatorji', slug: 'stabilizatorji' },
                },
            },
            upravljanje: {
                label: 'Upravljanje & krmiljenje',
                slug: 'upravljanje',
                icon: 'steering-wheel',
                brands: [],
                filters: [],
                children: {
                    servo:  { label: 'Servo volan / črpalka', slug: 'servo' },
                    blazilci:{ label: 'Blažilci volanskega mehanizma', slug: 'blazilci-volan' },
                },
            },
        },
    },

    karoserija_zunanjost: {
        label: 'Karoserija & zunanjost',
        icon: 'car-front',
        slug: 'karoserija-zunanjost',
        color: '#3b82f6',
        subcategories: {
            odbijaci: {
                label: 'Odbijači',
                slug: 'odbijaci',
                icon: 'shield',
                brands: PARTS_BRANDS.bodykit,
                filters: [
                    { id: 'pozicija', label: 'Pozicija', type: 'select', options: ['Sprednji', 'Zadnji', 'Komplet'] },
                    { id: 'material', label: 'Material', type: 'select', options: ['ABS plastika', 'Karbonska vlakna', 'Poliuretan', 'FRP'] },
                ],
                children: {
                    sprednji: { label: 'Sprednji odbijač', slug: 'sprednji-odbijac' },
                    zadnji:   { label: 'Zadnji odbijač', slug: 'zadnji-odbijac' },
                    spojler:  { label: 'Spojler / difuzor', slug: 'spojler' },
                    lip:      { label: 'Front lip', slug: 'front-lip' },
                },
            },
            pokrovi: {
                label: 'Pokrovi',
                slug: 'pokrovi',
                icon: 'layers',
                brands: PARTS_BRANDS.bodykit,
                filters: [
                    { id: 'tip', label: 'Tip', type: 'select', options: ['Hauba motorja', 'Pokrov prtljažnika', 'Strešni pokrov', 'Carbon hauba'] },
                    { id: 'material', label: 'Material', type: 'select', options: ['Jeklo', 'Aluminij', 'Karbonska vlakna', 'FRP'] },
                ],
                children: {
                    hauba:    { label: 'Hauba motorja', slug: 'hauba' },
                    prtljaznik:{ label: 'Pokrov prtljažnika', slug: 'pokrov-prtljaznik' },
                    streha:   { label: 'Strešni paneeli', slug: 'stresni-paneli' },
                },
            },
            luci: {
                label: 'Luči',
                slug: 'luci',
                icon: 'zap',
                brands: PARTS_BRANDS.lights,
                filters: FILTERS.lights,
                children: {
                    zarometi:  { label: 'Žarometi (spredaj)', slug: 'zarometi-spredaj' },
                    zadnje:    { label: 'Zadnje luči', slug: 'zadnje-luci' },
                    drl:       { label: 'DRL / dnevne luči', slug: 'drl' },
                    meglenke:  { label: 'Meglenke', slug: 'meglenke' },
                    dodatne:   { label: 'Dodatne / LED trakovi', slug: 'led-trakovi' },
                },
            },
            ogledala: {
                label: 'Ogledala',
                slug: 'ogledala',
                icon: 'flip-horizontal',
                brands: PARTS_BRANDS.bodykit,
                filters: [
                    { id: 'stran', label: 'Stran', type: 'select', options: ['Leva', 'Desna', 'Komplet'] },
                    { id: 'tip',   label: 'Tip',   type: 'select', options: ['Originalno', 'Carbon', 'Wide body'] },
                ],
                children: {
                    leva:   { label: 'Levo stransko ogledalo', slug: 'ogledalo-levo' },
                    desno:  { label: 'Desno stransko ogledalo', slug: 'ogledalo-desno' },
                    krtacke:{ label: 'Ogledala z električno ogrevanjem', slug: 'ogledala-ogrevanje' },
                },
            },
            bodykit: {
                label: 'Body kit & styling',
                slug: 'bodykit',
                icon: 'sparkles',
                brands: PARTS_BRANDS.bodykit,
                filters: [
                    { id: 'tip',      label: 'Tip',      type: 'select', options: ['Komplet body kit', 'Stranski pragovi', 'Spojler', 'Difuzor', 'Splitter', 'Kanard', 'Spoiler'] },
                    { id: 'material', label: 'Material', type: 'select', options: ['ABS plastika', 'Karbonska vlakna', 'Poliuretan', 'FRP'] },
                ],
                children: {
                    pragovi:   { label: 'Stranski pragovi', slug: 'stranski-pragovi' },
                    spojler_z: { label: 'Zadnji spojler', slug: 'zadnji-spojler' },
                    difuzor:   { label: 'Difuzor', slug: 'difuzor' },
                    komplet:   { label: 'Komplet body kit', slug: 'komplet-bodykit' },
                },
            },
            steklo: {
                label: 'Stekla',
                slug: 'stekla',
                icon: 'square',
                brands: [],
                filters: [
                    { id: 'tip', label: 'Tip', type: 'select', options: ['Vetrobransko steklo', 'Stranska stekla', 'Zadnje steklo', 'Panoramska streha'] },
                ],
                children: {
                    vetrobran: { label: 'Vetrobransko steklo', slug: 'vetrobransko-steklo' },
                    stransko:  { label: 'Stranska stekla', slug: 'stranska-stekla' },
                    zadnje:    { label: 'Zadnje steklo', slug: 'zadnje-steklo' },
                },
            },
        },
    },

    notranjost: {
        label: 'Notranjost',
        icon: 'armchair',
        slug: 'notranjost',
        color: '#8b5cf6',
        subcategories: {
            sedeji: {
                label: 'Sedeži',
                slug: 'sedeji',
                icon: 'armchair',
                brands: ['Recaro', 'Sparco', 'OMP', 'Bride', 'Cobra', 'Sabelt'],
                filters: [
                    { id: 'tip',      label: 'Tip',      type: 'select', options: ['Serijski sedež', 'Sportni sedež', 'Dirkaški sedež (FIA)', 'Zadnji sedež'] },
                    { id: 'material', label: 'Material', type: 'select', options: ['Blago', 'Umetno usnje', 'Pravo usnje', 'Alcantara', 'Karbonska školjka'] },
                    { id: 'pozicija', label: 'Pozicija', type: 'select', options: ['Spredaj levo', 'Spredaj desno', 'Spredaj komplet', 'Zadaj'] },
                ],
                children: {
                    sportni:  { label: 'Sportni sedeži', slug: 'sportni-sedeji' },
                    dirkaski: { label: 'Dirkaški sedeži (FIA)', slug: 'dirkaski-sedeji' },
                    serijski: { label: 'Serijski sedeži', slug: 'serijski-sedeji' },
                    obloge:   { label: 'Obloge sedežev', slug: 'obloge-sedejev' },
                },
            },
            volani: {
                label: 'Volani',
                slug: 'volani',
                icon: 'circle',
                brands: ['Momo', 'Sparco', 'OMP', 'Nardi', 'Raid HP', 'NRG'],
                filters: [
                    { id: 'premer',   label: 'Premer (mm)', type: 'select', options: ['320', '330', '340', '350', '360', '370', '380'] },
                    { id: 'material', label: 'Material',    type: 'select', options: ['Usnje', 'Alcantara', 'Karbon + usnje', 'Guma'] },
                    { id: 'tip',      label: 'Tip',         type: 'select', options: ['Sportni volan', 'Dirkalni volan (FIA)', 'Originalni'] },
                ],
                children: {
                    sportni:  { label: 'Sportni volani', slug: 'sportni-volani' },
                    dirkaski: { label: 'Dirkaški volani', slug: 'dirkaski-volani' },
                    distancnik:{ label: 'Distančnik / hub adapter', slug: 'distancnik-volan' },
                },
            },
            multimedija: {
                label: 'Multimedija',
                slug: 'multimedija',
                icon: 'monitor',
                brands: PARTS_BRANDS.multimedia,
                filters: [
                    { id: 'tip', label: 'Tip', type: 'select', options: ['Avtoradio', 'Subwoofer', 'Ojačevalec', 'Zvočniki', 'DAB+ sprejemnik', 'Kamera za vzvratno vožnjo', 'Android Auto / CarPlay'] },
                ],
                children: {
                    radio:      { label: 'Avtoradio / head unit', slug: 'avtoradio' },
                    zvocniki:   { label: 'Zvočniki', slug: 'zvocniki' },
                    subwoofer:  { label: 'Subwoofer', slug: 'subwoofer' },
                    ojacevalec: { label: 'Ojačevalec', slug: 'ojacevalec' },
                },
            },
            armatura: {
                label: 'Armatura & obloge',
                slug: 'armatura',
                icon: 'layout-dashboard',
                brands: [],
                filters: [
                    { id: 'tip', label: 'Tip', type: 'select', options: ['Armaturna plošča', 'Konzola', 'Obloge vrat', 'Preproge', 'Prtljažne obloge'] },
                ],
                children: {
                    armat:   { label: 'Armaturna plošča', slug: 'armaturna-plosca' },
                    konzola: { label: 'Sredinská konzola', slug: 'sredinska-konzola' },
                    preproge:{ label: 'Preproge', slug: 'preproge' },
                    obloge:  { label: 'Obloge vrat', slug: 'obloge-vrat' },
                },
            },
            varnostni: {
                label: 'Varnostni sistemi (roll cage, harnes)',
                slug: 'varnostni-sistemi',
                icon: 'shield-check',
                brands: ['Sparco', 'OMP', 'Sabelt', 'TRS', 'Schroth'],
                filters: [
                    { id: 'tip', label: 'Tip', type: 'select', options: ['Roll cage / bar', 'Varnostni pas (harnes)', 'Gasilnik', 'Zaprta kabina'] },
                ],
                children: {
                    rollcage: { label: 'Roll cage / roll bar', slug: 'roll-cage' },
                    harnes:   { label: 'Harnes pas', slug: 'harnes' },
                },
            },
        },
    },

    elektronika: {
        label: 'Elektronika',
        icon: 'cpu',
        slug: 'elektronika',
        color: '#06b6d4',
        subcategories: {
            ecu: {
                label: 'ECU & mapiranje',
                slug: 'ecu-mapiranje',
                icon: 'cpu',
                brands: ['Bosch', 'Siemens', 'Delphi', 'Magneti Marelli', 'Ecumaster', 'Link ECU', 'AEM'],
                filters: FILTERS.ecu,
                children: {
                    ecu_unit: { label: 'ECU enota', slug: 'ecu-enota' },
                    remap:    { label: 'Remap / chiptuning', slug: 'remap' },
                    piggyback:{ label: 'Piggyback modul', slug: 'piggyback' },
                    tcu:      { label: 'TCU (menjalnik)', slug: 'tcu' },
                },
            },
            senzorji: {
                label: 'Senzorji',
                slug: 'senzorji',
                icon: 'activity',
                brands: PARTS_BRANDS.electronics,
                filters: [
                    { id: 'tip', label: 'Tip senzorja', type: 'select', options: ['Lambda / O2 senzor', 'MAP / MAF senzor', 'Senzor tlaka olja', 'Senzor temperature', 'ABS senzor', 'Senzor položaja', 'Torkmetri'] },
                ],
                children: {
                    lambda:  { label: 'Lambda / O2 senzor', slug: 'lambda-senzor' },
                    maf_map: { label: 'MAF / MAP senzor', slug: 'maf-map' },
                    abs_senz:{ label: 'ABS senzor', slug: 'abs-senzor' },
                    tlak:    { label: 'Senzor tlaka in temperature', slug: 'senzor-tlaka' },
                },
            },
            kabli: {
                label: 'Kabli & konektorji',
                slug: 'kabli',
                icon: 'plug-zap',
                brands: [],
                filters: [
                    { id: 'tip', label: 'Tip', type: 'select', options: ['Svečkini kabli', 'OBD2 kabel', 'CAN bus modul', 'Akumulator', 'Alternator'] },
                ],
                children: {
                    svecke:    { label: 'Svečkini kabli', slug: 'sveckini-kabli' },
                    akumulator:{ label: 'Akumulator', slug: 'akumulator' },
                    alternator:{ label: 'Alternator', slug: 'alternator' },
                },
            },
            diagnostika: {
                label: 'Diagnostika',
                slug: 'diagnostika',
                icon: 'scan',
                brands: ['Autel', 'Launch', 'Bosch', 'iCarsoft', 'VCDS / VAG-COM'],
                filters: [
                    { id: 'tip', label: 'Tip', type: 'select', options: ['OBD2 bralnik napak', 'Profesionalni skener', 'Hidravlični merilnik tlaka', 'Osciloskop'] },
                ],
                children: {
                    obd2:   { label: 'OBD2 bralnik', slug: 'obd2' },
                    skener: { label: 'Profesionalni skener', slug: 'skener' },
                },
            },
        },
    },

    platisca_pnevmatike: {
        label: 'Platišča & pnevmatike',
        icon: 'circle',
        slug: 'platisca-pnevmatike',
        color: '#10b981',
        subcategories: {
            platisca: {
                label: 'Platišča',
                slug: 'platisca',
                icon: 'circle',
                brands: PARTS_BRANDS.wheels,
                filters: FILTERS.wheels,
                children: {
                    alu:     { label: 'Aluminijasta platišča', slug: 'alu-platisca' },
                    jeklena: { label: 'Jeklena platišča', slug: 'jeklena-platisca' },
                    kovanje: { label: 'Kovana platišča', slug: 'kovana-platisca' },
                },
            },
            pnevmatike: {
                label: 'Pnevmatike',
                slug: 'pnevmatike',
                icon: 'circle-dot',
                brands: PARTS_BRANDS.tyres,
                filters: FILTERS.tyres,
                children: {
                    letne:   { label: 'Letne pnevmatike', slug: 'letne-pnevmatike' },
                    zimske:  { label: 'Zimske pnevmatike', slug: 'zimske-pnevmatike' },
                    celoletne:{ label: 'Celoletne pnevmatike', slug: 'celoletne-pnevmatike' },
                    dirkaske:{ label: 'Dirkaške pnevmatike', slug: 'dirkaske-pnevmatike' },
                },
            },
            vijaki_matic: {
                label: 'Vijaki & matice',
                slug: 'vijaki-matice',
                icon: 'settings',
                brands: ['H&R', 'Eibach', 'Gorilla', 'Rays', 'Project Kics'],
                filters: [
                    { id: 'navoj',  label: 'Navoj',  type: 'select', options: ['M12x1.25', 'M12x1.5', 'M14x1.25', 'M14x1.5'] },
                    { id: 'dolz',   label: 'Dolžina', type: 'select', options: ['28mm', '35mm', '40mm', '50mm', '60mm'] },
                    { id: 'material', label: 'Material', type: 'select', options: ['Jeklo', 'Titan', 'Aluminij'] },
                ],
                children: {
                    vijaki:       { label: 'Vijaki platišč', slug: 'vijaki-platisca' },
                    matic:        { label: 'Matice platišč', slug: 'matic-platisca' },
                    distancniki:  { label: 'Distančniki platišč', slug: 'distancniki-platisca' },
                },
            },
        },
    },

    servis_potrosni: {
        label: 'Servis & potrošni material',
        icon: 'wrench',
        slug: 'servis-potrosni',
        color: '#f59e0b',
        subcategories: {
            olja_filtri: {
                label: 'Olja & filtri',
                slug: 'olja-filtri',
                icon: 'droplets',
                brands: PARTS_BRANDS.oils,
                filters: FILTERS.service,
                children: {
                    motorno_olje: { label: 'Motorno olje', slug: 'motorno-olje' },
                    filter_olja:  { label: 'Filter olja', slug: 'filter-olja' },
                    filter_zraka: { label: 'Filter zraka', slug: 'filter-zraka' },
                    filter_kabine:{ label: 'Filter kabine (pelenka)', slug: 'filter-kabine' },
                    gorivni:      { label: 'Gorivni filter', slug: 'gorivni-filter' },
                },
            },
            svecke_jermeni: {
                label: 'Svečke & jermeni',
                slug: 'svecke-jermeni',
                icon: 'zap',
                brands: ['NGK', 'Bosch', 'Denso', 'Champion', 'Gates', 'SKF', 'Continental'],
                filters: [
                    { id: 'tip', label: 'Tip', type: 'select', options: ['Svečka', 'Žarnica / svečka', 'Jermen zobati', 'Jermen poli', 'Kit jermena (timing kit)'] },
                ],
                children: {
                    svecke:     { label: 'Svečke', slug: 'svecke' },
                    jermen_zob: { label: 'Zobati jermen (timing belt)', slug: 'zobati-jermen' },
                    jermen_poli:{ label: 'Poly V jermen', slug: 'poly-v-jermen' },
                    kit:        { label: 'Timing kit', slug: 'timing-kit' },
                },
            },
            hladilni_sistem: {
                label: 'Hladilni sistem',
                slug: 'hladilni-sistem',
                icon: 'thermometer',
                brands: PARTS_BRANDS.electronics,
                filters: [],
                children: {
                    hladilnik:  { label: 'Hladilnik (radiator)', slug: 'radiator' },
                    termostat:  { label: 'Termostat', slug: 'termostat' },
                    crpalka_h:  { label: 'Vodna črpalka', slug: 'vodna-crpalka' },
                    tecnost_h:  { label: 'Hladilna tekočina', slug: 'hladilna-tecnost' },
                },
            },
        },
    },

    oprema_dodatki: {
        label: 'Oprema & dodatki',
        icon: 'package',
        slug: 'oprema-dodatki',
        color: '#ec4899',
        subcategories: {
            stresni_sistemi: {
                label: 'Strešni sistemi',
                slug: 'stresni-sistemi',
                icon: 'box',
                brands: ['Thule', 'Yakima', 'Hapro', 'Kamei', 'Bosal'],
                filters: [
                    { id: 'tip', label: 'Tip', type: 'select', options: ['Strešni nosilci', 'Strešni šotor', 'Strešna kutija', 'Kolo na streho', 'Smučarski nosilci'] },
                ],
                children: {
                    nosilci:   { label: 'Strešni nosilci', slug: 'stresni-nosilci' },
                    kutija:    { label: 'Strešna kutija', slug: 'stresna-kutija' },
                    kolo:      { label: 'Nastavek za kolo', slug: 'kolo-streha' },
                    smucarski: { label: 'Smučarski nosilci', slug: 'smucarski-nosilci' },
                },
            },
            kljuke: {
                label: 'Vlečne kljuke',
                slug: 'vlecne-kljuke',
                icon: 'git-merge',
                brands: ['Westfalia', 'BRINK', 'Bosal', 'GDW'],
                filters: [
                    { id: 'tip', label: 'Tip', type: 'select', options: ['Fiksna kljuka', 'Snemljiva kljuka', 'Skritá kljuka', 'Električni set'] },
                ],
                children: {
                    fiksna:   { label: 'Fiksna kljuka', slug: 'fiksna-kljuka' },
                    snemljiva:{ label: 'Snemljiva kljuka', slug: 'snemljiva-kljuka' },
                    el_set:   { label: 'El. vtičnica 7/13-pin', slug: 'el-set' },
                },
            },
            kamere_gps: {
                label: 'Kamere & GPS',
                slug: 'kamere-gps',
                icon: 'video',
                brands: ['Garmin', 'Navitel', 'TomTom', 'Nextbase', 'Viofo', 'BlackVue', 'Thinkware'],
                filters: [
                    { id: 'tip', label: 'Tip', type: 'select', options: ['Dash cam (spredaj)', 'Dash cam (front+rear)', 'GPS navigacija', 'Parkirna kamera', '360° kamera'] },
                    { id: 'resolucija', label: 'Resolucija', type: 'select', options: ['720p', '1080p', '1440p', '4K'] },
                ],
                children: {
                    dashcam:   { label: 'Dash cam', slug: 'dash-cam' },
                    gps:       { label: 'GPS navigacija', slug: 'gps-navigacija' },
                    park_cam:  { label: 'Parkirna kamera', slug: 'parkirna-kamera' },
                },
            },
            zastitni: {
                label: 'Zaščitni izdelki',
                slug: 'zastitni',
                icon: 'shield',
                brands: ['XPEL', '3M', 'Llumar', 'Stek', 'Hexis'],
                filters: [
                    { id: 'tip', label: 'Tip', type: 'select', options: ['Paint protection film (PPF)', 'Senčilne folije', 'Polirani premazi (keramika)', 'Zaščita praga', 'Zaščitna mreža'] },
                ],
                children: {
                    ppf:       { label: 'Paint Protection Film (PPF)', slug: 'ppf' },
                    folije:    { label: 'Senčilne folije', slug: 'sencilne-folije' },
                    keramika:  { label: 'Keramični premaz', slug: 'keramicni-premaz' },
                },
            },
        },
    },

    moto_deli: {
        label: 'Moto deli & oprema',
        icon: 'bike',
        slug: 'moto-deli',
        color: '#6366f1',
        subcategories: {
            moto_izpuh: {
                label: 'Izpušni sistem (moto)',
                slug: 'moto-izpuh',
                icon: 'flame',
                brands: ['Akrapovič', 'Remus', 'Leovince', 'Two Brothers', 'Yoshimura', 'SC Project', 'Arrow'],
                filters: FILTERS.exhaust,
                children: {
                    celoten: { label: 'Celoten sistem', slug: 'moto-celoten-izpuh' },
                    slip_on: { label: 'Slip-on (zadnji lonec)', slug: 'slip-on' },
                    kolektor:{ label: 'Kolektor', slug: 'moto-kolektor' },
                },
            },
            moto_zavore: {
                label: 'Zavore (moto)',
                slug: 'moto-zavore',
                icon: 'disc-3',
                brands: PARTS_BRANDS.brakes,
                filters: FILTERS.brakes,
                children: {
                    diski:    { label: 'Zavorni diski', slug: 'moto-diski' },
                    ploscice: { label: 'Zavorné ploščice', slug: 'moto-ploscice' },
                },
            },
            moto_vzmetenje: {
                label: 'Vzmetenje (moto)',
                slug: 'moto-vzmetenje',
                icon: 'chevrons-down',
                brands: ['Öhlins', 'WP', 'KYB', 'Bitubo', 'Wilbers'],
                filters: FILTERS.suspension,
                children: {
                    vilice:   { label: 'Prednje vilice', slug: 'moto-vilice' },
                    amortizer:{ label: 'Zadnji amortizer', slug: 'moto-amortizer' },
                },
            },
            moto_plastike: {
                label: 'Plastike & karoserija',
                slug: 'moto-plastike',
                icon: 'layers',
                brands: [],
                filters: [
                    { id: 'tip', label: 'Tip', type: 'select', options: ['Komplet obloge', 'Sprednji ščitnik', 'Zadnji ščitnik', 'Tank obloga', 'Sedejna obloga'] },
                    { id: 'material', label: 'Material', type: 'select', options: ['ABS plastika', 'Karbonska vlakna', 'FRP'] },
                ],
                children: {
                    komplet:  { label: 'Komplet obloge', slug: 'moto-obloge-komplet' },
                    stitnik:  { label: 'Ščitniki', slug: 'moto-stitniki' },
                },
            },
            moto_oprema: {
                label: 'Moto oprema (voznik)',
                slug: 'moto-oprema-voznik',
                icon: 'hard-hat',
                brands: ['Shoei', 'Arai', 'AGV', 'HJC', 'Dainese', 'Alpinestars', 'Rev\'It'],
                filters: [
                    { id: 'tip', label: 'Tip', type: 'select', options: ['Čelada', 'Jakna', 'Hlače', 'Rokavice', 'Škornji', 'Kombinezon'] },
                    { id: 'velikost', label: 'Velikost', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
                ],
                children: {
                    celade:   { label: 'Čelade', slug: 'moto-celade' },
                    jakne:    { label: 'Jakne in hlače', slug: 'moto-jakne' },
                    rokavice: { label: 'Rokavice', slug: 'moto-rokavice' },
                    skornij:  { label: 'Moto škornji', slug: 'moto-skornij' },
                },
            },
            moto_verige: {
                label: 'Verige & zobniki',
                slug: 'moto-verige',
                icon: 'link',
                brands: ['DID', 'RK', 'Regina', 'Renthal', 'JT Sprockets'],
                filters: [
                    { id: 'tip', label: 'Tip', type: 'select', options: ['Veriga', 'Sprednji zobnik', 'Zadnji zobnik', 'Komplet (kit)'] },
                ],
                children: {
                    veriga:  { label: 'Veriga', slug: 'moto-veriga' },
                    zobniki: { label: 'Zobniki', slug: 'moto-zobniki' },
                    kit:     { label: 'Komplet (chain kit)', slug: 'moto-chain-kit' },
                },
            },
        },
    },
};

// ── TOP brands for autocomplete / brand filter ─────────────────────────────────
export const TOP_BRANDS_ALL = [
    'Akrapovič', 'Brembo', 'Bilstein', 'KW', 'Bosch', 'K&N', 'Öhlins',
    'Eibach', 'H&R', 'BBS', 'Pirelli', 'Michelin', 'Continental',
    'Bridgestone', 'Remus', 'Garrett', 'NGK', 'Mann', 'Mahle',
    'Sparco', 'Recaro', 'OMP', 'Momo', 'Thule', 'Castrol', 'Motul',
    'Liqui Moly', 'EBC Brakes', 'Ferodo', 'StopTech', 'Rays', 'OZ Racing',
];

// ── Cross-sell map: category slug → suggested related category slugs ──────────
export const CROSS_SELL_MAP = {
    'izpusni-sistem':     ['sesalni-sistem', 'ecu-mapiranje', 'turbo'],
    'sesalni-sistem':     ['izpusni-sistem', 'ecu-mapiranje', 'turbo'],
    'turbo':              ['izpusni-sistem', 'sesalni-sistem', 'intercooler'],
    'zavore':             ['vzmetenje', 'platisca', 'pnevmatike'],
    'vzmetenje':          ['zavore', 'roke-stabilizatorji', 'platisca'],
    'platisca':           ['pnevmatike', 'vijaki-matice'],
    'pnevmatike':         ['platisca', 'vijaki-matice'],
    'ecu-mapiranje':      ['izpusni-sistem', 'sesalni-sistem', 'turbo'],
    'bodykit':            ['luci', 'odbijaci', 'ogledala'],
    'luci':               ['bodykit', 'odbijaci'],
};

// ── Most searched parts per popular makes ─────────────────────────────────────
export const HOT_PARTS_BY_MAKE = {
    'BMW':       ['izpusni-sistem', 'vzmetenje', 'zavore', 'turbo', 'ecu-mapiranje'],
    'Mercedes':  ['vzmetenje', 'zavore', 'ecu-mapiranje', 'izpusni-sistem'],
    'Volkswagen':['izpusni-sistem', 'sesalni-sistem', 'turbo', 'ecu-mapiranje'],
    'Audi':      ['izpusni-sistem', 'turbo', 'vzmetenje', 'ecu-mapiranje'],
    'Porsche':   ['zavore', 'vzmetenje', 'izpusni-sistem', 'ecu-mapiranje'],
    'Ford':      ['vzmetenje', 'zavore', 'sesalni-sistem'],
    'Toyota':    ['olja-filtri', 'vzmetenje', 'zavore'],
    'Škoda':     ['izpusni-sistem', 'sesalni-sistem', 'ecu-mapiranje'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Flat list of all top-level categories */
export function getPartsTopCategories() {
    return Object.entries(PARTS_CATEGORIES).map(([key, cat]) => ({ key, ...cat }));
}

/** Resolve a category by top-level slug */
export function resolvePartsCategory(slug) {
    return Object.values(PARTS_CATEGORIES).find(c => c.slug === slug) || null;
}

/** Resolve a subcategory by parent slug + sub slug */
export function resolvePartsSubcategory(catSlug, subSlug) {
    const cat = resolvePartsCategory(catSlug);
    if (!cat) return null;
    return Object.values(cat.subcategories).find(s => s.slug === subSlug) || null;
}

/** Get dynamic filters for a subcategory */
export function getPartsFilters(catSlug, subSlug) {
    const sub = resolvePartsSubcategory(catSlug, subSlug);
    return sub?.filters || [];
}

/** Get brands for a subcategory */
export function getPartsBrands(catSlug, subSlug) {
    const sub = resolvePartsSubcategory(catSlug, subSlug);
    return sub?.brands || [];
}

/** Build URL hash for navigating to parts search */
export function buildPartsUrl(catSlug, subSlug, childSlug, vehicleParams = {}) {
    const params = new URLSearchParams();
    if (catSlug) params.set('cat', catSlug);
    if (subSlug) params.set('sub', subSlug);
    if (childSlug) params.set('child', childSlug);
    if (vehicleParams.make)   params.set('make', vehicleParams.make);
    if (vehicleParams.model)  params.set('model', vehicleParams.model);
    if (vehicleParams.year)   params.set('year', vehicleParams.year);
    if (vehicleParams.engine) params.set('engine', vehicleParams.engine);
    return `#/deli?${params.toString()}`;
}
