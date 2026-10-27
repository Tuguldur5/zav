import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Onest } from "next/font/google";
import "./globals.css";

const onest = Onest({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-onest",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Зав байна",
  description: "Хагас цагийн ажил хайх, санал болгох платформ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Set by middleware from the host and the path, so the audience and the staff
  // frame tone are correct in the first byte of HTML. No client script, no
  // flash of the wrong backdrop or the wrong blue.
  const requestHeaders = await headers();
  const staff = requestHeaders.get("x-zav-audience") === "staff";
  const tone = requestHeaders.get("x-zav-tone") === "super" ? "super" : "admin";

  return (
    <html
      lang="mn"
      data-audience={staff ? "staff" : "public"}
      data-tone={staff ? tone : undefined}
      data-staff-tone={staff ? tone : undefined}
      className={staff ? `${onest.variable} staff-theme` : onest.variable}
    >
      <body>{children}</body>
    </html>
  );
}
