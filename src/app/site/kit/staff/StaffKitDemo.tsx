"use client";

import { useState } from "react";
import { Briefcase, CalendarCheck, Users } from "lucide-react";
import {
  BulkBar,
  LoadBar,
  PageHeader,
  PageTabs,
  Rows,
  Row,
  Section,
  StaffNote,
  StatTile,
  StatTiles,
} from "@/components/staff";

const tabs = [
  { href: "/__kit/staff", label: "Ерөнхий" },
  { href: "/__kit/staff?tab=catalog", label: "Каталог" },
];

export function StaffKitDemo() {
  const [bulk, setBulk] = useState(2);

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-8 p-4 pb-24">
      <header>
        <h1 className="text-[24px] font-semibold">Staff kit — v2</h1>
        <p className="text-[14px] text-[color:var(--st-muted)]">
          Зөвхөн хөгжүүлэлтийн үед. Бүх утга нь жишээ бөгөөд production хуудсанд ашиглагдахгүй.
        </p>
      </header>

      {(["admin", "super"] as const).map((tone) => (
        <section
          key={tone}
          className="staff-theme rounded-xl border border-[color:var(--st-border)] p-4"
          data-staff-tone={tone}
        >
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[color:var(--st-muted)]">
            {tone === "admin" ? "Админ тон — #0F766E" : "Супер тон — #134E4A"}
          </p>

          <PageHeader
            title="Өнөөдөр"
            subtitle="Жишээ дэд гарчиг — нэг мөрөнд"
            actions={
              <button type="button" className="st-btn" data-variant="primary">
                Үйлдэл
              </button>
            }
          />

          <div className="mt-4">
            <PageTabs label="Жишээ таб" active={tabs[0].href} tabs={tabs} />
          </div>

          <div className="mt-4">
            <StatTiles>
              <StatTile label="Шинэ зар" value={12} icon={Briefcase} />
              <StatTile label="Баталгаажуулах" value={3} icon={CalendarCheck} attention />
              <StatTile label="Ажилчид" value={28} icon={Users} />
              <StatTile label="Өнөөдрийн ажил" value={7} icon={CalendarCheck} />
            </StatTiles>
          </div>

          <div className="mt-6">
            <Section title="Жишээ мөрүүд" count={2}>
              <Rows label="Жишээ">
                <Row
                  title="Жишээ зар — өдөржин цэвэрлэгээ"
                  meta={
                    <>
                      <span>Сүхбаатар</span>
                      <span>2026-10-22</span>
                    </>
                  }
                  action={
                    <button type="button" className="st-btn" data-variant="outline">
                      Авах
                    </button>
                  }
                >
                  <span className="mt-1 block max-w-[320px]">
                    <LoadBar value={4} capacity={10} />
                  </span>
                </Row>
                <Row
                  title="Жишээ ажилтан"
                  meta={<span>Баянзүрх · Өглөө</span>}
                  action={
                    <button type="button" className="st-btn" data-variant="ghost">
                      Залгах
                    </button>
                  }
                />
              </Rows>
            </Section>
          </div>

          <div className="mt-4">
            <StaffNote>Жишээ тэмдэглэл — 1px хүрээтэй, сүүдэргүй.</StaffNote>
          </div>
        </section>
      ))}

      <section className="flex flex-col gap-3">
        <BulkBar count={bulk} onClear={() => setBulk(0)}>
          <button type="button" className="st-btn" data-variant="primary">
            Жишээ үйлдэл
          </button>
        </BulkBar>
        <button
          type="button"
          onClick={() => setBulk(2)}
          className="st-btn w-fit"
          data-variant="outline"
        >
          Сонголт харуулах
        </button>
      </section>
    </main>
  );
}
