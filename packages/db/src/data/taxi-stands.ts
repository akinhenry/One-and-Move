export interface TaxiStandData {
  id: string;
  lat: number;
  lng: number;
  name: string;
}

/**
 * Taxi stand / robot-taxi pickup locations.
 */
export const TAXI_STANDS: TaxiStandData[] = [
  { id: "half-way-tree", name: "Half Way Tree Taxi Stand", lat: 18.012, lng: -76.799 },
  { id: "cross-roads", name: "Cross Roads Taxi Stand", lat: 18.006, lng: -76.783 },
  { id: "papine", name: "Papine Taxi Stand", lat: 18.010, lng: -76.740 },
  { id: "liguanea", name: "Liguanea Taxi Stand", lat: 18.020479, lng: -76.769465 },
  { id: "barbican", name: "Barbican Taxi Stand", lat: 18.030, lng: -76.763 },
  { id: "constant-spring", name: "Constant Spring Taxi Stand", lat: 18.049, lng: -76.793 },
  { id: "stony-hill", name: "Stony Hill Taxi Stand", lat: 18.072, lng: -76.783 },
  { id: "red-hills", name: "Red Hills Taxi Stand", lat: 18.072, lng: -76.828 },

  { id: "downtown-kingston", name: "Downtown Kingston Taxi Stand", lat: 17.971, lng: -76.793 },

  { id: "spanish-town", name: "Spanish Town Taxi Stand", lat: 17.991, lng: -76.957 },
  { id: "portmore", name: "Portmore Taxi Stand", lat: 17.950, lng: -76.881 },
  { id: "greater-portmore", name: "Greater Portmore Taxi Stand", lat: 17.950, lng: -76.878 },
  { id: "waterford", name: "Waterford Taxi Stand", lat: 17.962, lng: -76.873 },
  { id: "naggo-head", name: "Naggo Head Taxi Stand", lat: 17.962, lng: -76.895 },
  { id: "braeton", name: "Braeton Taxi Stand", lat: 17.956, lng: -76.872 },
  { id: "linstead", name: "Linstead Taxi Stand", lat: 18.136, lng: -77.031 },
  { id: "old-harbour", name: "Old Harbour Taxi Stand", lat: 17.941, lng: -77.108 },
  { id: "ewarton", name: "Ewarton Taxi Stand", lat: 18.180, lng: -77.082 },
  { id: "bog-walk", name: "Bog Walk Taxi Stand", lat: 18.103, lng: -77.005 },

  { id: "may-pen", name: "May Pen Taxi Stand", lat: 17.965, lng: -77.245 },
  { id: "chapelton", name: "Chapelton Taxi Stand", lat: 18.083, lng: -77.268 },
  { id: "rock-river", name: "Rock River Taxi Stand", lat: 17.989, lng: -77.297 },
  { id: "lionel-town", name: "Lionel Town Taxi Stand", lat: 17.812, lng: -77.239 },
  { id: "frankfield", name: "Frankfield Taxi Stand", lat: 18.157, lng: -77.333 },

  { id: "mandeville", name: "Mandeville Taxi Stand", lat: 18.042, lng: -77.507 },
  { id: "christiana", name: "Christiana Taxi Stand", lat: 18.169, lng: -77.482 },
  { id: "porus", name: "Porus Taxi Stand", lat: 17.893, lng: -77.409 },
  { id: "williamsfield", name: "Williamsfield Taxi Stand", lat: 17.842, lng: -77.465 },

  { id: "montego-bay", name: "Montego Bay Taxi Stand", lat: 18.471, lng: -77.919 },
  { id: "anchovy", name: "Anchovy Taxi Stand", lat: 18.409, lng: -77.931 },
  { id: "cambridge", name: "Cambridge Taxi Stand", lat: 18.313, lng: -77.914 },
  { id: "adelphi", name: "Adelphi Taxi Stand", lat: 18.401, lng: -77.847 },

  { id: "falmouth", name: "Falmouth Taxi Stand", lat: 18.492, lng: -77.656 },
  { id: "clarks-town", name: "Clark's Town Taxi Stand", lat: 18.437, lng: -77.542 },
  { id: "wakefield", name: "Wakefield Taxi Stand", lat: 18.385, lng: -77.611 },

  { id: "savanna-la-mar", name: "Savanna-la-Mar Taxi Stand", lat: 18.218, lng: -78.133 },
  { id: "negril", name: "Negril Taxi Stand", lat: 18.268, lng: -78.348 },
  { id: "whitehouse", name: "Whitehouse Taxi Stand", lat: 18.103, lng: -77.957 },
  { id: "little-london", name: "Little London Taxi Stand", lat: 18.185, lng: -78.040 },

  { id: "ochorios", name: "Ocho Rios Taxi Stand", lat: 18.404, lng: -77.103 },
  { id: "stanns-bay", name: "St Ann's Bay Taxi Stand", lat: 18.435, lng: -77.206 },
  { id: "browns-town", name: "Brown's Town Taxi Stand", lat: 18.360, lng: -77.360 },
  { id: "runaway-bay", name: "Runaway Bay Taxi Stand", lat: 18.459, lng: -77.320 },
  { id: "claremont", name: "Claremont Taxi Stand", lat: 18.341, lng: -77.160 },
  { id: "moneague", name: "Moneague Taxi Stand", lat: 18.274, lng: -77.113 },

  { id: "port-antonio", name: "Port Antonio Taxi Stand", lat: 18.176, lng: -76.450 },
  { id: "buff-bay", name: "Buff Bay Taxi Stand", lat: 18.231, lng: -76.661 },
  { id: "hope-bay", name: "Hope Bay Taxi Stand", lat: 18.190, lng: -76.570 },
  { id: "manchioneal", name: "Manchioneal Taxi Stand", lat: 18.042, lng: -76.277 },

  { id: "port-maria", name: "Port Maria Taxi Stand", lat: 18.369, lng: -76.890 },
  { id: "annotto-bay", name: "Annotto Bay Taxi Stand", lat: 18.274, lng: -76.766 },
  { id: "highgate", name: "Highgate Taxi Stand", lat: 18.277, lng: -76.899 },
  { id: "oracabessa", name: "Oracabessa Taxi Stand", lat: 18.404, lng: -76.946 },

  { id: "black-river", name: "Black River Taxi Stand", lat: 18.026, lng: -77.848 },
  { id: "santa-cruz", name: "Santa Cruz Taxi Stand", lat: 18.053, lng: -77.698 },
  { id: "lacovia", name: "Lacovia Taxi Stand", lat: 18.072, lng: -77.753 },
  { id: "malvern", name: "Malvern Taxi Stand", lat: 17.966, lng: -77.695 },

  { id: "lucea", name: "Lucea Taxi Stand", lat: 18.441, lng: -78.173 },
  { id: "green-island", name: "Green Island Taxi Stand", lat: 18.391, lng: -78.272 },
  { id: "sandy-bay", name: "Sandy Bay Taxi Stand", lat: 18.450, lng: -78.085 },

  { id: "morant-bay", name: "Morant Bay Taxi Stand", lat: 17.882, lng: -76.409 },
  { id: "yallahs", name: "Yallahs Taxi Stand", lat: 17.878, lng: -76.563 },
  { id: "seaforth", name: "Seaforth Taxi Stand", lat: 17.940, lng: -76.456 }
];

/** Quick lookup by stand ID */
export const TAXI_STAND_MAP = new Map(TAXI_STANDS.map((s) => [s.id, s]));