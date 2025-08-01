const brandsModels = {
  "Abarth": [
    "124 Spider", "500", "595", "695", "Grande Punto", "Punto Evo", "Pulse"
  ],
  "Acura": [
    "CL", "CSX", "EL", "ILX", "Integra", "Legend", "MDX", "NSX", "RDX", "RL", "RLX", "RSX", "SLX", "TL", "TLX", "TSX", "Vigor", "ZDX"
  ],
  "Aiways": [
    "U5", "U6"
  ],
  "Aixam": [
    "City", "Coupe", "Crossline", "Crossover", "GTO", "Minauto"
  ],
  "Alfa Romeo": [
    "4C", "8C Competizione", "33", "75", "90", "145", "146", "147", "155", "156", "159", "164", "166", "Alfasud", "Alfetta", "Arna", "Brera", "Giulia", "Giulietta", "GT", "GTV", "Junior Zagato", "MiTo", "Montreal", "RZ", "Spider", "Sprint", "Stelvio", "SZ", "Tonale"
  ],
  "Alpina": [
    "B3", "B4", "B5", "B6", "B7", "B8", "B10", "B12", "D3", "D4", "D5", "Roadster", "XB7", "XD3", "XD4"
  ],
  "Alpine": [
    "A110", "A310", "A610", "GTA"
  ],
  "Aston Martin": [
    "Cygnet", "DB7", "DB9", "DB11", "DBS", "DBX", "Lagonda", "Rapide", "V8 Vantage", "V12 Vanquish", "Valhalla", "Valkyrie", "Vantage", "Virage", "Zagato"
  ],
  "Audi": [
    "50", "80", "90", "100", "200", "A1", "A2", "A3", "A4", "A4 Allroad", "A5", "A6", "A6 Allroad", "A7", "A8", "Cabriolet", "Coupe", "e-tron", "e-tron GT", "Q2", "Q3", "Q4 e-tron", "Q5", "Q6 e-tron", "Q7", "Q8", "R8", "RS2", "RS3", "RS4", "RS5", "RS6", "RS7", "RS Q3", "RS Q8", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "SQ2", "SQ5", "SQ7", "SQ8", "TT", "TTS", "TT RS", "V8"
  ],
  "Autobianchi": [
    "A111", "A112", "Bianchina", "Y10"
  ],
  "Bentley": [
    "Arnage", "Azure", "Batur", "Bentayga", "Brooklands", "Continental", "Continental Flying Spur", "Continental GT", "Flying Spur", "Mulsanne", "R-Type", "S-Type", "Turbo R"
  ],
  "BMW": [
    "Series 1", "Series 2", "Series 3", "Series 4", "Series 5", "Series 6", "Series 7", "Series 8", "E3", "E9", "i3", "i4", "i5", "i7", "i8", "iX", "iX1", "iX2", "iX3", "Isetta", "M1", "M2", "M3", "M4", "M5", "M6", "X1", "X2", "X3", "X3 M", "X4", "X4 M", "X5", "X5 M", "X6", "X6 M", "X7", "XM", "Z1", "Z3", "Z4", "Z8"
  ],
  "Brabus": [
    "G-Class", "GLE", "GLS", "GT", "Rocket", "S-Class"
  ],
  "Bugatti": [
    "Centodieci", "Chiron", "Divo", "EB110", "La Voiture Noire", "Mistral", "Veyron"
  ],
  "Buick": [
    "Century", "Electra", "Enclave", "Encore", "Envision", "LaCrosse", "LeSabre", "Lucerne", "Park Avenue", "Rainier", "Reatta", "Regal", "Rendezvous", "Riviera", "Roadmaster", "Skylark"
  ],
  "BYD": [
    "Atto 3", "Dolphin", "Han", "Seal", "Song", "Tang"
  ],
  "Cadillac": [
    "Allante", "ATS", "BLS", "Brougham", "Catera", "CT4", "CT5", "CT6", "CTS", "DeVille", "DTS", "Eldorado", "Escalade", "Fleetwood", "LSE", "Lyriq", "Seville", "SRX", "STS", "XLR", "XT4", "XT5", "XT6"
  ],
  "Caterham": [
    "Seven", "21"
  ],
  "Chevrolet": [
    "Alero", "Astro", "Avalanche", "Aveo", "Beretta", "Blazer", "Bolt", "Camaro", "Caprice", "Captiva", "Cavalier", "Celebrity", "Chevelle", "Cobalt", "Colorado", "Corsica", "Corvette", "Cruze", "El Camino", "Epica", "Equinox", "Evanda", "Express", "HHR", "Impala", "Kalos", "Lacetti", "Lumina", "Malibu", "Matiz", "Monte Carlo", "Nubira", "Orlando", "Rezzo", "Silverado", "Spark", "SSR", "Suburban", "Tacuma", "Tahoe", "Tracker", "Trailblazer", "Traverse", "Trax", "Volt"
  ],
  "Chrysler": [
    "200", "300C", "300M", "Aspen", "Concorde", "Crossfire", "Delta", "Grand Voyager", "Intrepid", "LeBaron", "LHS", "Neon", "New Yorker", "Pacifica", "PT Cruiser", "Saratoga", "Sebring", "Stratus", "Town & Country", "Viper", "Vision", "Voyager", "Ypsilon"
  ],
  "Citroën": [
    "2CV", "AMI", "AX", "Axel", "Berlingo", "BX", "C-Crosser", "C-Elysée", "C-Zero", "C1", "C2", "C3", "C3 Aircross", "C3 Picasso", "C4", "C4 Aircross", "C4 Cactus", "C4 Picasso", "C4 Spacetourer", "C4 X", "C5", "C5 Aircross", "C5 X", "C6", "C8", "CX", "DS", "DS3", "DS4", "DS5", "Dyane", "Evasion", "GS", "GSA", "ID", "Jumper", "Jumpy", "LN", "Méhari", "Saxo", "SM", "Spacetourer", "Traction Avant", "Visa", "Xantia", "XM", "Xsara", "Xsara Picasso", "ZX"
  ],
  "Cupra": [
    "Ateca", "Born", "Formentor", "Leon", "Tavascan"
  ],
  "Dacia": [
    "1300", "1310", "Dokker", "Duster", "Jogger", "Lodgy", "Logan", "Nova", "Sandero", "Solenza", "Spring", "SuperNova"
  ],
  "Daewoo": [
    "Chairman", "Espero", "Evanda", "Kalos", "Korando", "Lacetti", "Lanos", "Leganza", "Lublin", "Matiz", "Musso", "Nexia", "Nubira", "Rezzo", "Tacuma", "Tico"
  ],
  "Daihatsu": [
    "Applause", "Charade", "Charmant", "Copen", "Cuore", "Feroza", "Gran Move", "Materia", "Move", "Rocky", "Sirion", "Taft", "Terios", "Trevis", "YRV"
  ],
  "Dodge": [
    "Avenger", "Caliber", "Caravan", "Challenger", "Charger", "Dakota", "Dart", "Durango", "Grand Caravan", "Hornet", "Intrepid", "Journey", "Magnum", "Neon", "Nitro", "Stealth", "Stratus", "Viper"
  ],
  "DR Automobiles": [
    "DR1", "DR2", "DR3", "DR4", "DR5", "DR6", "DR7"
  ],
  "DS Automobiles": [
    "DS 3", "DS 4", "DS 7", "DS 9"
  ],
  "Ferrari": [
    "296 GTB", "308", "328", "348", "360 Modena", "400", "412", "456", "458 Italia", "488", "512", "550 Maranello", "575M", "599 GTB Fiorano", "612 Scaglietti", "812 Superfast", "California", "Daytona SP3", "Dino", "Enzo", "F8 Tributo", "F12 Berlinetta", "F355", "F40", "F430", "F50", "FF", "GTC4Lusso", "LaFerrari", "Mondial", "Portofino", "Purosangue", "Roma", "SF90 Stradale", "Testarossa"
  ],
  "Fiat": [
    "124", "125", "126", "127", "128", "130", "131", "132", "500", "500C", "500L", "500X", "600", "Albea", "Argenta", "Barchetta", "Brava", "Bravo", "Cinquecento", "Coupe", "Croma", "Dino", "Doblo", "Ducato", "Fiorino", "Freemont", "Fullback", "Idea", "Marea", "Multipla", "Palio", "Panda", "Punto", "Qubo", "Regata", "Ritmo", "Scudo", "Sedici", "Seicento", "Siena", "Stilo", "Strada", "Talento", "Tempra", "Tipo", "Topolino", "Ulysse", "Uno", "X1/9"
  ],
  "Ford": [
    "Aerostar", "B-Max", "Bronco", "C-Max", "Capri", "Cougar", "Courier", "Cortina", "Crown Victoria", "Edge", "Escape", "Escort", "Excursion", "Expedition", "Explorer", "F-150", "F-250", "Fairlane", "Falcon", "Fiesta", "Flex", "Focus", "Freestar", "Fusion", "Galaxy", "Granada", "Grand C-Max", "GT", "Ka", "Kuga", "Maverick", "Model A", "Model T", "Mondeo", "Mustang", "Mustang Mach-E", "Orion", "Probe", "Puma", "Ranger", "S-Max", "Scorpio", "Sierra", "Taunus", "Taurus", "Thunderbird", "Tourneo Connect", "Tourneo Courier", "Tourneo Custom", "Transit", "Transit Connect", "Transit Courier", "Transit Custom", "Windstar"
  ],
  "FSO": [
    "125p", "Polonez"
  ],
  "Genesis": [
    "G70", "G80", "G90", "GV60", "GV70", "GV80"
  ],
  "GMC": [
    "Acadia", "Canyon", "Envoy", "Hummer EV", "Jimmy", "Safari", "Savana", "Sierra", "Sonoma", "Suburban", "Terrain", "Yukon"
  ],
  "Great Wall": [
    "Hover", "Ora Funky Cat", "Steed", "WEY Coffee 01"
  ],
  "Honda": [
    "Accord", "Civic", "Concerto", "CR-V", "CR-Z", "CRX", "e", "Element", "FR-V", "HR-V", "Insight", "Integra", "Jazz", "Legend", "Logo", "NSX", "Odyssey", "Passport", "Pilot", "Prelude", "Quintet", "Ridgeline", "S2000", "Shuttle", "Stream"
  ],
  "Hummer": [
    "H1", "H2", "H3"
  ],
  "Hyundai": [
    "Accent", "Atos", "Bayon", "Coupe", "Elantra", "Equus", "Excel", "Galloper", "Genesis", "Genesis Coupe", "Getz", "Grand Santa Fe", "Grandeur", "H-1", "i10", "i20", "i30", "i40", "Ioniq", "Ioniq 5", "Ioniq 6", "ix20", "ix35", "ix55", "Kona", "Lantra", "Matrix", "Nexo", "Palisade", "Pony", "S-Coupe", "Santa Fe", "Sonata", "Staria", "Stellar", "Terracan", "Trajet", "Tucson", "Veloster", "Venue", "Veracruz", "XG"
  ],
  "Infiniti": [
    "EX", "FX", "G", "I30", "J30", "M", "Q30", "Q45", "Q50", "Q60", "Q70", "QX30", "QX4", "QX50", "QX55", "QX60", "QX70", "QX80"
  ],
  "Innocenti": [
    "Mini", "Elba"
  ],
  "Isuzu": [
    "Amigo", "Ascender", "Axiom", "Campo", "D-Max", "Gemini", "Midi", "Piazza", "Rodeo", "Trooper", "VehiCROSS"
  ],
  "Iveco": [
    "Daily", "Massif"
  ],
  "Jaguar": [
    "Daimler", "E-Pace", "E-type", "F-Pace", "F-Type", "I-Pace", "Mark II", "S-Type", "Sovereign", "X-Type", "XE", "XF", "XJ", "XJ6", "XJ8", "XJ12", "XJR", "XJS", "XK", "XK8", "XKR"
  ],
  "Jeep": [
    "Avenger", "Cherokee", "CJ", "Comanche", "Commander", "Compass", "Gladiator", "Grand Cherokee", "Liberty", "Patriot", "Recon", "Renegade", "Wagoneer", "Wrangler"
  ],
  "Kia": [
    "Besta", "Carens", "Carnival", "Ceed", "Cerato", "Clarus", "Credos", "Elan", "e-Niro", "e-Soul", "EV6", "EV9", "Joice", "K2500", "Magentis", "Mentor", "Niro", "Opirus", "Optima", "Picanto", "Pregio", "Pride", "ProCeed", "Retona", "Rio", "Rocsta", "Sephia", "Shuma", "Sorento", "Soul", "Spectra", "Sportage", "Stinger", "Stonic", "Telluride", "Venga", "XCeed"
  ],
  "Koenigsegg": [
    "Agera", "CC8", "CCR", "CCX", "Gemera", "Jesko", "One:1", "Regera"
  ],
  "Lada": [
    "110", "111", "112", "Granta", "Kalina", "Niva", "Nova", "Priora", "Riva", "Samara", "Vesta"
  ],
  "Lamborghini": [
    "Aventador", "Centenario", "Countach", "Diablo", "Espada", "Gallardo", "Huracán", "Jalpa", "Jarama", "LM002", "Miura", "Murciélago", "Reventón", "Revuelto", "Sián", "Urus", "Veneno"
  ],
  "Lancia": [
    "Appia", "Aurelia", "Beta", "Dedra", "Delta", "Flaminia", "Flavia", "Fulvia", "Gamma", "Kappa", "Lybra", "Musa", "Phedra", "Prisma", "Stratos", "Thema", "Thesis", "Trevi", "Voyager", "Y10", "Ypsilon", "Zeta"
  ],
  "Land Rover": [
    "Defender", "Discovery", "Discovery Sport", "Freelander", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar", "Series I", "Series II", "Series III"
  ],
  "Lexus": [
    "CT", "ES", "GS", "GX", "IS", "LC", "LFA", "LM", "LS", "LX", "NX", "RC", "RX", "RZ", "SC", "UX"
  ],
  "Ligier": [
    "Ambra", "Be Sun", "Ixo", "JS50", "JS60", "Nova", "X-Too"
  ],
  "Lincoln": [
    "Aviator", "Blackwood", "Continental", "Corsair", "LS", "Mark LT", "Mark VII", "Mark VIII", "MKC", "MKS", "MKT", "MKX", "MKZ", "Nautilus", "Navigator", "Town Car", "Zephyr"
  ],
  "Lotus": [
    "3-Eleven", "Elan", "Elise", "Elite", "Emira", "Esprit", "Europa", "Evora", "Exige"
  ],
  "Lynk & Co": [
    "01"
  ],
  "Maserati": [
    "228", "3200 GT", "4200 GT", "Barchetta", "Biturbo", "Bora", "Ghibli", "GranCabrio", "GranSport", "GranTurismo", "Grecale", "Indy", "Karif", "Khamsin", "Levante", "MC20", "Merak", "Quattroporte", "Shamal", "Spyder"
  ],
  "Maxus": [
    "e-Deliver 3", "e-Deliver 9", "Euniq 5", "Euniq 6", "T90"
  ],
  "Maybach": [
    "57", "62"
  ],
  "Mazda": [
    "121", "2", "3", "323", "5", "6", "626", "929", "B-Series", "Bongo", "BT-50", "CX-3", "CX-30", "CX-5", "CX-50", "CX-60", "CX-7", "CX-80", "CX-9", "Demio", "E-Series", "Millenia", "MPV", "MX-3", "MX-30", "MX-5", "MX-6", "Premacy", "Protege", "RX-7", "RX-8", "Tribute", "Xedos 6", "Xedos 9"
  ],
  "McLaren": [
    "540C", "570S", "600LT", "650S", "675LT", "720S", "750S", "765LT", "Artura", "Elva", "F1", "GT", "MP4-12C", "P1", "Senna", "Speedtail"
  ],
  "Mercedes-Benz": [
    "190", "A-Class", "AMG GT", "B-Class", "C-Class", "Citan", "CL-Class", "CLA-Class", "CLC-Class", "CLK-Class", "CLS-Class", "E-Class", "EQA", "EQB", "EQC", "EQE", "EQS", "EQT", "EQV", "G-Class", "GL-Class", "GLA-Class", "GLB-Class", "GLC-Class", "GLE-Class", "GLK-Class", "GLS-Class", "M-Class", "Pagode", "R-Class", "S-Class", "SL-Class", "SLC-Class", "SLK-Class", "SLR McLaren", "SLS AMG", "Sprinter", "T-Class", "V-Class", "Vaneo", "Viano", "Vito", "W123", "W124", "X-Class"
  ],
  "Mercury": [
    "Capri", "Cougar", "Grand Marquis", "Marauder", "Mariner", "Milan", "Montego", "Monterey", "Mountaineer", "Sable", "Villager"
  ],
  "MG": [
    "3", "4", "5", "Cyberster", "F", "HS", "Maestro", "Marvel R", "Metro", "MGF", "Midget", "Montego", "TF", "XPower SV", "ZR", "ZS", "ZT"
  ],
  "Microcar": [
    "Due", "M.Go", "M8", "Virgo"
  ],
  "MINI": [
    "Aceman", "Cabrio", "Clubman", "Clubvan", "Cooper", "Cooper S", "Countryman", "Coupe", "John Cooper Works", "One", "Paceman", "Roadster"
  ],
  "Mitsubishi": [
    "3000GT", "ASX", "Attrage", "Carisma", "Celeste", "Colt", "Cordia", "Delica", "Diamante", "Eclipse", "Eclipse Cross", "Endeavor", "Galant", "Grandis", "i-MiEV", "L200", "L300", "L400", "Lancer", "Mirage", "Montero", "Outlander", "Outlander PHEV", "Pajero", "Pajero Pinin", "Pajero Sport", "RVR", "Sapporo", "Sigma", "Space Gear", "Space Runner", "Space Star", "Space Wagon", "Starion", "Tredia"
  ],
  "Morgan": [
    "3-Wheeler", "4/4", "Aero 8", "Plus 4", "Plus 6", "Plus 8", "Roadster"
  ],
  "Nio": [
    "EL6", "EL7", "ES8", "ET5", "ET7"
  ],
  "Nissan": [
    "100NX", "200SX", "240SX", "280ZX", "300ZX", "350Z", "370Z", "Almera", "Almera Tino", "Altima", "Ariya", "Armada", "Bluebird", "Cedric", "Cherry", "Cube", "GT-R", "Interstar", "Juke", "Kubistar", "Laurel", "Leaf", "Maxima", "Micra", "Murano", "Navara", "Note", "NP300", "NV200", "NV250", "NV300", "NV400", "Pathfinder", "Patrol", "Pixo", "Prairie", "Primastar", "Primera", "Pulsar", "Qashqai", "Quest", "Rogue", "Sentra", "Serena", "Silvia", "Skyline", "Stanza", "Sunny", "Terrano", "Tiida", "Titan", "Townstar", "Vanette", "X-Trail", "Xterra"
  ],
  "Noble": [
    "M12", "M600"
  ],
  "Oldsmobile": [
    "Alero", "Aurora", "Bravada", "Cutlass", "Eighty-Eight", "Intrigue", "Ninety-Eight", "Silhouette", "Toronado"
  ],
  "Opel": [
    "Adam", "Agila", "Ampera", "Antara", "Ascona", "Astra", "Calibra", "Campo", "Cascada", "Combo", "Commodore", "Corsa", "Crossland", "Diplomat", "Frontera", "Grandland", "GT", "Insignia", "Kadett", "Karl", "Manta", "Meriva", "Mokka", "Monterey", "Monza", "Movano", "Omega", "Rekord", "Rocks-e", "Senator", "Signum", "Sintra", "Speedster", "Tigra", "Vectra", "Vivaro", "Zafira"
  ],
  "Pagani": [
    "Huayra", "Utopia", "Zonda"
  ],
  "Peugeot": [
    "104", "106", "107", "108", "204", "205", "206", "207", "208", "304", "305", "306", "307", "308", "309", "404", "405", "406", "407", "408", "504", "505", "508", "604", "605", "607", "806", "807", "1007", "2008", "3008", "4007", "4008", "5008", "Bipper", "Boxer", "Expert", "iOn", "J5", "Partner", "RCZ", "Rifter", "Traveller"
  ],
  "Piaggio": [
    "Ape", "Porter"
  ],
  "Plymouth": [
    "Acclaim", "Barracuda", "Breeze", "Duster", "Grand Voyager", "Laser", "Neon", "Prowler", "Road Runner", "Sundance", "Voyager"
  ],
  "Polestar": [
    "1", "2", "3", "4"
  ],
  "Pontiac": [
    "6000", "Aztek", "Bonneville", "Fiero", "Firebird", "G6", "Grand Am", "Grand Prix", "GTO", "Montana", "Solstice", "Sunfire", "Trans Am", "Trans Sport", "Vibe"
  ],
  "Porsche": [
    "356", "718 Boxster", "718 Cayman", "911", "912", "914", "918 Spyder", "924", "928", "944", "959", "968", "Boxster", "Carrera GT", "Cayenne", "Cayman", "Macan", "Panamera", "Taycan"
  ],
  "Proton": [
    "300", "400"
  ],
  "RAM": [
    "1500", "2500", "3500", "ProMaster"
  ],
  "Renault": [
    "4", "5", "6", "9", "11", "12", "14", "15", "16", "17", "18", "19", "20", "21", "25", "30", "Alaskan", "Arkana", "Austral", "Avantime", "Captur", "Clio", "Espace", "Express", "Fluence", "Fuego", "Kadjar", "Kangoo", "Koleos", "Laguna", "Latitude", "Mascott", "Master", "Megane", "Modus", "Rodeo", "Safrane", "Scenic", "Spider", "Talisman", "Thalia", "Trafic", "Twingo", "Twizy", "Vel Satis", "Wind", "Zoe"
  ],
  "Rolls-Royce": [
    "Camargue", "Corniche", "Cullinan", "Dawn", "Ghost", "Park Ward", "Phantom", "Silver Cloud", "Silver Seraph", "Silver Shadow", "Silver Spirit", "Silver Spur", "Spectre", "Wraith"
  ],
  "Rover": [
    "100", "200", "25", "400", "45", "600", "75", "800", "CityRover", "Maestro", "Metro", "Mini", "Montego", "P5", "P6", "SD1", "Streetwise"
  ],
  "Saab": [
    "9-2X", "9-3", "9-4X", "9-5", "9-7X", "90", "95", "96", "99", "900", "9000", "Sonett"
  ],
  "Saturn": [
    "Astra", "Aura", "Ion", "L-Series", "Outlook", "Relay", "Sky", "S-Series", "Vue"
  ],
  "Seat": [
    "Alhambra", "Altea", "Arona", "Arosa", "Ateca", "Cordoba", "Exeo", "Fura", "Ibiza", "Inca", "Leon", "Malaga", "Marbella", "Mii", "Panda", "Ritmo", "Ronda", "Tarraco", "Terra", "Toledo"
  ],
  "Seres": [
    "3", "5"
  ],
  "Simca": [
    "1000", "1100", "1307"
  ],
  "Škoda": [
    "100", "105", "120", "130", "Citigo", "Enyaq", "Fabia", "Favorit", "Felicia", "Forman", "Kamiq", "Karoq", "Kodiaq", "Octavia", "Praktik", "Rapid", "Roomster", "Scala", "Slavia", "Superb", "Yeti"
  ],
  "Smart": [
    "#1", "#3", "Forfour", "Fortwo", "Roadster"
  ],
  "SsangYong": [
    "Actyon", "Chairman", "Family", "Korando", "Kyron", "Musso", "Rexton", "Rodius", "Tivoli", "Torres", "XLV"
  ],
  "Subaru": [
    "1800", "B9 Tribeca", "Baja", "BRZ", "Forester", "G3X Justy", "Impreza", "Justy", "Legacy", "Leone", "Levorg", "Libero", "Outback", "Rex", "Solterra", "SVX", "Trezia", "Tribeca", "Vivio", "WRX", "XT", "XV"
  ],
  "Suzuki": [
    "Across", "Alto", "Baleno", "Cappuccino", "Carry", "Celerio", "Grand Vitara", "Ignis", "Jimny", "Kizashi", "Liana", "LJ", "Reno", "Samurai", "SJ", "Splash", "Swift", "Swace", "SX4", "SX4 S-Cross", "Vitara", "Wagon R+", "X-90", "XL7"
  ],
  "Talbot": [
    "Horizon", "Matra", "Samba", "Solara", "Tagora"
  ],
  "Tatra": [
    "603", "613", "700"
  ],
  "Tavria": [
    "Dana", "Nova"
  ],
  "Tesla": [
    "Cybertruck", "Model 3", "Model S", "Model X", "Model Y", "Roadster"
  ],
  "Toyota": [
    "2000GT", "4Runner", "Alphard", "Altezza", "Auris", "Avalon", "Avensis", "Avensis Verso", "Aygo", "Aygo X", "bZ4X", "Camry", "Carina", "Celica", "C-HR", "Corolla", "Corolla Cross", "Corolla Verso", "Cressida", "Crown", "Dyna", "Estima", "FJ Cruiser", "Fortuner", "GR Yaris", "GR86", "GT86", "Harrier", "Hiace", "Highlander", "Hilux", "iQ", "Land Cruiser", "Liteace", "Matrix", "Mirai", "Model F", "MR2", "Paseo", "Picnic", "Previa", "Prius", "Prius+", "Proace", "Proace City", "RAV4", "Sequoia", "Sienna", "Soarer", "Sports 800", "Sprinter", "Starlet", "Supra", "Tacoma", "Tercel", "Tundra", "Urban Cruiser", "Venza", "Verso", "Verso-S", "Yaris", "Yaris Cross"
  ],
  "Trabant": [
    "601", "P50"
  ],
  "Triumph": [
    "Dolomite", "GT6", "Spitfire", "Stag", "TR6", "TR7", "TR8"
  ],
  "TVR": [
    "Cerbera", "Chimaera", "Griffith", "Sagaris", "Tuscan"
  ],
  "Vauxhall": [
    "Astra", "Corsa", "Insignia", "Mokka", "Viva", "Zafira"
  ],
  "Volkswagen": [
    "181", "Amarok", "Arteon", "Atlas", "Beetle", "Bora", "Caddy", "CC", "Corrado", "Crafter", "Derby", "Eos", "Fox", "Golf", "Golf Plus", "ID. Buzz", "ID.3", "ID.4", "ID.5", "ID.7", "Iltis", "Jetta", "K70", "Karmann Ghia", "Lupo", "Multivan", "New Beetle", "Passat", "Passat Alltrack", "Passat CC", "Phaeton", "Polo", "Routan", "Santana", "Scirocco", "Sharan", "T-Cross", "T-Roc", "Taigo", "Taro", "Tiguan", "Tiguan Allspace", "Touareg", "Touran", "Transporter", "Type 3", "Type 4", "Up!", "Vento"
  ],
  "Volvo": [
    "140 Series", "164", "240 Series", "260 Series", "340-360", "440-460", "480", "66", "740", "760", "780", "850", "940", "960", "Amazon", "C30", "C40", "C70", "EX30", "EX90", "Laplander", "P1800", "S40", "S60", "S70", "S80", "S90", "V40", "V50", "V60", "V70", "V90", "XC40", "XC60", "XC70", "XC90"
  ],
  "Wartburg": [
    "311", "353"
  ],
  "Xpeng": [
    "G9", "P7"
  ],
  "Yugo": [
    "45", "55", "60", "65", "Florida", "Koral", "Tempo"
  ],
  "Zastava": [
    "10", "101", "128", "750", "Florida", "Koral", "Yugo"
  ],
  "ZAZ": [
    "Forza", "Lanos", "Sens", "Slavuta", "Tavria"
  ]
};