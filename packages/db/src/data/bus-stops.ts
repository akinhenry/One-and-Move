export interface BusStopData {
  address: string;
  id: string;
  lat: number;
  lng: number;
  name: string;
  /** Route numbers that serve this stop */
  routeIds: string[];
}

/**
 * Key JUTC bus stops / transport hubs in the Kingston Metropolitan Area
 * and major towns served by JUTC rural routes.
 * Coordinates are approximate.
 */
export const BUS_STOPS: BusStopData[] = [
  // ── Kingston Metropolitan Area ────────────────────
  {
    id: "hwt",
    name: "Half Way Tree Transport Centre",
    address: "Half Way Tree Rd, Kingston 10",
    lat: 18.0126,
    lng: -76.7983,
    routeIds: [
      "19",
      "20C",
      "3C",
      "52B",
      "508",
      "513",
      "520Ex",
      "620Ex",
      "135",
      "311",
      "310",
      "309",
    ],
  },
  {
    id: "downtown",
    name: "Downtown Kingston (Parade)",
    address: "King Street / South Parade, Kingston",
    lat: 17.9714,
    lng: -76.7936,
    routeIds: ["20C", "3C", "13", "513", "610", "702", "606Ex"],
  },
  {
    id: "crossroads",
    name: "Cross Roads",
    address: "Cross Roads, Kingston 5",
    lat: 18.0069,
    lng: -76.7868,
    routeIds: ["135", "311", "310", "309"],
  },
  {
    id: "papine",
    name: "Papine Square",
    address: "Papine, Kingston 7",
    lat: 18.0196,
    lng: -76.7381,
    routeIds: ["19"],
  },
  {
    id: "uwi-mona",
    name: "UWI Mona Front Gate",
    address: "UWI Mona Campus, Kingston 7",
    lat: 18.0057,
    lng: -76.7497,
    routeIds: ["19", "508"],
  },
  {
    id: "new-kingston",
    name: "New Kingston (Knutsford Blvd)",
    address: "Knutsford Boulevard, Kingston 5",
    lat: 18.0079,
    lng: -76.7844,
    routeIds: ["135"],
  },
  {
    id: "three-miles",
    name: "Three Miles",
    address: "Spanish Town Road, Three Miles",
    lat: 17.9875,
    lng: -76.8125,
    routeIds: ["20C", "3C", "513", "606Ex"],
  },
  {
    id: "six-miles",
    name: "Six Miles",
    address: "Spanish Town Road, Six Miles",
    lat: 17.9825,
    lng: -76.8325,
    routeIds: ["513"],
  },
  {
    id: "constant-spring",
    name: "Constant Spring",
    address: "Constant Spring Rd, Kingston 8",
    lat: 18.035,
    lng: -76.796,
    routeIds: [],
  },
  {
    id: "liguanea",
    name: "Liguanea",
    address: "Liguanea Plaza, Kingston 6",
    lat: 18.02046475,
    lng: -76.7693434,
    routeIds: [],
  },
  {
    id: "cmu",
    name: "Caribbean Maritime University",
    address: "Palisadoes, Kingston",
    lat: 17.9402,
    lng: -76.7735,
    routeIds: ["13"],
  },
  {
    id: "stony-hill",
    name: "Stony Hill",
    address: "Stony Hill, St. Andrew",
    lat: 18.0485,
    lng: -76.7716,
    routeIds: ["52B"],
  },
  {
    id: "bull-bay",
    name: "Bull Bay",
    address: "Bull Bay, St. Andrew",
    lat: 17.9536,
    lng: -76.7183,
    routeIds: ["702"],
  },

  // ── Greater Portmore ──────────────────────────────
  {
    id: "portmore-mall",
    name: "Portmore Mall",
    address: "Portmore, St. Catherine",
    lat: 17.9558,
    lng: -76.8803,
    routeIds: ["19", "20C", "3C", "13", "9"],
  },
  {
    id: "braeton",
    name: "Braeton",
    address: "Braeton, Portmore",
    lat: 17.9563,
    lng: -76.8721,
    routeIds: ["9", "311", "310", "309"],
  },

  // ── Spanish Town & St. Catherine ──────────────────
  {
    id: "spanish-town",
    name: "Spanish Town Transport Centre",
    address: "Spanish Town, St. Catherine",
    lat: 17.9915,
    lng: -76.9548,
    routeIds: ["9", "27", "501", "508", "509", "510", "511", "605", "606Ex"],
  },
  {
    id: "kitson-town",
    name: "Kitson Town",
    address: "Kitson Town, St. Catherine",
    lat: 18.0245,
    lng: -76.972,
    routeIds: ["27"],
  },

  // ── Clarendon / May Pen ───────────────────────────
  {
    id: "may-pen",
    name: "May Pen Transport Centre",
    address: "May Pen, Clarendon",
    lat: 17.9716,
    lng: -77.2437,
    routeIds: ["501", "502", "504", "511", "512", "513"],
  },
  {
    id: "old-harbour",
    name: "Old Harbour",
    address: "Old Harbour, St. Catherine",
    lat: 17.9402,
    lng: -77.1076,
    routeIds: ["501", "508", "509", "510"],
  },
  {
    id: "lionel-town",
    name: "Lionel Town",
    address: "Lionel Town, Clarendon",
    lat: 17.8788,
    lng: -77.2057,
    routeIds: ["502"],
  },
  {
    id: "denbigh",
    name: "Denbigh",
    address: "Denbigh, Clarendon",
    lat: 17.9608,
    lng: -77.256,
    routeIds: ["501", "502"],
  },
  {
    id: "chapelton",
    name: "Chapelton",
    address: "Chapelton, Clarendon",
    lat: 18.0752,
    lng: -77.266,
    routeIds: ["504"],
  },
  {
    id: "longville-park",
    name: "Longville Park",
    address: "Longville Park, Clarendon",
    lat: 17.947,
    lng: -77.15,
    routeIds: ["509"],
  },

  // ── Mandeville ────────────────────────────────────
  {
    id: "mandeville",
    name: "Mandeville Transport Centre",
    address: "Mandeville, Manchester",
    lat: 18.0416,
    lng: -77.5035,
    routeIds: ["512"],
  },

  // ── Linstead / St. Catherine North ────────────────
  {
    id: "linstead",
    name: "Linstead",
    address: "Linstead, St. Catherine",
    lat: 18.1607,
    lng: -77.0305,
    routeIds: ["605", "606Ex"],
  },
  {
    id: "bog-walk",
    name: "Bog Walk",
    address: "Bog Walk, St. Catherine",
    lat: 18.0997,
    lng: -76.9978,
    routeIds: ["605"],
  },

  // ── North Coast ───────────────────────────────────
  {
    id: "ocho-rios",
    name: "Ocho Rios Transport Centre",
    address: "Ocho Rios, St. Ann",
    lat: 18.4043,
    lng: -77.1078,
    routeIds: ["610"],
  },
  {
    id: "montego-bay",
    name: "Montego Bay Transport Centre",
    address: "Montego Bay, St. James",
    lat: 18.4712,
    lng: -77.9218,
    routeIds: ["620Ex"],
  },

  // ── South Coast / Negril ──────────────────────────
  {
    id: "negril",
    name: "Negril",
    address: "Negril, Westmoreland",
    lat: 18.268,
    lng: -78.3475,
    routeIds: ["520Ex"],
  },

  // ── St. Thomas ────────────────────────────────────
  {
    id: "morant-bay",
    name: "Morant Bay",
    address: "Morant Bay, St. Thomas",
    lat: 17.8811,
    lng: -76.4095,
    routeIds: ["702"],
  },
  {
    id: "yallahs",
    name: "Yallahs",
    address: "Yallahs, St. Thomas",
    lat: 17.8782,
    lng: -76.5718,
    routeIds: ["702"],
  },
];

/** Quick lookup by stop ID */
export const BUS_STOP_MAP = new Map(BUS_STOPS.map((s) => [s.id, s]));
