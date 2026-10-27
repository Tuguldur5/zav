"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, Minus, Plus } from "lucide-react";
import { createJobAction, type JobFormState } from "../actions";
import { addDaysISO, formatShortDateMn, formatMoney, todayISO } from "@/lib/dates";
import { slotLabels } from "@/lib/status";
import type { District, Skill } from "@/lib/types";
import { skillIcon } from "@/components/public/SkillIcon";
import { Container, Card, buttonCls, cx, inputCls, Note } from "@/components/public/ui";
import { mn } from "@/lib/i18n/mn";

type Slot = "full" | "am" | "pm";

type Data = {
  skillId: string;
  skillName: string;
  jobDate: string;
  jobSlot: Slot;
  districtId: string;
  addressNote: string;
  workersNeeded: number;
  payMode: "negotiate" | "amount";
  payOffer: string;
  description: string;
};

const STEPS = mn.app.orderSteps;

export function OrderWizard({
  skills,
  districts,
  initialSkillId,
  initialDistrictId,
  initialJobDate,
}: {
  skills: Skill[];
  districts: District[];
  initialSkillId?: string;
  initialDistrictId?: string;
  initialJobDate?: string;
}) {
  const initialSkill = skills.find((skill) => skill.id === initialSkillId);
  const [data, setData] = useState<Data>({
    skillId: initialSkill?.id ?? "",
    skillName: initialSkill?.name ?? "",
    jobDate: initialJobDate ?? "",
    jobSlot: "full",
    districtId: initialDistrictId ?? "",
    addressNote: "",
    workersNeeded: 1,
    payMode: "negotiate",
    payOffer: "",
    description: "",
  });
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [checks, setChecks] = useState({ declaration: false, truth: false, consents: false });
  const [state, formAction, pending] = useActionState<JobFormState, FormData>(createJobAction, {});

  const update = (patch: Partial<Data>) => {
    setData((current) => ({ ...current, ...patch }));
    setError("");
  };

  function validate(current: number): string {
    if (current === 0 && !data.skillId) return "Ажлын төрлөө сонгоно уу";
    if (current === 1) {
      if (!data.jobDate) return "Огноогоо сонгоно уу";
      if (data.jobDate < todayISO()) return "Өнгөрсөн өдөр сонгох боломжгүй";
    }
    if (current === 2) {
      if (!data.districtId) return "Дүүргээ сонгоно уу";
      if (data.addressNote.trim().length < 3) return "Хаягаа оруулна уу";
    }
    if (current === 4) {
      if (data.payMode === "amount" && Number(data.payOffer) <= 0)
        return "Төлбөрийн дүнгээ оруулна уу";
    }
    return "";
  }

  function next() {
    const problem = validate(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setStep((value) => Math.min(6, value + 1));
  }

  if (state.ok && state.jobId) {
    return (
      <Container className="max-w-[720px] py-10">
        <Card className="public-order-success flex flex-col gap-3 p-6">
          <p className="flex items-center gap-2 text-[1.05em] font-semibold text-ok">
            <Check aria-hidden className="size-5" /> Захиалга илгээгдлээ
          </p>
          <p className="text-[0.95em] text-muted">
            Манай админ удахгүй хүлээж аваад таны өгсөн утсаар холбогдож, тохирох ажилтныг хайж
            эхэлнэ. Ажилтан баталгаажмагц энэ хуудсанд харагдана.
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Link href={`/c/jobs/${state.jobId}`} className={buttonCls("primary", true)}>
              Захиалгаа харах
            </Link>
            <Link href="/c" className={buttonCls("secondary", true)}>
              Миний захиалгууд
            </Link>
          </div>
        </Card>
      </Container>
    );
  }

  const districtName = districts.find((item) => item.id === data.districtId)?.name ?? "—";
  const allChecked = checks.declaration && checks.truth && checks.consents;

  const summary = (
    <dl className="flex flex-col gap-2 text-[0.9em]">
      {[
        ["Ажил", data.skillName || "—"],
        ["Огноо", data.jobDate ? `${formatShortDateMn(data.jobDate)} · ${slotLabels[data.jobSlot]}` : "—"],
        ["Дүүрэг", districtName],
        ["Хаяг", data.addressNote || "—"],
        ["Ажилтны тоо", `${data.workersNeeded}`],
        [
          "Төлбөр",
          data.payMode === "negotiate" || !data.payOffer
            ? "Тохиролцоно"
            : formatMoney(Number(data.payOffer)),
        ],
      ].map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-3">
          <dt className="text-muted">{label}</dt>
          <dd className="max-w-[60%] break-words text-right font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <Container className="py-6 sm:py-8">
      <div className="flex flex-col gap-1">
        <h1 className="public-page-title">
          Ажил захиалах
        </h1>
        <p className="text-[0.95em] text-muted">
          Гурван алхам. Админ утсаар холбогдож баталгаажуулна.
        </p>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,700px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <ol className="public-order-steps flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.85em]">
            {STEPS.map((label, index) => (
              <li
                key={label}
                aria-current={index === step ? "step" : undefined}
                className={cx(
                  "flex items-center gap-1.5",
                  index === step ? "font-medium text-primary" : "text-muted",
                )}
              >
                <span
                  className={cx(
                    "flex size-5 items-center justify-center rounded-[4px] border text-[0.72em]",
                    index <= step ? "border-primary text-primary" : "border-divider",
                  )}
                >
                  {index + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>

          <form action={formAction} className="flex flex-col gap-5">
            <input type="hidden" name="skillId" value={data.skillId} />
            <input type="hidden" name="jobDate" value={data.jobDate} />
            <input type="hidden" name="jobSlot" value={data.jobSlot} />
            <input type="hidden" name="districtId" value={data.districtId} />
            <input type="hidden" name="addressNote" value={data.addressNote} />
            <input type="hidden" name="workersNeeded" value={data.workersNeeded} />
            <input type="hidden" name="payMode" value={data.payMode} />
            <input type="hidden" name="payOffer" value={data.payOffer} />
            <input type="hidden" name="description" value={data.description} />
            <input type="hidden" name="declaration" value={checks.declaration ? "on" : ""} />
            <input type="hidden" name="truth" value={checks.truth ? "on" : ""} />
            <input type="hidden" name="consents" value={checks.consents ? "on" : ""} />

            {state.error ? <Note tone="err">{state.error}</Note> : null}
            {error ? <Note tone="warn">{error}</Note> : null}

            {step === 0 ? (
              <fieldset className="flex flex-col gap-3">
                <legend className="text-[0.95em] font-medium">Ямар ажил хийлгэх вэ?</legend>
                <div className="public-order-skill-grid">
                  {skills.map((skill) => {
                    const Icon = skillIcon(skill.icon);
                    const active = data.skillId === skill.id;
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => update({ skillId: skill.id, skillName: skill.name })}
                        aria-pressed={active}
                        className={cx(
                          "public-order-skill",
                          active && "is-selected",
                        )}
                      >
                        <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            {step === 1 ? (
              <div className="flex flex-col gap-5">
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-[0.95em] font-medium">Хэзээ?</legend>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: todayISO(), label: "Өнөөдөр" },
                      { value: addDaysISO(todayISO(), 1), label: "Маргааш" },
                    ].map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => update({ jobDate: option.value })}
                        aria-pressed={data.jobDate === option.value}
                        className={cx(
                          "min-h-[44px] rounded-[8px] border px-3 text-[0.9em]",
                          data.jobDate === option.value
                            ? "border-primary bg-primary-soft font-medium text-primary-ink"
                            : "border-divider bg-surface",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <label className="mt-1 flex flex-col gap-1 text-[0.9em]">
                    Өөр өдөр
                    <input
                      type="date"
                      min={todayISO()}
                      value={data.jobDate}
                      onChange={(event) => update({ jobDate: event.target.value })}
                      className={inputCls}
                    />
                  </label>
                </fieldset>

                <fieldset className="flex flex-col gap-2">
                  <legend className="text-[0.95em] font-medium">Өдрийн аль хэсэгт?</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {(["full", "am", "pm"] as Slot[]).map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => update({ jobSlot: slot })}
                        aria-pressed={data.jobSlot === slot}
                        className={cx(
                          "min-h-[44px] rounded-[8px] border text-[0.88em]",
                          data.jobSlot === slot
                            ? "border-primary bg-primary-soft font-medium text-primary-ink"
                            : "border-divider bg-surface",
                        )}
                      >
                        {slotLabels[slot]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="flex flex-col gap-5">
                <label className="flex flex-col gap-1 text-[0.9em]">
                  Дүүрэг
                  <select
                    value={data.districtId}
                    onChange={(event) => update({ districtId: event.target.value })}
                    className={inputCls}
                  >
                    <option value="" disabled>
                      Сонгоно уу
                    </option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-[0.9em]">
                  Хаягийн тэмдэглэл
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={data.addressNote}
                    onChange={(event) => update({ addressNote: event.target.value })}
                    placeholder="Хороо, байр, орц, тоот"
                    className={inputCls}
                  />
                  <span className="text-[0.82em] text-muted">
                    Зөвхөн баталгаажсаны дараа ажилтанд харагдана.
                  </span>
                </label>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="flex flex-col gap-5">
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-[0.9em] font-medium">Ажилтны тоо</legend>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => update({ workersNeeded: Math.max(1, data.workersNeeded - 1) })}
                      disabled={data.workersNeeded <= 1}
                      className="flex size-11 items-center justify-center rounded-[8px] border border-outline disabled:opacity-40"
                      aria-label="Хасах"
                    >
                      <Minus aria-hidden className="size-4" />
                    </button>
                    <span className="w-8 text-center font-medium" aria-live="polite">
                      {data.workersNeeded}
                    </span>
                    <button
                      type="button"
                      onClick={() => update({ workersNeeded: Math.min(10, data.workersNeeded + 1) })}
                      disabled={data.workersNeeded >= 10}
                      className="flex size-11 items-center justify-center rounded-[8px] border border-outline disabled:opacity-40"
                      aria-label="Нэмэх"
                    >
                      <Plus aria-hidden className="size-4" />
                    </button>
                  </div>
                </fieldset>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="flex flex-col gap-5">
                <fieldset className="flex flex-col gap-2">
                  <legend className="text-[0.9em] font-medium">Хөлс</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ["negotiate", "Тохиролцоно"],
                        ["amount", "Дүн оруулах"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => update({ payMode: value })}
                        aria-pressed={data.payMode === value}
                        className={cx(
                          "min-h-[44px] rounded-[8px] border text-[0.9em]",
                          data.payMode === value
                            ? "border-primary bg-primary-soft font-medium text-primary-ink"
                            : "border-divider bg-surface",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {data.payMode === "amount" ? (
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1000}
                      value={data.payOffer}
                      onChange={(event) => update({ payOffer: event.target.value })}
                      placeholder="50000"
                      className={inputCls}
                      aria-label="Санал болгож буй төлбөр"
                    />
                  ) : null}
                </fieldset>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="flex flex-col gap-5">
                <label className="flex flex-col gap-1 text-[0.9em]">
                  Нэмэлт тайлбар (заавал биш)
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={data.description}
                    onChange={(event) => update({ description: event.target.value })}
                    className={inputCls}
                    placeholder="Жишээ: гал тогоо, угаалгын өрөө цэвэрлэх."
                  />
                  <span className="text-[0.82em] text-muted">{data.description.length}/500</span>
                </label>
              </div>
            ) : null}

            {step === 6 ? (
              <div className="flex flex-col gap-5">
                <Card className="public-order-review p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.95em] font-medium">Таны захиалга</p>
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="text-[0.85em] text-primary underline underline-offset-2"
                    >
                      Засах
                    </button>
                  </div>
                  <div className="mt-3">{summary}</div>
                </Card>

                <fieldset className="flex flex-col gap-3 rounded-[8px] border border-divider p-4">
                  <legend className="px-1 text-[0.85em] font-medium text-muted">
                    Баталгаажуулалт
                  </legend>
                  {(
                    [
                      ["declaration", "Би өөрөө ажил хийлгэх хүн мөн. Энэ нь ажил хайж буй хүний зар биш."],
                      ["truth", "Би өгсөн мэдээллээ (хаяг, огноо, ажлын тайлбар) үнэн зөв гэж баталж байна."],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-start gap-2 text-[0.92em]">
                      <input
                        type="checkbox"
                        checked={checks[key]}
                        onChange={(event) =>
                          setChecks((current) => ({ ...current, [key]: event.target.checked }))
                        }
                        className="mt-0.5 size-5 shrink-0"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                  <label className="flex items-start gap-2 text-[0.92em]">
                    <input
                      type="checkbox"
                      checked={checks.consents}
                      onChange={(event) =>
                        setChecks((current) => ({ ...current, consents: event.target.checked }))
                      }
                      className="mt-0.5 size-5 shrink-0"
                    />
                    <span>
                      Би{" "}
                      <Link href="/terms" target="_blank" className="text-primary underline underline-offset-2">
                        Үйлчилгээний нөхцөл
                      </Link>{" "}
                      болон{" "}
                      <Link href="/privacy" target="_blank" className="text-primary underline underline-offset-2">
                        Нууцлалын бодлогыг
                      </Link>{" "}
                      уншиж, зөвшөөрч байна.
                    </span>
                  </label>
                </fieldset>

                <Note>Манай админ таны өгсөн утсаар холбогдож захиалгыг баталгаажуулна.</Note>
              </div>
            ) : null}

            <div className="flex gap-2">
              {step > 0 ? (
                <button type="button" onClick={() => setStep((value) => value - 1)} className={buttonCls("secondary")}>
                  Буцах
                </button>
              ) : (
                <Link href="/c" className={buttonCls("secondary")}>
                  Болих
                </Link>
              )}
              {step < 6 ? (
                <button type="button" onClick={next} className={buttonCls("primary", true)}>
                  Үргэлжлүүлэх
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!allChecked || pending}
                  className={buttonCls("primary", true)}
                >
                  {pending ? "Илгээж байна…" : "Ажил захиалах"}
                </button>
              )}
            </div>
          </form>
        </div>

        <aside className="hidden lg:block">
          <Card className="public-order-summary sticky top-6 p-4">
            <p className="text-[0.9em] font-medium">Таны сонголт</p>
            <div className="mt-3">{summary}</div>
            <p className="mt-4 border-t border-divider pt-3 text-[0.82em] text-muted">
              Илгээсний дараа админ утсаар холбогдоно. Хөлсийг ажилтантай шууд тохиролцоно.
            </p>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
