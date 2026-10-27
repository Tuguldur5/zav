import Link from "next/link";
import { mn } from "@/lib/i18n/mn";
import { siteUrl, workerUrl } from "@/lib/hosts";

export function SiteFooter({
  audience,
  supportPhone,
}: {
  audience: "customer" | "worker";
  supportPhone: string | null;
}) {
  const copy = mn.footer;
  const brand = mn.marketing.header;
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="design-container">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <span>{brand.brand}</span>
            <p>{copy.brandLine}</p>
          </div>
          <nav aria-label={copy.customer}>
            <h2>{copy.customer}</h2>
            <a href={siteUrl("/")}>{copy.orderJob}</a>
            <a href={siteUrl("/c")}>{copy.myOrders}</a>
          </nav>
          <nav aria-label={copy.worker}>
            <h2>{copy.worker}</h2>
            <a href={workerUrl("/")}>{copy.findJob}</a>
            <a href={workerUrl("/home")}>{copy.myPage}</a>
          </nav>
          <nav aria-label={copy.help}>
            <h2>{copy.help}</h2>
            {supportPhone ? (
              <a href={`tel:${supportPhone.replace(/[^\d+]/g, "")}`}>
                {copy.support}: {supportPhone}
              </a>
            ) : null}
            <Link href="/terms">{copy.terms}</Link>
            <Link href="/privacy">{copy.privacy}</Link>
            {audience === "worker" ? <a href={siteUrl("/")}>{brand.order}</a> : null}
          </nav>
        </div>
        <p className="site-footer-wordmark" aria-hidden="true">
          {brand.brand}
        </p>
        <p className="site-footer-copyright">
          © {year} {brand.brand}. {copy.rights}
        </p>
      </div>
    </footer>
  );
}
