"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, jobSchema } from "@/lib/validation";

export type JobFormState = {
  ok?: boolean;
  jobId?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
    payOffer: negotiate ? 0 : (formData.get("payOffer") ?? 0),
    description: formData.get("description") ?? "",
    title: formData.get("title"),
  });

  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const input = parsed.data;

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  if (input.jobDate < today) {
    return { fieldErrors: { jobDate: "Өнгөрсөн өдөр сонгох боломжгүй" } };
  }

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      customer_id: user.id,
      skill_id: input.skillId,
      title: input.title,
      description: input.description ?? "",
      district_id: input.districtId,
      job_date: input.jobDate,
      job_slot: input.jobSlot,
      workers_needed: input.workersNeeded,
      pay_offer: negotiate ? null : input.payOffer,
      address_note: input.addressNote,
      status: "new",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Зар илгээх боломжгүй. Дахин оролдоно уу." };
  }

  revalidatePath("/c");
  revalidatePath("/c/jobs");
  return { ok: true, jobId: data.id as string };
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
    return { ok: false, error: "Энэ зарыг цуцлах боломжгүй байна" };
  }

  revalidatePath("/c");
  revalidatePath("/c/jobs");
  revalidatePath(`/c/jobs/${jobId}`);
  return { ok: true };
}
