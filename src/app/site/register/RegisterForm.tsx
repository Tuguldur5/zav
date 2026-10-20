"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { inputClass } from "@/components/ui/styles";
import { registerAction } from "@/app/site/auth/actions";
import { fieldErrors, registerSchema } from "@/lib/validation";
import type { AuthState } from "@/lib/auth-state";
import type { District, Skill } from "@/lib/types";

export function RegisterForm({
  role,
  districts,
  skills,
}: {
  role: "customer" | "worker";
  districts: District[];
  skills: Skill[];
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(registerAction, {});
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const errors = { ...state.fieldErrors, ...clientErrors };
  const isWorker = role === "worker";

  function toggleSkill(id: string) {
    setSelectedSkills((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse({
      role,
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      password: formData.get("password"),
      districtId: String(formData.get("districtId") ?? "") || undefined,
      skills: formData.getAll("skills").map(String).filter(Boolean),
      experienceNote: String(formData.get("experienceNote") ?? "") || undefined,
      consent: formData.get("consent") === "on",
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
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-success-container text-success">
          <Check aria-hidden className="size-9" />
        </span>
        <h2 className="text-[1.2em] font-semibold">Бүртгэл баталгаажлаа</h2>
        <p className="text-[0.9em] text-muted">
          И-мэйл рүү тань баталгаажуулах холбоос илгээлээ. Холбоосыг дарж бүртгэлээ идэвхжүүлнэ үү.
        </p>
        <p className="rounded-md bg-container px-3 py-2 text-[0.9em] text-ink">
          {state.role === "worker" || isWorker
            ? "Манай админ тантай холбогдоно."
            : "Дараа нь та ажлаа зарлаж эхлэх боломжтой."}
        </p>
        <Link
          href="/login"
          className="press flex min-h-[var(--control-h)] items-center rounded-md bg-primary px-5 font-medium text-on-primary"
        >
          Нэвтрэх хуудас
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} onSubmit={validate} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="role" value={role} />
      {state.error ? (
        <p role="alert" className="rounded-md bg-error-container px-3 py-2 text-[0.9em] text-error">
          {state.error}
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        Нэр
        <input name="fullName" autoComplete="name" required className={inputClass} />
        {errors.fullName ? <span className="text-error">{errors.fullName}</span> : null}
      </label>

      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        Утасны дугаар
        <input
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder="88112233"
          maxLength={12}
          required
          className={inputClass}
        />
        <span className="text-[0.8em] text-muted">8 оронтой тоо</span>
        {errors.phone ? <span className="text-error">{errors.phone}</span> : null}
      </label>

      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        И-мэйл
        <input type="email" name="email" autoComplete="email" required className={inputClass} />
        {errors.email ? <span className="text-error">{errors.email}</span> : null}
      </label>

      <label className="flex flex-col gap-1 text-[0.9em] font-medium">
        Нууц үг
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            required
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="press absolute right-1 top-1 flex min-h-11 min-w-11 items-center justify-center rounded-md"
            aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харуулах"}
          >
            {showPassword ? (
              <EyeOff aria-hidden className="size-5" />
            ) : (
              <Eye aria-hidden className="size-5" />
            )}
          </button>
        </div>
        <span className="text-[0.8em] text-muted">Дор хаяж 8 тэмдэгт</span>
        {errors.password ? <span className="text-error">{errors.password}</span> : null}
      </label>

      {isWorker ? (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-[0.9em] font-medium">
              Мэргэжил (нэгээс олон сонгож болно)
            </legend>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Chip
                  key={skill.id}
                  tone={selectedSkills.includes(skill.id) ? "primary" : "default"}
                  selected={selectedSkills.includes(skill.id)}
                  onClick={() => toggleSkill(skill.id)}
                >
                  {selectedSkills.includes(skill.id) ? (
                    <Check aria-hidden className="size-4" />
                  ) : null}
                  {skill.name}
                </Chip>
              ))}
            </div>
            {selectedSkills.map((id) => (
              <input key={id} type="hidden" name="skills" value={id} />
            ))}
            {errors.skills ? <span className="text-error">{errors.skills}</span> : null}
          </fieldset>

          <label className="flex flex-col gap-1 text-[0.9em] font-medium">
            Дүүрэг
            <select name="districtId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                Сонгоно уу
              </option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
            {errors.districtId ? <span className="text-error">{errors.districtId}</span> : null}
          </label>

          <label className="flex flex-col gap-1 text-[0.9em] font-medium">
            Туршлага (заавал биш)
            <textarea
              name="experienceNote"
              rows={3}
              maxLength={500}
              className={inputClass}
              placeholder="Ямар ажил хийж байсан тухайгаа товч бичнэ үү"
            />
            {errors.experienceNote ? (
              <span className="text-error">{errors.experienceNote}</span>
            ) : null}
          </label>
        </>
      ) : null}

      <label className="flex min-h-[var(--control-h)] items-start gap-2 rounded-md border border-container bg-bg p-3 text-[0.9em]">
        <input type="checkbox" name="consent" required className="mt-0.5 size-5" />
        <span>
          Үйлчилгээний нөхцөл, нууцлалын журмыг зөвшөөрч байна.
          {errors.consent ? <span className="block text-error">{errors.consent}</span> : null}
        </span>
      </label>

      <Button type="submit" full loading={pending}>
        Бүртгүүлэх
      </Button>

      <p className="text-center text-[0.9em] text-muted">
        Бүртгэлтэй юу?{" "}
        <Link href="/login" className="text-primary underline underline-offset-2">
          Нэвтрэх
        </Link>
      </p>
    </form>
  );
}
