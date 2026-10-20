import Link from "next/link";
import { Briefcase, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { AuthArt } from "@/components/art/AuthArt";

/**
 * Auth pages: one form column (480px) on the backdrop, and from 1024px a
 * tinted panel with the art and the short explanation. No opaque wrapper, so
 * the public backdrop stays visible around the card.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  staff = false,
  aside,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  staff?: boolean;
  aside?: ReactNode;
}) {
  return (
    <main className="min-h-dvh text-ink">
      <header data-topbar className="sticky top-0 z-30">
        <div className="mx-auto flex min-h-[var(--topbar-h)] w-full max-w-[1200px] items-center gap-2 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-on-primary">
              <Briefcase aria-hidden className="size-5" />
            </span>
            <span className="text-[1em] font-semibold">Зав байна</span>
          </Link>
          {staff ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-divider bg-surface2 px-2.5 py-1 text-[0.8em] font-medium text-muted">
              <ShieldCheck aria-hidden className="size-3.5" />
              Ажилтан
            </span>
          ) : null}
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[480px_minmax(0,1fr)] lg:gap-12 lg:py-14">
        <div className="flex w-full max-w-[480px] flex-col justify-center lg:max-w-none">
          <div className="mb-4">
            <p className="eyebrow">{staff ? "Ажилтны хэсэг" : "Зав байна"}</p>
            <h1 className="mt-1 text-[1.5em] font-semibold leading-tight">{title}</h1>
            {subtitle ? <p className="mt-1 text-[0.9em] text-muted">{subtitle}</p> : null}
          </div>

          <div className="rounded-lg border border-divider bg-surface p-5 sm:p-6">{children}</div>

          {footer ? <div className="mt-4 text-center text-[0.9em] text-muted">{footer}</div> : null}
          {staff ? null : (
            <p className="mt-6 text-center text-[0.9em]">
              <Link href="/help" className="text-primary underline underline-offset-2">
                Тусламж хэрэгтэй юу?
              </Link>
            </p>
          )}
        </div>

        <aside className="auth-panel hidden rounded-xl border border-divider p-6 lg:flex lg:flex-col lg:justify-center lg:gap-5">
          <AuthArt className="h-auto w-full max-w-[420px] self-center" />
          <div className="flex flex-col gap-4">
            {aside ?? (
              <div className="rounded-lg border border-divider bg-surface p-4 text-[0.9em] text-muted">
                Зөвхөн эрх бүхий ажилтан нэвтэрнэ. Нэвтрэх эрхгүй бол супер админд хандана
                уу.
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
