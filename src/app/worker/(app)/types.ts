export type WorkerJobRow = {
  assignment_id: string;
  job_id: string;
  title: string;
  description: string;
  skill_id: string;
  district_id: string;
  job_date: string;
  job_slot: "full" | "am" | "pm";
  pay_offer: number | null;
  address_note: string | null;
  job_status: string;
  assignment_status: string;
  workers_needed: number;
  created_at: string;
};

export type WorkerAdminContact = {
  admin_id: string | null;
  admin_name: string | null;
  admin_phone: string | null;
};

export type AvailabilityRow = {
  day: string;
  slot: "full" | "am" | "pm";
  status: "open" | "confirmed" | "booked";
  confirmed_at: string | null;
  created_by_staff: boolean;
};
