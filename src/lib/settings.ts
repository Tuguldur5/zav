import { createClient } from "@/lib/supabase/server";

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
