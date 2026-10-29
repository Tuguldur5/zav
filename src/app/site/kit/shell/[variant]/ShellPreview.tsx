"use client";

import { CalendarCheck, Users } from "lucide-react";
import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer, PageHeader, Section } from "@/components/ui/Layout";
import {
  CustomerBottomNav,
  CustomerSidebar,
  WorkerBottomNav,
  WorkerSidebar,
} from "@/components/app/navs";
import {
  PageHeader as StaffPageHeader,
  Row,
  Rows,
  StaffShell,
  StatTile,
  StatTiles,
} from "@/components/staff";

export type ShellVariant = "public" | "customer" | "worker" | "admin" | "super";

function SampleStaffPage({ superAdmin }: { superAdmin: boolean }) {
  return (
    <>
      {/* A real staff page never renders its own title: the shell topbar has
          it. The preview must show the same anatomy. */}
      <StaffPageHeader
        subtitle={
          superAdmin
            ? "Жишээ самбар — зөвхөн хөгжүүлэлтийн үед харагдана."
            : "Жишээ өдөр — зөвхөн хөгжүүлэлтийн үед харагдана."
        }
        actions={<Button>Жишээ үйлдэл</Button>}
      />

      <StatTiles>
        <StatTile label="Шинэ зар" value={12} icon={Users} />
        <StatTile label="Баталгаажуулах" value={4} icon={CalendarCheck} />
        <StatTile label="Хариу хүлээж буй" value={7} icon={CalendarCheck} />
        <StatTile label="Анхаарах" value={3} icon={CalendarCheck} attention />
      </StatTiles>

      <Section title="Жишээ мөрүүд">
        <Rows label="Жишээ">
          <Row
            title="Цэвэрлэгээ — Сүхбаатар"
            meta={<span>2026-10-19 · 2 ажилтан</span>}
            action={
              <button type="button" className="st-btn" data-variant="outline">
                Нээх
              </button>
            }
          />
          <Row title="Ачаа тээвэр — Хан-Уул" meta={<span>2026-10-20 · 1 ажилтан</span>} />
        </Rows>
      </Section>

      <EmptyState
        icon={Users}
        title="Жишээ хоосон төлөв"
        body="Энэ карт зөвхөн хөгжүүлэлтийн үед харагдана."
      />
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
      name="Жишээ Админ"
      email="admin@zav.test"
      counts={{ jobs: 4, newWorkers: 2, staleJobs: 1, alerts: 3 }}
      notices={[
        {
          id: "sample-1",
          title: "Жишээ мэдэгдэл — зөвхөн хөгжүүлэлтийн үед",
          href: "/notifications",
          read: false,
          time: "Саяхан",
        },
      ]}
      mfaEnabled
      lastSignIn="2 цагийн өмнө"
    >
      <SampleStaffPage superAdmin={superAdmin} />
    </StaffShell>
  );
}
