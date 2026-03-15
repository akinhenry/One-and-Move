/**
 * Seed script — populates JUTC routes, bus stops, and route↔stop links.
 *
 * Usage:  npx tsx packages/db/src/seed.ts
 *   (or)  bun run packages/db/src/seed.ts
 *
 * Requires DATABASE_URL in the environment (or .env).
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { BUS_STOPS } from "./data/bus-stops";
import { JUTC_ROUTES } from "./data/jutc-routes";
import * as schema from "./schema";

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const sql = neon(url);
  const db = drizzle(sql, { schema });

  console.log("🌱 Seeding JUTC routes…");

  const routeRows = JUTC_ROUTES.map((r) => ({
    id: `jutc-${r.route}`,
    name: `Route ${r.route}: ${r.origin} → ${r.destination}`,
    description: `${r.type} — via ${r.via} (Depot: ${r.depot})`,
    polyline: "", // Polylines to be added later
  }));

  for (const row of routeRows) {
    await db.insert(schema.route).values(row).onConflictDoNothing();
  }

  console.log(`  ✓ ${routeRows.length} routes upserted`);

  console.log("🌱 Seeding bus stops…");

  const stopRows = BUS_STOPS.map((s) => ({
    id: s.id,
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    address: s.address,
  }));

  for (const row of stopRows) {
    await db.insert(schema.busStop).values(row).onConflictDoNothing();
  }

  console.log(`  ✓ ${stopRows.length} bus stops upserted`);

  console.log("🌱 Seeding route ↔ stop links…");

  let linkCount = 0;
  for (const stop of BUS_STOPS) {
    for (let i = 0; i < stop.routeIds.length; i++) {
      const routeNumber = stop.routeIds[i];
      const routeId = `jutc-${routeNumber}`;

      await db
        .insert(schema.routeBusStop)
        .values({
          routeId,
          busStopId: stop.id,
          stopOrder: i,
        })
        .onConflictDoNothing();

      linkCount++;
    }
  }

  console.log(`  ✓ ${linkCount} route↔stop links upserted`);

  console.log("🌱 Seeding official JUTC vehicles…");

  const vehicleRows = JUTC_ROUTES.map((r) => ({
    id: uuidv4(),
    type: "jutc" as const,
    officialNumber: `JUTC-${r.route}`,
    currentRouteId: `jutc-${r.route}`,
  }));

  for (const row of vehicleRows) {
    await db.insert(schema.vehicle).values(row).onConflictDoNothing();
  }

  console.log(`  ✓ ${vehicleRows.length} vehicles upserted`);

  console.log("\n✅ Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
