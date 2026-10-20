"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Snackbar } from "@/components/ui/Snackbar";
import { inputClass } from "@/components/ui/styles";
import { addDistrictAction, addSkillAction, setSkillActiveAction } from "@/lib/actions/super";

type SkillRow = { id: string; name: string; icon: string; sort_order: number; active: boolean };
type DistrictRow = { id: string; name: string };

export function CatalogManager({
  skills,
  districts,
}: {
  skills: SkillRow[];
  districts: DistrictRow[];
}) {
  const router = useRouter();
  const [skillName, setSkillName] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  function notify(ok: boolean, message: string) {
    setSnack({ message, tone: ok ? "success" : "error" });
    if (ok) router.refresh();
  }

  async function createSkill() {
    if (!skillName.trim()) return;
    setBusy(true);
    const result = await addSkillAction(skillName.trim(), "Sparkles");
    setBusy(false);
    notify(result.ok, result.ok ? "Мэргэжил нэмлээ" : (result.error ?? "Алдаа гарлаа"));
    if (result.ok) setSkillName("");
  }

  async function createDistrict() {
    if (!districtName.trim()) return;
    setBusy(true);
    const result = await addDistrictAction(districtName.trim());
    setBusy(false);
    notify(result.ok, result.ok ? "Дүүрэг нэмлээ" : (result.error ?? "Алдаа гарлаа"));
    if (result.ok) setDistrictName("");
  }

  async function toggleSkill(skill: SkillRow) {
    const result = await setSkillActiveAction(skill.id, !skill.active);
    notify(
      result.ok,
      result.ok
        ? skill.active
          ? "Устгасан төлөвтэй боллоо"
          : "Идэвхтэй боллоо"
        : (result.error ?? "Алдаа гарлаа"),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <p className="font-semibold">Мэргэжлүүд ({skills.length})</p>
        <ul className="flex flex-col gap-2">
          {skills.map((skill) => (
            <li
              key={skill.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-container px-3 py-2"
            >
              <span className="flex items-center gap-2">
                <span className={`font-medium ${skill.active ? "" : "text-muted line-through"}`}>
                  {skill.name}
                </span>
                <span className="text-[0.8em] text-muted">#{skill.sort_order}</span>
              </span>
              <Button
                variant={skill.active ? "outline" : "tonal"}
                onClick={() => toggleSkill(skill)}
              >
                {skill.active ? (
                  <>
                    <X aria-hidden className="size-4" /> Идэвхгүй болгох
                  </>
                ) : (
                  <>
                    <Check aria-hidden className="size-4" /> Идэвхтэй болгох
                  </>
                )}
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="skill-name">
            Шинэ мэргэжлийн нэр
          </label>
          <input
            id="skill-name"
            value={skillName}
            onChange={(event) => setSkillName(event.target.value)}
            placeholder="Шинэ мэргэжил"
            className={`${inputClass} min-h-11 flex-1`}
          />
          <Button
            loading={busy}
            onClick={createSkill}
            icon={<Plus aria-hidden className="size-5" />}
          >
            Нэмэх
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="font-semibold">Дүүрэг ({districts.length})</p>
        <div className="flex flex-wrap gap-2">
          {districts.map((district) => (
            <span
              key={district.id}
              className="rounded-full border border-outline px-3 py-1 text-[0.9em]"
            >
              {district.name}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="district-name">
            Шинэ дүүргийн нэр
          </label>
          <input
            id="district-name"
            value={districtName}
            onChange={(event) => setDistrictName(event.target.value)}
            placeholder="Шинэ дүүрэг"
            className={`${inputClass} min-h-11 flex-1`}
          />
          <Button
            loading={busy}
            onClick={createDistrict}
            icon={<Plus aria-hidden className="size-5" />}
          >
            Нэмэх
          </Button>
        </div>
      </Card>

      <Snackbar
        open={Boolean(snack)}
        message={snack?.message ?? ""}
        tone={snack?.tone ?? "success"}
        onClose={() => setSnack(null)}
      />
    </div>
  );
}
