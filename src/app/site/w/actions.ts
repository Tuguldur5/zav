"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mapRpcError } from "@/lib/auth-errors";

type ActionResult = { ok: boolean; error?: string };

async function requireWorker() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Нэвтрэх эрхгүй" as string };
  return { supabase, error: null };
}

export async function respondAssignmentAction(
  assignmentId: string,
  accept: boolean,
): Promise<ActionResult> {
  const { supabase, error: authError } = await requireWorker();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase.rpc("respond_assignment", {
    p_assignment: assignmentId,
    p_accept: accept,
  });
  if (error) return { ok: false, error: mapRpcError(error.message) };

  revalidatePath("/w");
  revalidatePath("/w/offers");
  return { ok: true };
}

export async function setAvailabilityAction(
  day: string,
  slot: "full" | "am" | "pm" | null,
): Promise<ActionResult> {
  const { supabase, error: authError } = await requireWorker();
  if (authError) return { ok: false, error: authError };

  const { error } = await supabase.rpc("set_my_availability", {
    p_day: day,
    p_slot: slot,
  });
  if (error) return { ok: false, error: mapRpcError(error.message) };

  revalidatePath("/w/calendar");
  return { ok: true };
}

export async function bulkAvailabilityAction(
  days: string[],
  slot: "full" | "am" | "pm" = "full",
): Promise<ActionResult & { count?: number }> {
  const { supabase, error: authError } = await requireWorker();
  if (authError) return { ok: false, error: authError };

  let count = 0;
  for (const day of days) {
    const { error } = await supabase.rpc("set_my_availability", { p_day: day, p_slot: slot });
    if (error) return { ok: false, error: mapRpcError(error.message), count };
    count += 1;
  }

  revalidatePath("/w/calendar");
  return { ok: true, count };
}
