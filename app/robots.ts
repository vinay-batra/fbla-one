import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Trailing slashes matter: robots.txt matches by PREFIX, so a bare "/app"
      // also blocked /apple-touch-icon.png. /join/ holds chapter invite links,
      // which should never be crawled.
      disallow: ["/app/", "/auth/", "/join/"],
    },
    sitemap: "https://chapterprep.com/sitemap.xml",
    host: "https://chapterprep.com",
  };
}
