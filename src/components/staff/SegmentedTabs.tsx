"use client";

export type SegmentedTab = { id: string; label: string };

/** Three-tab segmented control (rounded, one hue). */
export function SegmentedTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: SegmentedTab[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="staff-seg" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
