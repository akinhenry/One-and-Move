import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { crowdsourceRouter } from "./crowdsource";
import { geocodeRouter } from "./geocode";
import { profileRouter } from "./profile";
import { routesRouter } from "./routes";
import { vehiclesRouter } from "./vehicles";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session?.user,
    };
  }),
  profile: profileRouter,
  vehicles: vehiclesRouter,
  routes: routesRouter,
  crowdsource: crowdsourceRouter,
  geocode: geocodeRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
