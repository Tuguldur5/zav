"use client";

import { Check, Minus, Plus } from "lucide-react";
import { addDaysISO, formatDateMn, formatMoney, todayISO } from "@/lib/dates";
import { inputClass } from "@/components/ui/styles";
import { slotLabels } from "@/lib/status";
import type { District, Skill } from "@/lib/types";
import type { JobSlot, WizardData } from "./types";

type Update = (patch: Partial<WizardData>) => void;

function choiceClass(active: boolean, extra = ""): string {
  return `press flex min-h-16 items-center gap-3 rounded-md border-2 px-4 text-left text-[1.05em] font-semibold ${
    active
      ? "border-primary bg-primary-container text-on-primary-container"
      : "border-outline bg-surface text-ink"
  } ${extra}`;
}

export function StepSkill({
  skills,
  data,
  update,
}: {
  skills: Skill[];
  data: WizardData;
  update: Update;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className=" font-semibold">Ямар ажил хийлгэх вэ?</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {skills.map((skill) => {
          const active = data.skillId === skill.id;
          return (
            <button
              key={skill.id}
              type="button"
              onClick={() => update({ skillId: skill.id, skillName: skill.name })}
              className={choiceClass(active)}
              aria-pressed={active}
            >
              <span className="flex-1">{skill.name}</span>
              {active ? <Check aria-hidden className="size-5" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StepDate({ data, update }: { data: WizardData; update: Update }) {
  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);
  const slots: JobSlot[] = ["full", "am", "pm"];

  return (
    <div className="flex flex-col gap-4">
      <p className=" font-semibold">Хэзээ ажил хийлгэх вэ?</p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => update({ jobDate: today })}
          className={choiceClass(data.jobDate === today)}
        >
          Өнөөдөр
          <span className="ml-auto text-[0.9em] font-normal">{formatDateMn(today)}</span>
        </button>
        <button
          type="button"
          onClick={() => update({ jobDate: tomorrow })}
          className={choiceClass(data.jobDate === tomorrow)}
        >
          Маргааш
          <span className="ml-auto text-[0.9em] font-normal">{formatDateMn(tomorrow)}</span>
        </button>
        <label className="flex flex-col gap-1 text-[0.9em] font-medium">
          Өөр өдөр
          <input
            type="date"
            value={data.jobDate}
            min={today}
            onChange={(event) => update({ jobDate: event.target.value })}
            className={inputClass}
          />
        </label>
      </div>

      <p className=" font-semibold">Өдрийн аль хэсэгт?</p>
      <div className="flex flex-col gap-2">
        {slots.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => update({ jobSlot: slot })}
            className={choiceClass(data.jobSlot === slot)}
            aria-pressed={data.jobSlot === slot}
          >
            {slotLabels[slot]}
            {data.jobSlot === slot ? <Check aria-hidden className="ml-auto size-5" /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StepAddress({
  districts,
  data,
  update,
}: {
  districts: District[];
  data: WizardData;
  update: Update;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className=" font-semibold">Хаана ажил хийлгэх вэ?</p>
      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        Дүүрэг
        <select
          value={data.districtId}
          onChange={(event) => update({ districtId: event.target.value })}
          className={inputClass}
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
      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        Хаяг
        <textarea
          value={data.addressNote}
          onChange={(event) => update({ addressNote: event.target.value })}
          rows={3}
          maxLength={300}
          placeholder="Хороо, байр, орц, тоот"
          className={inputClass}
        />
        <span className="text-[0.8em] text-muted">
          Ажилтанд зөвхөн баталгаажсаны дараа харагдана.
        </span>
      </label>
    </div>
  );
}

export function StepPay({ data, update }: { data: WizardData; update: Update }) {
  return (
    <div className="flex flex-col gap-4">
      <p className=" font-semibold">Хэдэн хүн, ямар төлбөртэй вэ?</p>

      <div className="flex items-center justify-between gap-3 rounded-md border border-outline p-3">
        <span className="font-medium">Ажилтны тоо</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => update({ workersNeeded: Math.max(1, data.workersNeeded - 1) })}
            disabled={data.workersNeeded <= 1}
            className="press flex size-12 items-center justify-center rounded-full border border-outline disabled:opacity-40"
            aria-label="Хасах"
          >
            <Minus aria-hidden className="size-5" />
          </button>
          <span className="w-8 text-center text-[1.2em] font-semibold" aria-live="polite">
            {data.workersNeeded}
          </span>
          <button
            type="button"
            onClick={() => update({ workersNeeded: Math.min(10, data.workersNeeded + 1) })}
            disabled={data.workersNeeded >= 10}
            className="press flex size-12 items-center justify-center rounded-full border border-outline disabled:opacity-40"
            aria-label="Нэмэх"
          >
            <Plus aria-hidden className="size-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => update({ payMode: "negotiate" })}
          className={choiceClass(data.payMode === "negotiate", "")}
          aria-pressed={data.payMode === "negotiate"}
        >
          Тохиролцоно
        </button>
        <button
          type="button"
          onClick={() => update({ payMode: "amount" })}
          className={choiceClass(data.payMode === "amount", "")}
          aria-pressed={data.payMode === "amount"}
        >
          Үнэ оруулах
        </button>
      </div>

      {data.payMode === "amount" ? (
        <label className="flex flex-col gap-1 text-[0.9em] font-medium">
          Санал болгож буй төлбөр (₮)
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            value={data.payOffer}
            onChange={(event) => update({ payOffer: event.target.value })}
            className={inputClass}
            placeholder="50000"
          />
        </label>
      ) : (
        <p className="rounded-md bg-container px-3 py-2 text-[0.9em]">
          Админ ажилтантай ярилцаж үнийг тохиролцуулна.
        </p>
      )}

      {data.payMode === "amount" && data.payOffer ? (
        <p className="text-[0.9em] text-muted">
          Сонгосон төлбөр: {formatMoney(Number(data.payOffer))}
        </p>
      ) : null}
    </div>
  );
}

export function StepNote({ data, update }: { data: WizardData; update: Update }) {
  return (
    <div className="flex flex-col gap-3">
      <p className=" font-semibold">Нэмэлт тэмдэглэл (заавал биш)</p>
      <textarea
        value={data.description}
        onChange={(event) => update({ description: event.target.value })}
        rows={5}
        maxLength={500}
        placeholder="Жишээ: гал тогоо, угаалгын өрөө цэвэрлэх. Материал бэлэн."
        className={inputClass}
      />
      <p className="text-[0.8em] text-muted">{data.description.length}/500</p>
    </div>
  );
}

export function StepReview({
  data,
  districts,
  onEdit,
}: {
  data: WizardData;
  districts: District[];
  onEdit: (step: number) => void;
}) {
  const district = districts.find((item) => item.id === data.districtId)?.name ?? "—";
  const rows: Array<{ label: string; value: string; step: number }> = [
    { label: "Мэргэжил", value: data.skillName || "—", step: 0 },
    {
      label: "Огноо",
      value: `${formatDateMn(data.jobDate)} · ${slotLabels[data.jobSlot]}`,
      step: 1,
    },
    { label: "Дүүрэг, хаяг", value: `${district}, ${data.addressNote}`, step: 2 },
    {
      label: "Ажилтны тоо",
      value: `${data.workersNeeded} хүн`,
      step: 3,
    },
    {
      label: "Төлбөр",
      value: data.payMode === "negotiate" ? "Тохиролцоно" : formatMoney(Number(data.payOffer || 0)),
      step: 3,
    },
    { label: "Тэмдэглэл", value: data.description || "—", step: 4 },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className=" font-semibold">Бүх зүйл зөв үү?</p>
      <dl className="flex flex-col divide-y divide-container rounded-md border border-container">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 px-3 py-3">
            <div className="min-w-0">
              <dt className="text-[0.8em] text-muted">{row.label}</dt>
              <dd className="break-words font-medium">{row.value}</dd>
            </div>
            <button
              type="button"
              onClick={() => onEdit(row.step)}
              className="press min-h-10 shrink-0 text-[0.9em] font-medium text-primary underline underline-offset-2"
            >
              Засах
            </button>
          </div>
        ))}
      </dl>
      <p className="rounded-md bg-container px-3 py-2 text-[0.9em]">
        Илгээсний дараа манай админ зарыг хүлээж аваад тохирох ажилтныг хайна.
      </p>
    </div>
  );
}
