import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated app + auth utility pages have no SEO value
      disallow: ["/app", "/auth"],
    },
    sitemap: "https://chapterprep.com/sitemap.xml",
    host: "https://chapterprep.com",
  };
}
