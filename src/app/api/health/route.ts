import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  // `env` lets the smoke script know whether dev-only routes should exist.
  return NextResponse.json({ ok: true, env: process.env.NODE_ENV ?? "development" });
}
