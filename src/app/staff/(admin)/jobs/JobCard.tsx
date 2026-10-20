import { ArrowUpRight, Briefcase, CalendarDays, MapPin, Users } from "lucide-react";
import type { ReactNode } from "react";
import { QueueCard, RoundAction } from "@/components/staff";
import { jobStatus, slotLabels } from "@/lib/status";
import { formatDateMn, formatMoney } from "@/lib/dates";
import type { Job } from "@/lib/types";

export function JobCard({
  job,
  districtName,
  skillName,
  featured = false,
  actions,
  children,
}: {
  job: Pick<
    Job,
    "id" | "title" | "status" | "job_date" | "job_slot" | "workers_needed" | "pay_offer"
  >;
  districtName?: string;
  skillName?: string;
  featured?: boolean;
  /** Extra round buttons beside the default "open" action. */
  actions?: ReactNode;
  /** Claim / reassign controls live in the card body. */
  children?: ReactNode;
}) {
  return (
    <QueueCard
      featured={featured}
      title={job.title}
      href={`/jobs/${job.id}`}
      description={skillName ? `Мэргэжил: ${skillName}` : undefined}
      icon={Briefcase}
      status={{ status: job.status, table: jobStatus }}
      meta={
        <>
          <span className="inline-flex items-center gap-1">
            <CalendarDays aria-hidden className="size-4" />
            {formatDateMn(job.job_date, false)} · {slotLabels[job.job_slot]}
          </span>
          {districtName ? (
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden className="size-4" />
              {districtName}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Users aria-hidden className="size-4" />
            {job.workers_needed} ажилтан
          </span>
          <span className="font-semibold text-ink">{formatMoney(job.pay_offer)}</span>
        </>
      }
      actions={
        <>
          <RoundAction href={`/jobs/${job.id}`} label="Зарыг нээх" icon={ArrowUpRight} />
          {actions}
        </>
      }
    >
      {children}
    </QueueCard>
  );
}
