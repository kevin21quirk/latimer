import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Burton Latimer Connect",
    short_name: "BL Connect",
    description:
      "Discover local businesses, services, events and ways to connect with the Burton Latimer community.",
    start_url: "/burton-latimer",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#D4AF37",
    icons: [
      {
        src: "/logos/32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/logos/48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/logos/BL-Connect-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logos/BL-Connect-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
