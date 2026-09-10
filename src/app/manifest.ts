import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SplitZ",
    short_name: "SplitZ",
    description: "Split expenses. Settle easily.",
    start_url: "/",
    display: "standalone",
    background_color: "#101317",
    theme_color: "#101317",
    icons: [
      {
        src: "/splitz-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}