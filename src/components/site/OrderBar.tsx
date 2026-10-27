"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useAuthDialog } from "@/components/auth/AuthDialogProvider";
import type { District, Skill } from "@/lib/types";

export function OrderBar({
  skills,
  districts,
  isCustomer,
  labels,
}: {
  skills: Skill[];
  districts: District[];
  isCustomer: boolean;
  labels: {
    skill: string;
    district: string;
    when: string;
    choose: string;
    today: string;
    tomorrow: string;
    anotherDay: string;
    submit: string;
    dataUnavailable: string;
  };
}) {
  const router = useRouter();
  const dialog = useAuthDialog();
  const unavailable = skills.length === 0 || districts.length === 0;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const name of ["skill", "district", "when"] as const) {
      const value = String(data.get(name) ?? "");
      if (value) params.set(name, value);
    }
    const next = `/c/new?${params.toString()}`;
    if (isCustomer) {
      router.push(next);
    } else if (dialog) {
      dialog.open("register", { next });
    } else {
      router.push(`/register?next=${encodeURIComponent(next)}`);
    }
  }

  return (
    <form className="order-bar" onSubmit={submit}>
      <label className="order-field">
        <span>{labels.skill}</span>
        <select className="ds-input" name="skill" defaultValue="" required disabled={unavailable}>
          <option value="" disabled>
            {labels.choose}
          </option>
          {skills.map((skill) => (
            <option value={skill.id} key={skill.id}>
              {skill.name}
            </option>
          ))}
        </select>
      </label>
      <label className="order-field">
        <span>{labels.district}</span>
        <select className="ds-input" name="district" defaultValue="" required disabled={unavailable}>
          <option value="" disabled>
            {labels.choose}
          </option>
          {districts.map((district) => (
            <option value={district.id} key={district.id}>
              {district.name}
            </option>
          ))}
        </select>
      </label>
      <label className="order-field">
        <span>{labels.when}</span>
        <select className="ds-input" name="when" defaultValue="today" required disabled={unavailable}>
          <option value="today">{labels.today}</option>
          <option value="tomorrow">{labels.tomorrow}</option>
          <option value="other">{labels.anotherDay}</option>
        </select>
      </label>
      <button className="order-submit" type="submit" disabled={unavailable}>
        <span>{labels.submit}</span>
        <span className="ds-button-arrow">
          <ArrowRight aria-hidden className="size-4" />
        </span>
      </button>
      {unavailable ? <p className="order-bar-error" role="alert">{labels.dataUnavailable}</p> : null}
    </form>
  );
}
