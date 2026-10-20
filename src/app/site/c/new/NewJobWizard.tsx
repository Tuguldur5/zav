"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TopAppBar } from "@/components/ui/TopAppBar";
import { Stepper } from "@/components/ui/Stepper";
import { createJobAction, type JobFormState } from "@/app/site/c/actions";
import { formatShortDateMn, formatMoney, todayISO } from "@/lib/dates";
import { slotLabels } from "@/lib/status";
import type { District, Skill } from "@/lib/types";
import { emptyWizard, type WizardData } from "./types";
import { StepAddress, StepDate, StepNote, StepPay, StepReview, StepSkill } from "./WizardSteps";

const labels = ["Мэргэжил", "Огноо", "Хаяг", "Төлбөр", "Тэмдэглэл", "Хянах"];

export function NewJobWizard({ skills, districts }: { skills: Skill[]; districts: District[] }) {
  const [data, setData] = useState<WizardData>(emptyWizard);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [state, formAction, pending] = useActionState<JobFormState, FormData>(createJobAction, {});

  const update = (patch: Partial<WizardData>) => {
    setData((current) => ({ ...current, ...patch }));
    setError("");
  };

  const title = useMemo(
    () => (data.skillName ? `${data.skillName} — ${formatShortDateMn(data.jobDate)}` : ""),
    [data.skillName, data.jobDate],
  );

  function validateStep(current: number): string {
    if (current === 0 && !data.skillId) return "Мэргэжлээ сонгоно уу";
    if (current === 1) {
      if (!data.jobDate) return "Огноогоо сонгоно уу";
      if (data.jobDate < todayISO()) return "Өнгөрсөн өдөр сонгох боломжгүй";
    }
    if (current === 2) {
      if (!data.districtId) return "Дүүргээ сонгоно уу";
      if (data.addressNote.trim().length < 3) return "Хаягаа оруулна уу";
    }
    if (current === 3 && data.payMode === "amount" && Number(data.payOffer) <= 0) {
      return "Төлбөрийн дүнгээ оруулна уу";
    }
    return "";
  }

  function next() {
    const problem = validateStep(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setStep((value) => Math.min(labels.length - 1, value + 1));
  }

  function back() {
    setError("");
    setStep((value) => Math.max(0, value - 1));
  }

  if (state.ok && state.jobId) {
    return (
      <>
        <TopAppBar title="Зар илгээгдлээ" />
        <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-10 text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-success-container text-success">
            <Check aria-hidden className="size-11" />
          </span>
          <h2 className="text-[1.35em] font-semibold">Зар илгээгдлээ</h2>
          <p className="text-muted">
            Манай админ удахгүй хүлээж аваад, тохирох ажилтныг хайж эхэлнэ. Ажилтан баталгаажмагц
            танд мэдэгдэнэ.
          </p>
          <div className="flex w-full flex-col gap-2">
            <Link href={`/c/jobs/${state.jobId}`} className="w-full">
              <Button full>Зарыг харах</Button>
            </Link>
            <Link href="/c" className="w-full">
              <Button variant="outline" full>
                Нүүр хуудас
              </Button>
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopAppBar title="Зар үүсгэх" backHref="/c" />
      <main className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-6 px-4 pt-4 sm:px-6 lg:grid-cols-[minmax(0,720px)_minmax(0,1fr)] lg:pt-6">
        <section className="flex flex-col gap-4">
          <Stepper steps={labels} current={step} />

          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="skillId" value={data.skillId} />
            <input type="hidden" name="jobDate" value={data.jobDate} />
            <input type="hidden" name="jobSlot" value={data.jobSlot} />
            <input type="hidden" name="districtId" value={data.districtId} />
            <input type="hidden" name="addressNote" value={data.addressNote} />
            <input type="hidden" name="workersNeeded" value={data.workersNeeded} />
            <input type="hidden" name="payMode" value={data.payMode} />
            <input type="hidden" name="payOffer" value={data.payOffer} />
            <input type="hidden" name="description" value={data.description} />
            <input type="hidden" name="title" value={title} />

            {state.error || state.fieldErrors ? (
              <p
                role="alert"
                className="rounded-md bg-error-container px-3 py-2 text-[0.9em] text-error"
              >
                {state.error ?? Object.values(state.fieldErrors ?? {})[0]}
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="rounded-md bg-warm px-3 py-2 text-[0.9em] text-warm-ink">
                {error}
              </p>
            ) : null}

            {step === 0 ? <StepSkill skills={skills} data={data} update={update} /> : null}
            {step === 1 ? <StepDate data={data} update={update} /> : null}
            {step === 2 ? <StepAddress districts={districts} data={data} update={update} /> : null}
            {step === 3 ? <StepPay data={data} update={update} /> : null}
            {step === 4 ? <StepNote data={data} update={update} /> : null}
            {step === 5 ? <StepReview data={data} districts={districts} onEdit={setStep} /> : null}

            <div className="flex gap-2 pt-2">
              {step > 0 ? (
                <Button
                  variant="outline"
                  onClick={back}
                  icon={<ArrowLeft aria-hidden className="size-5" />}
                >
                  Буцах
                </Button>
              ) : (
                <Link href="/c">
                  <Button variant="outline">Болих</Button>
                </Link>
              )}
              {step < labels.length - 1 ? (
                <Button full onClick={next} icon={<ArrowRight aria-hidden className="size-5" />}>
                  Үргэлжлүүлэх
                </Button>
              ) : (
                <Button
                  type="submit"
                  full
                  loading={pending}
                  disabled={!title}
                  icon={<Send aria-hidden className="size-5" />}
                >
                  Илгээх
                </Button>
              )}
            </div>
          </form>
        </section>

        {/* Live summary of the choices so far (>=1024px). */}
        <aside className="hidden flex-col gap-4 lg:flex">
          <div className="rounded-lg border border-divider bg-surface p-4">
            <p className="mb-3 text-[0.9em] font-semibold">Таны сонголт</p>
            <dl className="flex flex-col gap-2 text-[0.9em]">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Мэргэжил</dt>
                <dd className="text-right font-medium">{data.skillName ?? "—"}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Огноо</dt>
                <dd className="text-right font-medium">
                  {data.jobDate ? formatShortDateMn(data.jobDate) : "—"}
                  {data.jobDate ? ` · ${slotLabels[data.jobSlot]}` : ""}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Дүүрэг</dt>
                <dd className="text-right font-medium">
                  {districts.find((item) => item.id === data.districtId)?.name ?? "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Хаяг</dt>
                <dd className="text-right font-medium">
                  {data.addressNote.trim() ? data.addressNote : "—"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Ажилтаны тоо</dt>
                <dd className="text-right font-medium">{data.workersNeeded}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Төлбөр</dt>
                <dd className="text-right font-medium">
                  {data.payMode === "negotiate" || !data.payOffer
                    ? "Тохиролцоно"
                    : formatMoney(Number(data.payOffer))}
                </dd>
              </div>
            </dl>
          </div>
          <div className="rounded-lg border border-divider bg-surface p-4 text-[0.9em] text-muted">
            Илгээсний дараа манай админ зарыг хүлээж аваад, тохирох ажилтныг утсаар ярилцана.
          </div>
        </aside>
      </main>
    </>
  );
}
