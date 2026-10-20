export type StaffTone = "admin" | "super";

export type StaffDeskAction = { label: string; href: string; icon?: "phone" | "open" };

export type StaffDeskItemData = {
  id: string;
  /** Small type chip, e.g. "Зар" or "Чөлөөтэй". */
  kind: string;
  date: string;
  text: string;
  time: string;
  actions: StaffDeskAction[];
  /** 0-100: draws the small load bar (super admin tab). */
  bar?: number;
};

export type StaffDeskTab = {
  id: string;
  label: string;
  /** Real rows only. Empty tabs render `empty`. */
  items: StaffDeskItemData[];
  empty: string;
};

/** Everything the right-hand "Админы самбар" needs, built on the server. */
export type StaffDeskData = {
  title: string;
  summary: string;
  tabs: StaffDeskTab[];
};

export type StaffPlusAction = { label: string; href: string };

/** One row of the command palette. Never carries emails, phones or notes. */
export type StaffPaletteItem = {
  label: string;
  href: string;
  kind: "Хуудас" | "Зар" | "Ажилтан";
};

export type StaffNotice = {
  id: string;
  title: string;
  href: string;
  read: boolean;
  time: string;
};

export type StaffCounts = {
  jobs: number;
  alerts: number;
};
