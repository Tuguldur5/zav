"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { hasRecentReauth } from "@/lib/auth";
import { mapRpcError } from "@/lib/auth-errors";
import type { ActionResult } from "@/lib/action-result";

function revalidateSuper() {
  for (const path of [
    "/super",
    "/super/intake",
    "/super/admins",
    "/super/workers",
    "/super/jobs",
    "/super/audit",
    "/today",
    "/workers",
  ]) {
    revalidatePath(path);
  }
}

async function requireSuper(): Promise<
  { supabase: Awaited<ReturnType<typeof createClient>> } | { error: ActionResult }
> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { error: { ok: false, error: "Нэвтрэх эрхгүй" } };
  return { supabase };
}

async function guardReauth(): Promise<ActionResult | null> {
  const fresh = await hasRecentReauth();
  return fresh
    ? null
    : { ok: false, needsReauth: true, error: "Дахин баталгаажуулах шаардлагатай" };
}

async function call(
  name: string,
  params: Record<string, unknown>,
  options: { reauth?: boolean; data?: unknown } = {},
): Promise<ActionResult> {
  const guarded = options.reauth ? await guardReauth() : null;
  if (guarded) return guarded;

  const session = await requireSuper();
  if ("error" in session) return session.error;

  const { error, data } = await session.supabase.rpc(name, params);
  if (error) return { ok: false, error: mapRpcError(error.message) };
  revalidateSuper();
  return { ok: true, data: options.data ?? data ?? undefined };
}

export async function createInviteAction(): Promise<ActionResult> {
  const guarded = await guardReauth();
  if (guarded) return guarded;

  const session = await requireSuper();
  if ("error" in session) return session.error;

  const { error, data } = await session.supabase.rpc("create_staff_invite", {});
  if (error) return { ok: false, error: mapRpcError(error.message) };
  revalidateSuper();
  return { ok: true, data };
}

export async function bulkAssignWorkersAction(workerIds: string[], adminId: string) {
  return call("bulk_assign_workers", { p_workers: workerIds, p_admin: adminId }, { reauth: true });
}

export async function assignWorkerAction(workerId: string, adminId: string) {
  return call("assign_worker", { p_worker: workerId, p_admin: adminId });
}

export async function suggestAdminAction(workerId: string): Promise<ActionResult> {
  const session = await requireSuper();
  if ("error" in session) return session.error;
  const { error, data } = await session.supabase.rpc("suggest_admin", { p_worker: workerId });
  if (error) return { ok: false, error: mapRpcError(error.message) };
  return { ok: true, data };
}

export async function transferWorkersAction(fromAdmin: string | null, toAdmin: string) {
  return call("transfer_workers", { p_from: fromAdmin, p_to: toAdmin }, { reauth: true });
}

export async function setStaffStatusAction(userId: string, status: "active" | "suspended") {
  return call("set_staff_status", { p_user: userId, p_status: status }, { reauth: true });
}

export async function reassignJobAction(jobId: string, adminId: string) {
  return call("reassign_job", { p_job: jobId, p_admin: adminId });
}

export async function forceCancelJobAction(jobId: string) {
  return call("force_cancel_job", { p_job: jobId });
}

export async function setAdminScopesAction(
  adminId: string,
  skillIds: string[],
  districtIds: string[],
) {
  return call("set_admin_scopes", {
    p_admin: adminId,
    p_skill_ids: skillIds,
    p_district_ids: districtIds,
  });
}

export async function setSettingAction(key: "support_phone" | "support_text", value: string) {
  return call("set_setting", { p_key: key, p_value: JSON.stringify(value) });
}

export async function addSkillAction(name: string, icon: string): Promise<ActionResult> {
  const session = await requireSuper();
  if ("error" in session) return session.error;
  const { error } = await session.supabase
    .from("skills")
    .insert({ name, icon, sort_order: 999, active: true });
  if (error) return { ok: false, error: "Нэмэх боломжгүй. Нэр давхардаж байж магадгүй." };
  revalidatePath("/super/catalog");
  return { ok: true };
}

export async function setSkillActiveAction(
  skillId: string,
  active: boolean,
): Promise<ActionResult> {
  const session = await requireSuper();
  if ("error" in session) return session.error;
  const { error } = await session.supabase.from("skills").update({ active }).eq("id", skillId);
  if (error) return { ok: false, error: "Өөрчлөх боломжгүй" };
  revalidatePath("/super/catalog");
  return { ok: true };
}

export async function addDistrictAction(name: string): Promise<ActionResult> {
  const session = await requireSuper();
  if ("error" in session) return session.error;
  const { error } = await session.supabase.from("districts").insert({ name });
  if (error) return { ok: false, error: "Нэмэх боломжгүй. Нэр давхардаж байж магадгүй." };
  revalidatePath("/super/catalog");
  return { ok: true };
}
