import type { createClient } from "@/lib/supabase/server";
import type { StaffDeskData, StaffDeskItemData } from "@/components/staff/types";
import { formatDateMn, formatDateTimeMn, relativeHourLabel, todayISO } from "./dates";
import { slotLabels } from "./status";
import type { Assignment, Availability, Job, Profile } from "./types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type DeskOptions = {
  supabase: Supabase;
  role: "admin" | "super_admin";
  userId: string;
  /** The request path (set by middleware) so detail pages get their own desk. */
  path: string;
};

const EMPTY = "Мэдээлэл байхгүй байна.";

function jobItem(job: Pick<Job, "id" | "title" | "job_date" | "job_slot" | "status">): StaffDeskItemData {
  return {
    id: job.id,
    kind: "Зар",
    date: formatDateMn(job.job_date, false),
    text: job.title,
    time: slotLabels[job.job_slot] ?? job.status,
    actions: [{ label: "Зарыг нээх", href: `/jobs/${job.id}` }],
  };
}

function workerItem(
  worker: { id: string; full_name: string; phone: string | null },
  kind: string,
  date: string,
  time: string,
): StaffDeskItemData {
  const actions: StaffDeskItemData["actions"] = [{ label: "Холбоо харах", href: `/workers/${worker.id}` }];
  if (worker.phone) {
    actions.push({ label: `Залгах ${worker.phone}`, href: `tel:${worker.phone.replace(/[^\d+]/g, "")}`, icon: "phone" });
  }
  return { id: worker.id, kind, date, text: worker.full_name, time, actions };
}

function auditItem(row: { id: string; action: string; entity: string; created_at: string }): StaffDeskItemData {
  return {
    id: row.id,
    kind: "Аудит",
    date: formatDateTimeMn(row.created_at).split(" ")[0],
    text: `${row.action} · ${row.entity}`,
    time: relativeHourLabel(row.created_at),
    actions: [{ label: "Аудитыг нээх", href: "/super/audit" }],
  };
}

async function myWorkers(supabase: Supabase, userId: string): Promise<Profile[]> {
  const { data } = await supabase.from("worker_details").select("worker_id").eq("admin_id", userId);
  const ids = ((data as Array<{ worker_id: string }> | null) ?? []).map((row) => row.worker_id);
  if (ids.length === 0) return [];
  const { data: rows } = await supabase.from("profiles").select("*").in("id", ids);
  return (rows as Profile[] | null) ?? [];
}

/** Worker profile desk: contact history, assignments, the private staff note. */
async function workerDesk(supabase: Supabase, workerId: string): Promise<StaffDeskData | null> {
  const { data: worker } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .eq("id", workerId)
    .maybeSingle();
  if (!worker) return null;
  const profile = worker as { id: string; full_name: string; phone: string | null };

  const [availabilityResult, assignmentsResult, noteResult] = await Promise.all([
    supabase
      .from("availability")
      .select("id, day, slot, status, confirmed_at, confirmed_by_phone")
      .eq("worker_id", workerId)
      .order("day", { ascending: false })
      .limit(6),
    supabase
      .from("assignments")
      .select("id, job_id, status, created_at")
      .eq("worker_id", workerId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.rpc("worker_staff_note", { p_worker: workerId }),
  ]);

  const availability = (availabilityResult.data as Array<Availability> | null) ?? [];
  const assignments = (assignmentsResult.data as Assignment[] | null) ?? [];
  const note = typeof noteResult.data === "string" ? noteResult.data : "";

  const jobIds = [...new Set(assignments.map((row) => row.job_id))];
  const jobMap = new Map<string, { title: string; job_date: string }>();
  if (jobIds.length > 0) {
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, title, job_date")
      .in("id", jobIds);
    for (const row of (jobs as Array<{ id: string; title: string; job_date: string }> | null) ?? []) {
      jobMap.set(row.id, row);
    }
  }

  const contactItems: StaffDeskItemData[] = availability.map((row) => ({
    id: row.id,
    kind: row.confirmed_by_phone ? "Утсаар" : "Холбоо",
    date: formatDateMn(row.day, false),
    text: `${slotLabels[row.slot] ?? row.slot} — ${row.status === "booked" ? "ажилтай" : row.status === "confirmed" ? "баталгаажсан" : "чөлөөтэй"}`,
    time: row.confirmed_at ? formatDateTimeMn(row.confirmed_at) : "—",
    actions: [{ label: "Холбоо харах", href: `/workers/${workerId}` }],
  }));

  const jobItems: StaffDeskItemData[] = assignments.map((row) => {
    const job = jobMap.get(row.job_id);
    return {
      id: row.id,
      kind: "Ажил",
      date: job ? formatDateMn(job.job_date, false) : "—",
      text: job?.title ?? "Ажил",
      time: row.status,
      actions: [{ label: "Зарыг нээх", href: `/jobs/${row.job_id}` }],
    };
  });

  return {
    title: profile.full_name,
    summary: `${availability.length} чөлөөт өдөр, ${assignments.length} томилолт`,
    tabs: [
      { id: "contact", label: "Холбоо", items: contactItems, empty: "Холбоо бүртгэл байхгүй." },
      { id: "jobs", label: "Ажил", items: jobItems, empty: "Ажлын түүх байхгүй." },
      {
        id: "note",
        label: "Тэмдэглэл",
        items: note
          ? [
              {
                id: `${workerId}-note`,
                kind: "Тэмдэглэл",
                date: "",
                text: note,
                time: "Хувийн",
                actions: [{ label: "Холбоо харах", href: `/workers/${workerId}` }],
              },
            ]
          : [],
        empty: "Тэмдэглэл байхгүй. Доор нэмнэ үү.",
      },
    ],
  };
}

/** Job detail desk: the job, who it needs, who works on it. */
async function jobDesk(supabase: Supabase, jobId: string): Promise<StaffDeskData | null> {
  const { data } = await supabase.from("jobs").select("*").eq("id", jobId).maybeSingle();
  if (!data) return null;
  const job = data as Job;

  const { data: assignmentRows } = await supabase
    .from("assignments")
    .select("id, worker_id, status")
    .eq("job_id", job.id)
    .order("created_at", { ascending: false })
    .limit(6);
  const assignments = (assignmentRows as Array<{ id: string; worker_id: string; status: string }> | null) ?? [];

  const workerIds = [...new Set(assignments.map((row) => row.worker_id))];
  const workerMap = new Map<string, { id: string; full_name: string; phone: string | null }>();
  if (workerIds.length > 0) {
    const { data: workers } = await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", workerIds);
    for (const row of (workers as Array<{ id: string; full_name: string; phone: string | null }> | null) ?? []) {
      workerMap.set(row.id, row);
    }
  }

  const summaryItems: StaffDeskItemData[] = [
    {
      id: `${job.id}-summary`,
      kind: "Зар",
      date: formatDateMn(job.job_date, false),
      text: `${job.title} — ${job.workers_needed} ажилтан`,
      time: slotLabels[job.job_slot] ?? job.job_slot,
      actions: [{ label: "Зарыг нээх", href: `/jobs/${job.id}` }],
    },
  ];

  return {
    title: "Зарын товч",
    summary: `${assignments.length} томилолт · ${job.status}`,
    tabs: [
      { id: "summary", label: "Товч", items: summaryItems, empty: EMPTY },
      {
        id: "assigned",
        label: "Ажилчид",
        items: assignments.map((row) =>
          workerItem(
            workerMap.get(row.worker_id) ?? { id: row.worker_id, full_name: "Ажилтан", phone: null },
            "Томилогдсон",
            row.status,
            "—",
          ),
        ),
        empty: "Одоогоор ажилтан томилогдоогүй.",
      },
      { id: "history", label: "Түүх", items: [jobItem(job)], empty: EMPTY },
    ],
  };
}

async function adminDesk(supabase: Supabase, userId: string): Promise<StaffDeskData> {
  const today = todayISO();
  const workers = await myWorkers(supabase, userId);

  const [todayJobsResult, availabilityResult, openDaysResult, waitingResult, auditResult] =
    await Promise.all([
      supabase
        .from("jobs")
        .select("id, title, job_date, job_slot, status")
        .eq("claimed_by", userId)
        .eq("job_date", today)
        .in("status", ["matched", "confirmed", "done"])
        .order("job_date"),
      supabase.from("availability").select("*").eq("day", today),
      supabase
        .from("availability")
        .select("id, worker_id, day, slot, status")
        .eq("status", "open")
        .order("day", { ascending: true })
        .limit(6),
      supabase
        .from("assignments")
        .select("id, job_id, worker_id, created_at")
        .eq("status", "offered")
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("audit_logs")
        .select("id, action, entity, created_at")
        .eq("actor_id", userId)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const todayJobs = (todayJobsResult.data as Job[] | null) ?? [];
  const todayAvailability = (availabilityResult.data as Availability[] | null) ?? [];
  const workerById = new Map(workers.map((row) => [row.id, row]));
  const freeToday = todayAvailability.filter(
    (row) => row.status !== "booked" && workerById.has(row.worker_id),
  );

  const openDays = (openDaysResult.data as Array<{ id: string; worker_id: string; day: string; slot: string }> | null) ?? [];
  const waiting = (waitingResult.data as Array<{ id: string; job_id: string; worker_id: string; created_at: string }> | null) ?? [];
  const audit = (auditResult.data as Array<{ id: string; action: string; entity: string; created_at: string }> | null) ?? [];

  const waitingJobIds = [...new Set(waiting.map((row) => row.job_id))];
  const waitingJobs = new Map<string, string>();
  if (waitingJobIds.length > 0) {
    const { data: jobs } = await supabase.from("jobs").select("id, title").in("id", waitingJobIds);
    for (const row of (jobs as Array<{ id: string; title: string }> | null) ?? []) {
      waitingJobs.set(row.id, row.title);
    }
  }

  return {
    title: "Админы самбар",
    summary: `${openDays.length + waiting.length} зүйл хүлээж байна · ${todayJobs.length} ажил өнөөдөр`,
    tabs: [
      {
        id: "today",
        label: "Өнөөдөр",
        items: [
          ...todayJobs.map(jobItem),
          ...freeToday.map((row) => {
            const worker = workerById.get(row.worker_id)!;
            return workerItem(worker, "Чөлөөтэй", formatDateMn(row.day, false), slotLabels[row.slot] ?? "");
          }),
        ],
        empty: "Өнөөдрийн ажил, чөлөөтэй ажилтан алга.",
      },
      {
        id: "pending",
        label: "Баталгаа",
        items: [
          ...openDays.map((row) =>
            workerItem(
              workerById.get(row.worker_id) ?? { id: row.worker_id, full_name: "Ажилтан", phone: null },
              "Чөлөөт өдөр",
              formatDateMn(row.day, false),
              slotLabels[row.slot] ?? "",
            ),
          ),
          ...waiting.map((row) => ({
            id: row.id,
            kind: "Санал",
            date: relativeHourLabel(row.created_at),
            text: waitingJobs.get(row.job_id) ?? "Зар",
            time: "Хариу хүлээж байна",
            actions: [{ label: "Зарыг нээх", href: `/jobs/${row.job_id}` }],
          })),
        ],
        empty: "Баталгаажуулах зүйл алга.",
      },
      {
        id: "history",
        label: "Түүх",
        items: audit.map(auditItem),
        empty: "Сүүлийн үйлдэл байхгүй.",
      },
    ],
  };
}

async function superDesk(supabase: Supabase): Promise<StaffDeskData> {
  const today = todayISO();
  const [staleResult, intakeResult, auditResult, directoryResult, todayJobsResult] =
    await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, job_date, job_slot, status, created_at")
      .eq("status", "new")
      .order("created_at", { ascending: true })
      .limit(6),
    supabase
      .from("worker_details")
      .select("worker_id, intake_status")
      .eq("intake_status", "new")
      .limit(6),
    supabase
      .from("audit_logs")
      .select("id, action, entity, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.rpc("staff_directory"),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("job_date", today)
      .in("status", ["matched", "confirmed", "done"]),
  ]);

  const stale = (staleResult.data as Job[] | null) ?? [];
  const intake = (intakeResult.data as Array<{ worker_id: string }> | null) ?? [];
  const audit = (auditResult.data as Array<{ id: string; action: string; entity: string; created_at: string }> | null) ?? [];
  const directory =
    (directoryResult.data as Array<{
      id: string;
      full_name: string;
      role: string;
      status: string;
      last_sign_in_at: string | null;
      load: number;
    }> | null) ?? [];
  const admins = directory.filter((row) => row.role === "admin");
  const maxLoad = Math.max(1, ...admins.map((row) => row.load));
  const todayJobs = todayJobsResult.count ?? 0;

  const intakeIds = intake.map((row) => row.worker_id);
  const intakeWorkers = new Map<string, { id: string; full_name: string; phone: string | null }>();
  if (intakeIds.length > 0) {
    const { data: rows } = await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .in("id", intakeIds);
    for (const row of (rows as Array<{ id: string; full_name: string; phone: string | null }> | null) ?? []) {
      intakeWorkers.set(row.id, row);
    }
  }

  return {
    title: "Админы самбар",
    summary: `${intake.length + stale.length} зүйл хүлээж байна · ${todayJobs} ажил өнөөдөр`,
    tabs: [
      {
        id: "admins",
        label: "Админууд",
        items: admins.map((row) => ({
          id: row.id,
          kind: row.status === "active" ? "Админ" : "Түр хаагдсан",
          date: row.last_sign_in_at ? formatDateMn(row.last_sign_in_at.slice(0, 10), false) : "—",
          text: row.full_name || "Нэргүй админ",
          time: `${row.load} ажилтан`,
          bar: Math.round((row.load / maxLoad) * 100),
          actions: [{ label: "Админыг нээх", href: "/super/admins" }],
        })),
        empty: "Админ бүртгэгдээгүй байна.",
      },
      {
        id: "attention",
        label: "Анхаарах",
        items: [
          ...intake.map((row) => {
            const worker = intakeWorkers.get(row.worker_id) ?? {
              id: row.worker_id,
              full_name: "Ажилтан",
              phone: null,
            };
            const item = workerItem(worker, "Шинэ", "—", "Хуваариалаагүй");
            item.actions.push({ label: "Хуваарилах", href: "/super/intake" });
            return item;
          }),
          ...stale.map(jobItem),
        ],
        empty: "Анхаарах зүйл байхгүй.",
      },
      { id: "audit", label: "Аудит", items: audit.map(auditItem), empty: "Бүртгэл байхгүй." },
    ],
  };
}

/**
 * The desk is built on the server from real rows: detail pages get their own
 * tabs, otherwise the role's default three tabs.
 */
export async function loadStaffDesk(options: DeskOptions): Promise<StaffDeskData> {
  const { supabase, role, userId, path } = options;

  const workerMatch = path.match(/\/workers\/([0-9a-fA-F-]{8,})/);
  if (workerMatch) {
    const desk = await workerDesk(supabase, workerMatch[1]);
    if (desk) return desk;
  }

  const jobMatch = path.match(/\/jobs\/([0-9a-fA-F-]{8,})/);
  if (jobMatch) {
    const desk = await jobDesk(supabase, jobMatch[1]);
    if (desk) return desk;
  }

  return role === "super_admin" ? superDesk(supabase) : adminDesk(supabase, userId);
}
