const brandsModels = {
  "Abarth": {
    "124 Spider": ["124 Spider"],
    "500": ["500", "500C"],
    "595": ["595", "595 Competizione", "595 Turismo"],
    "695": ["695", "695 Biposto", "695 Rivale"],
    "Grande Punto": ["Grande Punto"],
    "Punto Evo": ["Punto Evo"]
  },
  "Acura": {
    "CL": ["CL"], "CSX": ["CSX"], "EL": ["EL"], "ILX": ["ILX"], "Integra": ["Integra"], "Legend": ["Legend"], "MDX": ["MDX"], "NSX": ["NSX"], "RDX": ["RDX"], "RL": ["RL"], "RLX": ["RLX"], "RSX": ["RSX"], "SLX": ["SLX"], "TL": ["TL"], "TLX": ["TLX"], "TSX": ["TSX"], "Vigor": ["Vigor"], "ZDX": ["ZDX"]
  },
  "Aiways": {
    "U5": ["U5"],
    "U6": ["U6"]
  },
  "Aixam": {
    "City": ["City"], "Coupe": ["Coupe"], "Crossline": ["Crossline"], "Crossover": ["Crossover"], "GTO": ["GTO"], "Minauto": ["Minauto"]
  },
  "Alfa Romeo": {
    "Giulia": ["Super", "Ti", "Veloce", "Quadrifoglio"],
    "Giulietta": ["Super", "Sport", "Veloce"],
    "Stelvio": ["Super", "Ti", "Veloce", "Quadrifoglio"],
    "Tonale": ["Super", "Sprint", "Ti", "Veloce"],
    "4C": ["4C"], "147": ["1.6 TS", "2.0 TS", "1.9 JTD"], "156": ["1.8 TS", "2.0 TS", "2.5 V6", "1.9 JTD", "2.4 JTD"], "159": ["1.9 JTDM", "2.4 JTDM", "1.8 MPI", "2.2 JTS"], "Brera": ["2.2 JTS", "3.2 JTS V6", "2.4 JTDM"], "GT": ["1.8 TS", "2.0 JTS", "3.2 V6", "1.9 JTD"], "GTV": ["GTV"], "MiTo": ["1.4", "1.4 MultiAir", "1.3 JTDM"], "Spider": ["Spider"]
  },
  "Alpina": {
    "B3": ["B3"], "B4": ["B4"], "B5": ["B5"], "B6": ["B6"], "B7": ["B7"], "B8": ["B8"], "B10": ["B10"], "B12": ["B12"], "D3": ["D3"], "D4": ["D4"], "D5": ["D5"], "Roadster": ["Roadster"], "XB7": ["XB7"], "XD3": ["XD3"], "XD4": ["XD4"]
  },
  "Alpine": {
    "A110": ["A110", "GT", "S"]
  },
  "Aston Martin": {
    "DB9": ["DB9"], "DB11": ["V8", "V12", "AMR"], "DBS": ["DBS Superleggera"], "DBX": ["DBX", "DBX707"], "Vantage": ["V8 Vantage"]
  },
  "Audi": {
    "A1": ["Sportback", "Citycarver"],
    "A3": ["Sportback", "Limousine", "S3", "RS 3"],
    "A4": ["Limousine", "Avant", "allroad quattro", "S4", "RS 4"],
    "A5": ["Coupé", "Sportback", "Cabriolet", "S5", "RS 5"],
    "A6": ["Limousine", "Avant", "allroad quattro", "S6", "RS 6"],
    "A7": ["Sportback", "S7", "RS 7"],
    "A8": ["A8", "A8 L", "S8"],
    "Q2": ["Q2", "SQ2"],
    "Q3": ["Q3", "Sportback", "RS Q3"],
    "Q4 e-tron": ["Q4 e-tron", "Sportback"],
    "Q5": ["Q5", "Sportback", "SQ5"],
    "Q7": ["Q7", "SQ7"],
    "Q8": ["Q8", "SQ8", "RS Q8"],
    "e-tron": ["50 quattro", "55 quattro", "S"],
    "e-tron GT": ["e-tron GT", "RS e-tron GT"],
    "R8": ["V10", "V10 Performance"],
    "TT": ["Coupé", "Roadster", "TTS", "TT RS"]
  },
  "Bentley": {
    "Arnage": ["Arnage"], "Azure": ["Azure"], "Bentayga": ["V8", "Speed", "Hybrid"], "Continental GT": ["GT", "GT V8", "GT Speed"], "Flying Spur": ["V8", "W12", "Hybrid"], "Mulsanne": ["Mulsanne"]
  },
  "BMW": {
    "Series 1": ["116i", "118i", "120i", "128ti", "M135i", "116d", "118d", "120d"],
    "Series 2": ["Coupé", "Gran Coupé", "Active Tourer", "M235i", "M240i", "M2"],
    "Series 3": ["Sedan", "Touring", "318i", "320i", "330i", "330e", "M340i", "318d", "320d", "330d", "M3"],
    "Series 4": ["Coupé", "Gran Coupé", "Cabriolet", "420i", "430i", "M440i", "420d", "M4"],
    "Series 5": ["Sedan", "Touring", "520i", "530i", "540i", "530e", "545e", "M550i", "520d", "530d", "M5"],
    "Series 6": ["Gran Turismo"],
    "Series 7": ["730d", "740d", "740i", "750e", "i7"],
    "Series 8": ["Coupé", "Gran Coupé", "Cabriolet", "840i", "840d", "M850i", "M8"],
    "X1": ["sDrive18i", "xDrive20i", "xDrive23i", "sDrive18d", "xDrive20d", "xDrive23d"],
    "X2": ["sDrive18i", "xDrive20i", "M35i", "sDrive18d"],
    "X3": ["xDrive20i", "xDrive30i", "M40i", "xDrive20d", "xDrive30d", "M40d", "X3 M"],
    "X4": ["xDrive20i", "xDrive30i", "M40i", "xDrive20d", "xDrive30d", "M40d", "X4 M"],
    "X5": ["xDrive40i", "xDrive50e", "M60i", "xDrive30d", "xDrive40d", "X5 M"],
    "X6": ["xDrive40i", "M60i", "xDrive30d", "xDrive40d", "X6 M"],
    "X7": ["xDrive40i", "M60i", "xDrive40d"],
    "Z4": ["sDrive20i", "sDrive30i", "M40i"],
    "i4": ["eDrive35", "eDrive40", "M50"],
    "i5": ["eDrive40", "M60"],
    "i7": ["eDrive50", "xDrive60", "M70"],
    "iX": ["xDrive40", "xDrive50", "M60"],
    "iX1": ["eDrive20", "xDrive30"],
    "iX2": ["eDrive20", "xDrive30"]
  },
  "Bugatti": {
    "Chiron": ["Chiron", "Sport", "Pur Sport", "Super Sport"],
    "Veyron": ["Veyron", "Grand Sport", "Super Sport"]
  },
  "Cadillac": {
    "Escalade": ["Escalade"], "CT4": ["CT4", "CT4-V"], "CT5": ["CT5", "CT5-V"], "XT4": ["XT4"], "XT5": ["XT5"], "XT6": ["XT6"]
  },
  "Chevrolet": {
    "Aveo": ["Aveo"], "Camaro": ["LT", "SS", "ZL1"], "Corvette": ["Stingray", "Z06", "E-Ray"], "Cruze": ["Cruze"], "Equinox": ["Equinox"], "Malibu": ["Malibu"], "Silverado": ["1500", "2500HD"], "Spark": ["Spark"], "Suburban": ["Suburban"], "Tahoe": ["Tahoe"], "Trax": ["Trax"]
  },
  "Chrysler": {
    "300C": ["300C"], "Grand Voyager": ["Grand Voyager"], "Pacifica": ["Pacifica"]
  },
  "Citroën": {
    "C3": ["C3"], "C3 Aircross": ["C3 Aircross"], "C4": ["C4", "ë-C4"], "C4 X": ["C4 X", "ë-C4 X"], "C5 Aircross": ["C5 Aircross"], "C5 X": ["C5 X"], "Berlingo": ["Berlingo"], "Spacetourer": ["Spacetourer"], "Jumper": ["Jumper"], "Jumpy": ["Jumpy"]
  },
  "Cupra": {
    "Ateca": ["Ateca"], "Born": ["Born"], "Formentor": ["Formentor"], "Leon": ["Leon"]
  },
  "Dacia": {
    "Duster": ["Duster"], "Jogger": ["Jogger"], "Logan": ["Logan"], "Sandero": ["Sandero", "Stepway"], "Spring": ["Spring"]
  },
  "Dodge": {
    "Challenger": ["SXT", "GT", "R/T", "Scat Pack", "Hellcat"], "Charger": ["SXT", "GT", "R/T", "Scat Pack", "Hellcat"], "Durango": ["SXT", "GT", "R/T", "Citadel", "SRT"]
  },
  "DS Automobiles": {
    "DS 3": ["DS 3"], "DS 4": ["DS 4"], "DS 7": ["DS 7"], "DS 9": ["DS 9"]
  },
  "Ferrari": {
    "296 GTB": ["296 GTB"], "812 Superfast": ["812 Superfast", "812 GTS"], "F8 Tributo": ["F8 Tributo", "F8 Spider"], "Portofino M": ["Portofino M"], "Purosangue": ["Purosangue"], "Roma": ["Roma"], "SF90 Stradale": ["SF90 Stradale", "SF90 Spider"]
  },
  "Fiat": {
    "500": ["500", "500e", "500C"], "500L": ["500L"], "500X": ["500X"], "Panda": ["Panda", "Panda Cross"], "Tipo": ["Hatchback", "Station Wagon"], "Doblo": ["Doblo"], "Ducato": ["Ducato"], "Punto": ["Punto"], "600": ["600"]
  },
  "Ford": {
    "Fiesta": ["Trend", "Titanium", "ST-Line", "ST"],
    "Focus": ["Hatchback", "Wagon", "ST-Line", "ST", "Active"],
    "Puma": ["Titanium", "ST-Line", "ST"],
    "Kuga": ["Titanium", "ST-Line", "Active", "PHEV"],
    "Mustang": ["EcoBoost", "GT", "Mach 1"],
    "Mustang Mach-E": ["RWD", "AWD", "GT"],
    "Explorer": ["ST-Line", "Platinum"],
    "Ranger": ["XL", "XLT", "Limited", "Wildtrak", "Raptor"],
    "Bronco": ["Bronco"],
    "Mondeo": ["Mondeo"],
    "Galaxy": ["Galaxy"],
    "S-Max": ["S-Max"],
    "Transit": ["Van", "Custom", "Connect", "Courier"]
  },
  "Genesis": {
    "G70": ["G70"], "G80": ["G80"], "G90": ["G90"], "GV60": ["GV60"], "GV70": ["GV70"], "GV80": ["GV80"]
  },
  "Honda": {
    "Civic": ["Comfort", "Elegance", "Sport", "Type R"],
    "Jazz": ["Crosstar", "Hybrid"],
    "HR-V": ["HR-V"],
    "CR-V": ["CR-V"],
    "e": ["e"]
  },
  "Hyundai": {
    "i10": ["i10"], "i20": ["i20", "N"], "i30": ["Hatchback", "Wagon", "Fastback", "N"], "Bayon": ["Bayon"], "Kona": ["Gasoline", "Hybrid", "Electric", "N"], "Tucson": ["Tucson"], "Santa Fe": ["Santa Fe"], "Ioniq 5": ["Ioniq 5"], "Ioniq 6": ["Ioniq 6"]
  },
  "Jaguar": {
    "E-Pace": ["E-Pace"], "F-Pace": ["F-Pace"], "I-Pace": ["I-Pace"], "F-Type": ["F-Type"], "XE": ["XE"], "XF": ["XF"]
  },
  "Jeep": {
    "Avenger": ["Avenger"], "Renegade": ["Renegade"], "Compass": ["Compass"], "Wrangler": ["Sahara", "Rubicon", "4xe"], "Grand Cherokee": ["Limited", "Overland", "Summit", "4xe"]
  },
  "Kia": {
    "Picanto": ["Picanto"], "Rio": ["Rio"], "Ceed": ["Hatchback", "Sportswagon"], "ProCeed": ["ProCeed"], "XCeed": ["XCeed"], "Niro": ["Hybrid", "Plug-in Hybrid", "EV"], "Sportage": ["Sportage"], "Sorento": ["Sorento"], "Stonic": ["Stonic"], "EV6": ["EV6", "GT-Line", "GT"], "EV9": ["EV9"]
  },
  "Lamborghini": {
    "Huracán": ["EVO", "STO", "Tecnica", "Sterrato"], "Revuelto": ["Revuelto"], "Urus": ["S", "Performante"]
  },
  "Lancia": {
    "Ypsilon": ["Ypsilon"]
  },
  "Land Rover": {
    "Defender": ["90", "110", "130"], "Discovery": ["Discovery"], "Discovery Sport": ["Discovery Sport"], "Range Rover": ["SE", "HSE", "Autobiography", "SV"], "Range Rover Evoque": ["Evoque"], "Range Rover Sport": ["Sport"], "Range Rover Velar": ["Velar"]
  },
  "Lexus": {
    "ES": ["ES"], "IS": ["IS"], "LS": ["LS"], "LC": ["LC"], "NX": ["NX"], "RX": ["RX"], "UX": ["UX"], "RZ": ["RZ"]
  },
  "Maserati": {
    "Ghibli": ["GT", "Modena", "Trofeo"], "Grecale": ["GT", "Modena", "Trofeo"], "Levante": ["GT", "Modena", "Trofeo"], "MC20": ["MC20"], "Quattroporte": ["GT", "Modena", "Trofeo"]
  },
  "Mazda": {
    "2": ["2", "Hybrid"], "3": ["Hatchback", "Sedan"], "6": ["Wagon", "Sedan"], "CX-30": ["CX-30"], "CX-5": ["CX-5"], "CX-60": ["CX-60"], "MX-30": ["MX-30"], "MX-5": ["Soft Top", "RF"]
  },
  "McLaren": {
    "Artura": ["Artura"], "GT": ["GT"], "750S": ["Coupé", "Spider"]
  },
  "Mercedes-Benz": {
    "A-Class": ["Hatchback", "Sedan", "A 180", "A 200", "A 250", "A 220 d", "AMG A 35", "AMG A 45 S"],
    "B-Class": ["B 180", "B 200", "B 200 d"],
    "C-Class": ["Sedan", "Estate", "C 180", "C 200", "C 300", "C 220 d", "AMG C 43", "AMG C 63"],
    "E-Class": ["Sedan", "Estate", "All-Terrain", "E 200", "E 220 d", "AMG E 53"],
    "S-Class": ["S 450 d", "S 580", "Maybach"],
    "CLA": ["Coupé", "Shooting Brake", "CLA 180", "CLA 200", "AMG CLA 35"],
    "CLS": ["CLS 300 d", "CLS 450", "AMG CLS 53"],
    "GLA": ["GLA 180", "GLA 200", "GLA 250", "GLA 200 d"],
    "GLB": ["GLB 200", "GLB 200 d"],
    "GLC": ["SUV", "Coupé", "GLC 200", "GLC 300", "GLC 220 d"],
    "GLE": ["SUV", "Coupé", "GLE 300 d", "GLE 450"],
    "GLS": ["GLS 450 d", "Maybach GLS 600"],
    "G-Class": ["G 450 d", "G 500", "AMG G 63"],
    "EQA": ["EQA 250", "EQA 300", "EQA 350"],
    "EQB": ["EQB 250", "EQB 300", "EQB 350"],
    "EQC": ["EQC 400"],
    "EQE": ["EQE 300", "EQE 350", "EQE 500", "AMG EQE 53"],
    "EQS": ["EQS 450+", "EQS 580", "AMG EQS 53"]
  },
  "MG": {
    "ZS": ["ZS EV"], "HS": ["HS"], "Marvel R": ["Marvel R"], "MG4": ["MG4"], "MG5": ["MG5"]
  },
  "MINI": {
    "Cooper": ["3-door", "5-door", "SE"], "Countryman": ["Countryman", "SE ALL4"], "Clubman": ["Clubman"], "Cabrio": ["Cabrio"]
  },
  "Mitsubishi": {
    "ASX": ["ASX"], "Colt": ["Colt"], "Eclipse Cross": ["Eclipse Cross"], "Space Star": ["Space Star"]
  },
  "Nissan": {
    "Juke": ["Juke"], "Qashqai": ["Qashqai"], "X-Trail": ["X-Trail"], "Ariya": ["Ariya"], "Leaf": ["Leaf"], "Townstar": ["Townstar"]
  },
  "Opel": {
    "Corsa": ["Corsa", "Corsa Electric"],
    "Astra": ["Hatchback", "Sports Tourer", "GSe"],
    "Mokka": ["Mokka", "Mokka Electric"],
    "Crossland": ["Crossland"],
    "Grandland": ["Grandland", "GSe"],
    "Combo": ["Combo Electric"],
    "Zafira": ["Zafira Electric"]
  },
  "Peugeot": {
    "208": ["208", "e-208"], "2008": ["2008", "e-2008"], "308": ["308", "SW", "e-308"], "408": ["408"], "508": ["508", "SW", "PSE"], "3008": ["3008"], "5008": ["5008"], "Rifter": ["Rifter"]
  },
  "Polestar": {
    "2": ["2"], "3": ["3"], "4": ["4"]
  },
  "Porsche": {
    "718": ["Cayman", "Boxster", "Style Edition", "S", "GTS 4.0"],
    "911": ["Carrera", "Carrera S", "Carrera GTS", "Turbo", "Turbo S", "GT3", "GT3 RS"],
    "Taycan": ["Taycan", "4S", "GTS", "Turbo", "Turbo S", "Cross Turismo"],
    "Panamera": ["Panamera", "4", "4S", "GTS", "Turbo E-Hybrid"],
    "Macan": ["Macan", "T", "S", "GTS", "Electric"],
    "Cayenne": ["Cayenne", "S", "E-Hybrid", "GTS", "Turbo E-Hybrid", "Coupé"]
  },
  "RAM": {
    "1500": ["1500"]
  },
  "Renault": {
    "Clio": ["Clio", "E-Tech full hybrid"],
    "Captur": ["Captur", "E-Tech full hybrid"],
    "Megane": ["E-Tech 100% electric"],
    "Arkana": ["Arkana", "E-Tech full hybrid"],
    "Austral": ["Austral"],
    "Espace": ["Espace"],
    "Kangoo": ["Kangoo"],
    "Trafic": ["Trafic"]
  },
  "Rolls-Royce": {
    "Cullinan": ["Cullinan"], "Ghost": ["Ghost"], "Phantom": ["Phantom"], "Spectre": ["Spectre"]
  },
  "Saab": {
    "9-3": ["9-3"], "9-5": ["9-5"]
  },
  "Seat": {
    "Ibiza": ["Ibiza"], "Leon": ["Leon", "Sportstourer"], "Arona": ["Arona"], "Ateca": ["Ateca"], "Tarraco": ["Tarraco"]
  },
  "Škoda": {
    "Fabia": ["Fabia"],
    "Scala": ["Scala"],
    "Octavia": ["Sedan", "Combi", "RS", "Scout"],
    "Superb": ["Sedan", "Combi"],
    "Kamiq": ["Kamiq"],
    "Karoq": ["Karoq"],
    "Kodiaq": ["Kodiaq", "RS"],
    "Enyaq": ["Enyaq", "Coupé", "RS"]
  },
  "Smart": {
    "#1": ["#1"], "#3": ["#3"]
  },
  "Subaru": {
    "Impreza": ["Impreza"], "Crosstrek": ["Crosstrek"], "Forester": ["Forester"], "Outback": ["Outback"], "Solterra": ["Solterra"], "BRZ": ["BRZ"]
  },
  "Suzuki": {
    "Ignis": ["Ignis"], "Swift": ["Swift"], "Vitara": ["Vitara"], "S-Cross": ["S-Cross"], "Across": ["Across"], "Swace": ["Swace"]
  },
  "Tesla": {
    "Model 3": ["RWD", "Long Range", "Performance"],
    "Model Y": ["RWD", "Long Range", "Performance"],
    "Model S": ["Dual Motor", "Plaid"],
    "Model X": ["Dual Motor", "Plaid"],
    "Cybertruck": ["Cybertruck"]
  },
  "Toyota": {
    "Aygo X": ["Aygo X"],
    "Yaris": ["Yaris", "GR Yaris"],
    "Yaris Cross": ["Yaris Cross"],
    "Corolla": ["Hatchback", "Touring Sports", "Sedan"],
    "Corolla Cross": ["Corolla Cross"],
    "C-HR": ["C-HR"],
    "RAV4": ["RAV4", "Plug-in Hybrid"],
    "Highlander": ["Highlander"],
    "Land Cruiser": ["Land Cruiser"],
    "Supra": ["GR Supra"],
    "GR86": ["GR86"],
    "bZ4X": ["bZ4X"]
  },
  "Volkswagen": {
    "Polo": ["Polo", "GTI"],
    "Golf": ["Golf", "Variant", "GTI", "GTE", "R"],
    "T-Cross": ["T-Cross"],
    "Taigo": ["Taigo"],
    "T-Roc": ["T-Roc", "Cabriolet", "R"],
    "Tiguan": ["Tiguan", "Allspace"],
    "Passat": ["Variant"],
    "Arteon": ["Arteon", "Shooting Brake"],
    "Touareg": ["Touareg"],
    "ID.3": ["ID.3"],
    "ID.4": ["ID.4"],
    "ID.5": ["ID.5"],
    "ID.7": ["ID.7"],
    "ID. Buzz": ["ID. Buzz"]
  },
  "Volvo": {
    "S60": ["S60"], "S90": ["S90"], "V60": ["V60", "Cross Country"], "V90": ["V90", "Cross Country"], "XC40": ["XC40", "Recharge"], "XC60": ["XC60"], "XC90": ["XC90"], "EX30": ["EX30"], "EX90": ["EX90"]
  },
  "Wartburg": {
    "311": ["311"],
    "353": ["353"]
  },
  "Xpeng": {
    "G9": ["G9"],
    "P7": ["P7"]
  },
  "Yugo": {
    "45": ["45"], "55": ["55"], "60": ["60"], "65": ["65"], "Florida": ["Florida"], "Koral": ["Koral"], "Tempo": ["Tempo"]
  },
  "Zastava": {
    "10": ["10"], "101": ["101"], "128": ["128"], "750": ["750"], "Florida": ["Florida"], "Koral": ["Koral"], "Yugo": ["Yugo"]
  },
  "ZAZ": {
    "Forza": ["Forza"], "Lanos": ["Lanos"], "Sens": ["Sens"], "Slavuta": ["Slavuta"], "Tavria": ["Tavria"]
  }
}