import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated app + auth utility pages have no SEO value
      disallow: ["/app", "/auth"],
    },
    sitemap: "https://fbla.one/sitemap.xml",
    host: "https://fbla.one",
  };
}
