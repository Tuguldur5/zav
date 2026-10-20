import Link from "next/link";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Stepper } from "@/components/ui/Stepper";

/**
 * Login / MFA / join: a frame-coloured page with one centred white card
 * (480px), the logo, an optional stepper and no illustration.
 */
export function StaffAuthFrame({
  title,
  subtitle,
  steps,
  currentStep = 0,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  steps?: string[];
  currentStep?: number;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="staff-auth-page" data-staff-auth="">
      <Link href="/" className="staff-brand press mb-5">
        <span className="staff-logo" aria-hidden>
          <Check className="size-5" strokeWidth={3} />
        </span>
        <span className="staff-brand-name !inline">Зав</span>
        <span className="staff-dot" aria-hidden />
        <span className="staff-role">Ажилтан</span>
      </Link>

      <div className="staff-auth-card" data-staff-panel="">
        <div className="mb-4">
          <p className="staff-role mb-1">Ажилтны хэсэг</p>
          <h1 className="staff-title">{title}</h1>
          {subtitle ? <p className="staff-subtitle">{subtitle}</p> : null}
        </div>

        {steps && steps.length > 1 ? (
          <div className="mb-4">
            <Stepper steps={steps} current={currentStep} />
          </div>
        ) : null}

        {children}
      </div>

      {footer ? (
        <p className="mt-4 max-w-[480px] text-center text-[0.85em] text-[color:var(--frame-text-muted)]">
          {footer}
        </p>
      ) : null}
    </main>
  );
}
