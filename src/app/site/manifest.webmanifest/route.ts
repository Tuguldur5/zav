import { NextResponse } from "next/server";

export const dynamic = "force-static";

/**
 * One manifest per user host. The customer app opens on the order list.
 * Scoped to "/" so login, terms and help stay inside the installed app.
 */
export function GET() {
  return NextResponse.json(
    {
      name: "Зав байна",
      short_name: "Зав байна",
      description: "Ажил захиалах хялбар арга",
      start_url: "/c",
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
