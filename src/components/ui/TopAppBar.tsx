import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "./styles";

type TopAppBarProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  chip?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/**
 * Sticky top bar: 52px on phones, 56px from 640px up. The `super` tone switches
 * to the navy bar via the --appbar-* variables set on the shell.
 */
export function TopAppBar({
  title,
  subtitle,
  backHref,
  backLabel = "Буцах",
  chip,
  actions,
  className,
}: TopAppBarProps) {
  return (
    <header
      className={cx(
        "sticky top-0 z-30 border-b border-[var(--appbar-border,var(--divider))]",
        "bg-[var(--appbar-bg)] text-[var(--appbar-fg)]",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6">
        <div className="flex min-h-[var(--topbar-h)] min-w-0 flex-1 items-center gap-2">
          {backHref ? (
            <Link
              href={backHref}
              aria-label={backLabel}
              className="press -ml-2 flex size-11 items-center justify-center rounded-md hover:bg-surface2"
            >
              <ArrowLeft aria-hidden className="size-5" />
            </Link>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-[1.05em] font-semibold">{title}</h1>
            {subtitle ? <p className="truncate text-[0.8em] opacity-70">{subtitle}</p> : null}
          </div>
        </div>
        {chip}
        {actions}
      </div>
    </header>
  );
}
