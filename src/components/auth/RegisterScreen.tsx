import { redirect } from "next/navigation";
import { AuthLayout } from "./AuthLayout";
import { RegisterForm } from "./RegisterForm";
import { createClient } from "@/lib/supabase/server";
import { getViewer, isStaffRole, roleHome, safeNextPath } from "@/lib/auth";
import { siteUrl, workerUrl } from "@/lib/hosts";
import type { District, Skill } from "@/lib/types";
import { issueFormToken } from "@/lib/auth/form-token";
import { loadPublicSkills } from "@/lib/marketing/skills";

export async function RegisterScreen({
  audience,
  next,
}: {
  audience: "customer" | "worker";
  next?: string;
}) {
  const { user, profile } = await getViewer();
  if (user && profile && profile.status !== "suspended" && !isStaffRole(profile.role)) {
    redirect(roleHome(profile.role));
  }

  let districts: District[] = [];
  let skills: Skill[] = [];
  if (audience === "worker") {
    const supabase = await createClient();
    const [districtResult, skillResult] = await Promise.all([
      supabase.from("districts").select("id, name").order("name"),
      loadPublicSkills(supabase),
    ]);
    if (districtResult.error) throw new Error(`Could not load districts: ${districtResult.error.message}`);
    if (skillResult.error) throw new Error(`Could not load worker skills: ${skillResult.error.message}`);
    districts = (districtResult.data as District[] | null) ?? [];
    skills = skillResult.skills;
  }

  const otherSite =
    audience === "customer"
      ? { href: workerUrl("/register"), label: "Ажилтны хэсэг" }
      : { href: siteUrl("/register"), label: "Захиалагчийн хэсэг" };

  return (
    <AuthLayout
      title={audience === "worker" ? "Ажилтнаар бүртгүүлэх" : "Захиалагчаар бүртгүүлэх"}
      lead={
        audience === "worker"
          ? "Чөлөөт өдрөө тэмдэглээд ажлын санал хүлээн авна."
          : "Ажил захиалаад тохирох ажилтныг олно."
      }
      footer={
        <span>
          {audience === "worker" ? "Ажил захиалах уу? " : "Ажил хайж байна уу? "}
          <a href={otherSite.href} className="text-primary underline underline-offset-2">
            {otherSite.label}
          </a>
        </span>
      }
    >
      <RegisterForm
        audience={audience}
        formToken={issueFormToken()}
        districts={districts}
        skills={skills}
        otherSite={otherSite}
        next={safeNextPath(next, audience) ?? undefined}
      />
    </AuthLayout>
  );
}
