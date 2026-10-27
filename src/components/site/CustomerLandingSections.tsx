import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { AuthTrigger } from "@/components/auth/AuthDialogProvider";
import { Faq, Marquee } from "@/components/ds";
import { SlotStrip } from "@/components/ds/SlotStrip";
import { skillIcon } from "@/components/public/SkillIcon";
import { workerUrl } from "@/lib/hosts";
import { mn } from "@/lib/i18n/mn";
import type { Skill } from "@/lib/types";

const copy = mn.marketing.customer;
const processRows = mn.design.sampleRows;

export function CustomerLandingSections({
  skills,
  isCustomer,
  phone,
  supportText,
}: {
  skills: Skill[];
  isCustomer: boolean;
  phone: string | null;
  supportText: string | null;
}) {
  return (
    <>
      <section className="landing-marquee" aria-label={mn.design.marqueeLabel}>
        <div className="design-container">
          <Marquee
            items={
              skills.length > 0
                ? skills.map((skill) => ({ label: skill.name }))
                : mn.design.marqueeItems.map((label) => ({ label }))
            }
            pauseLabel={mn.design.pause}
            showToggle={false}
          />
        </div>
      </section>

      <section className="landing-section services-section" id="services">
        <div className="design-container">
          <div className="section-heading">
            <p className="ds-label">{copy.popular}</p>
            <h2>{copy.servicesTitle}</h2>
            <p>{copy.servicesLead}</p>
          </div>
          {skills.length ? (
            <div className="service-grid">
              {skills.slice(0, 7).map((skill, index) => {
                const Icon = skillIcon(skill.icon);
                const next = `/c/new?skill=${encodeURIComponent(skill.id)}`;
                const content = (
                  <>
                    <span className="service-tile-icon"><Icon aria-hidden /></span>
                    <span className="service-tile-index">0{index + 1}</span>
                    <span className="service-tile-title">{skill.name}</span>
                    <span className="service-tile-action">
                      {copy.orderLink}
                      <ArrowRight aria-hidden />
                    </span>
                  </>
                );
                return isCustomer ? (
                  <Link key={skill.id} href={next} className={`service-tile service-tile--${index % 4}`}>
                    {content}
                  </Link>
                ) : (
                  <AuthTrigger
                    key={skill.id}
                    href={`/register?next=${encodeURIComponent(next)}`}
                    tab="register"
                    next={next}
                    className={`service-tile service-tile--${index % 4}`}
                  >
                    {content}
                  </AuthTrigger>
                );
              })}
              {skills.length > 7 ? (
                isCustomer ? (
                  <Link href="/c/new" className="service-tile service-tile--other">
                    <span className="service-tile-icon"><ArrowRight aria-hidden /></span>
                    <span className="service-tile-title">{copy.otherSkills}</span>
                    <span className="service-tile-other-list">
                      {skills.slice(7).map((skill) => skill.name).join(" · ")}
                    </span>
                    <span className="service-tile-action">
                      {copy.orderLink}
                      <ArrowRight aria-hidden />
                    </span>
                  </Link>
                ) : (
                  <AuthTrigger
                    href={`/register?next=${encodeURIComponent("/c/new")}`}
                    tab="register"
                    next="/c/new"
                    className="service-tile service-tile--other"
                  >
                    <span className="service-tile-icon"><ArrowRight aria-hidden /></span>
                    <span className="service-tile-title">{copy.otherSkills}</span>
                    <span className="service-tile-other-list">
                      {skills.slice(7).map((skill) => skill.name).join(" · ")}
                    </span>
                    <span className="service-tile-action">
                      {copy.orderLink}
                      <ArrowRight aria-hidden />
                    </span>
                  </AuthTrigger>
                )
              ) : null}
            </div>
          ) : (
            <p className="landing-data-error" role="alert">{copy.dataUnavailable}</p>
          )}
        </div>
      </section>

      <section className="landing-section process-section" id="how">
        <div className="design-container process-layout">
          <div className="process-intro">
            <p className="ds-label">{copy.howLabel}</p>
            <h2>{copy.howTitle}</h2>
            <p>{copy.howLead}</p>
          </div>
          <ol className="process-steps">
            {copy.steps.map((step, index) => (
              <li className="process-step" key={step.title}>
                <span className="process-step-number">0{index + 1}</span>
                <div className="process-step-copy">
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  <SlotStrip rows={[processRows[index]]} variant="divider" description="" />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="trust-section" id="trust">
        <div className="design-container">
          <div className="trust-heading">
            <p className="ds-label">{copy.trustLabel}</p>
            <h2>{copy.trustTitle}</h2>
            <p>{copy.trustLead}</p>
          </div>
          <div className="trust-grid">
            {copy.trustItems.map((item, index) => (
              <article className="trust-item" key={item.title}>
                <span className="trust-number" aria-hidden>0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
          {phone ? (
            <div className="trust-contact">
              <span>{mn.footer.support}</span>
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                <Phone aria-hidden />
                {phone}
              </a>
              {supportText ? <p>{supportText}</p> : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="worker-band">
        <div className="design-container worker-band-inner">
          <div>
            <p className="ds-label">{copy.workerBandTitle}</p>
            <h2>{copy.workerBandBody}</h2>
          </div>
          <a className="ds-button ds-button--secondary" href={workerUrl("/")}>
            <span>{copy.workerBandCta}</span>
            <ArrowRight aria-hidden className="ds-button-arrow" />
          </a>
        </div>
      </section>

      <section className="landing-section faq-section" id="faq">
        <div className="design-container faq-layout">
          <div className="section-heading">
            <p className="ds-label">{copy.faqLabel}</p>
            <h2>{copy.faqTitle}</h2>
          </div>
          <Faq items={copy.faq} />
        </div>
      </section>

      <section className="closing-cta">
        <div className="design-container closing-cta-inner">
          <div>
            <p className="ds-label">{copy.ctaTitle}</p>
            <h2>{copy.ctaBody}</h2>
          </div>
          {isCustomer ? (
            <Link href="/c/new" className="ds-button ds-button--accent">
              <span>{copy.ctaButton}</span>
              <ArrowRight aria-hidden className="ds-button-arrow" />
            </Link>
          ) : (
            <AuthTrigger
              href={`/register?next=${encodeURIComponent("/c/new")}`}
              tab="register"
              next="/c/new"
              className="ds-button ds-button--accent"
            >
              <span>{copy.ctaButton}</span>
              <ArrowRight aria-hidden className="ds-button-arrow" />
            </AuthTrigger>
          )}
        </div>
      </section>
    </>
  );
}
