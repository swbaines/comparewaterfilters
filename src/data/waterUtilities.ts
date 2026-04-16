// ── Water utility profiles & suburb-to-utility mappings ──────────────────────
// Data sourced from state water authority annual reports & WaterScore analysis 2024–25

export interface WaterUtilityProfile {
  key: string;
  utilityName: string;
  reportUrl: string;
  region: string;
  state: string;
  postcodeRanges: [number, number][];
  suburbs: string[]; // common suburb names for text search
  hardness: number;
  chlorine: number;
  fluoride: number;
  ph: number;
  pfasRisk: "low" | "moderate" | "elevated";
  usesChloramine?: boolean;
  source: string;
  notes: string;
}

export const WATER_UTILITIES: WaterUtilityProfile[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // VICTORIA
  // ═══════════════════════════════════════════════════════════════════════════
  // ── Greater Western Water — Inner Melbourne (former City West Water) ────────
  {
    key: "gww-inner",
    utilityName: "Greater Western Water",
    region: "Melbourne — CBD & Inner Suburbs",
    state: "VIC",
    postcodeRanges: [
      [3000, 3008], // Melbourne CBD, Docklands, Southbank
      [3002, 3002], // East Melbourne
      [3003, 3003], // West Melbourne
      [3031, 3031], // Flemington, Kensington
      [3051, 3058], // North Melbourne, Parkville, Carlton, Brunswick
      [3065, 3068], // Fitzroy, Collingwood, Clifton Hill
      [3121, 3121], // Richmond, Burnley, Cremorne, Abbotsford
      [3122, 3124], // Hawthorn, Hawthorn East, Camberwell (parts)
      [3141, 3146], // South Yarra, Prahran, Toorak, Malvern, Armadale
      [3181, 3183], // Windsor, St Kilda, Balaclava, St Kilda East
      [3185, 3186], // Elsternwick, Ripponlea
      [3205, 3207], // South Melbourne, Albert Park, Middle Park, Port Melbourne
    ],
    suburbs: [
      "Melbourne CBD", "Melbourne", "Docklands", "Southbank", "East Melbourne",
      "West Melbourne", "North Melbourne", "Parkville", "Carlton", "Carlton North",
      "Carlton South", "Brunswick", "Brunswick East", "Brunswick West",
      "Brunswick North", "Brunswick South", "Flemington", "Kensington",
      "Fitzroy", "Fitzroy North", "Collingwood", "Clifton Hill", "Abbotsford",
      "Richmond", "Richmond North", "Richmond South", "Richmond East",
      "Burnley", "Cremorne", "Hawthorn", "Hawthorn East", "Hawthorn West",
      "Hawthorn North", "South Yarra", "Prahran", "Windsor", "Toorak",
      "Armadale", "Malvern", "Malvern North", "Kooyong",
      "St Kilda", "St Kilda East", "St Kilda West", "St Kilda South",
      "Balaclava", "Elsternwick", "Ripponlea",
      "South Melbourne", "Albert Park", "Middle Park", "Port Melbourne",
      "Ascot Vale", "Moonee Ponds", "Essendon", "Travancore",
      "Coburg", "Coburg North", "Pascoe Vale", "Pascoe Vale South",
      "Strathmore", "Strathmore Heights", "Hadfield", "Glenroy",
      "Oak Park", "Jacana", "Dallas", "Meadow Heights",
    ],
    hardness: 16,
    chlorine: 0.65,
    fluoride: 0.8,
    ph: 7.4,
    pfasRisk: "low",
    source: "Melbourne Water wholesale supply (Silvan, Cardinia & Sugarloaf Reservoirs)",
    notes: "Greater Western Water supplies inner Melbourne with some of Australia's softest water — just 16 mg/L hardness from protected mountain catchments. No softener needed. Chlorine is low to moderate — a carbon filter is a great upgrade for taste and shower comfort.",
  },
  // ── Greater Western Water — Western & Outer Suburbs ───────────────────────
  {
    key: "gww-west",
    utilityName: "Greater Western Water",
    region: "Melbourne — West & Northwest",
    state: "VIC",
    postcodeRanges: [
      [3011, 3020], // Footscray, Yarraville, Seddon, Williamstown, Altona
      [3021, 3030], // St Albans, Sunshine, Deer Park, Werribee
      [3032, 3038], // Maribyrnong, Keilor, Airport West, Tullamarine
      [3040, 3044], // Aberfeldie, Essendon West, Niddrie, Gladstone Park
      [3335, 3342], // Rockbank, Melton, Bacchus Marsh
      [3427, 3442], // Sunbury, Gisborne, Romsey, Lancefield
      [3060, 3064], // Fawkner, Broadmeadows (parts)
    ],
    suburbs: [
      "Footscray", "West Footscray", "Yarraville", "Seddon", "Williamstown",
      "Altona", "Altona North", "Altona Meadows", "Newport",
      "Sunshine", "Sunshine North", "Sunshine West", "St Albans",
      "Deer Park", "Cairnlea", "Derrimut", "Caroline Springs",
      "Keilor", "Keilor East", "Airport West", "Tullamarine", "Niddrie",
      "Gladstone Park", "Hillside", "Sydenham", "Taylors Lakes",
      "Melton", "Melton South", "Melton West", "Bacchus Marsh", "Rockbank",
      "Werribee", "Point Cook", "Hoppers Crossing", "Wyndham Vale",
      "Tarneit", "Truganina", "Laverton", "Mambourin",
      "Sunbury", "Gisborne", "Romsey", "Lancefield",
      "Fawkner", "Broadmeadows", "Braybrook", "Maidstone",
      "Maribyrnong", "Kingsville", "Tottenham",
    ],
    hardness: 22,
    chlorine: 1.0,
    fluoride: 0.9,
    ph: 7.4,
    pfasRisk: "low",
    source: "Melbourne Water wholesale supply + Rosslynne & Merrimu Reservoirs (regional areas)",
    notes: "Greater Western Water's western corridor receives Melbourne Water supply through longer distribution networks. Slightly harder than inner Melbourne but still soft at 22 mg/L. Chlorine is moderate — a whole house filtration is strongly recommended, especially for families with young children or skin sensitivities.",
  },
  // ── Yarra Valley Water — North & Outer East ───────────────────────────────
  {
    key: "yvw",
    utilityName: "Yarra Valley Water",
    region: "Melbourne — North & Outer East",
    state: "VIC",
    postcodeRanges: [
      [3070, 3079], // Northcote, Thornbury, Preston, Reservoir
      [3081, 3097], // Ivanhoe, Bundoora, Mill Park, South Morang
      [3101, 3116], // Kew, Balwyn, Doncaster, Templestowe
      [3125, 3138], // Camberwell (parts), Box Hill, Ringwood, Croydon
      [3140, 3140], // Lilydale
      [3148, 3156], // Syndal, Glen Waverley, Ferntree Gully
      [3750, 3767], // Epping, South Morang, Mernda, Whittlesea, Doreen
      [3770, 3787], // Coldstream, Yarra Glen, Healesville, Mt Evelyn
      [3795, 3797], // Belgrave, Emerald, Cockatoo
    ],
    suburbs: [
      "Northcote", "Thornbury", "Preston", "Reservoir", "Bundoora",
      "Mill Park", "South Morang", "Epping", "Mernda", "Doreen",
      "Whittlesea", "Kew", "Kew East", "Balwyn", "Balwyn North",
      "Doncaster", "Doncaster East", "Templestowe", "Donvale",
      "Camberwell", "Surrey Hills", "Box Hill", "Box Hill North",
      "Box Hill South", "Blackburn", "Ringwood", "Ringwood East",
      "Ringwood North", "Croydon", "Croydon Hills", "Mooroolbark",
      "Lilydale", "Healesville", "Mt Evelyn", "Chirnside Park",
      "Glen Waverley", "Mount Waverley", "Ferntree Gully", "Belgrave",
      "Ivanhoe", "Heidelberg", "Greensborough", "Eltham",
      "Diamond Creek", "Hurstbridge", "Alphington", "Fairfield",
      "Watsonia", "Macleod", "Rosanna", "Viewbank",
      "Craigieburn", "Roxburgh Park", "Mickleham", "Wollert",
      "Templestowe Lower", "Warrandyte", "Park Orchards", "Wonga Park",
      "Montmorency", "Briar Hill", "Lower Plenty", "Yallambie",
      "Bulleen", "Manningham", "Dingley Village", "Heathmont",
      "Bayswater", "Bayswater North", "Boronia", "The Basin",
      "Kilsyth", "Montrose", "Olinda", "Sassafras", "Upwey",
      "Tecoma", "Emerald", "Cockatoo", "Gembrook",
      "Lalor", "Thomastown", "Kingsbury", "Coolaroo",
    ],
    hardness: 19,
    chlorine: 0.7,
    fluoride: 0.8,
    ph: 7.4,
    pfasRisk: "low",
    source: "Silvan, Upper Yarra & Maroondah Reservoirs via Melbourne Water",
    notes: "Yarra Valley Water supplies some of Australia's softest water at just 19 mg/L hardness, drawn from protected mountain catchments east of Melbourne. No softener needed. Chlorine is low — a whole house filtration is the most popular upgrade for taste and shower comfort.",
  },
  // ── South East Water ──────────────────────────────────────────────────────
  {
    key: "sew",
    utilityName: "South East Water",
    region: "Melbourne — South & Southeast",
    state: "VIC",
    postcodeRanges: [
      [3161, 3178], // Caulfield, Carnegie, Bentleigh, Oakleigh, Dandenong, Keysborough
      [3185, 3210], // Brighton, Sandringham, Cheltenham, Moorabbin, Mordialloc, Chelsea, Frankston
      [3800, 3810], // Monash Uni area, Berwick, Narre Warren
      [3910, 3920], // Langwarrin, Frankston South, Cranbourne
      [3930, 3945], // Mornington, Mt Martha, Rosebud, Rye, Sorrento
      [3158, 3160], // Upwey, Belgrave South
      [3802, 3806], // Endeavour Hills, Hallam, Berwick
    ],
    suburbs: [
      "Caulfield", "Caulfield North", "Caulfield South", "Carnegie",
      "Murrumbeena", "Bentleigh", "Bentleigh East", "Oakleigh",
      "Brighton", "Brighton East", "Hampton", "Sandringham",
      "Cheltenham", "Moorabbin", "Mordialloc", "Chelsea",
      "Frankston", "Frankston South", "Langwarrin",
      "Mornington", "Mt Martha", "Rosebud", "Rye", "Sorrento",
      "Cranbourne", "Narre Warren", "Berwick", "Pakenham",
      "Dandenong", "Keysborough", "Rowville", "Scoresby",
      "Endeavour Hills", "Hallam", "Springvale",
      "Oakleigh South", "Hughesdale", "Huntingdale", "Clayton",
      "Clayton South", "Notting Hill", "Mulgrave", "Wheelers Hill",
      "Noble Park", "Noble Park North", "Doveton", "Eumemmerring",
      "Carrum", "Bonbeach", "Patterson Lakes", "Seaford",
      "Carrum Downs", "Skye", "Sandhurst", "Lyndhurst", "Clyde",
      "Officer", "Beaconsfield", "Upper Beaconsfield",
      "Mentone", "Parkdale", "Aspendale", "Edithvale",
      "Dromana", "Safety Beach", "McCrae", "Blairgowrie",
      "Portsea", "Hastings", "Somerville", "Baxter",
      "Cranbourne East", "Cranbourne West", "Cranbourne North",
      "Narre Warren South", "Narre Warren North",
      "Hampton Park", "Lynbrook", "Dandenong North", "Dandenong South",
    ],
    hardness: 18,
    chlorine: 0.8,
    fluoride: 0.9,
    ph: 7.4,
    pfasRisk: "low",
    source: "Cardinia & Tarago Reservoirs via Melbourne Water",
    notes: "South East Water draws from Cardinia and Tarago reservoirs — very soft, high-quality water at just 18 mg/L. Chlorine is moderate and a carbon filter addresses taste and skin comfort. No scale issues in this area.",
  },
  // ── Barwon Water ──────────────────────────────────────────────────────────
  {
    key: "barwon",
    utilityName: "Barwon Water",
    region: "Geelong & Surf Coast",
    state: "VIC",
    postcodeRanges: [
      [3214, 3228], // Geelong, Geelong West, Newtown, Belmont, Highton
      [3230, 3233], // Torquay, Anglesea, Aireys Inlet
    ],
    suburbs: [
      "Geelong", "Geelong West", "Newtown", "Belmont", "Highton",
      "Torquay", "Anglesea", "Aireys Inlet", "Lara", "Corio",
      "Norlane", "Leopold", "Ocean Grove", "Drysdale",
      "Grovedale", "Waurn Ponds", "Armstrong Creek", "Mount Duneed",
      "Barwon Heads", "Queenscliff", "Point Lonsdale", "Portarlington",
      "Clifton Springs", "Curlewis", "Indented Head", "St Leonards",
      "Lovely Banks", "Fyansford", "Herne Hill", "Hamlyn Heights",
      "Bell Park", "Bell Post Hill", "North Geelong", "Drumcondra",
      "North Shore", "Rippleside", "East Geelong", "South Geelong",
      "Manifold Heights", "Wandana Heights",
    ],
    hardness: 35,
    chlorine: 0.8,
    fluoride: 0.9,
    ph: 7.4,
    pfasRisk: "low",
    source: "Moorabool & West Barwon Reservoirs",
    notes: "Barwon Water provides soft water to the Geelong region. Good quality overall — a carbon filter for chlorine taste is the main upgrade most families consider.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW SOUTH WALES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: "sydney-water-inner",
    utilityName: "Sydney Water",
    region: "Sydney — Inner City & Eastern Suburbs",
    state: "NSW",
    postcodeRanges: [
      [2000, 2050], // CBD, Surry Hills, Paddington, Bondi, Randwick
      [2060, 2069], // North Sydney, Crows Nest, Chatswood
    ],
    suburbs: [
      "Sydney CBD", "Sydney", "Surry Hills", "Paddington", "Darlinghurst", "Potts Point",
      "Bondi", "Bondi Junction", "Randwick", "Coogee", "Maroubra",
      "Newtown", "Enmore", "Marrickville", "Redfern", "Waterloo",
      "North Sydney", "Crows Nest", "Neutral Bay", "Mosman",
      "Chatswood", "Willoughby", "Woollahra", "Double Bay", "Rose Bay",
      "Vaucluse", "Watsons Bay", "Dover Heights", "Bellevue Hill",
      "Centennial Park", "Moore Park", "Zetland", "Rosebery", "Alexandria",
      "Erskineville", "St Peters", "Tempe", "Sydenham", "Dulwich Hill",
      "Summer Hill", "Ashfield", "Croydon", "Burwood", "Strathfield",
      "Concord", "Five Dock", "Drummoyne", "Leichhardt", "Annandale",
      "Glebe", "Ultimo", "Pyrmont", "Balmain", "Birchgrove", "Rozelle",
      "Camperdown", "Stanmore", "Petersham", "Lewisham",
      "Cremorne", "Kirribilli", "Lavender Bay", "McMahons Point",
      "Waverton", "Wollstonecraft", "Artarmon", "Lane Cove",
      "Greenwich", "Longueville", "Hunters Hill", "Gladesville",
      "Ryde", "Eastwood", "Epping", "Marsfield", "Macquarie Park",
      "Meadowbank", "West Ryde", "Putney", "Tennyson Point",
    ],
    hardness: 49,
    chlorine: 0.6,
    fluoride: 1.0,
    ph: 7.5,
    pfasRisk: "low",
    usesChloramine: true,
    source: "Prospect WFP (Warragamba Dam)",
    notes: "Sydney Water supplies soft water from Warragamba Dam via the Prospect Water Filtration Plant. Chloramine is used in some areas instead of chlorine. Good quality — a carbon filter removes taste and improves skin comfort.",
  },
  {
    key: "sydney-water-west",
    utilityName: "Sydney Water",
    region: "Sydney — Western Suburbs",
    state: "NSW",
    postcodeRanges: [
      [2100, 2200], // Parramatta, Blacktown, Liverpool, Bankstown
      [2740, 2770], // Penrith, St Marys, Mt Druitt
    ],
    suburbs: [
      "Parramatta", "Blacktown", "Liverpool", "Bankstown", "Cabramatta",
      "Fairfield", "Penrith", "St Marys", "Mt Druitt", "Rooty Hill",
      "Castle Hill", "Baulkham Hills", "Rouse Hill", "Kellyville",
      "Merrylands", "Granville", "Auburn", "Homebush",
      "Lidcombe", "Berala", "Regents Park", "Yagoona", "Condell Park",
      "Revesby", "Padstow", "Panania", "Picnic Point", "East Hills",
      "Guildford", "Chester Hill", "Bass Hill", "Georges Hall",
      "Wetherill Park", "Smithfield", "Greystanes", "Pemulwuy",
      "Prospect", "Seven Hills", "Kings Langley", "Doonside",
      "Quakers Hill", "Stanhope Gardens", "The Ponds", "Schofields",
      "Marsden Park", "Riverstone", "Box Hill", "Vineyard",
      "Campbelltown", "Ingleburn", "Minto", "Leumeah", "Macquarie Fields",
      "Glenfield", "Casula", "Moorebank", "Chipping Norton", "Holsworthy",
      "Prestons", "Edmondson Park", "Leppington", "Oran Park",
      "Narellan", "Camden", "Spring Farm", "Mount Annan", "Currans Hill",
      "Gregory Hills", "Harrington Park", "Werrington", "Kingswood",
      "Emu Plains", "Glenmore Park", "Cranebrook", "Jordan Springs",
      "South Penrith", "Jamisontown", "Leonay", "Mulgoa",
    ],
    hardness: 54,
    chlorine: 0.7,
    fluoride: 1.0,
    ph: 7.5,
    pfasRisk: "low",
    usesChloramine: true,
    source: "Prospect & Orchard Hills WFPs (Warragamba Dam)",
    notes: "Western Sydney receives water from the same Warragamba catchment but through longer distribution networks, resulting in slightly higher chlorine residual. Still soft water — no softener needed. Carbon filter recommended for taste.",
  },
  {
    key: "sydney-water-north",
    utilityName: "Sydney Water",
    region: "Sydney — Northern Beaches & North Shore",
    state: "NSW",
    postcodeRanges: [
      [2070, 2099], // Upper North Shore, Hornsby, Wahroonga
      [2085, 2108], // Northern Beaches, Manly, Dee Why, Mona Vale
    ],
    suburbs: [
      "Manly", "Dee Why", "Mona Vale", "Avalon", "Newport",
      "Narrabeen", "Brookvale", "Freshwater", "Curl Curl",
      "Hornsby", "Wahroonga", "Turramurra", "Gordon", "Pymble",
      "Lindfield", "Killara", "Roseville",
      "Manly Vale", "Fairlight", "Balgowlah", "Seaforth", "Clontarf",
      "Beacon Hill", "Allambie Heights", "Frenchs Forest", "Belrose",
      "Davidson", "Forestville", "Killarney Heights",
      "Collaroy", "Collaroy Plateau", "Cromer", "Wheeler Heights",
      "Warriewood", "Elanora Heights", "Ingleside", "Bayview",
      "Church Point", "Terrey Hills", "Duffys Forest",
      "Palm Beach", "Whale Beach", "Bilgola", "Clareville",
      "Pennant Hills", "Beecroft", "Cheltenham", "Thornleigh",
      "Normanhurst", "Waitara", "Asquith", "Mount Colah", "Mount Kuring-gai",
      "Berowra", "Berowra Heights", "Cowan", "Brooklyn",
      "Galston", "Arcadia", "Dural", "Glenhaven", "Castle Hill",
      "West Pennant Hills", "Cherrybrook", "North Rocks",
      "Carlingford", "North Epping", "Eastwood",
    ],
    hardness: 42,
    chlorine: 0.5,
    fluoride: 1.0,
    ph: 7.7,
    pfasRisk: "low",
    source: "Warringah WFP & North Head",
    notes: "The Northern Beaches and Upper North Shore receive soft water via the Ryde and Warragamba supply zones. Excellent water quality — filtration is mostly a preference for taste and purity.",
  },
  {
    key: "sydney-water-south",
    utilityName: "Sydney Water",
    region: "Sydney — Sutherland & South",
    state: "NSW",
    postcodeRanges: [
      [2205, 2234], // Sutherland, Cronulla, Hurstville, Kogarah
    ],
    suburbs: [
      "Sutherland", "Cronulla", "Miranda", "Caringbah", "Engadine",
      "Hurstville", "Kogarah", "Rockdale", "Sans Souci", "Sylvania",
      "Gymea", "Gymea Bay", "Grays Point", "Loftus", "Yarrawarrah",
      "Jannali", "Bonnet Bay", "Barden Ridge", "Menai", "Illawong",
      "Alfords Point", "Sandy Point", "Taren Point", "Woolooware",
      "Burraneer", "Kurnell", "Bundeena", "Maianbar",
      "Oyster Bay", "Como West", "Kirrawee", "Kangaroo Point",
      "Heathcote", "Waterfall", "Helensburgh", "Stanwell Park",
      "Oatley", "Mortdale", "Penshurst", "Beverly Hills",
      "Blakehurst", "Carlton", "Ramsgate", "Dolls Point",
      "Arncliffe", "Bexley", "Bexley North", "Kingsgrove",
      "Beverly Hills", "Narwee", "Riverwood", "Peakhurst",
      "Lugarno", "Connells Point", "Kyle Bay", "South Hurstville",
    ],
    hardness: 37,
    chlorine: 0.6,
    fluoride: 1.0,
    ph: 7.7,
    pfasRisk: "low",
    usesChloramine: true,
    source: "Prospect WFP (Warragamba Dam) via Woronora zone",
    notes: "The Sutherland Shire and southern Sydney receive soft water at 37 mg/L from the Woronora supply zone. Good quality — carbon filter for chlorine taste.",
  },
  {
    key: "sydney-water-bluemountains",
    utilityName: "Sydney Water",
    region: "Blue Mountains",
    state: "NSW",
    postcodeRanges: [
      [2773, 2786], // Glenbrook, Springwood, Katoomba, Blackheath
    ],
    suburbs: [
      "Blue Mountains", "Glenbrook", "Springwood", "Katoomba",
      "Leura", "Blackheath", "Wentworth Falls", "Faulconbridge",
      "Winmalee", "Hazelbrook", "Lawson", "Bullaburra",
      "Valley Heights", "Warrimoo", "Blaxland", "Mount Riverview",
      "Lapstone", "Woodford", "Linden", "Mount Victoria",
      "Medlow Bath", "Megalong Valley", "Bell",
    ],
    hardness: 38,
    chlorine: 0.6,
    fluoride: 1.0,
    ph: 7.7,
    pfasRisk: "moderate",
    source: "Cascade WFP",
    notes: "Blue Mountains water is soft at 38 mg/L but PFAS was elevated at Cascade WFP in 2024 — now within updated 2025 guidelines. For households concerned about PFAS, a reverse osmosis system provides the best protection.",
  },
  {
    key: "sydney-water-centralcoast",
    utilityName: "Central Coast Council Water",
    region: "Central Coast",
    state: "NSW",
    postcodeRanges: [
      [2250, 2263], // Gosford, Terrigal, Wyong, Tuggerah, The Entrance
    ],
    suburbs: [
      "Gosford", "Terrigal", "Wyong", "Tuggerah", "The Entrance",
      "Erina", "Woy Woy", "Umina Beach", "Avoca Beach", "Bateau Bay",
      "Point Clare", "Tascott", "Kincumber", "Saratoga", "Davistown",
      "Kariong", "Somersby", "Springfield", "Lisarow", "Niagara Park",
      "Wyoming", "Narara", "Copacabana", "MacMasters Beach", "Killcare",
      "Ettalong Beach", "Booker Bay", "Pearl Beach",
      "Toukley", "Norah Head", "Noraville", "Budgewoi", "Buff Point",
      "Lake Haven", "Kanwal", "Charmhaven", "Gorokan",
      "Long Jetty", "Killarney Vale", "Shelly Beach", "Blue Bay",
      "Ourimbah", "Berkeley Vale", "Tumbi Umbi",
    ],
    hardness: 42,
    chlorine: 0.6,
    fluoride: 1.0,
    ph: 7.4,
    pfasRisk: "low",
    source: "Mardi WFP (Mangrove Creek & Mardi Dams)",
    notes: "Central Coast water is soft with low chlorine. Good quality overall — a carbon filter is the main upgrade for taste preference.",
  },
  {
    key: "hunter-water",
    utilityName: "Hunter Water",
    region: "Newcastle & Hunter Valley",
    state: "NSW",
    postcodeRanges: [
      [2280, 2330], // Newcastle, Maitland, Cessnock, Singleton
    ],
    suburbs: [
      "Newcastle", "Newcastle East", "Newcastle West", "The Hill",
      "Maitland", "Cessnock", "Singleton", "Charlestown",
      "Lambton", "Hamilton", "Merewether", "The Junction", "Adamstown",
      "Raymond Terrace", "Nelson Bay", "Port Stephens",
      "Wallsend", "Jesmond", "Waratah", "Georgetown", "Broadmeadow",
      "Islington", "Wickham", "Carrington", "Stockton",
      "Kotara", "Cardiff", "Warners Bay", "Belmont",
      "Swansea", "Lake Macquarie", "Toronto", "Morisset",
      "Valentine", "Eleebana", "Dudley", "Redhead", "Caves Beach",
      "Mayfield", "Warabrook", "Shortland", "Maryland", "Fletcher",
      "Minmi", "Elermore Vale", "Rankin Park", "New Lambton",
      "Bar Beach", "Cooks Hill", "Darby Street",
      "Beresfield", "Thornton", "Woodberry", "East Maitland",
      "Rutherford", "Aberglasslyn", "Morpeth", "Lorn",
      "Salamander Bay", "Shoal Bay", "Soldiers Point", "Anna Bay",
      "Medowie", "Tanilba Bay", "Lemon Tree Passage",
    ],
    hardness: 45,
    chlorine: 0.6,
    fluoride: 1.0,
    ph: 7.4,
    pfasRisk: "low",
    source: "Hunter Water (Grahamstown & Chichester Dams)",
    notes: "Hunter Water supplies soft water from protected catchments. Good quality — carbon filter for taste improvement.",
  },
  {
    key: "sydney-water-illawarra",
    utilityName: "Sydney Water",
    region: "Wollongong & Illawarra",
    state: "NSW",
    postcodeRanges: [
      [2500, 2530], // Wollongong, Fairy Meadow, Thirroul, Shellharbour
    ],
    suburbs: [
      "Wollongong", "Wollongong CBD", "Fairy Meadow", "Thirroul", "Bulli", "Corrimal",
      "Figtree", "Unanderra", "Shellharbour", "Kiama", "Dapto",
      "North Wollongong", "Coniston", "Mangerton", "Mount Keira",
      "Gwynneville", "Keiraville", "West Wollongong", "Balgownie",
      "Austinmer", "Coledale", "Wombarra", "Scarborough", "Stanwell Park",
      "Warrawong", "Port Kembla", "Berkeley", "Lake Heights",
      "Windang", "Primbee", "Barrack Heights", "Oak Flats",
      "Albion Park", "Albion Park Rail", "Tullimbar", "Calderwood",
      "Bombo", "Minnamurra", "Jamberoo", "Gerringong", "Berry",
      "Woonona", "Russell Vale", "Bellambi", "East Corrimal",
      "Tarrawanna", "Towradgi", "Fernhill",
    ],
    hardness: 33,
    chlorine: 0.5,
    fluoride: 1.0,
    ph: 7.8,
    pfasRisk: "low",
    source: "Illawarra WFP (Avon & Cordeaux Dams)",
    notes: "Illawarra receives very soft water at just 33 mg/L from mountain catchments. Excellent quality. A carbon filter is a nice-to-have for taste.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // QUEENSLAND
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: "urban-utilities-brisbane",
    utilityName: "Urban Utilities",
    region: "Brisbane",
    state: "QLD",
    postcodeRanges: [
      [4000, 4030], // CBD, Fortitude Valley, South Brisbane, West End
      [4051, 4078], // Paddington, Bardon, The Gap, Ashgrove, Ferny Hills
      [4101, 4132], // Woolloongabba, Annerley, Sunnybank, Eight Mile Plains
      [4151, 4174], // Coorparoo, Camp Hill, Mt Gravatt, Rochedale
    ],
    suburbs: [
      "Brisbane CBD", "Brisbane", "Fortitude Valley", "South Brisbane", "West End",
      "New Farm", "Teneriffe", "Paddington", "Bardon", "The Gap",
      "Ashgrove", "Woolloongabba", "Annerley", "Sunnybank",
      "Eight Mile Plains", "Coorparoo", "Camp Hill", "Mt Gravatt",
      "Carindale", "Bulimba", "Hawthorne", "Chermside", "Nundah",
      "Kedron", "Stafford", "Aspley",
      "Kangaroo Point", "East Brisbane", "Norman Park", "Morningside",
      "Balmoral", "Cannon Hill", "Murarrie", "Tingalpa",
      "Wynnum", "Manly", "Lota", "Hemmant",
      "Kelvin Grove", "Red Hill", "Milton", "Toowong", "Auchenflower",
      "Indooroopilly", "St Lucia", "Taringa", "Chapel Hill",
      "Kenmore", "Brookfield", "Pullenvale", "Fig Tree Pocket",
      "Jindalee", "Sinnamon Park", "Westlake", "Riverhills",
      "Sherwood", "Graceville", "Chelmer", "Corinda", "Tennyson",
      "Yeronga", "Fairfield", "Yeerongpilly", "Moorooka",
      "Tarragindi", "Holland Park", "Holland Park West", "Greenslopes",
      "Stones Corner", "Dutton Park", "Highgate Hill",
      "Clayfield", "Hendra", "Hamilton", "Ascot", "Eagle Farm",
      "Albion", "Windsor", "Lutwyche", "Gordon Park", "Grange",
      "Newmarket", "Alderley", "Enoggera", "Mitchelton",
      "Everton Park", "Everton Hills", "Stafford Heights",
      "Geebung", "Zillmere", "Carseldine", "Bald Hills",
      "Boondall", "Nudgee", "Banyo", "Virginia", "Northgate",
      "Bracken Ridge", "Sandgate", "Shorncliffe", "Brighton",
      "Deagon", "Taigum", "Fitzgibbon",
      "Wishart", "Upper Mt Gravatt", "Macgregor", "Robertson",
      "Runcorn", "Kuraby", "Rochedale", "Rochedale South",
      "Mansfield", "Mt Gravatt East", "Capalaba West",
      "Sunnybank Hills", "Stretton", "Karawatha",
    ],
    hardness: 115,
    chlorine: 1.1,
    fluoride: 0.85,
    ph: 7.8,
    pfasRisk: "low",
    usesChloramine: true,
    source: "Wivenhoe Dam / North Pine Dam via Seqwater",
    notes: "Brisbane has moderately hard water with higher chlorine. Seasonal earthy/musty taste after rain is naturally occurring. A whole house filtration addresses chlorine taste — add scale-reduction if you notice buildup in kettles.",
  },
  {
    key: "urban-utilities-ipswich",
    utilityName: "Urban Utilities",
    region: "Ipswich & Logan",
    state: "QLD",
    postcodeRanges: [
      [4300, 4312], // Ipswich, Springfield, Redbank
      [4114, 4120], // Logan, Woodridge, Underwood, Springwood
      [4131, 4133], // Browns Plains, Regents Park
    ],
    suburbs: [
      "Ipswich", "Springfield", "Redbank Plains", "Goodna", "Riverview",
      "Logan", "Woodridge", "Underwood", "Springwood", "Browns Plains",
      "Beenleigh", "Eagleby",
      "Springfield Lakes", "Augustine Heights", "Brookwater",
      "Booval", "Bundamba", "Dinmore", "Ebbw Vale", "Leichhardt",
      "Brassall", "North Ipswich", "East Ipswich", "Yamanto",
      "Karalee", "Chuwar", "Bellbird Park", "Collingwood Park",
      "Camira", "Gailes", "Inala", "Darra", "Richlands", "Forest Lake",
      "Oxley", "Corinda", "Ellen Grove", "Durack",
      "Marsden", "Crestmead", "Heritage Park", "Regents Park",
      "Berrinba", "Kingston", "Slacks Creek", "Daisy Hill",
      "Shailer Park", "Loganholme", "Meadowbrook", "Loganlea",
      "Park Ridge", "Boronia Heights", "Hillcrest",
      "Waterford", "Waterford West", "Bethania", "Edens Landing",
      "Holmview", "Windaroo", "Bannockburn", "Tamborine",
    ],
    hardness: 120,
    chlorine: 1.1,
    fluoride: 0.85,
    ph: 7.8,
    pfasRisk: "low",
    usesChloramine: true,
    source: "Wivenhoe / Somerset Dams via Seqwater",
    notes: "Ipswich and Logan receive moderately hard water from the Wivenhoe system. Scale-reduction filter recommended for appliances. Whole house filtration for chlorine taste.",
  },
  {
    key: "unity-water-sc",
    utilityName: "Unitywater",
    region: "Sunshine Coast",
    state: "QLD",
    postcodeRanges: [
      [4550, 4575], // Maroochydore, Noosa, Caloundra, Mooloolaba, Buderim
    ],
    suburbs: [
      "Maroochydore", "Noosa", "Caloundra", "Mooloolaba", "Buderim",
      "Nambour", "Coolum Beach", "Peregian Beach", "Sippy Downs",
      "Noosa Heads", "Noosaville", "Tewantin", "Sunshine Beach",
      "Sunrise Beach", "Marcus Beach", "Castaways Beach",
      "Alexandra Headland", "Cotton Tree", "Point Cartwright",
      "Mountain Creek", "Chancellor Park", "Palmwoods", "Woombye",
      "Yandina", "Eumundi", "Bli Bli", "Pacific Paradise",
      "Mudjimba", "Twin Waters", "Marcoola", "Mount Coolum",
      "Pelican Waters", "Golden Beach", "Kings Beach", "Dicky Beach",
      "Currimundi", "Aroona", "Battery Hill", "Shelly Beach",
      "Moffat Beach", "Landsborough", "Beerwah", "Glass House Mountains",
      "Maleny", "Montville", "Mapleton", "Kenilworth",
      "Kawana Waters", "Bokarina", "Wurtulla", "Birtinya",
      "Warana", "Buddina", "Parrearra",
    ],
    hardness: 45,
    chlorine: 0.8,
    fluoride: 0.8,
    ph: 7.5,
    pfasRisk: "low",
    usesChloramine: true,
    source: "Baroon Pocket Dam via Landers Shute WTP",
    notes: "Sunshine Coast has soft water at 45 mg/L from the Baroon Pocket Dam rainforest catchment, treated at Landers Shute WTP. No scale issues. Chloramine is used for disinfection — a carbon filter is the main upgrade for taste.",
  },
  {
    key: "unity-water-mb",
    utilityName: "Unitywater",
    region: "Moreton Bay",
    state: "QLD",
    postcodeRanges: [
      [4500, 4521], // Brendale, Strathpine, Petrie, Caboolture, Morayfield
    ],
    suburbs: [
      "Caboolture", "Morayfield", "North Lakes", "Redcliffe",
      "Strathpine", "Petrie", "Brendale",
      "Burpengary", "Narangba", "Dakabin", "Kallangur",
      "Murrumba Downs", "Griffin", "Mango Hill", "Kippa-Ring",
      "Scarborough", "Margate", "Woody Point", "Clontarf",
      "Deception Bay", "Rothwell", "Lawnton", "Bray Park",
      "Warner", "Cashmere", "Eatons Hill", "Albany Creek",
      "Bridgeman Downs", "McDowall", "Ferny Hills", "Arana Hills",
    ],
    hardness: 75,
    chlorine: 0.9,
    fluoride: 0.8,
    ph: 7.6,
    pfasRisk: "low",
    usesChloramine: true,
    source: "North Pine Dam via Seqwater",
    notes: "Moreton Bay receives moderately soft water from North Pine Dam. Slightly harder than Sunshine Coast due to different dam source. Carbon filter for chloramine taste is the main upgrade.",
  },
  {
    key: "gold-coast-water",
    utilityName: "City of Gold Coast",
    region: "Gold Coast",
    state: "QLD",
    postcodeRanges: [
      [4207, 4230], // Gold Coast, Southport, Surfers Paradise, Burleigh, Coolangatta
    ],
    suburbs: [
      "Gold Coast", "Southport", "Surfers Paradise", "Broadbeach",
      "Burleigh Heads", "Palm Beach", "Coolangatta", "Robina",
      "Varsity Lakes", "Nerang", "Mudgeeraba", "Coomera", "Helensvale",
      "Oxenford", "Ormeau", "Pimpama",
      "Main Beach", "Runaway Bay", "Biggera Waters", "Labrador",
      "Parkwood", "Arundel", "Molendinar", "Ashmore", "Benowa",
      "Bundall", "Chevron Island", "Isle of Capri",
      "Mermaid Beach", "Mermaid Waters", "Miami", "Nobby Beach",
      "Burleigh Waters", "Tallebudgera", "Currumbin", "Currumbin Waters",
      "Tugun", "Bilinga", "Kirra", "Rainbow Bay",
      "Merrimac", "Carrara", "Highland Park", "Pacific Pines",
      "Gaven", "Mount Nathan", "Worongary", "Tallai",
      "Upper Coomera", "Willowvale", "Jacobs Well", "Alberton",
      "Hope Island", "Sanctuary Cove", "Paradise Point",
      "Hollywell", "Coombabah", "Elanora", "Palm Beach",
      "Reedy Creek", "Clear Island Waters", "Broadbeach Waters",
    ],
    hardness: 32,
    chlorine: 1.4,
    fluoride: 0.8,
    ph: 7.3,
    pfasRisk: "low",
    usesChloramine: false,
    source: "Hinze Dam via Molendinar WTP",
    notes: "Gold Coast has very soft water at just 32 mg/L from Hinze Dam in the hinterland. No scale issues. Chlorine (not chloramine) is used for disinfection at moderate-to-high levels — a carbon filter makes a noticeable difference for taste, especially in summer.",
  },
  {
    key: "toowoomba",
    utilityName: "Toowoomba Regional Council",
    region: "Toowoomba & Darling Downs",
    state: "QLD",
    postcodeRanges: [
      [4350, 4352], // Toowoomba, Harristown, Darling Heights
    ],
    suburbs: [
      "Toowoomba", "Harristown", "Darling Heights", "Rangeville",
      "East Toowoomba", "Newtown", "Wilsonton",
    ],
    hardness: 160,
    chlorine: 0.9,
    fluoride: 0.85,
    ph: 7.6,
    pfasRisk: "low",
    source: "Cooby & Perseverance Dams / groundwater",
    notes: "Toowoomba has harder water than coastal Queensland due to local groundwater sources. Scale buildup is a known issue. Whole house filter with scale-reduction strongly recommended.",
  },
  {
    key: "cairns-water",
    utilityName: "Cairns Regional Council",
    region: "Cairns",
    state: "QLD",
    postcodeRanges: [
      [4868, 4881], // Cairns, Cairns North, Edge Hill, Smithfield, Northern Beaches
    ],
    suburbs: [
      "Cairns", "Cairns CBD", "Cairns North", "Cairns City", "Edge Hill",
      "Whitfield", "Smithfield", "Trinity Beach", "Trinity Park",
      "Palm Cove", "Yorkeys Knob", "Gordonvale", "Machans Beach",
      "Holloways Beach", "Kewarra Beach", "Clifton Beach",
      "Brinsmead", "Freshwater", "Stratford", "Manoora",
      "Manunda", "Parramatta Park", "Westcourt", "Mooroobool",
      "Kanimbla", "Bayview Heights", "Mount Sheridan", "Edmonton",
      "Bentley Park", "Woree", "White Rock", "Earlville",
      "Aeroglen", "Portsmith", "Redlynch",
    ],
    hardness: 18,
    chlorine: 0.6,
    fluoride: 0.0,
    ph: 7.2,
    pfasRisk: "low",
    source: "Copperlode Falls Dam (Lake Morris) & Behana Creek",
    notes: "Cairns has very soft water at just 18 mg/L from protected tropical rainforest catchments. Cairns does NOT fluoridate its water supply. Chlorine is used for disinfection at low levels. A carbon filter is a great upgrade for taste and chlorine removal.",
  },
  // ── Townsville City Council ──────────────────────────────────────────────
  {
    key: "townsville-water",
    utilityName: "Townsville City Council",
    region: "Townsville",
    state: "QLD",
    postcodeRanges: [
      [4810, 4818], // Townsville CBD, South Townsville, North Ward, Belgian Gardens
      [4812, 4812], // Currajong, Mysterton, Pimlico
      [4814, 4814], // Aitkenvale, Cranbrook, Douglas
      [4815, 4815], // Kirwan, Thuringowa Central
      [4816, 4820], // Outer suburbs, Magnetic Island
    ],
    suburbs: [
      "Townsville", "Townsville CBD", "South Townsville", "North Ward",
      "Belgian Gardens", "Castle Hill", "Rowes Bay", "Garbutt",
      "Currajong", "Mysterton", "Pimlico", "Mundingburra",
      "Aitkenvale", "Cranbrook", "Douglas", "Annandale",
      "Kirwan", "Thuringowa Central", "Condon", "Kelso",
      "Rasmussen", "Mount Louisa", "Bohle Plains", "Burdell",
      "Bushland Beach", "Deeragun", "Jensen", "Mount Low",
      "Magnetic Island", "Nelly Bay", "Arcadia", "Picnic Bay",
      "Horseshoe Bay", "West End", "Railway Estate", "Oonoonba",
      "Stuart", "Wulguru", "Idalia", "Cluden",
    ],
    hardness: 25,
    chlorine: 0.8,
    fluoride: 0.7,
    ph: 7.3,
    pfasRisk: "low",
    source: "Ross River Dam & Paluma Dam",
    notes: "Townsville has very soft tropical water at just 25 mg/L hardness from Ross River Dam. No scale issues. Chlorine is moderate — a carbon filter is the main upgrade for taste. Occasional discolouration can occur after heavy rainfall and dam releases.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WESTERN AUSTRALIA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: "watercorp-perth-central",
    utilityName: "Water Corporation",
    region: "Perth — Central & CBD",
    state: "WA",
    postcodeRanges: [
      [6000, 6020], // Perth CBD, West Perth, Subiaco, Claremont, Cottesloe
    ],
    suburbs: [
      "Perth CBD", "West Perth", "East Perth", "Subiaco", "Leederville",
      "Mount Lawley", "Northbridge", "Claremont", "Cottesloe",
      "Nedlands", "Dalkeith", "Peppermint Grove", "Crawley", "Shenton Park",
      "Wembley", "Floreat", "City Beach", "Scarborough", "Doubleview",
      "Churchlands", "Karrinyup", "Innaloo", "Mosman Park", "Swanbourne",
      "Mount Hawthorn", "North Perth", "Highgate", "Menora",
    ],
    hardness: 95,
    chlorine: 0.8,
    fluoride: 0.75,
    ph: 7.8,
    pfasRisk: "low",
    source: "Mixed: Perth Seawater Desalination Plant + Mundaring Weir",
    notes: "Central Perth receives a mix of desalinated and dam water. Moderately hard at 95 mg/L — some scale buildup on taps and appliances. Whole house filtration with scale-reduction is the recommended setup.",
  },
  {
    key: "watercorp-perth-north",
    utilityName: "Water Corporation",
    region: "Perth — Northern Suburbs",
    state: "WA",
    postcodeRanges: [
      [6021, 6038], // Joondalup, Wanneroo, Yanchep, Two Rocks
      [6055, 6055], // Caversham
      [6060, 6069], // Yokine, Nollamara, Balcatta, Stirling
    ],
    suburbs: [
      "Joondalup", "Wanneroo", "Yanchep", "Two Rocks", "Clarkson",
      "Butler", "Alkimos", "Currambine", "Quinns Rocks", "Mindarie",
      "Balcatta", "Stirling", "Nollamara", "Yokine", "Dianella",
      "Morley", "Bayswater", "Maylands", "Caversham", "Ellenbrook",
      "The Vines", "Woodvale", "Kingsley", "Padbury", "Hillarys",
      "Sorrento", "Kallaroo", "Craigie", "Beldon", "Edgewater",
      "Heathridge", "Ocean Reef", "Connolly", "Burns Beach",
      "Iluka", "Banksia Grove", "Tapping", "Madeley", "Landsdale",
      "Ballajura", "Malaga", "Beechboro", "Kiara", "Bassendean",
      "Ashfield", "Bedford", "Embleton", "Noranda",
    ],
    hardness: 165,
    chlorine: 0.9,
    fluoride: 0.75,
    ph: 7.5,
    pfasRisk: "low",
    source: "Gnangara Mound groundwater",
    notes: "Perth's northern suburbs have hard water at 165 mg/L from the Gnangara Mound aquifer — some areas like Two Rocks and Yanchep exceed 200 mg/L. White scale on shower screens, taps, kettles. A water softener is strongly recommended, plus RO for drinking water.",
  },
  {
    key: "watercorp-perth-south",
    utilityName: "Water Corporation",
    region: "Perth — Southern Suburbs",
    state: "WA",
    postcodeRanges: [
      [6100, 6112], // Victoria Park, Cannington, Beckenham, Gosnells
      [6147, 6172], // Thornlie, Canning Vale, Cockburn, Fremantle, Rockingham
    ],
    suburbs: [
      "Fremantle", "Cockburn", "Rockingham", "Canning Vale",
      "Thornlie", "Gosnells", "Armadale", "Victoria Park", "Cannington",
      "South Perth", "Como", "Riverton", "Bull Creek", "Murdoch",
      "Bibra Lake", "Success", "Atwell", "Spearwood", "East Fremantle",
      "North Fremantle", "Hamilton Hill", "Beaconsfield", "Hilton",
      "Coolbellup", "Yangebup", "South Lake", "Jandakot", "Leeming",
      "Willetton", "Shelley", "Rossmoyne", "Applecross", "Booragoon",
      "Melville", "Myaree", "Palmyra", "Bentley", "St James",
      "East Cannington", "Beckenham", "Kenwick", "Maddington",
      "Huntingdale", "Southern River", "Byford", "Mundijong",
      "Baldivis", "Warnbro", "Safety Bay", "Secret Harbour",
      "Wellard", "Bertram", "Piara Waters", "Harrisdale",
    ],
    hardness: 86,
    chlorine: 0.7,
    fluoride: 0.75,
    ph: 7.8,
    pfasRisk: "low",
    source: "Perth Seawater Desalination Plant / Serpentine Dam",
    notes: "Perth's southern suburbs get more desalinated water, resulting in moderately hard water at 86 mg/L — softer than the north. Carbon filter for chlorine taste. Scale-reduction optional.",
  },
  {
    key: "watercorp-perth-east",
    utilityName: "Water Corporation",
    region: "Perth — Eastern Suburbs & Hills",
    state: "WA",
    postcodeRanges: [
      [6050, 6058], // Midland, Helena Valley, Mundaring
      [6071, 6076], // Kalamunda, Lesmurdie, High Wycombe
    ],
    suburbs: [
      "Midland", "Helena Valley", "Mundaring", "Kalamunda", "Lesmurdie",
      "High Wycombe", "Forrestfield", "Maida Vale", "Darlington",
      "Glen Forrest", "Parkerville", "Sawyers Valley", "Stoneville",
      "Mount Helena", "Chidlow", "Wooroloo", "Boya", "Gooseberry Hill",
      "Walliston", "Carmel", "Pickering Brook", "Roleystone",
      "Kelmscott", "Seville Grove", "Champion Lakes", "Wattle Grove",
      "Orange Grove", "Martin", "Bickley",
    ],
    hardness: 95,
    chlorine: 0.8,
    fluoride: 0.75,
    ph: 8.1,
    pfasRisk: "low",
    source: "Mundaring Weir / Victoria Dam",
    notes: "Perth's eastern hills receive dam water from Mundaring Weir. Moderately hard at 95 mg/L — softer than northern suburbs due to surface water sources. Carbon filter for taste is the main upgrade.",
  },
  {
    key: "watercorp-mandurah",
    utilityName: "Water Corporation",
    region: "Mandurah & Peel",
    state: "WA",
    postcodeRanges: [
      [6210, 6215], // Mandurah, Halls Head, Falcon, Dawesville
    ],
    suburbs: [
      "Mandurah", "Halls Head", "Falcon", "Dawesville", "Pinjarra",
      "Meadow Springs", "Greenfields", "Coodanup", "Dudley Park",
      "Lakelands", "Madora Bay", "San Remo", "Erskine",
      "Furnissdale", "South Yunderup", "North Yunderup",
    ],
    hardness: 54,
    chlorine: 0.7,
    fluoride: 0.75,
    ph: 8.4,
    pfasRisk: "low",
    source: "Perth Seawater Desalination Plant / Serpentine Dam",
    notes: "Mandurah has soft water at 54 mg/L — significantly softer than Perth's northern suburbs thanks to higher desalinated supply. No scale issues. Carbon filter for chlorine taste is the main upgrade.",
  },
  {
    key: "watercorp-bunbury",
    utilityName: "Water Corporation",
    region: "Bunbury & South West",
    state: "WA",
    postcodeRanges: [
      [6230, 6240], // Bunbury, Busselton, Dunsborough
    ],
    suburbs: [
      "Bunbury", "Busselton", "Dunsborough", "Margaret River",
      "Australind", "Eaton",
    ],
    hardness: 100,
    chlorine: 0.7,
    fluoride: 0.75,
    ph: 7.6,
    pfasRisk: "low",
    source: "Wellington Dam / groundwater",
    notes: "Moderate hardness — good quality for regional WA. Carbon filter + scale-reduction recommended.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUTH AUSTRALIA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: "sawater-central",
    utilityName: "SA Water",
    region: "Adelaide — CBD & Inner Suburbs",
    state: "SA",
    postcodeRanges: [
      [5000, 5015], // CBD, North Adelaide, Bowden, Prospect
      [5031, 5045], // Thebarton, Torrensville, Mile End, Unley, Goodwood
      [5061, 5075], // Burnside, Norwood, Kensington, Magill, Campbelltown
    ],
    suburbs: [
      "Adelaide CBD", "North Adelaide", "Prospect", "Unley", "Norwood",
      "Burnside", "Kensington", "Goodwood", "Parkside", "Fullarton",
      "Mile End", "Torrensville", "Magill", "Campbelltown", "Payneham",
    ],
    hardness: 97,
    chlorine: 1.3,
    fluoride: 0.6,
    ph: 7.6,
    pfasRisk: "low",
    source: "Happy Valley Reservoir / Murray River blend",
    notes: "Adelaide has some of Australia's highest chlorine levels and moderately hard water at 97 mg/L from Murray River blending. A whole house filtration is the single most impactful upgrade for SA homes — it transforms the taste, and many families notice softer skin and hair immediately.",
  },
  {
    key: "sawater-north",
    utilityName: "SA Water",
    region: "Adelaide — Northern Suburbs",
    state: "SA",
    postcodeRanges: [
      [5081, 5098], // Walkerville, Modbury, Tea Tree Gully
      [5106, 5120], // Salisbury, Elizabeth, Gawler, Munno Para
      [5160, 5161], // Hallett Cove, Sheidow Park
    ],
    suburbs: [
      "Salisbury", "Elizabeth", "Gawler", "Munno Para", "Craigmore",
      "Modbury", "Tea Tree Gully", "Golden Grove", "Mawson Lakes",
      "Parafield Gardens", "Smithfield", "Davoren Park",
    ],
    hardness: 111,
    chlorine: 1.5,
    fluoride: 0.6,
    ph: 7.5,
    pfasRisk: "low",
    source: "Murray River / Happy Valley Reservoir",
    notes: "Northern Adelaide has the hardest water and highest chlorine in the city at 111 mg/L. Scale in kettles and on shower screens is common. A water softener + whole house filtration is the recommended combination for this area.",
  },
  {
    key: "sawater-south",
    utilityName: "SA Water",
    region: "Adelaide — Southern Suburbs",
    state: "SA",
    postcodeRanges: [
      [5041, 5050], // Colonel Light Gardens, Mitcham, Blackwood
      [5159, 5174], // Morphett Vale, Noarlunga, Reynella, Seaford, McLaren Vale
    ],
    suburbs: [
      "Morphett Vale", "Noarlunga", "Port Noarlunga", "Reynella", "Seaford",
      "Aldinga", "Aldinga Beach", "McLaren Vale", "McLaren Flat", "Moana",
      "Christies Beach", "Hackham", "Mitcham", "Blackwood", "Aberfoyle Park",
      "Happy Valley", "Old Reynella", "Woodcroft", "Hallett Cove",
      "Sheidow Park", "Trott Park", "O'Halloran Hill", "Lonsdale",
      "Port Willunga", "Maslin Beach", "Sellicks Beach", "Willunga",
    ],
    hardness: 105,
    chlorine: 1.2,
    fluoride: 0.6,
    ph: 7.7,
    pfasRisk: "low",
    usesChloramine: true,
    source: "Myponga Reservoir / Southern metro blend",
    notes: "Southern Adelaide receives a blend of Myponga Reservoir and southern metro supply — moderately hard at 105 mg/L, treated with chloramine. Carbon filter recommended for taste — scale-reduction helpful for appliances.",
  },
  {
    key: "sawater-hills",
    utilityName: "SA Water",
    region: "Adelaide Hills",
    state: "SA",
    postcodeRanges: [
      [5134, 5158], // Stirling, Crafers, Mount Barker, Hahndorf
    ],
    suburbs: [
      "Stirling", "Crafers", "Mount Barker", "Hahndorf", "Bridgewater",
      "Aldgate", "Lobethal", "Woodside", "Nairne",
    ],
    hardness: 89,
    chlorine: 1.0,
    fluoride: 0.6,
    ph: 7.6,
    pfasRisk: "low",
    usesChloramine: true,
    source: "Mount Lofty Ranges reservoirs (Mount Bold, Kangaroo Creek)",
    notes: "Adelaide Hills has the softest water in the Adelaide metro area at 89 mg/L from local mountain catchments. Better taste than other SA zones. Chloramine treatment — carbon filter for preference.",
  },
  {
    key: "sawater-west",
    utilityName: "SA Water",
    region: "Adelaide — Western Suburbs & Beach",
    state: "SA",
    postcodeRanges: [
      [5015, 5025], // Port Adelaide, Henley Beach, West Lakes
      [5044, 5049], // Glenelg, Brighton, Somerton Park
    ],
    suburbs: [
      "Glenelg", "Brighton", "Henley Beach", "West Lakes",
      "Port Adelaide", "Semaphore", "Largs Bay", "Somerton Park",
      "Seacliff", "Marino",
    ],
    hardness: 104,
    chlorine: 1.2,
    fluoride: 0.6,
    ph: 7.7,
    pfasRisk: "low",
    source: "Murray River blend / Happy Valley Reservoir",
    notes: "Western Adelaide and Port Adelaide receive Murray River blended water at 104 mg/L. Some coastal areas notice a slightly brackish taste from Murray salinity. Carbon filter + scale-reduction for best results.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TASMANIA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: "taswater-hobart",
    utilityName: "TasWater",
    region: "Hobart & Greater Hobart",
    state: "TAS",
    postcodeRanges: [
      [7000, 7055], // Hobart, Sandy Bay, Battery Point, Glenorchy, Moonah, Kingston
    ],
    suburbs: [
      "Hobart", "Hobart CBD", "Sandy Bay", "Battery Point", "Glenorchy", "Moonah",
      "Kingston", "Blackmans Bay", "Howrah", "Bellerive", "Lindisfarne",
      "Claremont", "New Town", "Lenah Valley", "West Hobart", "North Hobart",
      "South Hobart", "Dynnyrne", "Mount Nelson", "Taroona", "Tranmere",
      "Warrane", "Mornington", "Rosny", "Rosny Park", "Montagu Bay",
      "Rose Bay", "Lutana", "Derwent Park", "Austins Ferry",
      "Granton", "Berriedale", "Chigwell", "Bridgewater",
      "Brighton", "Old Beach", "Rokeby", "Lauderdale", "Opossum Bay",
      "Margate", "Snug", "Kettering", "Sorell", "Midway Point",
      "Dodges Ferry", "Seven Mile Beach", "Cambridge", "Richmond",
    ],
    hardness: 18,
    chlorine: 0.4,
    fluoride: 1.0,
    ph: 7.2,
    pfasRisk: "low",
    source: "Mount Wellington catchment (Ridgeway Dam)",
    notes: "Hobart has some of the purest water in Australia — very soft, low chlorine, from a pristine mountain catchment. Filtration is mostly personal preference here. If you want the absolute best, a simple under-sink carbon filter does the job.",
  },
  {
    key: "taswater-launceston",
    utilityName: "TasWater",
    region: "Launceston",
    state: "TAS",
    postcodeRanges: [
      [7248, 7260], // Launceston, Riverside, Prospect, Legana
    ],
    suburbs: [
      "Launceston", "Launceston CBD", "Riverside", "Prospect", "Legana", "Newnham",
      "Mowbray", "Kings Meadows", "Youngtown", "Ravenswood", "Waverley",
      "St Leonards", "East Launceston", "South Launceston", "Trevallyn",
      "West Launceston", "Invermay", "Summerhill", "Norwood",
      "Blackstone Heights", "Prospect Vale", "Hadspen", "Perth",
      "Longford", "Evandale", "George Town",
    ],
    hardness: 22,
    chlorine: 0.4,
    fluoride: 1.0,
    ph: 7.3,
    pfasRisk: "low",
    source: "Trevallyn Dam / St Patricks River",
    notes: "Launceston has excellent soft water from local catchments. One of the best tap waters in Australia. Low treatment levels — filtration is optional.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ACT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: "icon-water",
    utilityName: "Icon Water",
    region: "Canberra & ACT",
    state: "ACT",
    postcodeRanges: [
      [2600, 2620], // All of ACT
      [2900, 2914], // Tuggeranong, Woden, Weston Creek
    ],
    suburbs: [
      "Canberra", "Civic", "Braddon", "Turner", "O'Connor",
      "Belconnen", "Woden", "Tuggeranong", "Weston Creek", "Gungahlin",
      "Mitchell", "Fyshwick", "Kingston", "Manuka", "Griffith",
      "Curtin", "Hughes", "Garran", "Narrabundah", "Red Hill",
      "Deakin", "Yarralumla", "Forrest", "Barton", "Parkes",
      "Acton", "Campbell", "Russell", "Duntroon", "Ainslie",
      "Dickson", "Downer", "Watson", "Hackett", "Lyneham",
      "Kaleen", "Giralang", "McKellar", "Evatt", "Florey",
      "Scullin", "Page", "Hawker", "Weetangera", "Cook",
      "Macquarie", "Aranda", "Bruce", "Holder", "Duffy",
      "Rivett", "Fisher", "Waramanga", "Chapman", "Stirling",
      "Phillip", "Mawson", "Pearce", "Torrens", "Farrer",
      "Isaacs", "O'Malley", "Wanniassa", "Kambah", "Greenway",
      "Bonython", "Gordon", "Conder", "Banks", "Theodore",
      "Calwell", "Richardson", "Isabella Plains", "Chisholm",
      "Gilmore", "Fadden", "Gowrie", "Monash", "Oxley",
      "Palmerston", "Nicholls", "Ngunnawal", "Amaroo", "Bonner",
      "Casey", "Crace", "Forde", "Harrison", "Franklin",
      "Jacka", "Moncrieff", "Taylor", "Throsby",
      "Molonglo Valley", "Wright", "Coombs", "Denman Prospect",
    ],
    hardness: 38,
    chlorine: 0.6,
    fluoride: 1.0,
    ph: 7.4,
    pfasRisk: "moderate",
    source: "Googong & Cotter Reservoirs",
    notes: "Canberra has soft water at 38 mg/L from mountain reservoirs. PFAS monitoring is ongoing near defence and industrial sites — current levels within guidelines. For PFAS-concerned households, a reverse osmosis system provides the best protection.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NORTHERN TERRITORY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: "pwc-darwin",
    utilityName: "Power and Water Corporation",
    region: "Darwin & Palmerston",
    state: "NT",
    postcodeRanges: [
      [800, 832], // Darwin, Palmerston, Howard Springs, Humpty Doo
    ],
    suburbs: [
      "Darwin", "Darwin CBD", "Darwin City", "Palmerston",
      "Howard Springs", "Humpty Doo",
      "Stuart Park", "Larrakeyah", "The Gardens", "Fannie Bay",
      "Parap", "Woolner", "Bayview", "East Point",
      "Nightcliff", "Coconut Grove", "Rapid Creek", "Millner",
      "Casuarina", "Nakara", "Tiwi", "Brinkin", "Wanguri",
      "Malak", "Karama", "Anula", "Berrimah",
      "Leanyer", "Muirhead", "Lee Point",
      "Gunn", "Driver", "Durack", "Gray", "Moulden",
      "Woodroffe", "Rosebery", "Bellamack", "Zuccoli",
    ],
    hardness: 43,
    chlorine: 0.7,
    fluoride: 0.6,
    ph: 7.4,
    pfasRisk: "moderate",
    source: "Darwin River Dam (259,000 ML) & McMinns/Howard East Borefields",
    notes: "Darwin has soft water at 43 mg/L from tropical rainfall catchments. No scale issues. The NT fluoridates at 0.6 mg/L. Chlorine (not chloramine) is used for disinfection. PFAS has been detected near RAAF Base Darwin from historical firefighting foam use — the reticulated supply is separate but a reverse osmosis system provides the best peace of mind.",
  },
  {
    key: "pwc-alice",
    utilityName: "Power and Water Corporation",
    region: "Alice Springs",
    state: "NT",
    postcodeRanges: [
      [870, 872], // Alice Springs
    ],
    suburbs: [
      "Alice Springs", "The Gap", "Larapinta", "Gillen",
      "East Side", "Sadadeen",
    ],
    hardness: 180,
    chlorine: 0.8,
    fluoride: 0.0,
    ph: 7.8,
    pfasRisk: "low",
    source: "Amadeus Basin groundwater (Roe Creek borefield)",
    notes: "Alice Springs has very hard groundwater from the Amadeus Basin. Scale is a significant issue. NT does not fluoridate. A water softener or whole house filter with scale-reduction is strongly recommended.",
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // TASMANIA
  // ═══════════════════════════════════════════════════════════════════════════
  // ── TasWater — Greater Hobart ─────────────────────────────────────────────
  {
    key: "taswater-hobart",
    utilityName: "TasWater",
    region: "Greater Hobart",
    state: "TAS",
    postcodeRanges: [
      [7000, 7000], // Hobart CBD
      [7001, 7001], // Hobart GPO
      [7004, 7004], // Battery Point, Sandy Bay
      [7005, 7005], // Sandy Bay, Dynnyrne
      [7006, 7006], // Sandy Bay (upper)
      [7007, 7007], // Mount Nelson, Tolmans Hill
      [7008, 7008], // New Town, Lenah Valley
      [7009, 7009], // Lutana, Moonah, Derwent Park
      [7010, 7011], // Glenorchy, Montrose, Rosetta, Claremont
      [7012, 7012], // Berriedale, Austins Ferry
      [7015, 7015], // Lindisfarne, Rose Bay
      [7016, 7016], // Bellerive, Howrah
      [7017, 7018], // Rokeby, Clarendon Vale, Lauderdale
      [7019, 7019], // Tranmere, Droughty Point
      [7020, 7020], // South Arm
      [7050, 7050], // Bridgewater, Brighton
      [7052, 7054], // Sorell, Midway Point, Dodges Ferry
      [7055, 7055], // Cambridge, Seven Mile Beach
      [7109, 7109], // Huonville
      [7170, 7170], // Kingston, Blackmans Bay
      [7171, 7172], // Kingston Beach, Taroona
    ],
    suburbs: [
      "Hobart", "Hobart CBD", "Battery Point", "Sandy Bay", "Dynnyrne",
      "Mount Nelson", "Tolmans Hill", "New Town", "Lenah Valley",
      "Lutana", "Moonah", "Derwent Park", "Glenorchy", "Montrose",
      "Rosetta", "Claremont", "Berriedale", "Austins Ferry",
      "Lindisfarne", "Rose Bay", "Bellerive", "Howrah",
      "Rokeby", "Clarendon Vale", "Lauderdale", "Tranmere",
      "South Arm", "Bridgewater", "Brighton", "Sorell",
      "Midway Point", "Dodges Ferry", "Cambridge", "Seven Mile Beach",
      "Huonville", "Kingston", "Blackmans Bay", "Kingston Beach", "Taroona",
      "West Hobart", "North Hobart", "South Hobart", "Salamanca",
      "Mornington", "Warrane", "Risdon Vale", "Old Beach",
    ],
    hardness: 24,
    chlorine: 0.82,
    fluoride: 0.93,
    ph: 7.4,
    pfasRisk: "low",
    source: "TasWater (Bryn Estyn Water Treatment Plant — Derwent River)",
    notes: "Hobart's water is soft at just 24 mg/L hardness, sourced from the Derwent River. Free chlorine sits around 0.82 mg/L — a carbon filter will noticeably improve taste. Fluoride is within the recommended range at 0.93 mg/L. Overall excellent quality from protected Tasmanian catchments.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUSTRALIAN CAPITAL TERRITORY
  // ═══════════════════════════════════════════════════════════════════════════
  // ── Icon Water — Canberra / ACT ───────────────────────────────────────────
  {
    key: "icon-water-canberra",
    utilityName: "Icon Water",
    region: "Canberra & ACT",
    state: "ACT",
    postcodeRanges: [
      [2600, 2600], // Canberra CBD, Barton, Capital Hill
      [2601, 2601], // Acton, Black Mountain
      [2602, 2602], // Ainslie, Dickson, Downer, Hackett, Watson
      [2603, 2603], // Forrest, Griffith, Manuka, Red Hill
      [2604, 2604], // Kingston, Narrabundah
      [2605, 2605], // Curtin, Garran, Hughes
      [2606, 2606], // Phillip, Mawson, Farrer
      [2607, 2607], // Deakin, Yarralumla
      [2609, 2609], // Fyshwick, Pialligo
      [2611, 2611], // Weston Creek, Woden Valley (parts)
      [2612, 2612], // Braddon, Turner, Campbell, Reid
      [2614, 2614], // Aranda, Cook, Hawker, Weetangera
      [2615, 2615], // Belconnen, Macquarie, Scullin, Page
      [2617, 2617], // Bruce, Evatt, Giralang, Kaleen
      [2900, 2900], // Tuggeranong, Greenway, Kambah
      [2903, 2906], // Wanniassa, Fadden, Gordon, Bonython, Isabella Plains
      [2912, 2914], // Gungahlin, Harrison, Franklin, Mitchell
    ],
    suburbs: [
      "Canberra", "Canberra CBD", "Barton", "Capital Hill", "Acton",
      "Ainslie", "Dickson", "Downer", "Hackett", "Watson",
      "Forrest", "Griffith", "Manuka", "Red Hill", "Kingston",
      "Narrabundah", "Curtin", "Garran", "Hughes", "Phillip",
      "Mawson", "Farrer", "Deakin", "Yarralumla", "Fyshwick",
      "Weston Creek", "Woden", "Braddon", "Turner", "Campbell", "Reid",
      "Aranda", "Cook", "Hawker", "Weetangera", "Belconnen",
      "Macquarie", "Scullin", "Page", "Bruce", "Evatt",
      "Giralang", "Kaleen", "Tuggeranong", "Greenway", "Kambah",
      "Wanniassa", "Fadden", "Gordon", "Bonython", "Isabella Plains",
      "Gungahlin", "Harrison", "Franklin", "Mitchell", "Casey",
      "Ngunnawal", "Nicholls", "Amaroo", "Palmerston",
      "Weston", "Holder", "Duffy", "Rivett", "Chapman",
    ],
    hardness: 38,
    chlorine: 0.69,
    fluoride: 0.8,
    ph: 7.78,
    pfasRisk: "low",
    usesChloramine: true,
    source: "Icon Water (Corin, Bendora & Cotter Dams — Cotter River catchment)",
    notes: "Canberra's water is soft to moderately soft at 38 mg/L hardness, drawn from pristine mountain catchments west of the city. Icon Water uses chloramine (monochloramine) for disinfection — a catalytic carbon filter is recommended over standard carbon for effective removal. Fluoride is at the target level of 0.8 mg/L.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW SOUTH WALES — REGIONAL
  // ═══════════════════════════════════════════════════════════════════════════
  // ── Sydney Water — Illawarra (Wollongong) ─────────────────────────────────
  {
    key: "sydney-water-illawarra",
    utilityName: "Sydney Water",
    region: "Wollongong & Illawarra",
    state: "NSW",
    postcodeRanges: [
      [2500, 2500], // Wollongong CBD
      [2502, 2502], // Warrawong, Port Kembla
      [2505, 2506], // Unanderra, Figtree, Cordeaux Heights
      [2515, 2515], // Thirroul, Bulli, Austinmer, Coledale
      [2516, 2517], // Helensburgh, Stanwell Park
      [2518, 2518], // Corrimal, Bellambi, Tarrawanna
      [2519, 2519], // Balgownie, Fairy Meadow
      [2520, 2520], // North Wollongong, Wollongong
      [2525, 2525], // Shellharbour, Barrack Heights
      [2526, 2526], // Albion Park, Oak Flats
      [2527, 2527], // Albion Park Rail, Tongarra
      [2528, 2528], // Dapto, Kanahooka, Brownsville
      [2529, 2530], // Horsley, Berkeley, Lake Heights
      [2533, 2534], // Bombo, Kiama, Gerringong
    ],
    suburbs: [
      "Wollongong", "Wollongong CBD", "North Wollongong", "Warrawong",
      "Port Kembla", "Unanderra", "Figtree", "Cordeaux Heights",
      "Thirroul", "Bulli", "Austinmer", "Coledale", "Scarborough",
      "Helensburgh", "Stanwell Park", "Stanwell Tops", "Coalcliff",
      "Corrimal", "Bellambi", "Tarrawanna", "East Corrimal",
      "Balgownie", "Fairy Meadow", "Towradgi", "Fernhill",
      "Shellharbour", "Barrack Heights", "Warilla", "Lake Illawarra",
      "Albion Park", "Oak Flats", "Albion Park Rail",
      "Dapto", "Kanahooka", "Brownsville", "Horsley",
      "Berkeley", "Lake Heights", "Bombo", "Kiama", "Gerringong",
      "Keiraville", "Gwynneville", "Mangerton", "Coniston",
      "West Wollongong", "Mount Keira", "Mount Ousley",
    ],
    hardness: 33,
    chlorine: 1.45,
    fluoride: 1.03,
    ph: 7.8,
    pfasRisk: "low",
    source: "Sydney Water (Avon & Cordeaux Dams — Illawarra catchment)",
    notes: "Wollongong receives Sydney Water supply from the Illawarra catchment. Water is soft at 33 mg/L hardness. Chlorine is on the higher side at 1.45 mg/L — a carbon filter is highly recommended for improved taste and shower comfort. Fluoride is at 1.03 mg/L, within guidelines.",
  },
  // ── Hunter Water — Greater Newcastle ──────────────────────────────────────
  {
    key: "hunter-water-newcastle",
    utilityName: "Hunter Water",
    region: "Greater Newcastle & Hunter Valley",
    state: "NSW",
    postcodeRanges: [
      [2280, 2280], // Belmont, Belmont South
      [2281, 2281], // Swansea, Blacksmiths, Caves Beach
      [2282, 2282], // Warners Bay, Eleebana, Valentine
      [2283, 2284], // Toronto, Morisset, Cooranbong
      [2285, 2285], // Whitebridge, Charlestown, Dudley
      [2286, 2287], // Kotara, Lambton, Jesmond, Waratah
      [2289, 2289], // Adamstown, Merewether
      [2290, 2290], // Charlestown, Kahibah
      [2291, 2291], // Merewether, The Junction
      [2292, 2292], // Broadmeadow, Hamilton
      [2293, 2295], // Maryville, Wickham, Newcastle, Cooks Hill
      [2296, 2296], // Islington, Tighes Hill
      [2297, 2299], // Mayfield, Warabrook, Shortland, Jesmond
      [2300, 2300], // Newcastle CBD, Newcastle East
      [2302, 2305], // Newcastle West, Stockton, Carrington, Tarro, Maitland (parts)
      [2320, 2326], // Maitland, Rutherford, Cessnock, Kurri Kurri
    ],
    suburbs: [
      "Newcastle", "Newcastle CBD", "Newcastle East", "Newcastle West",
      "Belmont", "Belmont South", "Swansea", "Blacksmiths", "Caves Beach",
      "Warners Bay", "Eleebana", "Valentine", "Toronto",
      "Morisset", "Cooranbong", "Whitebridge", "Charlestown", "Dudley",
      "Kotara", "Lambton", "Jesmond", "Waratah", "Adamstown",
      "Merewether", "Kahibah", "The Junction", "Broadmeadow", "Hamilton",
      "Maryville", "Wickham", "Cooks Hill", "Islington", "Tighes Hill",
      "Mayfield", "Warabrook", "Shortland", "Stockton", "Carrington",
      "Maitland", "Rutherford", "Cessnock", "Kurri Kurri",
      "New Lambton", "Bar Beach", "King Edward Park", "The Hill",
      "Wallsend", "Cardiff", "Glendale", "Edgeworth", "Cameron Park",
    ],
    hardness: 30,
    chlorine: 0.78,
    fluoride: 0.93,
    ph: 7.5,
    pfasRisk: "low",
    source: "Hunter Water (Grahamstown Dam & Chichester Dam — Williams River catchment)",
    notes: "Newcastle's water is soft at around 30 mg/L hardness from the Hunter region's dammed catchments. Chlorine is moderate at 0.78 mg/L. Note: Hunter Water occasionally reports earthy/musty taste from a naturally occurring compound (MIB) in the Grahamstown supply — this is harmless but a carbon filter will remove it effectively.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VICTORIA — REGIONAL
  // ═══════════════════════════════════════════════════════════════════════════
  // ── Barwon Water — Greater Geelong ────────────────────────────────────────
  {
    key: "barwon-water-geelong",
    utilityName: "Barwon Water",
    region: "Greater Geelong & Surf Coast",
    state: "VIC",
    postcodeRanges: [
      [3214, 3214], // Corio, Norlane, North Shore
      [3215, 3215], // North Geelong, Bell Park, Bell Post Hill
      [3216, 3216], // Belmont, Grovedale, Highton, Wandana Heights
      [3217, 3217], // Armstrong Creek, Mount Duneed
      [3218, 3218], // Waurn Ponds, Deakin University
      [3219, 3219], // Breakwater, East Geelong, South Geelong
      [3220, 3220], // Geelong, Geelong CBD, Newtown
      [3221, 3221], // Geelong West
      [3222, 3222], // Drysdale, Clifton Springs
      [3223, 3224], // Queenscliff, Barwon Heads, Ocean Grove
      [3225, 3225], // Point Lonsdale
      [3226, 3227], // Leopold, Wallington
      [3228, 3228], // Torquay, Jan Juc
      [3230, 3232], // Anglesea, Aireys Inlet, Lorne
    ],
    suburbs: [
      "Geelong", "Geelong CBD", "Geelong West", "South Geelong",
      "East Geelong", "Newtown", "Chilwell", "Highton", "Belmont",
      "Grovedale", "Waurn Ponds", "Armstrong Creek", "Mount Duneed",
      "Corio", "Norlane", "North Shore", "North Geelong", "Bell Park",
      "Bell Post Hill", "Breakwater", "Drysdale", "Clifton Springs",
      "Queenscliff", "Barwon Heads", "Ocean Grove", "Point Lonsdale",
      "Leopold", "Wallington", "Torquay", "Jan Juc",
      "Anglesea", "Aireys Inlet", "Lorne", "Herne Hill",
      "Hamlyn Heights", "Manifold Heights", "Drumcondra",
      "Whittington", "St Albans Park", "Thomson", "Lovely Banks",
    ],
    hardness: 19,
    chlorine: 0.7,
    fluoride: 0.7,
    ph: 7.4,
    pfasRisk: "low",
    source: "Barwon Water (Wurdee Boluc, West Barwon & Moorabool Reservoirs)",
    notes: "Geelong's water is very soft at just 19 mg/L hardness — no softener needed. Barwon Water draws from protected catchments in the Otway Ranges. Chlorine and fluoride levels are low to moderate. A carbon filter is a good upgrade for taste, especially in summer when chlorine levels may be slightly higher.",
  },
];

// ── Search logic ────────────────────────────────────────────────────────────

export function findUtilityProfile(query: string): (WaterUtilityProfile & { matchedSuburb?: string }) | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const postcode = parseInt(q);

  // 1. Try exact suburb match first (best UX)
  for (const util of WATER_UTILITIES) {
    for (const sub of util.suburbs) {
      if (sub.toLowerCase() === q) {
        return { ...util, matchedSuburb: sub };
      }
    }
  }

  // 2. Try postcode range match
  if (!isNaN(postcode)) {
    for (const util of WATER_UTILITIES) {
      for (const [min, max] of util.postcodeRanges) {
        if (postcode >= min && postcode <= max) {
          return util;
        }
      }
    }
  }

  // 3. Try partial suburb name match
  for (const util of WATER_UTILITIES) {
    for (const sub of util.suburbs) {
      if (sub.toLowerCase().includes(q)) {
        return { ...util, matchedSuburb: sub };
      }
    }
  }

  // 4. Try utility name match
  for (const util of WATER_UTILITIES) {
    if (util.utilityName.toLowerCase().includes(q) || util.region.toLowerCase().includes(q)) {
      return util;
    }
  }

  // 5. Try state abbreviation
  for (const util of WATER_UTILITIES) {
    if (util.state.toLowerCase() === q) {
      return util;
    }
  }

  return null;
}

// ── Autocomplete suggestions ────────────────────────────────────────────────

export interface SuburbSuggestion {
  suburb: string;
  state: string;
  utilityName: string;
  region: string;
}

export function getSuburbSuggestions(query: string, limit = 8): SuburbSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const seen = new Set<string>();
  const results: SuburbSuggestion[] = [];

  // Exact prefix matches first (higher relevance)
  for (const util of WATER_UTILITIES) {
    for (const sub of util.suburbs) {
      const key = `${sub}-${util.key}`;
      if (!seen.has(key) && sub.toLowerCase().startsWith(q)) {
        seen.add(key);
        results.push({ suburb: sub, state: util.state, utilityName: util.utilityName, region: util.region });
      }
    }
  }

  // Then partial matches
  for (const util of WATER_UTILITIES) {
    for (const sub of util.suburbs) {
      const key = `${sub}-${util.key}`;
      if (!seen.has(key) && sub.toLowerCase().includes(q)) {
        seen.add(key);
        results.push({ suburb: sub, state: util.state, utilityName: util.utilityName, region: util.region });
      }
    }
  }

  return results.slice(0, limit);
}
