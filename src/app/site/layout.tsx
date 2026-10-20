import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  applicationName: "Зав байна",
  appleWebApp: {
    capable: true,
    title: "Зав байна",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
