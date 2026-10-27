import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AuthDialogProvider, AuthTrigger } from "@/components/auth/AuthDialogProvider";
import { CalendarDemo } from "@/components/ds";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { StickyActionBar } from "@/components/site/StickyActionBar";
import { WorkerLandingSections } from "@/components/site/WorkerLandingSections";
import { getViewer } from "@/lib/auth";
import { issueFormToken } from "@/lib/auth/form-token";
import { siteUrl } from "@/lib/hosts";
import { mn } from "@/lib/i18n/mn";
import { loadPublicSkills } from "@/lib/marketing/skills";
import { getSupportPhone } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import type { District } from "@/lib/types";

export const dynamic = "force-dynamic";

const copy = mn.marketing.worker;

export default async function WorkerLandingPage() {
  const supabase = await createClient();
  const [viewer, skillResult, districtResult, phone] = await Promise.all([
    getViewer(),
    loadPublicSkills(supabase),
    supabase.from("districts").select("id, name").order("name"),
    getSupportPhone(),
  ]);
  if (skillResult.error) console.error("Could not load public skills:", skillResult.error);
  if (districtResult.error) console.error("Could not load public districts:", districtResult.error);

  const skills = skillResult.skills;
  const districts = (districtResult.data as District[] | null) ?? [];
  const isWorker = Boolean(viewer.user && viewer.profile?.role === "worker");

  return (
    <AuthDialogProvider
      audience="worker"
      districts={districts}
      skills={skills}
      formToken={issueFormToken()}
      switchHref={siteUrl("/?auth=register")}
    >
      <div className="landing-page landing-page--worker">
        <a className="skip-link" href="#main">{mn.common.skipToContent}</a>
        <SiteHeader audience="worker" />
        <main id="main">
          <section className="landing-hero worker-hero" id="worker-hero">
            <div className="design-container worker-hero-grid">
              <div className="worker-hero-copy">
                <p className="ds-label">{copy.chip}</p>
                <h1 className="landing-title">
                  <span>{copy.titleStart}</span>
                  <span className="hero-marker">{copy.titleAccent}</span>
                </h1>
                <p className="landing-lead">{copy.subtitle}</p>
                <div className="hero-actions">
                  {isWorker ? (
                    <Link href="/home" className="ds-button ds-button--accent">
                      <span>{copy.register}</span>
                      <ArrowRight aria-hidden className="ds-button-arrow" />
                    </Link>
                  ) : (
                    <AuthTrigger href="/register" tab="register" className="ds-button ds-button--accent">
                      <span>{copy.register}</span>
                      <ArrowRight aria-hidden className="ds-button-arrow" />
                    </AuthTrigger>
                  )}
                  <AuthTrigger href="/login" tab="login" className="ds-button ds-button--secondary">
                    <span>{copy.login}</span>
                  </AuthTrigger>
                </div>
                <ul className="worker-hero-points">
                  {[copy.trust1, copy.trust2, copy.trust3].map((item) => (
                    <li key={item}>
                      <span aria-hidden className="worker-point-mark" />
                      {item}
                    </li>
                  ))}
                </ul>
                <a className="worker-customer-link" href={siteUrl("/")}>
                  {mn.marketing.auth.workerToCustomer}
                </a>
              </div>

              <div className="worker-hero-visual">
                <div className="worker-calendar-wrap">
                  <CalendarDemo
                    label={copy.sample}
                    title={copy.calendarTitle}
                    hint={mn.design.calendarHint}
                    freeLabel={copy.calendarLegendOpen}
                    emptyLabel={mn.design.calendarEmpty}
                  />
                </div>
                <article className="worker-offer-card">
                  <p className="ds-label">{copy.sample}</p>
                  <h2>{copy.offerTitle}</h2>
                  <p>{copy.offerBody}</p>
                  <div className="worker-offer-actions" aria-hidden="true">
                    <span>{copy.accept}</span>
                    <span>{copy.decline}</span>
                  </div>
                </article>
                <label className="ds-motion-toggle landing-motion-toggle">
                  <input type="checkbox" />
                  <span>{mn.design.pause}</span>
                </label>
              </div>
            </div>
          </section>

          <WorkerLandingSections skills={skills} isWorker={isWorker} />
        </main>
        <SiteFooter audience="worker" supportPhone={phone} />
        <StickyActionBar
          targetId="worker-hero"
          label={copy.sticky}
          signedInHref={isWorker ? "/home" : undefined}
        />
      </div>
    </AuthDialogProvider>
  );
}
