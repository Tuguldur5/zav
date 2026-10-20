import type { ReactNode } from "react";
import { cx } from "./styles";

/** Width is capped by AppShell; this adds the content padding and stack. */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "page-container mx-auto flex w-full flex-col gap-5 px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pt-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Page anatomy: title, one-line description, actions on the right from 640px up
 * (stacked below it on phones).
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}
    >
      <div className="min-w-0">
        <h2 className="text-[1.25em] font-semibold leading-tight text-ink">{title}</h2>
        {description ? <p className="mt-1 text-[0.9em] text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Small uppercase label that groups cards on the public home screens. */
export function SectionLabel({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="text-[0.78em] font-semibold uppercase tracking-[0.08em] text-muted">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("flex flex-col gap-3", className)}>
      {title ? (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[1em] font-semibold text-ink">{title}</h3>
            {description ? <p className="text-[0.85em] text-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Card grid: 1 column on phones, 2 from 1024, 3 from 1440. */
export function Grid({
  children,
  columns = 2,
  className,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const cols: Record<number, string> = {
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-2 xl:grid-cols-3",
    4: "sm:grid-cols-2 xl:grid-cols-4",
  };
  return <div className={cx("grid grid-cols-1 gap-4", cols[columns], className)}>{children}</div>;
}

/**
 * List + detail. On phones both are rendered and the caller decides; from 1024
 * the list keeps a fixed 420px column and the detail fills the rest.
 */
export function SplitPane({ list, detail }: { list: ReactNode; detail: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-3">{list}</div>
      <div className="flex min-w-0 flex-col gap-5">{detail}</div>
    </div>
  );
}
