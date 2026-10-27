import Link from "next/link";
import { Container, Note } from "@/components/public/ui";
import { PublicFooter } from "@/components/public/PublicFooter";
import { LEGAL_NOTICE, type LegalSection } from "@/content/legal";

export function LegalPage({
  title,
  lead,
  updatedAt,
  sections,
  sectionLabel = "Агуулга",
  supportPhone,
}: {
  title: string;
  lead?: string;
  updatedAt: string;
  sections: LegalSection[];
  sectionLabel?: string;
  supportPhone?: string | null;
}) {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="public-legal-header">
        <Container className="public-legal-header-inner">
          <Link href="/" className="public-legal-brand">
            Зав байна
          </Link>
          <nav className="public-legal-links">
            <Link href="/terms" className="text-muted hover:text-primary">
              Нөхцөл
            </Link>
            <Link href="/privacy" className="text-muted hover:text-primary">
              Нууцлал
            </Link>
            <Link href="/help" className="text-muted hover:text-primary">
              Тусламж
            </Link>
          </nav>
        </Container>
      </header>

      <main>
        <Container className="py-8 sm:py-12">
          <div className="max-w-[720px]">
            <h1 className="public-page-title">
              {title}
            </h1>
            {lead ? <p className="mt-2 text-muted">{lead}</p> : null}
            <p className="mt-2 text-[0.85em] text-muted">Сүүлд шинэчлэгдсэн: {updatedAt}</p>
            <div className="mt-4">
              <Note tone="warn">{LEGAL_NOTICE}</Note>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
            <nav aria-label={sectionLabel} className="hidden lg:block">
              <div className="sticky top-8">
                <p className="text-[0.78em] font-semibold uppercase tracking-[0.08em] text-muted">
                  {sectionLabel}
                </p>
                <ol className="mt-3 flex flex-col gap-1.5 text-[0.88em]">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="block py-1 text-muted hover:text-primary"
                      >
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </nav>

            <article className="flex max-w-[760px] flex-col gap-8">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-20">
                  <h2 className="text-[1.1em] font-semibold">{section.title}</h2>
                  <div className="mt-2 flex flex-col gap-2 text-[0.95em] leading-[1.65] text-ink [&_li]:ml-5 [&_li]:list-disc [&_p]:text-muted">
                    {section.body}
                  </div>
                </section>
              ))}
            </article>
          </div>
        </Container>
      </main>

      <PublicFooter supportPhone={supportPhone} />
    </div>
  );
}
