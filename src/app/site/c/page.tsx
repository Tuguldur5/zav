import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { Container, Card, EmptyBox, PageTitle, StatusTag, buttonCls } from "@/components/public/ui";
import { formatMoney, formatShortDateMn } from "@/lib/dates";
import { orderStatus, slotLabels } from "@/lib/status";
import type { Job } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CustomerOrdersPage() {
  const { supabase, user } = await requireRole(["customer"]);

  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const jobs = (data as Job[] | null) ?? [];
  const active = jobs.filter((job) => !["done", "cancelled"].includes(job.status));
  const closed = jobs.filter((job) => ["done", "cancelled"].includes(job.status));

  return (
    <Container className="py-6 sm:py-8">
      <PageTitle
        title="Миний захиалгууд"
        lead="Эндхийн захиалгыг админ хүлээж аваад тохирох ажилтныг хайна."
        action={
          <Link href="/c/new" className={buttonCls("primary")}>
            <Plus aria-hidden className="size-4" strokeWidth={1.75} />
            Ажил захиалах
          </Link>
        }
      />

      {jobs.length === 0 ? (
        <div className="mt-6">
          <EmptyBox
            title="Одоогоор захиалга байхгүй"
            body="Ажлын төрлөө сонгоод эхний захиалгаа өгөөрэй."
            action={
              <Link href="/c/new" className={buttonCls("primary")}>
                Ажил захиалах
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          {[
            { title: "Идэвхтэй", rows: active },
            { title: "Хаагдсан", rows: closed },
          ].map((group) =>
            group.rows.length === 0 ? null : (
              <section key={group.title} className="flex flex-col gap-3">
                <h2 className="text-[0.92em] font-semibold text-muted">{group.title}</h2>
                <div className="flex flex-col gap-3">
                  {group.rows.map((job) => {
                    const meta = orderStatus[job.status] ?? orderStatus.new;
                    return (
                      <Link key={job.id} href={`/c/jobs/${job.id}`} className="block">
                        <Card className="flex flex-col gap-2 p-4 transition-colors duration-150 hover:border-primary">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium">{job.title}</p>
                            <StatusTag tone={meta.tone}>{meta.label}</StatusTag>
                          </div>
                          <p className="flex items-center gap-2 text-[0.9em] text-muted">
                            <CalendarDays aria-hidden className="size-4" strokeWidth={1.75} />
                            {formatShortDateMn(job.job_date)} · {slotLabels[job.job_slot]} ·{" "}
                            {formatMoney(job.pay_offer)}
                          </p>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ),
          )}
        </div>
      )}

      <div className="mt-8 sm:hidden">
        <Link href="/c/new" className={buttonCls("primary", true)}>
          <Plus aria-hidden className="size-4" strokeWidth={1.75} />
          Ажил захиалах
        </Link>
      </div>
    </Container>
  );
}
