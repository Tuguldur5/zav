import type { NextRequest } from "next/server";
import { handleAuthConfirm } from "@/lib/auth-confirm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleAuthConfirm(request);
}
