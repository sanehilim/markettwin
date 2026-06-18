import type { MetadataRoute } from "next";

import { appConfig } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appConfig.name,
    short_name: "MarketTwin",
    description: "AI market pattern intelligence for live crypto market analog research.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4f7fb",
    theme_color: "#122033",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
