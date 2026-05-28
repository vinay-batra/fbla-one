import type { MetadataRoute } from "next";
import { COMPETITIONS } from "@/lib/competitions";

const BASE = "https://fbla.one";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = ["", "/competitions", "/about", "/faq", "/privacy", "/terms"].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const competitionRoutes = COMPETITIONS.map((c) => ({
    url: `${BASE}/competitions/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: c.popular ? 0.8 : 0.6,
  }));

  return [...staticRoutes, ...competitionRoutes];
}
