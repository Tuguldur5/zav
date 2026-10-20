import type { ReactNode } from "react";
import { cx, surfaceCard } from "./styles";

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return <Tag className={cx(surfaceCard, "p-4", className)}>{children}</Tag>;
}
