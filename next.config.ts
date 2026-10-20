import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel builds its own function output; standalone remains for VPS/Docker.
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  // Verification runs use their own build dir so a dev server that already
  // holds .next (Windows file locks) cannot block a second instance.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
