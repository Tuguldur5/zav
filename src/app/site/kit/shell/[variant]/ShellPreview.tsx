"use client";

import { AlertTriangle, Briefcase, CalendarCheck, MailQuestion, Search, Users } from "lucide-react";
import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer, PageHeader, Section } from "@/components/ui/Layout";
import {
  CustomerBottomNav,
  CustomerSidebar,
  WorkerBottomNav,
  WorkerSidebar,
} from "@/components/app/navs";
import {
  PageTitle as StaffPageHeader,
  PanelSection,
  QueueCard,
  QueueGrid,
  RoundAction,
  StaffShell,
  StatRow,
  StatTile,
} from "@/components/staff";
import type { StaffDeskData } from "@/components/staff";
import { jobStatus } from "@/lib/status";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";

export type ShellVariant = "public" | "customer" | "worker" | "admin" | "super";

/** Dev-only sample content: the /__kit pages are the one place it is allowed. */
function sampleDesk(superAdmin: boolean): StaffDeskData {
  return {
    title: superAdmin ? "Супер админы самбар" : "Админы самбар",
    summary: "Жишээ мэдээлэл — зөвхөн хөгжүүлэлтийн үед",
    tabs: [
      {
        id: "today",
        label: "Өнөөдөр",
        empty: "Энэ таб хоосон байна.",
        items: [
          {
            id: "d1",
            kind: "Зар",
            date: "2026 оны 10-р сарын 19",
            text: "Цэвэрлэгээ — Сүхбаатар дүүрэг",
            time: "Өдөржин",
            actions: [{ label: "Зарыг нээх", href: "/__kit/shell/admin" }],
          },
          {
            id: "d2",
            kind: "Чөлөөтэй",
            date: "2026 оны 10-р сарын 19",
            text: "Болормаа С.",
            time: "Өглөө",
            actions: [{ label: "Холбоо харах", href: "/__kit/shell/admin" }],
          },
        ],
      },
      {
        id: "pending",
        label: "Баталгаажуулах",
        empty: "Баталгаажуулах зүйл алга.",
        items: [
          {
            id: "d3",
            kind: "Чөлөөт өдөр",
            date: "2026 оны 10-р сарын 20",
            text: "Нэргүй А.",
            time: "Үдээс хойш",
            actions: [{ label: "Холбоо харах", href: "/__kit/shell/admin" }],
          },
        ],
      },
      {
        id: "history",
        label: "Түүх",
        empty: "Сүүлийн үйлдэл байхгүй.",
        items: [
          {
            id: "d4",
            kind: "Аудит",
            date: "2026-10-19",
            text: "claim_job · jobs",
            time: "Саяхан",
            actions: [{ label: "Аудитыг нээх", href: "/__kit/shell/admin" }],
          },
        ],
      },
    ],
  };
}

function samplePage(superAdmin: boolean) {
  return (
    <>
      <StaffPageHeader
        title={superAdmin ? "Самбар" : "Өнөөдөр"}
        subtitle="Жишээ хуудас — зөвхөн хөгжүүлэлтийн үед харагдана."
        search={
          <label className="staff-search w-full sm:w-64">
            <Search aria-hidden className="size-4 shrink-0" />
            <span className="sr-only">Хайх</span>
            <input placeholder="Хайх" readOnly />
          </label>
        }
        actions={<Button>Шинэ үйлдэл</Button>}
      />

      <StatRow>
        <StatTile featured label="Шинэ зар" value={12} href="/__kit/shell/admin" icon={Briefcase} />
        <StatTile
          label="Баталгаажуулах чөлөөт өдөр"
          value={4}
          href="/__kit/shell/admin"
          icon={CalendarCheck}
        />
        <StatTile
          label="Хариу хүлээж буй санал"
          value={7}
          href="/__kit/shell/admin"
          icon={MailQuestion}
        />
        <StatTile
          attention
          label="24 цагаас дээш авагдаагүй зар"
          value={3}
          href="/__kit/shell/admin"
          icon={AlertTriangle}
        />
      </StatRow>

      <PanelSection title="Жишээ картууд" count={3} href="/__kit/shell/admin">
        <QueueGrid>
          <QueueCard
            featured
            title="Цэвэрлэгээ хийх ажилтан"
            href="/__kit/shell/admin"
            description="Сүхбаатар дүүрэг, өдөржин, тохиролцоно"
            icon={Briefcase}
            meta={<span>2026 оны 10-р сарын 19 · 2 ажилтан</span>}
            status={{ status: "new", table: jobStatus }}
            actions={
              <>
                <RoundAction href="/__kit/shell/admin" label="Нээх" icon={Users} />
                <RoundAction href="/__kit/shell/admin" label="Баталгаажуулах" icon={Users} confirm />
              </>
            }
          />
          <QueueCard
            title="Ачаа тээвэр"
            href="/__kit/shell/admin"
            description="Хан-Уул дүүрэг, өглөө"
            icon={Users}
            meta={<span>2026 оны 10-р сарын 20 · 1 ажилтан</span>}
            status={{ status: "matched", table: jobStatus }}
            actions={<RoundAction href="/__kit/shell/admin" label="Нээх" icon={Users} />}
          >
            <div className="flex flex-wrap gap-1.5">
              <Chip tone="primary">Жишиг чиглэл</Chip>
            </div>
          </QueueCard>
          <QueueCard
            title="Бага ажил"
            href="/__kit/shell/admin"
            description="Баянзүрх дүүрэг, үдээс хойш"
            icon={CalendarCheck}
            meta={<span>2026 оны 10-р сарын 21 · 3 ажилтан</span>}
            status={{ status: "done", table: jobStatus }}
            actions={<RoundAction href="/__kit/shell/admin" label="Нээх" icon={Users} />}
          />
        </QueueGrid>
      </PanelSection>

      <PanelSection title="Хоосон төлөв">
        <EmptyState
          icon={Users}
          title="Жишээ хоосон төлөв"
          body="Энэ карт зөвхөн хөгжүүлэлтийн үед харагдана."
        />
      </PanelSection>
    </>
  );
}

export function ShellPreview({ kind }: { kind: ShellVariant }) {
  const sample = (
    <>
      <PageHeader
        title={`${kind} харагдац`}
        description="Энэ хуудас зөвхөн хөгжүүлэлтийн үед харагдана."
        actions={<Button>Үйлдэл</Button>}
      />
      <Section title="Жишээ агуулга">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <Card key={index} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">Жишээ бичлэг {index}</span>
                <Chip tone="primary">Шинэ</Chip>
              </div>
              <p className="text-[0.9em] text-muted">
                Хугарч, давхцахгүй эсэхийг шалгах урт бичвэр. {kind} горим.
              </p>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );

  if (kind === "public") {
    return (
      <AppShell audience="public">
        <PageContainer>{sample}</PageContainer>
      </AppShell>
    );
  }

  if (kind === "customer") {
    return (
      <AppShell audience="public" sidebar={<CustomerSidebar />} bottomNav={<CustomerBottomNav />}>
        <PageContainer>{sample}</PageContainer>
      </AppShell>
    );
  }

  if (kind === "worker") {
    return (
      <AppShell audience="public" sidebar={<WorkerSidebar />} bottomNav={<WorkerBottomNav />}>
        <PageContainer>{sample}</PageContainer>
      </AppShell>
    );
  }

  const superAdmin = kind === "super";
  return (
    <StaffShell
      tone={superAdmin ? "super" : "admin"}
      role={superAdmin ? "super_admin" : "admin"}
      activeHref={superAdmin ? "/super" : "/today"}
      name="Жишээ Админ"
      email="admin@zav.test"
      lastSignIn="2026-10-19 09:15"
      counts={{ jobs: 4, alerts: 3 }}
      desk={sampleDesk(superAdmin)}
      palette={[
        { label: superAdmin ? "Хянах самбар" : "Өнөөдөр", href: superAdmin ? "/super" : "/today", kind: "Хуудас" },
        { label: "Жишээ зар", href: "/jobs", kind: "Зар" },
        { label: "Жишээ ажилтан", href: "/workers", kind: "Ажилтан" },
      ]}
      notices={[
        {
          id: "sample-1",
          title: "Жишээ мэдэгдэл — зөвхөн хөгжүүлэлтийн үед",
          href: "/notifications",
          read: false,
          time: "Саяхан",
        },
      ]}
    >
      {samplePage(superAdmin)}
    </StaffShell>
  );
}
