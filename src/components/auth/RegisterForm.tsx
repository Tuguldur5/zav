"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff } from "lucide-react";
import { registerAction } from "@/lib/actions/auth";
import { FormGuards } from "./AuthBits";
import { fieldErrors, registerSchema } from "@/lib/validation";
import type { AuthState } from "@/lib/auth-state";
import type { District, Skill } from "@/lib/types";
import { buttonCls, Field, inputCls, Note, cx } from "@/components/public/ui";

export function RegisterForm({
  audience,
  formToken,
  districts,
  skills,
  otherSite,
  next,
}: {
  audience: "customer" | "worker";
  formToken: string;
  districts: District[];
  skills: Skill[];
  /** Absolute link to the other user host, built with siteUrl/workerUrl. */
  otherSite: { href: string; label: string };
  /** Same-host relative path to return to after signup (already validated). */
  next?: string;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(registerAction, {});
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const errors = { ...state.fieldErrors, ...clientErrors };
  const isWorker = audience === "worker";

  function toggleSkill(id: string) {
    setSelectedSkills((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse({
      role: audience,
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      password: formData.get("password"),
      districtId: String(formData.get("districtId") ?? "") || undefined,
      skills: formData.getAll("skills").map(String).filter(Boolean),
      experienceNote: String(formData.get("experienceNote") ?? "") || undefined,
      consent: formData.get("consent") === "on",
      declaration: formData.get("declaration") === "on",
      phoneCheck: formData.get("phoneCheck") === "on",
    });
    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(fieldErrors(parsed.error));
      return;
    }
    setClientErrors({});
  }

  if (state.ok && state.needsConfirm) {
    return (
      <div className="flex flex-col gap-3">
        <p className="inline-flex items-center gap-2 font-medium text-ok">
          <Check aria-hidden className="size-5" /> Бүртгэл амжилттай
        </p>
        <p className="text-[0.92em] text-muted">
          И-мэйл рүү тань баталгаажуулах холбоос илгээлээ. Холбоосыг дарж бүртгэлээ
          идэвхжүүлнэ үү.
        </p>
        <Note>
          {isWorker
            ? "Манай админ тантай утсаар холбогдоно."
            : "Дараа нь та ажлаа захиалж эхлэх боломжтой."}
        </Note>
        <Link href="/login" className={buttonCls("secondary", true)}>
          Нэвтрэх хуудас
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} onSubmit={validate} className="flex flex-col gap-4" noValidate>
      <FormGuards formToken={formToken} />
      <input type="hidden" name="next" value={next ?? ""} />
      {!isWorker ? (
        <Note tone="warn">
          Энэ хаяг нь ажил ЗАХИАЛАХ хүнд зориулагдсан. Ажил хайж байгаа бол{" "}
          <a href={otherSite.href} className="font-medium underline">
            {otherSite.label}
          </a>{" "}
          орно уу.
        </Note>
      ) : null}

      {state.error ? <Note tone="err">{state.error}</Note> : null}

      <Field label="Нэр" error={errors.fullName}>
        <input name="fullName" autoComplete="name" required className={inputCls} />
      </Field>

      <Field label="Утасны дугаар" hint="8 оронтой тоо" error={errors.phone}>
        <input
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder="88112233"
          maxLength={12}
          required
          className={inputCls}
        />
      </Field>

      <Field label="И-мэйл" error={errors.email}>
        <input type="email" name="email" autoComplete="email" required className={inputCls} />
      </Field>

      <Field label="Нууц үг" hint="Дор хаяж 8 тэмдэгт" error={errors.password}>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            required
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-1 top-1 flex min-h-12 min-w-12 items-center justify-center rounded-[6px] text-muted"
            aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харуулах"}
          >
            {showPassword ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
          </button>
        </div>
      </Field>

      {isWorker ? (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-[0.92em] font-medium">
              Юу хийж чадах вэ? (нэгээс олон сонгож болно)
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {skills.map((skill) => {
                const active = selectedSkills.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkill(skill.id)}
                    aria-pressed={active}
                    className={cx(
                      "flex min-h-[44px] items-center gap-2 rounded-[8px] border px-3 text-left text-[0.9em]",
                      active
                        ? "border-primary bg-primary-soft font-medium text-primary-ink"
                        : "border-divider bg-surface",
                    )}
                  >
                    {active ? <Check aria-hidden className="size-4 shrink-0" /> : null}
                    {skill.name}
                  </button>
                );
              })}
            </div>
            {selectedSkills.map((id) => (
              <input key={id} type="hidden" name="skills" value={id} />
            ))}
            {errors.skills ? <span className="text-[0.82em] text-error">{errors.skills}</span> : null}
          </fieldset>

          <Field label="Дүүрэг" error={errors.districtId}>
            <select name="districtId" required className={inputCls} defaultValue="">
              <option value="" disabled>
                Сонгоно уу
              </option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Туршлага (заавал биш)" error={errors.experienceNote}>
            <textarea
              name="experienceNote"
              rows={3}
              maxLength={500}
              className={inputCls}
              placeholder="Ямар ажил хийж байснаа товч бичнэ үү"
            />
          </Field>
        </>
      ) : null}

      <fieldset className="flex flex-col gap-3 rounded-[8px] border border-divider p-3">
        <legend className="px-1 text-[0.82em] font-medium text-muted">Баталгаажуулалт</legend>

        <label className="flex items-start gap-2 text-[0.9em]">
          <input type="checkbox" name="declaration" required className="mt-0.5 size-5 shrink-0" />
          <span>
            {isWorker
              ? "Би ажил хийх хүн мөн. Өгсөн мэдээллээ үнэн зөв гэж баталж байна."
              : "Би өөрөө ажил хийлгэх хүн мөн. Энэ нь ажил хайж буй хүний зар биш."}
            {errors.declaration ? (
              <span className="block text-[0.9em] text-error">{errors.declaration}</span>
            ) : null}
          </span>
        </label>

        {isWorker ? (
          <label className="flex items-start gap-2 text-[0.9em]">
            <input type="checkbox" name="phoneCheck" required className="mt-0.5 size-5 shrink-0" />
            <span>
              Админ надтай утсаар холбогдож мэдээллийг шалгахыг зөвшөөрч байна.
              {errors.phoneCheck ? (
                <span className="block text-[0.9em] text-error">{errors.phoneCheck}</span>
              ) : null}
            </span>
          </label>
        ) : null}

        <label className="flex items-start gap-2 text-[0.9em]">
          <input type="checkbox" name="consent" required className="mt-0.5 size-5 shrink-0" />
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
            {errors.consent ? (
              <span className="block text-[0.9em] text-error">{errors.consent}</span>
            ) : null}
          </span>
        </label>
      </fieldset>

      <button type="submit" disabled={pending} className={buttonCls("primary", true)}>
        {pending ? "Түр хүлээнэ үү…" : "Бүртгүүлэх"}
      </button>

      <p className="text-center text-[0.9em] text-muted">
        Бүртгэлтэй юу?{" "}
        <Link href="/login" className="text-primary underline underline-offset-2">
          Нэвтрэх
        </Link>
      </p>
    </form>
  );
}
