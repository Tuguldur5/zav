import Link from "next/link";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Stepper } from "@/components/ui/Stepper";

/**
 * Login / MFA / join: a plain white page with one centred 420px card, the logo
 * mark only and no role wording in the chrome.
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
    <main className="st-auth-page">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/" aria-label="Нүүр" className="st-mark">
          <Check aria-hidden className="size-4" strokeWidth={3} />
        </Link>
      </div>

      <div className="st-auth-card">
        <div className="st-auth-head">
          <h1 className="st-auth-title">{title}</h1>
          {subtitle ? <p className="st-auth-sub">{subtitle}</p> : null}
        </div>

        {steps && steps.length > 1 ? (
          <div className="mb-4">
            <Stepper steps={steps} current={currentStep} />
          </div>
        ) : null}

        {children}
      </div>

      {footer ? (
        <p className="mt-4 max-w-[420px] text-center text-[13px] text-[color:var(--st-muted)]">
          {footer}
        </p>
      ) : null}
    </main>
  );
}
