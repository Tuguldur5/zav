"use client";

import { useState } from "react";
import { Bell, Briefcase, CalendarCheck, UserPlus, Users } from "lucide-react";
import {
  AdminDesk,
  BulkBar,
  Dock,
  FloatingRail,
  PageTitle,
  QueueCard,
  RoundAction,
  SearchPill,
  SectionHeader,
  SegmentedTabs,
  StatRow,
  StatTile,
  TabNav,
  type StaffDeskData,
} from "@/components/staff";
import { adminDock, adminNav, adminPhone, adminPlus, superNav, superPlus } from "@/components/staff/nav";

/** Clearly fake rows: the kit is the only place sample data is allowed. */
function sampleDesk(superAdmin: boolean): StaffDeskData {
  return {
    title: "Админы самбар",
    summary: superAdmin ? "6 зүйл хүлээж байна · 3 ажил өнөөдөр" : "4 зүйл хүлээж байна · 2 ажил өнөөдөр",
    tabs: superAdmin
      ? [
          {
            id: "admins",
            label: "Админууд",
            empty: "Жишээ хоосон.",
            items: [
              { id: "a1", kind: "Админ", date: "10-19", text: "Жишээ админ А", time: "12 ажилтан", bar: 80, actions: [{ label: "Нээх", href: "/super/admins" }] },
              { id: "a2", kind: "Админ", date: "10-18", text: "Жишээ админ Б", time: "4 ажилтан", bar: 30, actions: [{ label: "Нээх", href: "/super/admins" }] },
            ],
          },
          { id: "attention", label: "Анхаарах", empty: "Жишээ хоосон.", items: [{ id: "x1", kind: "Шинэ", date: "—", text: "Жишээ ажилтан — хуваарилаагүй", time: "Хуваарилах", actions: [{ label: "Нээх", href: "/super/intake" }] }] },
          { id: "audit", label: "Аудит", empty: "Жишээ хоосон.", items: [{ id: "l1", kind: "Аудит", date: "10-20", text: "claim_job · jobs", time: "Саяхан", actions: [{ label: "Нээх", href: "/super/audit" }] }] },
        ]
      : [
          { id: "today", label: "Өнөөдөр", empty: "Жишээ хоосон.", items: [{ id: "t1", kind: "Зар", date: "10-20", text: "Жишээ зар — өдөржин", time: "Өглөө", actions: [{ label: "Нээх", href: "/jobs" }] }] },
          { id: "pending", label: "Баталгаа", empty: "Жишээ хоосон.", items: [{ id: "p1", kind: "Чөлөөтэй", date: "10-21", text: "Жишээ ажилтан", time: "Өглөө", actions: [{ label: "Нээх", href: "/calendar" }] }] },
          { id: "history", label: "Түүх", empty: "Жишээ хоосон.", items: [{ id: "h1", kind: "Аудит", date: "10-19", text: "confirm_availability · availability", time: "1 өдрийн өмнө", actions: [{ label: "Нээх", href: "/today" }] }] },
        ],
  };
}

function Tone({ tone, children }: { tone: "admin" | "super"; children: React.ReactNode }) {
  return (
    <section
      className="staff-theme"
      data-staff-tone={tone}
      data-kit-tone={tone}
      style={{ background: "var(--adm-frame)", borderRadius: 28, padding: 16, color: "var(--adm-frame-ink)" }}
    >
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em]">
        {tone === "admin" ? "Админ тон — #0369A1" : "Супер тон — #0C4A6E"} · жишээ өгөгдөл
      </p>
      {children}
    </section>
  );
}

export function StaffKitDemo() {
  const [seg, setSeg] = useState("today");
  const [bulk, setBulk] = useState(2);
  const [compact, setCompact] = useState(false);

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-8 p-4 pb-40" data-staff-kit="">
      <header>
        <h1 className="text-[24px] font-bold">Staff kit — Control Center</h1>
        <p className="text-[14px] text-muted">
          Зөвхөн хөгжүүлэлтийн үед. Бүх өгөгдөл нь тодорхой жишээ, production хуудсанд ашиглагдахгүй.
        </p>
      </header>

      {(["admin", "super"] as const).map((tone) => {
        const superAdmin = tone === "super";
        return (
          <Tone key={tone} tone={tone}>
            <div className="mb-4 rounded-[28px] bg-[color:var(--adm-frame-soft)] p-2">
              <TabNav
                items={superAdmin ? superNav : adminNav}
                counts={{ jobs: 4, alerts: 3 }}
                activeHref={superAdmin ? "/super" : "/today"}
              />
            </div>

            <div className="rounded-[24px] bg-[color:var(--adm-paper)] p-4 text-[color:var(--adm-ink)]">
              <PageTitle
                title={superAdmin ? "Хянах самбар" : "Хяналтын төв"}
                emoji={superAdmin ? "🛰️" : "⏰"}
                subtitle="Жишээ дэд гарчиг — бодит тоо, шинэчлэгдсэн мэдээлэл"
                search={<SearchPill placeholder="Хайх (жишээ)" />}
              />

              <div className="mt-4">
                <StatRow>
                  <StatTile label="Шинэ зар" value={12} href="#" icon={Briefcase} />
                  <StatTile label="Баталгаажуулах" value={3} attention icon={CalendarCheck} />
                  <StatTile label="Хариу хүлээж буй" value={5} icon={Bell} />
                  <StatTile label="Өнөөдрийн ажил" value={7} icon={Users} />
                </StatRow>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <SectionHeader title="Ажлын дараалал" count={4} href="#" hrefLabel="Бүгд" />
                <div className="staff-card-grid">
                  <QueueCard
                    featured
                    title="Жишээ зар — өдөржин цэвэрлэгээ"
                    href="#"
                    description="Жишээ тайлбар: мэргэжил, дүүрэг, цаг"
                    icon={Briefcase}
                    meta={<span>10-21 · Өглөө · Сүхбаатар</span>}
                    status={{ status: "new", table: { new: { label: "Шинэ", tone: "primary", icon: Briefcase } } }}
                    actions={
                      <>
                        <RoundAction href="#" label="Илүү" icon={Bell} variant="ghost" />
                        <RoundAction href="#" label="Татгалзах" icon={Users} />
                        <RoundAction href="#" label="Баталгаажуулах" icon={CalendarCheck} confirm />
                      </>
                    }
                  />
                  <QueueCard
                    title="Жишээ ажилтан"
                    href="#"
                    description="Жишээ тайлбар: ур чадвар, дүүрэг"
                    icon={UserPlus}
                    meta={<span>10-20 · Үдээс хойш</span>}
                    status={{ status: "confirmed", table: { confirmed: { label: "Баталгаажсан", tone: "success", icon: CalendarCheck } } }}
                    actions={<RoundAction href="#" label="Нээх" icon={Briefcase} confirm />}
                  />
                  <QueueCard
                    title="Жишээ мэдэгдэл"
                    href="#"
                    description="Жишээ тайлбар"
                    icon={Bell}
                    meta={<span>Саяхан</span>}
                    actions={<RoundAction href="#" label="Нээх" icon={Briefcase} />}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
                <div className="rounded-[24px] bg-[color:var(--adm-tint-1)] p-3">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide">Segmented</p>
                  <SegmentedTabs
                    tabs={[
                      { id: "today", label: "Өнөөдөр" },
                      { id: "pending", label: "Баталгаа" },
                      { id: "history", label: "Түүх" },
                    ]}
                    active={seg}
                    onChange={setSeg}
                  />
                </div>
                <div className="rounded-[24px] bg-[color:var(--adm-tint-1)] p-3">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide">Админы самбар</p>
                  <AdminDesk desk={sampleDesk(superAdmin)} />
                </div>
              </div>

              <div className="relative mt-6 h-[320px] overflow-hidden rounded-[24px] bg-[color:var(--adm-paper)]">
                <span className="staff-notch" aria-hidden />
                <FloatingRail
                  onOpenPalette={() => undefined}
                  hasLists
                  view="table"
                  onToggleView={() => undefined}
                  compact={compact}
                  onToggleDensity={() => setCompact((value) => !value)}
                  unread={3}
                  notices={[
                    { id: "n1", title: "Жишээ мэдэгдэл", href: "#", read: false, time: "Саяхан" },
                  ]}
                  quick={superAdmin ? superPlus : adminPlus}
                />
                <p className="pl-24 pt-6 text-[14px] text-[color:var(--adm-muted)]">
                  Зүүн талын floating rail (&gt;=1024px). Товчнууд нь жишээ.
                </p>
              </div>
            </div>
          </Tone>
        );
      })}

      <section className="rounded-[28px] bg-[color:var(--adm-paper)] p-4">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[color:var(--adm-muted)]">
          Dock ба Bulk bar
        </p>
        <BulkBar count={bulk} onClear={() => setBulk(0)}>
          <button
            type="button"
            className="press rounded-full bg-primary px-4 py-1.5 text-[13px] font-semibold text-on-primary"
          >
            Жишээ үйлдэл
          </button>
        </BulkBar>
        <button
          type="button"
          onClick={() => setBulk(2)}
          className="press mt-2 rounded-full bg-tint-1 px-4 py-2 text-[13px] font-semibold"
        >
          Сонголт харуулах
        </button>
      </section>

      <Dock
        items={adminDock}
        phoneItems={adminPhone}
        plus={adminPlus}
        more={adminNav.map((item) => ({ label: item.label, href: item.href }))}
        onOpenDesk={() => undefined}
      />
    </main>
  );
}
