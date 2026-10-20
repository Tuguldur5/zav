"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Inbox, Phone } from "lucide-react";
import { SegmentedTabs } from "./SegmentedTabs";
import type { StaffDeskData, StaffDeskItemData } from "./types";

function DeskCard({ item, tint }: { item: StaffDeskItemData; tint: 1 | 2 | 3 }) {
  return (
    <article className="staff-desk-item" data-desk-item="" data-tint={tint}>
      <div className="flex items-center gap-2">
        <span className="staff-desk-chip">{item.kind}</span>
        {item.date ? <span className="staff-desk-date">{item.date}</span> : null}
      </div>
      <p className="staff-desk-text">{item.text}</p>
      {typeof item.bar === "number" ? (
        <div className="staff-desk-bar" aria-hidden>
          <div className="staff-desk-bar-track">
            <div
              className="staff-desk-bar-fill"
              style={{ width: `${Math.min(100, Math.max(3, Math.round(item.bar)))}%` }}
            />
          </div>
        </div>
      ) : null}
      <div className="staff-desk-row">
        <span className="truncate">{item.time}</span>
        <span className="staff-desk-row-actions">
          {item.actions.map((action) => {
            const icon =
              action.icon === "phone" ? (
                <Phone aria-hidden className="size-4" />
              ) : (
                <ArrowUpRight aria-hidden className="size-4" />
              );
            const shared = {
              "aria-label": action.label,
              title: action.label,
              className: "staff-desk-action press",
              children: icon,
            };
            return action.href.startsWith("tel:") || action.href.startsWith("http") ? (
              <a key={`${item.id}-${action.label}`} href={action.href} {...shared} />
            ) : (
              <Link key={`${item.id}-${action.label}`} href={action.href} {...shared} />
            );
          })}
        </span>
      </div>
    </article>
  );
}

/**
 * "Админы самбар": title with a small emoji, real counts, three segments and a
 * vertical list of tinted cards. The same body renders in the 360px column and
 * in the right drawer below 1280px.
 */
export function AdminDesk({ desk }: { desk: StaffDeskData }) {
  const [active, setActive] = useState(desk.tabs[0]?.id ?? "");
  const tab = desk.tabs.find((item) => item.id === active) ?? desk.tabs[0];

  return (
    <div className="staff-desk" data-staff-desk="">
      <div>
        <p className="staff-desk-title">
          <span aria-hidden>🗂️</span> {desk.title}
        </p>
        <p className="staff-desk-summary mt-0.5">{desk.summary}</p>
      </div>

      {desk.tabs.length > 0 ? (
        <SegmentedTabs
          tabs={desk.tabs.map((item) => ({ id: item.id, label: item.label }))}
          active={tab?.id ?? ""}
          onChange={setActive}
        />
      ) : null}

      <div className="flex flex-col gap-3">
        {tab && tab.items.length > 0 ? (
          tab.items.map((item, index) => (
            <DeskCard key={item.id} item={item} tint={((index % 3) + 1) as 1 | 2 | 3} />
          ))
        ) : (
          <div className="staff-desk-empty">
            <Inbox aria-hidden className="size-5" />
            {tab?.empty ?? "Одоогоор мэдээлэл алга."}
          </div>
        )}
      </div>
    </div>
  );
}
