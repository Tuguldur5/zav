"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { hasRecentReauth } from "@/lib/auth";
import { passwordSchema, phoneSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/action-result";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Нэрээ оруулна уу").max(80, "Нэр хэт урт байна"),
  phone: z.union([phoneSchema, z.literal("")]).optional(),
});

/**
 * Only the caller's own profile row: name and phone. Role, status and the
 * assignment to an admin are never writable here.
 */
export async function updateOwnProfileAction(input: {
  fullName: string;
  phone: string;
}): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Мэдээлэл буруу байна" };
  }

  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Нэвтрэх эрхгүй" };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone ? parsed.data.phone : null,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: "Хадгалах боломжгүй байна" };
  revalidatePath("/profile");
  return { ok: true };
}

/** Needs a fresh password confirmation (ReauthDialog) first. */
export async function changeOwnPasswordAction(password: string): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Нууц үг буруу байна" };
  }
  if (!(await hasRecentReauth())) {
    return { ok: false, needsReauth: true, error: "Дахин баталгаажуулах шаардлагатай" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { ok: false, error: "Нууц үгийг солих боломжгүй байна" };
  return { ok: true };
}
