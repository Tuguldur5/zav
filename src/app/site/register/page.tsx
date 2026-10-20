import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "./RegisterForm";
import { AuthAside } from "@/components/auth/AuthAside";
import { createClient } from "@/lib/supabase/server";
import { getViewer, isStaffRole, roleHome } from "@/lib/auth";
import type { District, Skill } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const role = params.role === "worker" ? "worker" : "customer";

  const { user, profile } = await getViewer();
  if (user && profile && !isStaffRole(profile.role) && profile.status !== "suspended") {
    redirect(roleHome(profile.role));
  }

  let districts: District[] = [];
  let skills: Skill[] = [];
  try {
    const supabase = await createClient();
    const [districtResult, skillResult] = await Promise.all([
      supabase.from("districts").select("id, name").order("name"),
      supabase
        .from("skills")
        .select("id, name, icon, sort_order, active")
        .eq("active", true)
        .order("sort_order"),
    ]);
    districts = (districtResult.data as District[] | null) ?? [];
    skills = (skillResult.data as Skill[] | null) ?? [];
  } catch {
    districts = [];
    skills = [];
  }

  return (
    <AuthShell
      title={role === "worker" ? "Ажил хийгчээр бүртгүүлэх" : "Захиалагчаар бүртгүүлэх"}
      subtitle={
        role === "worker"
          ? "Чөлөөт өдрөө тэмдэглээд ажил хүлээн авна."
          : "Ажил зарлаад тохирох ажилтныг олно."
      }
      footer={
        <span>
          {role === "worker" ? "Ажил захиалах уу? " : "Ажил хийх үү? "}
          <Link
            href={role === "worker" ? "/register?role=customer" : "/register?role=worker"}
            className="text-primary underline underline-offset-2"
          >
            {role === "worker" ? "Захиалагчаар бүртгүүлэх" : "Ажил хийгчээр бүртгүүлэх"}
          </Link>
        </span>
      }
      aside={
        <AuthAside
          steps={[
            {
              title: role === "worker" ? "Чөлөөт өдрөө бич" : "Ажлаа зарла",
              body:
                role === "worker"
                  ? "Хэзээ, ямар мэргэжилтэйгээ сонгоод чөлөөт өдрөө тэмдэглэнэ."
                  : "Ямар ажил, хэзээ, хаана хийлгэхээ бичээрэй.",
            },
            {
              title: "Админ утсаар ярилцана",
              body: "Бид утсаар холбогдож, тохирох ажилтныг олохын тулд ярилцана.",
            },
            {
              title: "Ажил амжилттай",
              body:
                role === "worker"
                  ? "Ажил баталгаажвал хаяг, холбоо барих мэдээлэл чинь харагдана."
                  : "Ажилтан баталгаажмагц таны хаяг түүнд харагдана.",
            },
          ]}
        />
      }
    >
      <RegisterForm role={role} districts={districts} skills={skills} />
    </AuthShell>
  );
}
