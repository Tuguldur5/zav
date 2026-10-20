"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { setAdminScopesAction } from "@/lib/actions/super";

type Option = { id: string; name: string };

export function ScopesEditor({
  adminId,
  skills,
  districts,
  initialSkillIds,
  initialDistrictIds,
}: {
  adminId: string;
  skills: Option[];
  districts: Option[];
  initialSkillIds: string[];
  initialDistrictIds: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [skillIds, setSkillIds] = useState<string[]>(initialSkillIds);
  const [districtIds, setDistrictIds] = useState<string[]>(initialDistrictIds);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function toggle(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((value) => value !== id) : [...list, id];
  }

  async function save() {
    setBusy(true);
    const result = await setAdminScopesAction(adminId, skillIds, districtIds);
    setBusy(false);
    setMessage({
      text: result.ok ? "Хүрээ хадгалагдлаа" : (result.error ?? "Алдаа гарлаа"),
      ok: result.ok,
    });
    if (result.ok) router.refresh();
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Мэргэжил, дүүргийн хүрээ
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-container p-3">
      <fieldset>
        <legend className="mb-1 text-[0.9em] font-semibold">Мэргэжил</legend>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <label
              key={skill.id}
              className="flex min-h-11 items-center gap-2 rounded-md border border-outline px-3 text-[0.9em]"
            >
              <input
                type="checkbox"
                checked={skillIds.includes(skill.id)}
                onChange={() => setSkillIds((current) => toggle(current, skill.id))}
                className="size-5"
              />
              {skill.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-[0.9em] font-semibold">Дүүрэг</legend>
        <div className="flex flex-wrap gap-2">
          {districts.map((district) => (
            <label
              key={district.id}
              className="flex min-h-11 items-center gap-2 rounded-md border border-outline px-3 text-[0.9em]"
            >
              <input
                type="checkbox"
                checked={districtIds.includes(district.id)}
                onChange={() => setDistrictIds((current) => toggle(current, district.id))}
                className="size-5"
              />
              {district.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} loading={busy}>
          Хадгалах
        </Button>
        <Button variant="text" onClick={() => setOpen(false)}>
          Хаах
        </Button>
      </div>
      {message ? (
        <p className={message.ok ? "text-[0.9em] text-success" : "text-[0.9em] text-error"}>
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
