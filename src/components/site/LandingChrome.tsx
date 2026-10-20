import Link from "next/link";
import { Briefcase, Smartphone } from "lucide-react";
import { buttonClass, cx } from "@/components/ui/styles";

/** Landing header: anchors + login on desktop, logo + login on phones. */
export function LandingHeader() {
  return (
    <header data-topbar className="sticky top-0 z-30">
      <div className="mx-auto flex min-h-[var(--topbar-h)] w-full max-w-[1200px] items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-on-primary">
            <Briefcase aria-hidden className="size-5" />
          </span>
          <span className="text-[1.05em] font-semibold">Зав байна</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2">
          <Link
            href="#how"
            className={cx(buttonClass("text", false, "sm"), "max-sm:hidden")}
          >
            Хэрхэн ажилладаг
          </Link>
          <Link
            href="/help"
            className={cx(buttonClass("text", false, "sm"), "max-sm:hidden")}
          >
            Тусламж
          </Link>
          <Link href="/login" className={buttonClass("filled", false, "sm")}>
            Нэвтрэх
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-divider bg-surface">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-on-primary">
            <Briefcase aria-hidden className="size-4" />
          </span>
          <span className="text-[0.9em] text-muted">© 2026 Зав байна</span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.9em] text-muted">
          <Link href="/help" className="hover:text-ink">
            Тусламж
          </Link>
          <Link href="/help#install" className="inline-flex items-center gap-1 hover:text-ink">
            <Smartphone aria-hidden className="size-4" />
            Нүүр дэлгэцэнд нэмэх
          </Link>
          <Link href="/register" className="hover:text-ink">
            Бүртгүүлэх
          </Link>
        </nav>
      </div>
    </footer>
  );
}
