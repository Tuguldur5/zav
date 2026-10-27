import { requireRole } from "@/lib/auth";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { PublicTabBar, PublicTopNav } from "@/components/public/PublicNav";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["customer"]);

  return (
    <div className="public-app-shell public-app-shell--customer">
      <OfflineBanner />
      <PublicTopNav audience="customer" />
      <main>{children}</main>
      <PublicTabBar audience="customer" />
    </div>
  );
}
