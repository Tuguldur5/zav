import type { ReactNode } from "react";
import Link from "next/link";
import { Container, Card, cx } from "@/components/public/ui";
import { SlotStrip } from "@/components/ds";
import { mn } from "@/lib/i18n/mn";

/**
 * One calm auth frame for both user hosts. Forms are implemented once and
 * rendered by /login, /register, /forgot-password, /reset-password on the
 * customer host and on the worker host.
 */
export function AuthLayout({
  title,
  lead,
  children,
  footer,
  wide = false,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="auth-page min-h-dvh bg-bg">
      <header className="auth-page-header border-b border-divider bg-surface">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="font-bold">
            {mn.appName}
          </Link>
          <Link href="/help" className="text-[0.9em] text-muted hover:text-primary">
            {mn.common.help}
          </Link>
        </Container>
      </header>

      <main className="auth-page-main py-8 sm:py-12">
        <Container className={cx("flex flex-col gap-5", wide ? "max-w-[720px]" : "max-w-[480px]")}>
          <div>
            <h1 className="auth-page-title text-[24px] font-semibold leading-[30px] sm:text-[28px] sm:leading-[32px]">
              {title}
            </h1>
            {lead ? <p className="mt-2 text-[0.95em] text-muted">{lead}</p> : null}
          </div>

          <Card className="auth-card overflow-hidden p-0">
            <div className="auth-card-rule">
              <SlotStrip
                rows={[{ label: "", blocks: [{ span: 2, state: "free" }, { span: 1, state: "empty" }, { span: 3, state: "taken" }, { span: 6, state: "empty" }] }]}
                variant="loader"
                description={mn.common.loading}
              />
            </div>
            <div className="p-5 sm:p-6">{children}</div>
          </Card>

          {footer ? <div className="text-[0.9em] text-muted">{footer}</div> : null}
        </Container>
      </main>
    </div>
  );
}
