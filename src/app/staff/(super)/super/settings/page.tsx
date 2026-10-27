import { LifeBuoy } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PageHeader, PageTabs, StaffNote, settingsTabs } from "@/components/staff";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SuperSettingsPage() {
  const { supabase } = await requireRole(["super_admin"]);
  const { data } = await supabase.from("settings").select("key, value");
  const rows = (data as Array<{ key: string; value: unknown }> | null) ?? [];
  const phone = String(rows.find((row) => row.key === "support_phone")?.value ?? "");
  const text = String(rows.find((row) => row.key === "support_text")?.value ?? "");

  return (
    <>
      <PageHeader title="Тохиргоо" subtitle="Тусламжийн мэдээлэл — бүх хэрэглэгчийн «Тусламж» товч дээр харагдана" />
      <PageTabs label="Тохиргооны хэсэг" active="/super/settings" tabs={settingsTabs} />
      <StaffNote>
        <LifeBuoy aria-hidden className="size-4 shrink-0" />
        Энэ утас бүх хэрэглэгчийн «Тусламж» товч дээр харагдана.
      </StaffNote>
      <SettingsForm initialPhone={phone} initialText={text} />
    </>
  );
}
