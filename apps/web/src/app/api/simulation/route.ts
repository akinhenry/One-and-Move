import type { SimulatedUser, SimulatedVehicle } from "@/lib/simulation";
import {
  applyResolvedPaths,
  createSimulatedUser,
  createSimulatedVehicles,
  DEFAULT_CONFIG,
  resolveRoadPaths,
  tickUser,
  tickVehicles,
} from "@/lib/simulation";
import type { LatLng } from "@/lib/simulation";

/* ─── Singleton simulation state ────────────────── */

let vehicles: SimulatedVehicle[] | null = null;
let simUser: SimulatedUser | null = null;
let lastTick = Date.now();
/** Resolved waypoint lookup — survives vehicle object replacement by tick() */
let resolvedPaths: Map<string, LatLng[]> | null = null;
let roadSnapPromise: Promise<void> | null = null;

function ensureInitialised(): void {
  if (vehicles === null) {
    vehicles = createSimulatedVehicles();
    simUser = createSimulatedUser();
    lastTick = Date.now();
  }
}

function tick(): void {
  if (!vehicles || !simUser) return;
  const now = Date.now();
  const delta = (now - lastTick) / 1000;
  lastTick = now;
  vehicles = tickVehicles(vehicles, DEFAULT_CONFIG, delta);

  // Re-apply snapped waypoints to the freshly-created vehicle objects.
  // tickVehicles() returns new objects via .map({...v}), so any previously
  // applied waypoints are lost. We re-apply from our cached lookup every tick.
  if (resolvedPaths && resolvedPaths.size > 0) {
    applyResolvedPaths(vehicles, resolvedPaths);
  }

  simUser = tickUser(simUser, DEFAULT_CONFIG, delta);
}

/** One-time road-snapping — starts once, result cached in resolvedPaths */
function resolveOnce(): void {
  if (resolvedPaths || roadSnapPromise) return;
  roadSnapPromise = (async () => {
    try {
      if (vehicles) {
        const paths = await resolveRoadPaths(vehicles);
        resolvedPaths = paths;
        // Apply immediately to the current vehicle array
        if (vehicles && paths.size > 0) {
          applyResolvedPaths(vehicles, paths);
        }
      }
    } catch (err) {
      console.warn("[simulation] resolveRoadPaths failed:", err);
    }
  })();
}

/* ─── Wire format (compact) ─────────────────────── */

interface VehicleSnapshot {
  avgCost: string;
  capacity: number;
  heading: number;
  id: string;
  lat: number;
  lng: number;
  name: string;
  route: string;
  type: "jutc" | "robot_taxi";
}

interface UserSnapshot {
  enabled: boolean;
  lat: number;
  lng: number;
}

interface SimFrame {
  ts: number;
  user: UserSnapshot;
  vehicles: VehicleSnapshot[];
}

function buildFrame(): SimFrame {
  return {
    ts: Date.now(),
    vehicles: (vehicles ?? []).map((v) => ({
      id: v.id,
      type: v.type,
      lat: v.lat,
      lng: v.lng,
      heading: v.heading,
      name: v.name,
      route: v.route,
      capacity: v.capacity,
      avgCost: v.avgCost,
    })),
    user: {
      lat: simUser?.lat ?? 0,
      lng: simUser?.lng ?? 0,
      enabled: simUser?.enabled ?? false,
    },
  };
}

/* ─── SSE endpoint ──────────────────────────────── */

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  ensureInitialised();
  // Kick off road-snapping in background
  resolveOnce();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(id);
        try { controller.close(); } catch { /* already closed */ }
      };

      // Send first frame immediately
      tick();
      const first = `data: ${JSON.stringify(buildFrame())}\n\n`;
      controller.enqueue(encoder.encode(first));

      // Tick + push every second
      const id = setInterval(() => {
        if (closed) { clearInterval(id); return; }
        try {
          tick();
          const frame = buildFrame();
          const data = `data: ${JSON.stringify(frame)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          close();
        }
      }, 1000);

      // Expose close fn so cancel() can use it
      (controller as unknown as { _close: () => void })._close = close;
    },
    cancel(controller) {
      (controller as unknown as { _close?: () => void })._close?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
