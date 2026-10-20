import { requireRole } from "@/lib/auth";
import { getSupportPhone } from "@/lib/settings";
import { AppShell } from "@/components/ui/AppShell";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { WorkerBottomNav, WorkerSidebar } from "@/components/app/navs";
import { SupportButton } from "@/components/app/SupportButton";

export const dynamic = "force-dynamic";

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["worker"]);
  const phone = await getSupportPhone();

  return (
    <>
      <OfflineBanner />
      <AppShell
        audience="public"
        tone="user"
        sidebar={
          <WorkerSidebar footer={<SupportButton phone={phone} compact className="w-full" />} />
        }
        bottomNav={<WorkerBottomNav />}
      >
        {children}
      </AppShell>
      <SupportButton
        phone={phone}
        compact
        className="fixed bottom-[calc(var(--row-h)+env(safe-area-inset-bottom)+12px)] left-4 z-30 sm:hidden"
      />
    </>
  );
}
