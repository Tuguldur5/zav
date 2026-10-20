import Link from "next/link";
import { LifeBuoy, Phone } from "lucide-react";
import { buttonClass, cx } from "@/components/ui/styles";

/**
 * Support is a normal action, never a floating action button: it sits in the
 * sidebar footer on wide screens and above the bottom nav on phones.
 */
export function SupportButton({
  phone,
  className,
  compact = false,
}: {
  phone: string | null;
  className?: string;
  compact?: boolean;
}) {
  if (!phone) {
    return (
      <Link
        href="/help"
        className={cx(buttonClass("outline", false, compact ? "sm" : "md"), className)}
      >
        <LifeBuoy aria-hidden className="size-4" />
        Тусламж
      </Link>
    );
  }

  const digits = phone.replace(/[^\d+]/g, "");
  return (
    <a
      href={`tel:${digits}`}
      className={cx(buttonClass("outline", false, compact ? "sm" : "md"), className)}
    >
      <Phone aria-hidden className="size-4" />
      Тусламж
    </a>
  );
}
