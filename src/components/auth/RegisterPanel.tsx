"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff, MailCheck } from "lucide-react";
import { registerAction } from "@/lib/actions/auth";
import { AuthAlert, FormGuards, SubmitButton, TextField } from "./AuthBits";
import { passwordStrengthHint } from "@/lib/auth/common-passwords";
import { mn } from "@/lib/i18n/mn";
import type { AuthState } from "@/lib/auth-state";
import type { District, Skill } from "@/lib/types";

const copy = mn.marketing.auth;

export function RegisterPanel({
  audience,
  districts,
  skills,
  next,
  formToken,
  onSwitch,
}: {
  audience: "customer" | "worker";
  districts: District[];
  skills: Skill[];
  next?: string;
  formToken: string;
  onSwitch?: () => void;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(registerAction, {});
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const errors = { ...state.fieldErrors, ...clientErrors };
  const isWorker = audience === "worker";

  function toggleSkill(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  /** Step 1 is validated in the browser before the panel slides to step 2. */
  function goToStep2(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    const data = new FormData(form);
    const found: Record<string, string> = {};
    const name = String(data.get("fullName") ?? "").trim();
    const phone = String(data.get("phone") ?? "").replace(/[\s-]/g, "");
    const email = String(data.get("email") ?? "").trim();
    const pass = String(data.get("password") ?? "");
    if (name.length < 2) found.fullName = "Нэрээ оруулна уу";
    if (!/^\d{8}$/.test(phone)) found.phone = "8 оронтой утасны дугаар оруулна уу";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) found.email = "И-мэйл хаяг буруу байна";
    if (pass.length < 8) found.password = "Нууц үг дор хаяж 8 тэмдэгт байна";
    setClientErrors(found);
    if (Object.keys(found).length === 0) setStep(2);
  }

  if (state.ok && state.needsConfirm) {
    return (
      <div className="flex flex-col gap-3" aria-live="polite">
        <p className="inline-flex items-center gap-2 font-medium text-ok">
          <MailCheck aria-hidden className="size-5" />
          {copy.sentTitle}
        </p>
        <p className="text-[0.94em] text-muted">{copy.sentHint}</p>
        <p className="rounded-[8px] bg-surface-2 px-3 py-2 text-[0.9em] text-muted">
          {isWorker
            ? "Манай админ тантай утсаар холбогдоно."
            : "Дараа нь та ажлаа захиалж эхлэх боломжтой."}
        </p>
        <Link href="/login" className="auth-button-light w-full">
          {copy.submitLogin}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="relative flex flex-col gap-4" noValidate>
      <FormGuards formToken={formToken} />
      <input type="hidden" name="next" value={next ?? ""} />

      {isWorker ? (
        <div className="flex items-center gap-2 text-[0.82em] text-muted">
          <span className={step === 1 ? "font-semibold text-primary" : undefined}>
            1 · {copy.step1}
          </span>
          <span aria-hidden>—</span>
          <span className={step === 2 ? "font-semibold text-primary" : undefined}>
            2 · {copy.step2}
          </span>
        </div>
      ) : null}

      {state.error ? <AuthAlert>{state.error}</AuthAlert> : null}

      <div hidden={isWorker && step === 2} className="flex flex-col gap-4">
        <TextField
          label={copy.name}
          htmlFor="register-name"
          error={errors.fullName}
          input={{
            id: "register-name",
            name: "fullName",
            autoComplete: "name",
            maxLength: 80,
            required: true,
          }}
        />
        <TextField
          label={copy.phone}
          hint={copy.phoneHint}
          htmlFor="register-phone"
          error={errors.phone}
          input={{
            id: "register-phone",
            name: "phone",
            type: "tel",
            inputMode: "tel",
            autoComplete: "tel",
            placeholder: "88112233",
            maxLength: 12,
            required: true,
          }}
        />
        <TextField
          label={copy.email}
          htmlFor="register-email"
          error={errors.email}
          input={{
            id: "register-email",
            name: "email",
            type: "email",
            autoComplete: "email",
            inputMode: "email",
            maxLength: 254,
            required: true,
          }}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="register-password" className="text-[0.92em] font-medium">
            {copy.password}
          </label>
          <div className="relative">
            <input
              id="register-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="auth-field pr-12"
              aria-invalid={Boolean(errors.password) || undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted"
              aria-label={showPassword ? mn.auth.hidePassword : mn.auth.showPasswordToggle}
            >
              {showPassword ? (
                <EyeOff aria-hidden className="size-5" />
              ) : (
                <Eye aria-hidden className="size-5" />
              )}
            </button>
          </div>
          {errors.password ? (
            <span className="text-[0.82em] text-err">{errors.password}</span>
          ) : (
            <span className="text-[0.82em] text-muted">
              {passwordStrengthHint(password) ?? copy.passwordHint}
            </span>
          )}
        </div>
      </div>

      <div hidden={isWorker && step === 1} className="flex flex-col gap-4">
        {isWorker ? (
          <>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-[0.92em] font-medium">{copy.skillsLabel}</legend>
              <div className="grid grid-cols-2 gap-2">
                {skills.map((skill) => {
                  const active = selected.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      aria-pressed={active}
                      className={
                        active
                          ? "flex min-h-11 items-center gap-1.5 rounded-[8px] border border-primary bg-primary-soft px-2.5 text-left text-[0.85em] font-medium text-primary-ink"
                          : "flex min-h-11 items-center gap-1.5 rounded-[8px] border border-border bg-surface px-2.5 text-left text-[0.85em]"
                      }
                    >
                      {active ? <Check aria-hidden className="size-4 shrink-0" /> : null}
                      {skill.name}
                    </button>
                  );
                })}
              </div>
              {selected.map((id) => (
                <input key={id} type="hidden" name="skills" value={id} />
              ))}
              {errors.skills ? (
                <span className="text-[0.82em] text-err">{errors.skills}</span>
              ) : null}
            </fieldset>

            <div className="flex flex-col gap-1">
              <label htmlFor="register-district" className="text-[0.92em] font-medium">
                {copy.district}
              </label>
              <select
                id="register-district"
                name="districtId"
                defaultValue=""
                className="auth-field"
                aria-invalid={Boolean(errors.districtId) || undefined}
              >
                <option value="" disabled>
                  {mn.marketing.customer.choose}
                </option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
              {errors.districtId ? (
                <span className="text-[0.82em] text-err">{errors.districtId}</span>
              ) : null}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="register-experience" className="text-[0.92em] font-medium">
                {copy.experience}
              </label>
              <textarea
                id="register-experience"
                name="experienceNote"
                rows={2}
                maxLength={500}
                placeholder={copy.experienceHint}
                className="rounded-[8px] border border-border bg-surface p-2 text-[0.95em]"
              />
            </div>
          </>
        ) : null}

        <fieldset className="flex flex-col gap-2.5 rounded-[8px] border border-border p-3">
          <legend className="px-1 text-[0.8em] font-medium text-muted">
            {isWorker ? copy.step2 : copy.step1}
          </legend>
          <label className="flex items-start gap-2 text-[0.88em]">
            <input type="checkbox" name="declaration" required className="mt-0.5 size-5 shrink-0" />
            <span>
              {isWorker ? copy.declarationWorker : copy.declarationCustomer}
              {errors.declaration ? (
                <span className="block text-err">{errors.declaration}</span>
              ) : null}
            </span>
          </label>
          {isWorker ? (
            <label className="flex items-start gap-2 text-[0.88em]">
              <input type="checkbox" name="phoneCheck" required className="mt-0.5 size-5 shrink-0" />
              <span>
                {copy.phoneCheck}
                {errors.phoneCheck ? (
                  <span className="block text-err">{errors.phoneCheck}</span>
                ) : null}
              </span>
            </label>
          ) : null}
          <label className="flex items-start gap-2 text-[0.88em]">
            <input type="checkbox" name="consent" required className="mt-0.5 size-5 shrink-0" />
            <span>
              {mn.marketing.auth.termsConsent}
              {errors.consent ? <span className="block text-err">{errors.consent}</span> : null}
            </span>
          </label>
          <p className="flex flex-wrap gap-3 text-[0.82em]">
            <Link href="/terms" target="_blank" className="text-primary underline underline-offset-2">
              {copy.terms}
            </Link>
            <Link href="/privacy" target="_blank" className="text-primary underline underline-offset-2">
              {copy.privacy}
            </Link>
          </p>
        </fieldset>
      </div>

      {isWorker && step === 1 ? (
        <button type="button" onClick={goToStep2} className="auth-button w-full">
          {copy.continue}
        </button>
      ) : (
        <SubmitButton pending={pending}>
          {pending ? copy.registering : copy.submitRegister}
        </SubmitButton>
      )}

      {isWorker && step === 2 ? (
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-center text-[0.88em] text-muted underline underline-offset-2"
        >
          {mn.common.back}
        </button>
      ) : null}

      <p className="text-center text-[0.9em] text-muted">
        {onSwitch ? (
          <button type="button" onClick={onSwitch} className="text-primary underline underline-offset-2">
            {copy.switchToLogin}
          </button>
        ) : (
          <Link href="/login" className="text-primary underline underline-offset-2">
            {copy.switchToLogin}
          </Link>
        )}
      </p>
    </form>
  );
}
