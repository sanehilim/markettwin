import type { MetadataRoute } from "next";

import { appConfig } from "@/lib/config";

const routes = [
  "",
  "/analyze",
  "/twins",
  "/research",
  "/api-health",
  "/settings",
  "/risk",
  "/privacy",
  "/terms"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return routes.map((route) => ({
    url: `${appConfig.siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" || route === "/analyze" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/analyze" ? 0.9 : 0.7
  }));
}
