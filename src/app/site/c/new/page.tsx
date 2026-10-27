import { requireRole } from "@/lib/auth";
import { OrderWizard } from "./OrderWizard";
import type { District } from "@/lib/types";
import { addDaysISO, todayISO } from "@/lib/dates";
import { loadPublicSkills } from "@/lib/marketing/skills";

export const dynamic = "force-dynamic";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string; district?: string; when?: string }>;
}) {
  const { supabase } = await requireRole(["customer"]);
  const params = await searchParams;

  const [skillResult, districtResult] = await Promise.all([
    loadPublicSkills(supabase),
    supabase.from("districts").select("id, name").order("name"),
  ]);
  if (skillResult.error) throw new Error(`Could not load active skills: ${skillResult.error.message}`);
  if (districtResult.error) throw new Error(`Could not load districts: ${districtResult.error.message}`);

  const skills = skillResult.skills;
  const districts = (districtResult.data as District[] | null) ?? [];
  const initialSkillId = skills.some((skill) => skill.id === params.skill && !skill.sensitive)
    ? params.skill
    : undefined;
  const initialDistrictId = districts.some((district) => district.id === params.district)
    ? params.district
    : undefined;
  const today = todayISO();
  const initialJobDate =
    params.when === "today" ? today : params.when === "tomorrow" ? addDaysISO(today, 1) : undefined;

  return (
    <OrderWizard
      skills={skills.filter((skill) => !skill.sensitive)}
      districts={districts}
      initialSkillId={initialSkillId}
      initialDistrictId={initialDistrictId}
      initialJobDate={initialJobDate}
    />
  );
}
