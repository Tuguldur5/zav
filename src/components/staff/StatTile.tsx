import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/components/ui/styles";

type StatTileProps = {
  label: string;
  value: number | string;
  /** Filled tint-3 tile — the first tile on a page. */
  featured?: boolean;
  /** Dashed outline: this number needs attention. */
  attention?: boolean;
  icon?: LucideIcon;
  href?: string;
};

/**
 * Centred tile: big number, small label. Fills rotate through the four blue
 * tints by position (CSS); green/amber/red never appear here.
 */
export function StatTile({
  label,
  value,
  featured = false,
  attention = false,
  icon: Icon,
  href,
}: StatTileProps) {
  const variant = featured ? "featured" : attention ? "attention" : "plain";
  const body = (
    <>
      {Icon ? <Icon aria-hidden className="staff-tile-icon size-4" /> : null}
      <span className="staff-tile-value">{value}</span>
      <span className="staff-tile-label">{label}</span>
    </>
  );
  const className = cx("staff-tile", href && "press h-full");

  if (href) {
    return (
      <Link href={href} className={className} data-tile="" data-variant={variant}>
        {body}
      </Link>
    );
  }

  return (
    <div className={className} data-tile="" data-variant={variant}>
      {body}
    </div>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <div className="staff-stats">{children}</div>;
}
