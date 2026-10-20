import { Package } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageTitle } from "@/components/staff";
import type { District, Skill } from "@/lib/types";
import { CatalogManager } from "./CatalogManager";

export const dynamic = "force-dynamic";

export default async function SuperCatalogPage() {
  const { supabase } = await requireRole(["super_admin"]);
  const [skillsResult, districtsResult] = await Promise.all([
    supabase.from("skills").select("*").order("sort_order"),
    supabase.from("districts").select("*").order("name"),
  ]);
  const skills = (skillsResult.data as Skill[] | null) ?? [];
  const districts = (districtsResult.data as District[] | null) ?? [];

  return (
    <>
      <PageTitle title="Каталог" subtitle={`Мэргэжил ${skills.length} · дүүрэг ${districts.length}`} />
      <p className="staff-banner">
        <Package aria-hidden className="size-4 shrink-0" />
        Идэвхгүй мэргэжил шинэ зар дээр харагдахгүй, одоогийн зарыг өөрчлөхгүй.
      </p>
      <CatalogManager skills={skills} districts={districts} />
    </>
  );
}
