import { NextResponse } from "next/server";

export const dynamic = "force-static";

/**
 * Worker install: the app opens on /home so an offer is one tap away.
 * Push notifications are delivered by /sw.js (no caching, no offline mode).
 */
export function GET() {
  return NextResponse.json(
    {
      name: "Зав байна · Ажилтан",
      short_name: "Зав ажил",
      description: "Ажлын санал хүлээн авах",
      start_url: "/home",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "white",
      theme_color: "white",
      lang: "mn",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        {
          src: "/icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
