export type Role = "customer" | "worker" | "admin" | "super_admin";

export type ProfileStatus = "active" | "pending" | "suspended";

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  phone: string | null;
  district_id: string | null;
  status: ProfileStatus;
  created_at: string;
};

export type District = { id: string; name: string };
export type Skill = {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  active: boolean;
};

export type Job = {
  id: string;
  customer_id: string;
  skill_id: string;
  title: string;
  description: string;
  district_id: string;
  job_date: string;
  job_slot: "full" | "am" | "pm";
  workers_needed: number;
  pay_offer: number | null;
  address_note: string;
  status: "new" | "claimed" | "matched" | "confirmed" | "done" | "cancelled";
  claimed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Assignment = {
  id: string;
  job_id: string;
  worker_id: string;
  availability_id: string | null;
  offered_by: string | null;
  status: "offered" | "accepted" | "declined" | "confirmed" | "completed" | "cancelled";
  answered_via: "app" | "admin_phone" | null;
  created_at: string;
  updated_at: string;
};

export type Availability = {
  id: string;
  worker_id: string;
  day: string;
  slot: "full" | "am" | "pm";
  status: "open" | "confirmed" | "booked";
  confirmed_by: string | null;
  confirmed_at: string | null;
  confirmed_by_phone: boolean;
  created_by_staff: boolean;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
};
