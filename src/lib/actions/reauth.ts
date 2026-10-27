"use server";

import { cookies } from "next/headers";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { reauthCookieName } from "@/lib/auth";

export async function reauthenticate(password: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user?.email) {
    return { ok: false, error: "Дахин нэвтэрнэ үү" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (error) {
    return { ok: false, error: "Нууц үг буруу байна" };
  }

  const store = await cookies();
  store.set(reauthCookieName, String(Date.now()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return { ok: true };
}
