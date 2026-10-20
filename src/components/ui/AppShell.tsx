import type { ReactNode } from "react";
import { cx } from "./styles";

export type Tone = "user" | "admin" | "super";
export type Audience = "public" | "staff";

type AppShellProps = {
  /** Density + width preset. Set on the shell so CSS owns every breakpoint. */
  audience?: Audience;
  tone?: Tone;
  /** Tablet rail + desktop sidebar (same component, CSS switches the layout). */
  sidebar?: ReactNode;
  /** Phone navigation. Hidden from 640px up. */
  bottomNav?: ReactNode;
  /** Optional extra bar rendered above the content. */
  topBar?: ReactNode;
  /** Right-hand column on >=1024 (summary, contact card, filters ...). */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * One shell for every role: phone (top bar + bottom nav), tablet (icon rail),
 * desktop (sidebar + content, optional aside). No JS, no window.innerWidth.
 * The shell does not cap the width — PageContainer and each page do — so a
 * sticky top bar always spans the whole content column.
 */
export function AppShell({
  audience = "public",
  tone = "user",
  sidebar,
  bottomNav,
  topBar,
  aside,
  children,
  className,
}: AppShellProps) {
  return (
    <div data-audience={audience} data-tone={tone} className="min-h-dvh text-ink">
      {topBar}
      <div className="mx-auto flex w-full">
        {sidebar ? (
          <aside className="sticky top-0 hidden h-dvh shrink-0 overflow-y-auto border-r border-divider bg-surface sm:block">
            {sidebar}
          </aside>
        ) : null}

        <div className={cx("flex min-h-dvh w-full min-w-0 flex-col", className)}>
          <div
            className={cx(
              "w-full flex-1",
              bottomNav ? "pb-[calc(var(--row-h)+56px)] sm:pb-8" : "pb-8",
            )}
          >
            {aside ? (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="flex min-w-0 flex-col gap-5">{children}</div>
                <div className="flex flex-col gap-5">{aside}</div>
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
      {bottomNav}
    </div>
  );
}
