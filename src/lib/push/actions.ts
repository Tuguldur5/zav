"use server";

import { z } from "zod";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(600),
  p256dh: z.string().min(1).max(300),
  auth: z.string().min(1).max(300),
});

export type PushActionResult = { ok: boolean; error?: string };

/** A worker can save only their own subscription; RLS enforces it too. */
export async function savePushSubscriptionAction(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<PushActionResult> {
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Буруу өгөгдөл" };

  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Нэвтрэх эрхгүй" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "worker") return { ok: false, error: "Зөвхөн ажилтанд" };

  const userAgent =
    typeof globalThis.navigator === "undefined"
      ? null
      : (globalThis.navigator as Navigator).userAgent.slice(0, 300);

  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: user.id,
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.p256dh,
    auth: parsed.data.auth,
    user_agent: userAgent,
  });

  if (error) {
    // Already registered on this device: nothing to do.
    if (error.code === "23505") return { ok: true };
    return { ok: false, error: "Хадгалах боломжгүй" };
  }
  return { ok: true };
}

export async function deletePushSubscriptionAction(endpoint: string): Promise<PushActionResult> {
  if (!endpoint) return { ok: false, error: "Буруу өгөгдөл" };

  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Нэвтрэх эрхгүй" };

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Устгах боломжгүй" };
  return { ok: true };
}
