import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const preferredTransport = pgTable("preferred_transport", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  mode: varchar("mode", { length: 50 }).notNull(), // 'bus', 'robot_taxi', etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const route = pgTable("route", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  polyline: text("polyline").notNull(), // GeoJSON or Polyline string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicle = pgTable("vehicle", {
  id: text("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(), // 'jutc', 'robot_taxi'
  officialNumber: varchar("official_number", { length: 50 }), // null for robot_taxis maybe
  currentRouteId: text("current_route_id").references(() => route.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicleReport = pgTable("vehicle_report", {
  id: text("id").primaryKey(),
  vehicleId: text("vehicle_id")
    .notNull()
    .references(() => vehicle.id, { onDelete: "cascade" }),
  reporterId: text("reporter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  fullness: integer("fullness"), // 0-100%
  speed: real("speed"),
  reportedAt: timestamp("reported_at").defaultNow().notNull(),
});

/* ── Bus stops ─────────────────────────────────── */

export const busStop = pgTable("bus_stop", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  address: text("address"),
});

export const routeBusStop = pgTable(
  "route_bus_stop",
  {
    routeId: text("route_id")
      .notNull()
      .references(() => route.id, { onDelete: "cascade" }),
    busStopId: text("bus_stop_id")
      .notNull()
      .references(() => busStop.id, { onDelete: "cascade" }),
    stopOrder: integer("stop_order").notNull(),
  },
  (table) => [primaryKey({ columns: [table.routeId, table.busStopId] })]
);

/* ── Taxi stands ───────────────────────────────── */

export const taxiStand = pgTable("taxi_stand", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  address: text("address"),
});

/* ── Live crowdsource vehicle tracking ─────────── */

export const liveVehicle = pgTable("live_vehicle", {
  id: text("id").primaryKey(),
  vehicleType: varchar("vehicle_type", { length: 20 }).notNull(), // 'jutc' | 'taxi'
  licensePlate: varchar("license_plate", { length: 20 }).notNull().unique(),
  routeNumber: varchar("route_number", { length: 20 }),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  heading: real("heading"),
  speed: real("speed"),
  reportedById: text("reported_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

/* ── Relations ─────────────────────────────────── */

export const transportRelations = relations(user, ({ many }) => ({
  preferredTransports: many(preferredTransport),
  reports: many(vehicleReport),
  liveVehicles: many(liveVehicle),
}));

export const routeRelations = relations(route, ({ many }) => ({
  vehicles: many(vehicle),
  routeBusStops: many(routeBusStop),
}));

export const vehicleRelations = relations(vehicle, ({ one, many }) => ({
  route: one(route, {
    fields: [vehicle.currentRouteId],
    references: [route.id],
  }),
  reports: many(vehicleReport),
}));

export const reportRelations = relations(vehicleReport, ({ one }) => ({
  vehicle: one(vehicle, {
    fields: [vehicleReport.vehicleId],
    references: [vehicle.id],
  }),
  reporter: one(user, {
    fields: [vehicleReport.reporterId],
    references: [user.id],
  }),
}));

export const busStopRelations = relations(busStop, ({ many }) => ({
  routeBusStops: many(routeBusStop),
}));

export const routeBusStopRelations = relations(routeBusStop, ({ one }) => ({
  route: one(route, {
    fields: [routeBusStop.routeId],
    references: [route.id],
  }),
  busStop: one(busStop, {
    fields: [routeBusStop.busStopId],
    references: [busStop.id],
  }),
}));

export const liveVehicleRelations = relations(liveVehicle, ({ one }) => ({
  reportedBy: one(user, {
    fields: [liveVehicle.reportedById],
    references: [user.id],
  }),
}));
