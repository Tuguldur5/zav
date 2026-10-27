import { AuthDialogProvider } from "@/components/auth/AuthDialogProvider";
import { StatusPill } from "@/components/ds";
import { SlotStrip } from "@/components/ds/SlotStrip";
import { CustomerLandingSections } from "@/components/site/CustomerLandingSections";
import { OrderBar } from "@/components/site/OrderBar";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { StickyActionBar } from "@/components/site/StickyActionBar";
import { getViewer } from "@/lib/auth";
import { issueFormToken } from "@/lib/auth/form-token";
import { workerUrl } from "@/lib/hosts";
import { mn } from "@/lib/i18n/mn";
import { loadPublicSkills } from "@/lib/marketing/skills";
import { getSupportPhone, getSupportText } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import type { District } from "@/lib/types";

export const dynamic = "force-dynamic";

const copy = mn.marketing.customer;

export default async function CustomerLandingPage() {
  const supabase = await createClient();
  const [viewer, skillResult, districtResult, phone, supportText] = await Promise.all([
    getViewer(),
    loadPublicSkills(supabase),
    supabase.from("districts").select("id, name").order("name"),
    getSupportPhone(),
    getSupportText(),
  ]);
  if (skillResult.error) console.error("Could not load public skills:", skillResult.error);
  if (districtResult.error) console.error("Could not load public districts:", districtResult.error);

  const skills = skillResult.skills;
  const districts = (districtResult.data as District[] | null) ?? [];
  const isCustomer = Boolean(viewer.user && viewer.profile?.role === "customer");

  return (
    <AuthDialogProvider
      audience="customer"
      districts={districts}
      skills={skills}
      formToken={issueFormToken()}
      switchHref={workerUrl("/?auth=register")}
    >
      <div className="landing-page landing-page--customer">
        <a className="skip-link" href="#main">{mn.common.skipToContent}</a>
        <SiteHeader audience="customer" />
        <main id="main">
          <section className="landing-hero customer-hero" id="customer-hero">
            <div className="design-container customer-hero-grid">
              <div className="customer-hero-copy">
                <p className="ds-label">{copy.chip}</p>
                <h1 className="landing-title">
                  <span>{copy.titleStart}</span>
                  <span className="hero-marker">{copy.titleAccent}</span>
                </h1>
                <p className="landing-lead">{copy.subtitle}</p>
                <OrderBar
                  skills={skills}
                  districts={districts}
                  isCustomer={isCustomer}
                  labels={{
                    skill: copy.formSkill,
                    district: copy.formDistrict,
                    when: copy.formWhen,
                    choose: copy.choose,
                    today: copy.today,
                    tomorrow: copy.tomorrow,
                    anotherDay: copy.anotherDay,
                    submit: copy.submit,
                    dataUnavailable: copy.dataUnavailable,
                  }}
                />
                <p className="landing-crosslink">
                  <a href={workerUrl("/")}>{copy.workerLink}</a>
                </p>
              </div>

              <div className="customer-hero-visual">
                <div className="sample-heading">
                  <span className="ds-label">{copy.sample}</span>
                  <span>{copy.previewOrder}</span>
                </div>
                <div className="sample-order-card">
                  <div className="sample-order-top">
                    <span>{copy.previewSkill}</span>
                    <span className="sample-order-meta">{copy.previewDistrict}</span>
                    <span className="sample-order-meta">{copy.previewDate}</span>
                  </div>
                  <SlotStrip
                    rows={mn.design.sampleRows}
                    variant="board"
                    description={mn.design.slotDescription}
                    isLive
                  />
                  <div className="sample-status">
                    <p className="ds-label">{copy.previewStatus}</p>
                    <ol>
                      {[
                        copy.statusNew,
                        copy.statusClaimed,
                        copy.statusMatched,
                        copy.statusConfirmed,
                      ].map((status, index) => (
                        <li key={status}>
                          <span className="sample-status-index">0{index + 1}</span>
                          <StatusPill tone={index < 2 ? "ok" : "warn"}>{status}</StatusPill>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
                <label className="ds-motion-toggle landing-motion-toggle">
                  <input type="checkbox" />
                  <span>{mn.design.pause}</span>
                </label>
              </div>
            </div>
          </section>

          <CustomerLandingSections
            skills={skills}
            isCustomer={isCustomer}
            phone={phone}
            supportText={supportText}
          />
        </main>
        <SiteFooter audience="customer" supportPhone={phone} />
        <StickyActionBar targetId="customer-hero" label={copy.sticky} next="/c/new" />
      </div>
    </AuthDialogProvider>
  );
}
