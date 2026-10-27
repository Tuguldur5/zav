import Link from "next/link";
import { Container } from "./ui";

export function PublicFooter({ supportPhone }: { supportPhone?: string | null }) {
  return (
    <footer className="mt-12 border-t border-divider bg-surface">
      <Container className="flex flex-col gap-3 py-6 text-[0.88em] text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Зав байна</p>
        <nav className="public-legal-footer-links flex flex-wrap items-center gap-4">
          <Link href="/terms" className="hover:text-primary">
            Үйлчилгээний нөхцөл
          </Link>
          <Link href="/privacy" className="hover:text-primary">
            Нууцлал
          </Link>
          <Link href="/help" className="hover:text-primary">
            Тусламж
          </Link>
          {supportPhone ? <span>{supportPhone}</span> : null}
        </nav>
      </Container>
    </footer>
  );
}
