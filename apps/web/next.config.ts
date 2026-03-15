import "@One-and-Move/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: false,
  transpilePackages: ["@One-and-Move/db"],
  turbopack: {
    resolveAlias: {
      "maplibre-gl": "maplibre-gl",
    },
  },
};

export default nextConfig;
