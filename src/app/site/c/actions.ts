"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { fieldErrors, jobSchema } from "@/lib/validation";
import { TERMS_VERSION } from "@/lib/consent";
import { formatShortDateMn } from "@/lib/dates";

export type JobFormState = {
  ok?: boolean;
  jobId?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function currentUser() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();
  return { supabase, user, profile };
}

export async function createJobAction(
  _prev: JobFormState,
  formData: FormData,
): Promise<JobFormState> {
  const { supabase, user, profile } = await currentUser();
  if (!user || profile?.role !== "customer") return { error: "Нэвтрэх эрхгүй" };

  const negotiate = formData.get("payMode") === "negotiate";
  const parsed = jobSchema.safeParse({
    skillId: formData.get("skillId"),
    jobDate: formData.get("jobDate"),
    jobSlot: formData.get("jobSlot"),
    districtId: formData.get("districtId"),
    addressNote: formData.get("addressNote"),
    workersNeeded: formData.get("workersNeeded"),
    payOffer: negotiate ? null : (formData.get("payOffer") ?? 0),
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const input = parsed.data;

  const declaration = formData.get("declaration") === "on";
  const consents = formData.get("consents") === "on";
  const truth = formData.get("truth") === "on";
  if (!declaration || !consents || !truth) {
    return { error: "Бүх баталгаажуулалтыг тэмдэглэнэ үү." };
  }

  const { data: skill } = await supabase
    .from("skills")
    .select("name")
    .eq("id", input.skillId)
    .maybeSingle();
  const title = `${skill?.name ?? "Ажил"} — ${formatShortDateMn(input.jobDate)}`.slice(0, 80);

  const { data, error } = await supabase.rpc("create_job", {
    p_skill: input.skillId,
    p_title: title,
    p_description: input.description ?? "",
    p_district: input.districtId,
    p_job_date: input.jobDate,
    p_job_slot: input.jobSlot,
    p_workers_needed: input.workersNeeded,
    p_pay_offer: negotiate ? null : input.payOffer,
    p_address_note: input.addressNote,
    p_declaration: true,
    p_version: TERMS_VERSION,
  });

  if (error || !data) {
    if (error?.message?.includes("declaration_required")) {
      return { error: "Баталгаажуулалтыг тэмдэглэнэ үү." };
    }
    return { error: "Захиалга илгээх боломжгүй. Дахин оролдоно уу." };
  }

  revalidatePath("/c");
  return { ok: true, jobId: String(data) };
}

export async function cancelJobAction(jobId: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user, profile } = await currentUser();
  if (!user || profile?.role !== "customer") return { ok: false, error: "Нэвтрэх эрхгүй" };

  const { data, error } = await supabase
    .from("jobs")
    .update({ status: "cancelled" })
    .eq("id", jobId)
    .eq("customer_id", user.id)
    .in("status", ["new", "claimed", "matched"])
    .select("id");

  if (error || !data || data.length === 0) {
    return { ok: false, error: "Энэ захиалгыг цуцлах боломжгүй байна" };
  }

  revalidatePath("/c");
  revalidatePath(`/c/jobs/${jobId}`);
  return { ok: true };
}
