import { env } from "@One-and-Move/env/server";
import { z } from "zod";
import { publicProcedure } from "../index";

const LOCATIONIQ_BASE = "https://us1.locationiq.com/v1";

interface LocationIQResult {
  class?: string;
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
  type?: string;
}

export const geocodeRouter = {
  /**
   * Forward-geocode search — proxies LocationIQ so the API token stays server-side.
   * Returns up to 5 suggestions matching the query string.
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(2).max(200),
      })
    )
    .handler(async ({ input }) => {
      const token = env.LOCATION_IQ_TOKEN;
      if (!token) {
        return [];
      }

      const params = new URLSearchParams({
        key: token,
        q: input.query,
        format: "json",
        limit: "5",
        countrycodes: "jm", // bias results to Jamaica
        addressdetails: "1",
      });

      const res = await fetch(
        `${LOCATIONIQ_BASE}/search?${params.toString()}`,
        { headers: { Accept: "application/json" } }
      );

      if (!res.ok) {
        return [];
      }

      const data = (await res.json()) as LocationIQResult[];

      return data.map((r) => ({
        id: r.place_id,
        name: (r.display_name.split(",")[0] ?? r.display_name).trim(),
        address: r.display_name,
        coords: {
          lat: Number.parseFloat(r.lat),
          lng: Number.parseFloat(r.lon),
        },
      }));
    }),
};
