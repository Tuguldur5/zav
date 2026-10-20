import { requireRole } from "@/lib/auth";
import { getSupportPhone } from "@/lib/settings";
import { AppShell } from "@/components/ui/AppShell";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { CustomerBottomNav, CustomerSidebar } from "@/components/app/navs";
import { SupportButton } from "@/components/app/SupportButton";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["customer"]);
  const phone = await getSupportPhone();

  return (
    <>
      <OfflineBanner />
      <AppShell
        audience="public"
        tone="user"
        sidebar={
          <CustomerSidebar footer={<SupportButton phone={phone} compact className="w-full" />} />
        }
        bottomNav={<CustomerBottomNav />}
      >
        {children}
      </AppShell>
      {/* Phone-only support action, sitting above the bottom nav. */}
      <SupportButton
        phone={phone}
        compact
        className="fixed bottom-[calc(var(--row-h)+env(safe-area-inset-bottom)+12px)] left-4 z-30 sm:hidden"
      />
    </>
  );
}
