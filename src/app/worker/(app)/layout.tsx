import { requireRole } from "@/lib/auth";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { PublicTabBar, PublicTopNav } from "@/components/public/PublicNav";

export const dynamic = "force-dynamic";

export default async function WorkerAppLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["worker"]);

  return (
    <div className="public-app-shell public-app-shell--worker">
      <OfflineBanner />
      <PublicTopNav audience="worker" />
      <main>{children}</main>
      <PublicTabBar audience="worker" />
    </div>
  );
}
