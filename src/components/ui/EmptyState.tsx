import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "./Card";

export function EmptyState({
  icon: Icon,
  art,
  title,
  body,
  action,
}: {
  icon?: LucideIcon;
  /** Matching illustration from `@/components/art/EmptyArts`. */
  art?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 py-8 text-center">
      {art ? (
        <div className="w-full max-w-[180px]" aria-hidden>
          {art}
        </div>
      ) : Icon ? (
        <span className="flex size-14 items-center justify-center rounded-full bg-container">
          <Icon aria-hidden className="size-7 text-primary" />
        </span>
      ) : null}
      <p className="text-[1.05em] font-semibold">{title}</p>
      {body ? <p className="max-w-sm text-[0.9em] text-muted">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </Card>
  );
}
