/**
 * Transit simulation engine.
 *
 * Drives simulated JUTC buses and route taxis along real route paths
 * built from bus-stop coordinates, plus a movable "demo user" location.
 *
 * Configurable per-vehicle: speed factor, lateness, randomness (jitter).
 */

import { BUS_STOPS } from "@One-and-Move/db/data/bus-stops";
import { TAXI_STANDS } from "@One-and-Move/db/data/taxi-stands";

/* ─── Types ─────────────────────────────────────── */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface SimulatedVehicle {
  /** Average cost string */
  avgCost: string;
  /** Capacity */
  capacity: number;
  /** Direction: 1 = forward along waypoints, -1 = reverse */
  direction: 1 | -1;
  /** Current heading in degrees (0 = north, 90 = east) */
  heading: number;
  /** Unique id */
  id: string;
  /** Current interpolated position */
  lat: number;
  lng: number;
  /** Display name */
  name: string;
  /** 0-1 progress through the route */
  progress: number;
  /** JUTC route number or taxi route label */
  route: string;
  /** Speed multiplier – 1 = normal, <1 = slower/late, >1 = faster */
  speedFactor: number;
  /** "jutc" | "robot_taxi" */
  type: "jutc" | "robot_taxi";
  /** Ordered waypoints the vehicle follows (loop) */
  waypoints: LatLng[];
}

export interface SimulatedUser {
  enabled: boolean;
  lat: number;
  lng: number;
  progress: number;
  speed: number; // km per tick-second
  /** If set, user moves along these waypoints automatically */
  waypoints: LatLng[];
}

export interface SimulationConfig {
  /** Global speed multiplier (default 1) */
  globalSpeed: number;
  /** 0-1, chance a vehicle will randomly slow down for "lateness" */
  latenessChance: number;
  /** Speed factor applied when a vehicle is "late" */
  latenessSpeedFactor: number;
  /** 0-1, random positional jitter added each tick */
  randomness: number;
  /** Whether simulation is running */
  running: boolean;
  /** Tick interval in ms */
  tickInterval: number;
}

/* ─── Utility functions ─────────────────────────── */

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/** Haversine distance in km between two points */
function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = (b.lat - a.lat) * DEG_TO_RAD;
  const dLng = (b.lng - a.lng) * DEG_TO_RAD;
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLng = Math.sin(dLng / 2);
  const h =
    sinHalfLat * sinHalfLat +
    Math.cos(a.lat * DEG_TO_RAD) *
    Math.cos(b.lat * DEG_TO_RAD) *
    sinHalfLng *
    sinHalfLng;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Bearing from a → b in degrees (0 = north, clockwise) */
function bearing(a: LatLng, b: LatLng): number {
  const dLng = (b.lng - a.lng) * DEG_TO_RAD;
  const y = Math.sin(dLng) * Math.cos(b.lat * DEG_TO_RAD);
  const x =
    Math.cos(a.lat * DEG_TO_RAD) * Math.sin(b.lat * DEG_TO_RAD) -
    Math.sin(a.lat * DEG_TO_RAD) *
    Math.cos(b.lat * DEG_TO_RAD) *
    Math.cos(dLng);
  return (Math.atan2(y, x) * RAD_TO_DEG + 360) % 360;
}

/** Compute total path distance in km for an ordered array of waypoints */
function pathDistanceKm(waypoints: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    total += haversineKm(waypoints[i - 1], waypoints[i]);
  }
  return total;
}

/** Linearly interpolate along a polyline by normalised progress (0-1) */
function interpolateAlongPath(
  waypoints: LatLng[],
  progress: number
): { position: LatLng; heading: number } {
  if (waypoints.length === 0) {
    return { position: { lat: 0, lng: 0 }, heading: 0 };
  }
  if (waypoints.length === 1) {
    return { position: waypoints[0], heading: 0 };
  }

  const totalDist = pathDistanceKm(waypoints);
  const targetDist = progress * totalDist;

  let accumulated = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const segDist = haversineKm(waypoints[i - 1], waypoints[i]);
    if (accumulated + segDist >= targetDist) {
      const segProgress =
        segDist > 0 ? (targetDist - accumulated) / segDist : 0;
      const lat =
        waypoints[i - 1].lat +
        (waypoints[i].lat - waypoints[i - 1].lat) * segProgress;
      const lng =
        waypoints[i - 1].lng +
        (waypoints[i].lng - waypoints[i - 1].lng) * segProgress;
      const hdg = bearing(waypoints[i - 1], waypoints[i]);
      return { position: { lat, lng }, heading: hdg };
    }
    accumulated += segDist;
  }

  // Clamp to end
  const last = waypoints[waypoints.length - 1];
  const prev = waypoints[waypoints.length - 2];
  return { position: last, heading: bearing(prev, last) };
}

/* ─── Route path builders ───────────────────────── */

/**
 * Use the OSRM public demo server to snap a list of coordinates to
 * real road geometry. Returns a dense polyline that follows streets.
 *
 * Falls back to straight-line waypoints if the fetch fails (offline, etc.).
 */
async function fetchRoadGeometry(coords: LatLng[]): Promise<LatLng[]> {
  if (coords.length < 2) return coords;

  // OSRM expects lng,lat semicolon-separated
  const coordStr = coords.map((c) => `${c.lng},${c.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) return coords;
    const json = await res.json();
    const geometry = json?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(geometry) || geometry.length < 2) return coords;

    // GeoJSON coordinates are [lng, lat]
    return geometry.map(([lng, lat]: [number, number]) => ({ lat, lng }));
  } catch {
    return coords;
  }
}

/**
 * Build an ordered waypoint path for a JUTC route by collecting
 * bus stops whose routeIds include that route number, then sorting
 * them geographically (southernmost first, roughly Kingston → outbound).
 * Returns straight-line fallback; call resolveRoadPaths() afterwards
 * to upgrade to road-snapped geometry.
 */
function buildBusRoutePath(routeId: string): LatLng[] {
  const stops = BUS_STOPS.filter((s) => s.routeIds.includes(routeId));
  if (stops.length < 2) return [];

  // Sort south-to-north (ascending lat) so downtown Kingston is first
  const sorted = [...stops].sort((a, b) => a.lat - b.lat);
  return sorted.map((s) => ({ lat: s.lat, lng: s.lng }));
}

/**
 * Build a taxi route path between two taxi stands.
 * Returns straight-line fallback; call resolveRoadPaths() afterwards
 * to upgrade to road-snapped geometry.
 */
function buildTaxiRoutePath(
  fromStand: { lat: number; lng: number },
  toStand: { lat: number; lng: number }
): LatLng[] {
  return [
    { lat: fromStand.lat, lng: fromStand.lng },
    { lat: toStand.lat, lng: toStand.lng },
  ];
}

/**
 * Upgrade all vehicle waypoints from straight lines to road-snapped
 * polylines using OSRM. Call once after createSimulatedVehicles().
 * Mutates the vehicles in-place and returns them.
 */
export async function resolveRoadPaths(
  vehicles: SimulatedVehicle[]
): Promise<SimulatedVehicle[]> {
  const results = await Promise.allSettled(
    vehicles.map(async (v) => {
      const snapped = await fetchRoadGeometry(v.waypoints);
      v.waypoints = snapped;
      // Re-interpolate current position on the new path
      const { position, heading: hdg } = interpolateAlongPath(
        snapped,
        v.progress
      );
      v.lat = position.lat;
      v.lng = position.lng;
      v.heading = hdg;
    })
  );
  // Silently ignore per-vehicle failures; they keep straight-line paths
  return vehicles;
}

/* ─── Pre-defined simulation routes ─────────────── */

/** Popular JUTC bus routes with enough bus stops to build meaningful paths */
const POPULAR_BUS_ROUTES = [
  { routeId: "20C", name: "JUTC Bus 20C", label: "Portmore → Downtown" },
  { routeId: "19", name: "JUTC Bus 19", label: "Portmore → Papine/UWI" },
  { routeId: "3C", name: "JUTC Bus 3C", label: "Portmore → Downtown" },
  { routeId: "13", name: "JUTC Bus 13", label: "Portmore → CMU" },
  { routeId: "513", name: "JUTC Bus 513", label: "May Pen → Downtown" },
  { routeId: "702", name: "JUTC Bus 702", label: "Morant Bay → Downtown" },
  { routeId: "606Ex", name: "JUTC Bus 606Ex", label: "Linstead → Downtown" },
  { routeId: "605", name: "JUTC Bus 605", label: "Linstead → Spanish Town" },
] as const;

/**
 * Pre-defined taxi routes using known taxi stands.
 * Each entry picks a from-stand and to-stand by name.
 */
const POPULAR_TAXI_ROUTES = [
  {
    fromStandName: "Half Way Tree",
    toStandName: "Papine",
    label: "HWT → Papine",
  },
  {
    fromStandName: "Cross Roads",
    toStandName: "Downtown Kingston",
    label: "Cross Roads → Downtown",
  },
  {
    fromStandName: "Liguanea",
    toStandName: "Half Way Tree",
    label: "Liguanea → HWT",
  },
  {
    fromStandName: "Constant Spring",
    toStandName: "Cross Roads",
    label: "Constant Spring → Cross Roads",
  },
] as const;

/* ─── Simulation state factory ──────────────────── */

export const DEFAULT_CONFIG: SimulationConfig = {
  globalSpeed: 0.1,
  randomness: 0.15,
  latenessChance: 0.3,
  latenessSpeedFactor: 0.4,
  running: true,
  tickInterval: 1000,
};

/**
 * Create initial simulated vehicles from popular routes.
 * Each bus route gets one vehicle; each taxi route gets one taxi.
 * Vehicles start at random progress along their route.
 */
export function createSimulatedVehicles(): SimulatedVehicle[] {
  const vehicles: SimulatedVehicle[] = [];
  let idCounter = 100;

  // Buses
  for (const routeDef of POPULAR_BUS_ROUTES) {
    const waypoints = buildBusRoutePath(routeDef.routeId);
    if (waypoints.length < 2) continue;

    const startProgress = Math.random();
    const { position, heading: hdg } = interpolateAlongPath(
      waypoints,
      startProgress
    );

    vehicles.push({
      id: `sim-bus-${idCounter++}`,
      name: routeDef.name,
      type: "jutc",
      route: `${routeDef.routeId}: ${routeDef.label}`,
      waypoints,
      lat: position.lat,
      lng: position.lng,
      heading: hdg,
      capacity: 72,
      avgCost: "JMD $100",
      progress: startProgress,
      speedFactor: 0.8 + Math.random() * 0.4, // 0.8-1.2
      direction: 1,
    });
  }

  // Taxis
  for (const taxiDef of POPULAR_TAXI_ROUTES) {
    const fromStand = TAXI_STANDS.find((s) => s.name === taxiDef.fromStandName);
    const toStand = TAXI_STANDS.find((s) => s.name === taxiDef.toStandName);
    if (!fromStand || !toStand) continue;

    const waypoints = buildTaxiRoutePath(fromStand, toStand);
    const startProgress = Math.random();
    const { position, heading: hdg } = interpolateAlongPath(
      waypoints,
      startProgress
    );

    vehicles.push({
      id: `sim-taxi-${idCounter++}`,
      name: `Route Taxi ${taxiDef.label}`,
      type: "robot_taxi",
      route: taxiDef.label,
      waypoints,
      lat: position.lat,
      lng: position.lng,
      heading: hdg,
      capacity: 4,
      avgCost: "JMD $250",
      progress: startProgress,
      speedFactor: 0.9 + Math.random() * 0.3,
      direction: 1,
    });
  }

  return vehicles;
}

/**
 * Create a simulated user at Half Way Tree, optionally walking toward Papine.
 */
export function createSimulatedUser(): SimulatedUser {
  const hwt = BUS_STOPS.find((s) => s.id === "hwt");
  const papine = BUS_STOPS.find((s) => s.id === "papine");
  const uwi = BUS_STOPS.find((s) => s.id === "uwi-mona");
  const crossroads = BUS_STOPS.find((s) => s.id === "crossroads");

  const waypoints: LatLng[] = [];
  if (hwt) waypoints.push({ lat: hwt.lat, lng: hwt.lng });
  if (crossroads) waypoints.push({ lat: crossroads.lat, lng: crossroads.lng });
  if (uwi) waypoints.push({ lat: uwi.lat, lng: uwi.lng });
  if (papine) waypoints.push({ lat: papine.lat, lng: papine.lng });

  return {
    lat: hwt?.lat ?? 18.0126,
    lng: hwt?.lng ?? -76.7983,
    waypoints,
    progress: 0,
    speed: 0.004, // ~4 m/s walking speed equivalent in km per tick
    enabled: true,
  };
}

/* ─── Tick function ─────────────────────────────── */

/**
 * Advance all vehicles by one tick.
 * Returns new arrays (immutable update) for React state.
 *
 * Speed model: Each vehicle moves at
 *   baseSpeed × vehicle.speedFactor × config.globalSpeed
 *
 * The base speed is derived from the route length so a full
 * loop takes ~3 minutes of real-time (adjustable via globalSpeed).
 */
export function tickVehicles(
  vehicles: SimulatedVehicle[],
  config: SimulationConfig,
  deltaSeconds: number
): SimulatedVehicle[] {
  const FULL_LOOP_SECONDS = 180; // 3 min for a complete route traversal

  return vehicles.map((v) => {
    // Each tick we advance progress proportionally
    let effectiveSpeed = v.speedFactor * config.globalSpeed;

    // Random lateness: chance to temporarily slow down
    if (
      config.latenessChance > 0 &&
      Math.random() < config.latenessChance * 0.05
    ) {
      effectiveSpeed *= config.latenessSpeedFactor;
    }

    const progressDelta =
      (deltaSeconds / FULL_LOOP_SECONDS) * effectiveSpeed * v.direction;

    let newProgress = v.progress + progressDelta;

    // Random jitter
    if (config.randomness > 0) {
      newProgress += (Math.random() - 0.5) * config.randomness * 0.002;
    }

    // Bounce at ends (ping-pong along route)
    let newDirection = v.direction;
    if (newProgress >= 1) {
      newProgress = 1 - (newProgress - 1);
      newDirection = -1;
    } else if (newProgress <= 0) {
      newProgress = -newProgress;
      newDirection = 1;
    }
    newProgress = Math.max(0, Math.min(1, newProgress));

    const { position, heading: hdg } = interpolateAlongPath(
      v.waypoints,
      newProgress
    );

    // Flip heading 180° when going in reverse
    const adjustedHeading = newDirection === -1 ? (hdg + 180) % 360 : hdg;

    return {
      ...v,
      lat: position.lat,
      lng: position.lng,
      heading: adjustedHeading,
      progress: newProgress,
      direction: newDirection,
    };
  });
}

/**
 * Advance the simulated user by one tick.
 */
export function tickUser(
  user: SimulatedUser,
  config: SimulationConfig,
  deltaSeconds: number
): SimulatedUser {
  if (!user.enabled || user.waypoints.length < 2) return user;

  const totalDist = pathDistanceKm(user.waypoints);
  if (totalDist === 0) return user;

  // User speed: user.speed km per second × globalSpeed
  const distThisTick = user.speed * deltaSeconds * config.globalSpeed;
  const progressDelta = distThisTick / totalDist;

  let newProgress = user.progress + progressDelta;

  // Loop back to start when reaching the end
  if (newProgress >= 1) {
    newProgress = newProgress - 1;
  }

  const { position } = interpolateAlongPath(user.waypoints, newProgress);

  return {
    ...user,
    lat: position.lat,
    lng: position.lng,
    progress: newProgress,
  };
}
