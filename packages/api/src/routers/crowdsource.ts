import { db, schema } from "@One-and-Move/db";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../index";

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const crowdsourceRouter = {
  /**
   * Start tracking — called when a user boards a bus / taxi.
   * Upserts on licensePlate: if a vehicle with the same plate already
   * exists and is active, the caller takes over tracking.
   */
  startTracking: protectedProcedure
    .input(
      z.object({
        vehicleType: z.enum(["jutc", "taxi"]),
        licensePlate: z.string().min(1).max(20),
        routeNumber: z.string().max(20).optional(),
        lat: z.number(),
        lng: z.number(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      // Check if a vehicle with this plate is already active
      const existing = await db.query.liveVehicle.findFirst({
        where: and(
          eq(schema.liveVehicle.licensePlate, input.licensePlate),
          eq(schema.liveVehicle.isActive, true)
        ),
      });

      if (existing) {
        // Take over tracking — update reporter, position, lastSeen
        await db
          .update(schema.liveVehicle)
          .set({
            reportedById: userId,
            lat: input.lat,
            lng: input.lng,
            routeNumber: input.routeNumber ?? existing.routeNumber,
            lastSeenAt: new Date(),
          })
          .where(eq(schema.liveVehicle.id, existing.id));

        return { id: existing.id, isNew: false };
      }

      // Create new live vehicle entry
      const id = uuidv4();
      await db.insert(schema.liveVehicle).values({
        id,
        vehicleType: input.vehicleType,
        licensePlate: input.licensePlate,
        routeNumber: input.routeNumber ?? null,
        lat: input.lat,
        lng: input.lng,
        reportedById: userId,
        isActive: true,
      });

      return { id, isNew: true };
    }),

  /**
   * Update location — called periodically (~every 10s) while the user
   * is on the vehicle.
   */
  updateLocation: protectedProcedure
    .input(
      z.object({
        liveVehicleId: z.string(),
        lat: z.number(),
        lng: z.number(),
        heading: z.number().optional(),
        speed: z.number().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      await db
        .update(schema.liveVehicle)
        .set({
          lat: input.lat,
          lng: input.lng,
          heading: input.heading ?? null,
          speed: input.speed ?? null,
          lastSeenAt: new Date(),
        })
        .where(
          and(
            eq(schema.liveVehicle.id, input.liveVehicleId),
            eq(schema.liveVehicle.reportedById, userId)
          )
        );

      return { success: true };
    }),

  /**
   * Stop tracking — user has exited the vehicle.
   */
  stopTracking: protectedProcedure
    .input(z.object({ liveVehicleId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session?.user?.id;
      if (!userId) {
        throw new Error("Unauthorized");
      }

      await db
        .update(schema.liveVehicle)
        .set({ isActive: false })
        .where(
          and(
            eq(schema.liveVehicle.id, input.liveVehicleId),
            eq(schema.liveVehicle.reportedById, userId)
          )
        );

      return { success: true };
    }),

  /**
   * Get nearby active vehicles — public endpoint polled by the map.
   * Uses a simple bounding-box filter. Only returns vehicles
   * that have reported within the last 2 minutes.
   */
  getNearbyVehicles: publicProcedure
    .input(
      z.object({
        lat: z.number(),
        lng: z.number(),
        radiusKm: z.number().default(10),
      })
    )
    .handler(async ({ input }) => {
      // ~0.009 degrees ≈ 1 km at Jamaica's latitude
      const degPerKm = 0.009;
      const delta = input.radiusKm * degPerKm;
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);

      const vehicles = await db
        .select()
        .from(schema.liveVehicle)
        .where(
          and(
            eq(schema.liveVehicle.isActive, true),
            gte(schema.liveVehicle.lastSeenAt, twoMinAgo),
            gte(schema.liveVehicle.lat, input.lat - delta),
            lte(schema.liveVehicle.lat, input.lat + delta),
            gte(schema.liveVehicle.lng, input.lng - delta),
            lte(schema.liveVehicle.lng, input.lng + delta)
          )
        );

      return vehicles.map((v) => ({
        id: v.id,
        vehicleType: v.vehicleType,
        licensePlate: v.licensePlate,
        routeNumber: v.routeNumber,
        lat: v.lat,
        lng: v.lng,
        heading: v.heading,
        speed: v.speed,
        lastSeenAt: v.lastSeenAt,
      }));
    }),
};
