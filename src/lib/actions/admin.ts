"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { mapRpcError } from "@/lib/auth-errors";
import type { ActionResult } from "@/lib/action-result";

function revalidateOperational() {
  for (const path of ["/today", "/jobs", "/calendar", "/workers", "/notifications"]) {
    revalidatePath(path);
  }
  revalidatePath("/jobs/[id]", "page");
  revalidatePath("/workers/[id]", "page");
}

async function callRpc(name: string, params: Record<string, unknown>): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Нэвтрэх эрхгүй" };

  const { error } = await supabase.rpc(name, params);
  if (error) return { ok: false, error: mapRpcError(error.message) };
  revalidateOperational();
  return { ok: true };
}

export async function claimJobAction(jobId: string) {
  return callRpc("claim_job", { p_job: jobId });
}

export async function releaseJobAction(jobId: string) {
  return callRpc("release_job", { p_job: jobId });
}

export async function offerAssignmentAction(jobId: string, workerId: string, day: string) {
  return callRpc("offer_assignment", { p_job: jobId, p_worker: workerId, p_day: day });
}

export async function confirmAvailabilityAction(workerId: string, day: string, byPhone: boolean) {
  return callRpc("confirm_availability", {
    p_worker: workerId,
    p_day: day,
    p_by_phone: byPhone,
  });
}

export async function setWorkerAvailabilityAction(
  workerId: string,
  day: string,
  slot: "full" | "am" | "pm" | null,
) {
  return callRpc("set_availability_for_worker", {
    p_worker: workerId,
    p_day: day,
    p_slot: slot,
  });
}

export async function recordPhoneAnswerAction(assignmentId: string, accept: boolean) {
  return callRpc("record_phone_answer", { p_assignment: assignmentId, p_accept: accept });
}

export async function confirmAssignmentAction(assignmentId: string) {
  return callRpc("confirm_assignment", { p_assignment: assignmentId });
}

export async function completeAssignmentAction(assignmentId: string) {
  return callRpc("complete_assignment", { p_assignment: assignmentId });
}

export async function cancelAssignmentAction(assignmentId: string) {
  return callRpc("cancel_assignment", { p_assignment: assignmentId });
}

export async function saveWorkerNoteAction(workerId: string, note: string) {
  return callRpc("set_worker_note", { p_worker: workerId, p_note: note });
}

export async function updateWorkerCatalogAction(
  workerId: string,
  skillIds: string[],
  districtId: string | null,
) {
  return callRpc("set_worker_catalog", {
    p_worker: workerId,
    p_skill_ids: skillIds,
    p_district: districtId,
  });
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Нэвтрэх эрхгүй" };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
  if (error) return { ok: false, error: "Алдаа гарлаа" };

  revalidatePath("/notifications");
  return { ok: true };
}
