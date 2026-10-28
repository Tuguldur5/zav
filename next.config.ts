import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel builds its own function output. Docker/VPS builds opt in with
  // NEXT_OUTPUT=standalone (Dockerfile sets it); `next start` stays warning-free.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  // Verification runs use their own build dir so a dev server that already
  // holds .next (Windows file locks) cannot block a second instance.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
