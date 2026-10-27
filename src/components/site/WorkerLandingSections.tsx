import Link from "next/link";
import { ArrowRight, Bell, CalendarDays, Headset, MapPin } from "lucide-react";
import { AuthTrigger } from "@/components/auth/AuthDialogProvider";
import { Faq, Marquee } from "@/components/ds";
import { SlotStrip } from "@/components/ds/SlotStrip";
import { mn } from "@/lib/i18n/mn";
import type { Skill } from "@/lib/types";

const copy = mn.marketing.worker;
const howRows = mn.design.sampleRows;
const benefitIcons = [CalendarDays, Headset, Bell, MapPin];

export function WorkerLandingSections({
  skills,
  isWorker,
}: {
  skills: Skill[];
  isWorker: boolean;
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

      <section className="landing-section benefits-section" id="benefits">
        <div className="design-container">
          <div className="section-heading">
            <p className="ds-label">{copy.benefitsLabel}</p>
            <h2>{copy.benefitsTitle}</h2>
          </div>
          <div className="benefit-grid">
            {copy.benefits.map((benefit, index) => {
              const Icon = benefitIcons[index % benefitIcons.length];
              return (
                <article className={`benefit-tile benefit-tile--${index}`} key={benefit.title}>
                  <span className="benefit-icon"><Icon aria-hidden /></span>
                  <span className="benefit-index">0{index + 1}</span>
                  <div>
                    <h3>{benefit.title}</h3>
                    <p>{benefit.body}</p>
                  </div>
                  {index === 0 ? (
                    <div className="benefit-slot-sample">
                      <p className="ds-label">{copy.sample}</p>
                      <SlotStrip
                        rows={[howRows[0]]}
                        variant="divider"
                        description={mn.design.slotDescription}
                      />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-section worker-process-section" id="how">
        <div className="design-container process-layout">
          <div className="process-intro">
            <p className="ds-label">{copy.howLabel}</p>
            <h2>{copy.howTitle}</h2>
            <div className="worker-process-sample">
              <p className="ds-label">{copy.sample}</p>
              <h3>{copy.calendarTitle}</h3>
              <SlotStrip
                rows={howRows.slice(0, 3)}
                variant="board"
                description={mn.design.slotDescription}
              />
            </div>
          </div>
          <ol className="process-steps">
            {copy.steps.map((step, index) => (
              <li className="process-step" key={step.title}>
                <span className="process-step-number">0{index + 1}</span>
                <div className="process-step-copy">
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  <SlotStrip rows={[howRows[index]]} variant="divider" description="" />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="worker-requirements-section" id="requirements">
        <div className="design-container worker-requirements-grid">
          <div className="requirements-panel">
            <div>
              <p className="ds-label">{copy.needLabel}</p>
              <h2>{copy.needTitle}</h2>
              <p>{copy.needLead}</p>
            </div>
            <ul>
              {copy.needs.map((need) => (
                <li key={need}>
                  <span aria-hidden className="requirement-check" />
                  {need}
                </li>
              ))}
            </ul>
          </div>
          <article className="worker-install-card">
            <div>
              <p className="ds-label">{copy.installTitle}</p>
              <h2>{copy.installTitle}</h2>
              <p>{copy.installBody}</p>
            </div>
            <ul>
              <li>{copy.installIphone}</li>
              <li>{copy.installAndroid}</li>
            </ul>
          </article>
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

      <section className="closing-cta worker-closing-cta">
        <div className="design-container closing-cta-inner">
          <div>
            <p className="ds-label">{copy.ctaTitle}</p>
            <h2>{copy.ctaBody}</h2>
          </div>
          {isWorker ? (
            <Link href="/home" className="ds-button ds-button--accent">
              <span>{copy.ctaButton}</span>
              <ArrowRight aria-hidden className="ds-button-arrow" />
            </Link>
          ) : (
            <AuthTrigger href="/register" tab="register" className="ds-button ds-button--accent">
              <span>{copy.ctaButton}</span>
              <ArrowRight aria-hidden className="ds-button-arrow" />
            </AuthTrigger>
          )}
        </div>
      </section>
    </>
  );
}
