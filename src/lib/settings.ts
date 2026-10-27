import { createClient } from "@/lib/supabase/server";

export async function getAdminCapacity(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "admin_capacity")
      .maybeSingle();
    const value = Number(data?.value);
    return Number.isFinite(value) && value > 0 ? value : 10;
  } catch {
    return 10;
  }
}

export async function getSupportPhone(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "support_phone")
      .maybeSingle();
    const value = data?.value;
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}

export async function getSupportText(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "support_text")
      .maybeSingle();
    const value = data?.value;
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}
