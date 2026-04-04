// ── Water utility profiles & suburb-to-utility mappings ──────────────────────
// Data sourced from state water authority annual reports 2023–24

export interface WaterUtilityProfile {
  key: string;
  utilityName: string;
  region: string;
  state: string;
  postcodeRanges: [number, number][];
  suburbs: string[]; // common suburb names for text search
  hardness: number;
  chlorine: number;
  fluoride: number;
  ph: number;
  pfasRisk: "low" | "moderate" | "elevated";
  source: string;
  notes: string;
}

export const WATER_UTILITIES: WaterUtilityProfile[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // VICTORIA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    key: "yvw",
    utilityName: "Yarra Valley Water",
    region: "Melbourne — North & East",
    state: "VIC",
    postcodeRanges: [
      [3000, 3008], // CBD
      [3051, 3058], // Inner north (Carlton, Fitzroy, Collingwood)
      [3065, 3079], // Fitzroy North, Northcote, Thornbury, Preston
      [3081, 3097], // Ivanhoe, Bundoora, Mill Park, South Morang
      [3101, 3116], // Kew, Balwyn, Doncaster, Templestowe
      [3121, 3138], // Richmond, Hawthorn, Camberwell, Box Hill, Ringwood
      [3140, 3140], // Lilydale
      [3148, 3156], // Syndal, Glen Waverley (parts), Ferntree Gully
      [3750, 3767], // Epping, South Morang, Mernda, Whittlesea, Doreen
      [3770, 3787], // Coldstream, Yarra Glen, Healesville, Mt Evelyn
      [3795, 3797], // Belgrave, Emerald, Cockatoo
    ],
    suburbs: [
      "Melbourne CBD", "Carlton", "Fitzroy", "Collingwood", "Richmond",
      "Northcote", "Thornbury", "Preston", "Reservoir", "Bundoora",
      "Mill Park", "South Morang", "Epping", "Mernda", "Doreen",
      "Whittlesea", "Kew", "Balwyn", "Doncaster", "Templestowe",
      "Hawthorn", "Camberwell", "Box Hill", "Ringwood", "Croydon",
      "Lilydale", "Healesville", "Glen Waverley", "Ferntree Gully",
      "Belgrave", "Ivanhoe", "Heidelberg", "Greensborough", "Eltham",
      "Diamond Creek", "Hurstbridge",
    ],
    hardness: 25,
    chlorine: 0.8,
    fluoride: 0.9,
    ph: 7.4,
    pfasRisk: "low",
    source: "Silvan, Upper Yarra & Maroondah Reservoirs",
    notes: "Yarra Valley Water supplies some of Australia's softest water, drawn from protected mountain catchments. No softener needed. Chlorine is moderate — a whole house carbon filter is the most popular upgrade for taste and shower comfort.",
  },
  {
    key: "sew",
    utilityName: "South East Water",
    region: "Melbourne — South & Southeast",
    state: "VIC",
    postcodeRanges: [
      [3141, 3146], // South Yarra, Prahran, Malvern
      [3161, 3186], // Caulfield, Carnegie, Bentleigh, Brighton, Sandringham
      [3188, 3207], // Hampton, Cheltenham, Moorabbin, Mordialloc, Chelsea, Frankston
      [3800, 3810], // Monash Uni area, Berwick, Narre Warren
      [3910, 3920], // Langwarrin, Frankston South, Cranbourne
      [3930, 3945], // Mornington, Mt Martha, Rosebud, Rye, Sorrento
      [3158, 3160], // Upwey, Belgrave South
      [3802, 3806], // Endeavour Hills, Hallam, Berwick
      [3175, 3178], // Dandenong, Keysborough, Rowville
    ],
    suburbs: [
      "South Yarra", "Prahran", "St Kilda", "Brighton", "Sandringham",
      "Malvern", "Caulfield", "Carnegie", "Bentleigh", "Moorabbin",
      "Cheltenham", "Mordialloc", "Chelsea", "Frankston", "Mornington",
      "Mt Martha", "Rosebud", "Rye", "Sorrento", "Cranbourne",
      "Narre Warren", "Berwick", "Dandenong", "Keysborough", "Rowville",
      "Endeavour Hills", "Hallam", "Hampton", "Bayside",
    ],
    hardness: 30,
    chlorine: 0.8,
    fluoride: 0.9,
    ph: 7.4,
    pfasRisk: "low",
    source: "Cardinia & Tarago Reservoirs",
    notes: "South East Water draws from Cardinia and Tarago reservoirs — soft, high-quality water. Chlorine is moderate and a carbon filter addresses taste and skin comfort. No scale issues in this area.",
  },
  {
    key: "gww",
    utilityName: "Greater Western Water",
    region: "Melbourne — West & Northwest",
    state: "VIC",
    postcodeRanges: [
      [3011, 3032], // Footscray, Yarraville, Seddon, Williamstown, Altona, Sunshine, St Albans
      [3033, 3038], // Keilor, Tullamarine, Airport West, Gladstone Park
      [3020, 3025], // Albion, Sunshine, Deer Park
      [3335, 3340], // Rockbank, Melton, Bacchus Marsh
      [3427, 3430], // Roxburgh Park, Craigieburn
      [3037, 3038], // Hillside, Sydenham, Taylors Lakes
      [3060, 3064], // Fawkner, Coburg North, Craigieburn (parts)
      [3428, 3442], // Sunbury, Gisborne, Romsey, Lancefield
    ],
    suburbs: [
      "Footscray", "Yarraville", "Seddon", "Williamstown", "Altona",
      "Sunshine", "St Albans", "Deer Park", "Keilor", "Tullamarine",
      "Airport West", "Gladstone Park", "Hillside", "Sydenham",
      "Taylors Lakes", "Melton", "Bacchus Marsh", "Rockbank",
      "Werribee", "Point Cook", "Hoppers Crossing", "Wyndham Vale",
      "Tarneit", "Truganina", "Roxburgh Park", "Craigieburn",
      "Sunbury", "Gisborne", "Fawkner", "Broadmeadows",
    ],
    hardness: 38,
    chlorine: 1.0,
    fluoride: 0.9,
    ph: 7.2,
    pfasRisk: "low",
    source: "Sugarloaf, Greenvale & Rosslynne Reservoirs",
    notes: "Greater Western Water serves Melbourne's growing western corridor. Water is soft but chlorine is slightly higher due to longer distribution networks. A whole house carbon filter is strongly recommended for this area, especially for families with young children or skin sensitivities.",
  },
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
      "Sydney CBD", "Surry Hills", "Paddington", "Darlinghurst", "Potts Point",
      "Bondi", "Bondi Junction", "Randwick", "Coogee", "Maroubra",
      "Newtown", "Enmore", "Marrickville", "Redfern", "Waterloo",
      "North Sydney", "Crows Nest", "Neutral Bay", "Mosman",
      "Chatswood", "Willoughby",
    ],
    hardness: 49,
    chlorine: 0.6,
    fluoride: 1.0,
    ph: 7.5,
    pfasRisk: "low",
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
    ],
    hardness: 54,
    chlorine: 0.7,
    fluoride: 1.0,
    ph: 7.5,
    pfasRisk: "low",
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
    ],
    hardness: 37,
    chlorine: 0.5,
    fluoride: 1.0,
    ph: 7.6,
    pfasRisk: "low",
    source: "Warringah WFP & North Head",
    notes: "The Northern Beaches and Upper North Shore enjoy some of Sydney's softest water with lower chlorine levels. Excellent water quality — filtration is mostly a preference for taste and purity.",
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
    ],
    hardness: 45,
    chlorine: 0.6,
    fluoride: 1.0,
    ph: 7.5,
    pfasRisk: "low",
    source: "Prospect WFP (Warragamba Dam)",
    notes: "The Sutherland Shire and southern Sydney receive soft water from the Warragamba catchment. Good quality — carbon filter for chlorine taste.",
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
      "Winmalee", "Hazelbrook",
    ],
    hardness: 32,
    chlorine: 0.6,
    fluoride: 1.0,
    ph: 7.5,
    pfasRisk: "moderate",
    source: "Cascade WFP",
    notes: "Blue Mountains water is very soft but PFAS was elevated at Cascade WFP in 2024 — now within updated 2025 guidelines. For households concerned about PFAS, a reverse osmosis system provides the best protection.",
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
      "Newcastle", "Maitland", "Cessnock", "Singleton", "Charlestown",
      "Lambton", "Hamilton", "Merewether", "The Junction", "Adamstown",
      "Raymond Terrace", "Nelson Bay", "Port Stephens",
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
      "Wollongong", "Fairy Meadow", "Thirroul", "Bulli", "Corrimal",
      "Figtree", "Unanderra", "Shellharbour", "Kiama", "Dapto",
    ],
    hardness: 38,
    chlorine: 0.5,
    fluoride: 1.0,
    ph: 7.5,
    pfasRisk: "low",
    source: "Illawarra WFP (Avon & Cordeaux Dams)",
    notes: "Illawarra receives soft water from mountain catchments. Very good quality. A carbon filter is a nice-to-have for taste.",
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
      "Brisbane CBD", "Fortitude Valley", "South Brisbane", "West End",
      "New Farm", "Teneriffe", "Paddington", "Bardon", "The Gap",
      "Ashgrove", "Woolloongabba", "Annerley", "Sunnybank",
      "Eight Mile Plains", "Coorparoo", "Camp Hill", "Mt Gravatt",
      "Carindale", "Bulimba", "Hawthorne", "Chermside", "Nundah",
      "Kedron", "Stafford", "Aspley",
    ],
    hardness: 115,
    chlorine: 1.1,
    fluoride: 0.85,
    ph: 7.8,
    pfasRisk: "low",
    source: "Wivenhoe Dam / North Pine Dam via Seqwater",
    notes: "Brisbane has moderately hard water with higher chlorine. Seasonal earthy/musty taste after rain is naturally occurring. A whole house carbon filter addresses chlorine taste — add scale-reduction if you notice buildup in kettles.",
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
    ],
    hardness: 120,
    chlorine: 1.1,
    fluoride: 0.85,
    ph: 7.8,
    pfasRisk: "low",
    source: "Wivenhoe / Somerset Dams via Seqwater",
    notes: "Ipswich and Logan receive moderately hard water from the Wivenhoe system. Scale-reduction filter recommended for appliances. Whole house carbon for chlorine taste.",
  },
  {
    key: "unity-water",
    utilityName: "Unitywater",
    region: "Sunshine Coast & Moreton Bay",
    state: "QLD",
    postcodeRanges: [
      [4500, 4521], // Brendale, Strathpine, Petrie, Caboolture, Morayfield
      [4550, 4575], // Maroochydore, Noosa, Caloundra, Mooloolaba, Buderim
    ],
    suburbs: [
      "Maroochydore", "Noosa", "Caloundra", "Mooloolaba", "Buderim",
      "Nambour", "Coolum Beach", "Peregian Beach", "Sippy Downs",
      "Caboolture", "Morayfield", "North Lakes", "Redcliffe",
      "Strathpine", "Petrie", "Brendale",
    ],
    hardness: 90,
    chlorine: 0.9,
    fluoride: 0.85,
    ph: 7.7,
    pfasRisk: "low",
    source: "Baroon Pocket Dam / North Pine Dam via Seqwater",
    notes: "Unitywater serves the Sunshine Coast and Moreton Bay regions with moderate hardness water. Carbon filter for chlorine taste — scale-reduction is optional but helpful for kettles.",
  },
  {
    key: "gold-coast-water",
    utilityName: "Gold Coast Water",
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
    ],
    hardness: 34,
    chlorine: 0.8,
    fluoride: 0.85,
    ph: 7.6,
    pfasRisk: "low",
    source: "Hinze Dam",
    notes: "Gold Coast water is much softer than Brisbane thanks to the Hinze Dam source. No scale issues. A carbon filter for chlorine taste is the main upgrade most families consider.",
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
      [4868, 4879], // Cairns, Cairns North, Edge Hill, Smithfield
    ],
    suburbs: [
      "Cairns", "Cairns North", "Edge Hill", "Smithfield", "Trinity Beach",
      "Palm Cove", "Yorkeys Knob", "Gordonvale",
    ],
    hardness: 55,
    chlorine: 0.7,
    fluoride: 0.7,
    ph: 7.5,
    pfasRisk: "low",
    source: "Copperlode Dam",
    notes: "Cairns has soft water from the Copperlode Dam catchment. Good quality — a carbon filter is a nice-to-have for taste.",
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
      "Nedlands", "Dalkeith", "Peppermint Grove",
    ],
    hardness: 135,
    chlorine: 0.8,
    fluoride: 0.75,
    ph: 7.6,
    pfasRisk: "low",
    source: "Mixed: Perth Seawater Desalination Plant + Mundaring Weir",
    notes: "Central Perth receives a mix of desalinated and dam water. Moderately hard — scale buildup on taps and appliances is common. Whole house carbon + scale-reduction filter is the recommended setup.",
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
      "Morley", "Bayswater", "Maylands", "Caversham",
    ],
    hardness: 210,
    chlorine: 0.9,
    fluoride: 0.75,
    ph: 7.4,
    pfasRisk: "low",
    source: "Gnangara Mound groundwater",
    notes: "Perth's northern suburbs have some of the hardest water in Australia at 200+ mg/L from the Gnangara Mound aquifer. White scale on everything — shower screens, taps, kettles. A water softener is strongly recommended, plus RO for drinking water.",
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
      "Fremantle", "Cockburn", "Rockingham", "Mandurah", "Canning Vale",
      "Thornlie", "Gosnells", "Armadale", "Victoria Park", "Cannington",
      "South Perth", "Como", "Riverton", "Bull Creek", "Murdoch",
      "Bibra Lake", "Success", "Atwell", "Spearwood",
    ],
    hardness: 110,
    chlorine: 0.7,
    fluoride: 0.75,
    ph: 7.7,
    pfasRisk: "low",
    source: "Perth Seawater Desalination Plant / Serpentine Dam",
    notes: "Perth's southern suburbs get more desalinated water, resulting in softer water than the north. Moderately hard — scale-reduction filter recommended. Carbon filter for chlorine taste.",
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
      "Glen Forrest", "Parkerville",
    ],
    hardness: 155,
    chlorine: 0.8,
    fluoride: 0.75,
    ph: 7.5,
    pfasRisk: "low",
    source: "Mundaring Weir / Victoria Dam",
    notes: "Perth's eastern hills receive dam water from Mundaring Weir. Hard water — scale is a common complaint. Whole house filter with scale-reduction or a water softener is recommended.",
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
      "Meadow Springs",
    ],
    hardness: 90,
    chlorine: 0.7,
    fluoride: 0.75,
    ph: 7.7,
    pfasRisk: "low",
    source: "Perth Seawater Desalination Plant / Serpentine Dam",
    notes: "Mandurah is moderately soft for WA. Less scale than Perth's northern suburbs. Carbon filter for chlorine taste is the main upgrade.",
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
    hardness: 125,
    chlorine: 1.3,
    fluoride: 0.6,
    ph: 7.6,
    pfasRisk: "low",
    source: "Happy Valley Reservoir / Murray River blend",
    notes: "Adelaide has Australia's highest chlorine levels and hard water from Murray River blending. Strong chlorine taste is common. A whole house carbon filter is the single most impactful upgrade for SA homes — it transforms the taste, and many families notice softer skin and hair immediately.",
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
    hardness: 138,
    chlorine: 1.5,
    fluoride: 0.6,
    ph: 7.5,
    pfasRisk: "low",
    source: "Murray River / Happy Valley Reservoir",
    notes: "Northern Adelaide has the hardest water and highest chlorine in the city. Scale in kettles and on shower screens is severe. A water softener + whole house carbon filter is the recommended combination for this area.",
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
      "Morphett Vale", "Noarlunga", "Reynella", "Seaford", "Aldinga",
      "McLaren Vale", "Christies Beach", "Hackham", "Mitcham",
      "Blackwood", "Aberfoyle Park", "Happy Valley",
    ],
    hardness: 115,
    chlorine: 1.2,
    fluoride: 0.6,
    ph: 7.7,
    pfasRisk: "low",
    source: "Myponga Reservoir",
    notes: "Southern Adelaide is slightly softer than the north, using Myponga Reservoir water treated with chloramine. Carbon filter recommended for taste — scale-reduction helpful for appliances.",
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
    hardness: 95,
    chlorine: 1.0,
    fluoride: 0.6,
    ph: 7.6,
    pfasRisk: "low",
    source: "Mount Lofty Ranges reservoirs (Mount Bold, Kangaroo Creek)",
    notes: "Adelaide Hills has the softest water in the Adelaide metro area from local mountain catchments. Better taste than other SA zones. Chloramine treatment — carbon filter for preference.",
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
    hardness: 115,
    chlorine: 1.2,
    fluoride: 0.6,
    ph: 7.7,
    pfasRisk: "low",
    source: "Murray River blend / Happy Valley Reservoir",
    notes: "Western Adelaide beaches and Port Adelaide area receive Murray River blended water. Some coastal areas notice a slightly brackish taste from Murray salinity. Carbon filter + scale-reduction for best results.",
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
      "Hobart", "Sandy Bay", "Battery Point", "Glenorchy", "Moonah",
      "Kingston", "Blackmans Bay", "Howrah", "Bellerive", "Lindisfarne",
      "Claremont", "New Town", "Lenah Valley",
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
      "Launceston", "Riverside", "Prospect", "Legana", "Newnham",
      "Mowbray", "Kings Meadows", "Youngtown",
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
      "Curtin", "Hughes", "Garran", "Narrabundah",
    ],
    hardness: 45,
    chlorine: 0.6,
    fluoride: 1.0,
    ph: 7.4,
    pfasRisk: "moderate",
    source: "Googong & Cotter Reservoirs",
    notes: "Canberra has soft, good-quality water from mountain reservoirs. PFAS monitoring is ongoing near defence and industrial sites — current levels within guidelines. For PFAS-concerned households, a reverse osmosis system provides the best protection.",
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
      [800, 832], // Darwin, Palmerston, Howard Springs
    ],
    suburbs: [
      "Darwin", "Darwin CBD", "Palmerston", "Howard Springs",
      "Stuart Park", "Fannie Bay", "Parap", "Nightcliff",
      "Rapid Creek", "Casuarina", "Millner", "Berrimah",
    ],
    hardness: 75,
    chlorine: 0.7,
    fluoride: 0.0,
    ph: 7.3,
    pfasRisk: "low",
    source: "Darwin River Dam / Howard Springs",
    notes: "The Northern Territory does NOT fluoridate its water supply. Moderate hardness. Good quality overall — carbon filter for taste preference. If fluoride-free water is important to you, Darwin already has it.",
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
