import { requireRole } from "@/lib/auth";
import { NewJobWizard } from "./NewJobWizard";
import type { District, Skill } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  const { supabase } = await requireRole(["customer"]);

  const [skillResult, districtResult] = await Promise.all([
    supabase
      .from("skills")
      .select("id, name, icon, sort_order, active")
      .eq("active", true)
      .order("sort_order"),
    supabase.from("districts").select("id, name").order("name"),
  ]);

  const skills = (skillResult.data as Skill[] | null) ?? [];
  const districts = (districtResult.data as District[] | null) ?? [];

  return <NewJobWizard skills={skills} districts={districts} />;
}
