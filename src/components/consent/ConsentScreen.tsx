import { redirect } from "next/navigation";
import { requireRole, roleHome, needsConsent } from "@/lib/auth";
import { ConsentForm } from "./ConsentForm";
import { Container, Card } from "@/components/public/ui";

/**
 * Shown by requireRole for any customer/worker whose accepted terms are
 * missing or outdated (for example when email confirmation was on at signup).
 */
export async function ConsentScreen({ role }: { role: "customer" | "worker" }) {
  const { profile } = await requireRole([role], { skipConsent: true });
  if (!needsConsent(profile)) redirect(roleHome(profile.role));

  return (
    <div className="min-h-dvh bg-bg py-8 sm:py-12">
      <Container className="max-w-[640px]">
        <h1 className="text-[24px] font-semibold leading-[30px] sm:text-[28px] sm:leading-[32px]">
          Үргэлжлүүлэхийн тулд зөвшөөрөл өгнө үү
        </h1>
        <p className="mt-2 text-[0.95em] text-muted">
          {role === "worker"
            ? "Ажил хийх хүн мөн гэдгээ баталж, нөхцөлийг зөвшөөрсний дараа ажлын санал хүлээн авна."
            : "Ажил хийлгэх хүн мөн гэдгээ баталж, нөхцөлийг зөвшөөрсний дараа захиалга өгөх боломжтой."}
        </p>
        <Card className="mt-5 p-5">
          <ConsentForm kind={role} />
        </Card>
      </Container>
    </div>
  );
}
