import type { MetadataRoute } from "next";
import { INK, PAPER } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ryuartistry",
    short_name: "Ryuartistry",
    description: "Studio kreatif untuk era AI, game, dan software.",
    start_url: "/",
    display: "browser",
    background_color: PAPER,
    theme_color: INK,
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/logo.png", type: "image/png", sizes: "512x512" },
    ],
  };
}
