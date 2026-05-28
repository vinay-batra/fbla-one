import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FBLA One",
    short_name: "FBLA One",
    description: "Competition guides, study resources, and prep tracker for FBLA chapters.",
    start_url: "/app",
    display: "standalone",
    background_color: "#060c16",
    theme_color: "#060c16",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    categories: ["education", "productivity"],
  };
}
