#!/usr/bin/env node
/**
 * Dev-only demo data. Refuses in production and unless ALLOW_DEMO_SEED=1.
 *
 * Accounts are created through the normal signup API (anon key) with the demo
 * domain @demo.zav.test and random passwords that are never printed. Roles and
 * assignments are then set over the database connection. `--remove` deletes
 * every demo account (profiles cascade), leaving real staff untouched.
 */
import { loadEnv, withDb } from "./env.mjs";

loadEnv();

const DEMO_DOMAIN = "@demo.zav.test";
// Mirrors src/lib/consent.ts. Demo accounts accept the current terms so they
// can use the app without stopping on /consent.
const TERMS_VERSION = "2026-10";
const remove = process.argv.includes("--remove");

const FIRST = [
  "Бат-Эрдэнэ", "Сарангэрэл", "Тэмүүлэн", "Ануужин", "Ганбат", "Оюунчимэг",
  "Хүрэлбаатар", "Номин", "Энхжин", "Билгүүн", "Мөнхбат", "Цолмон",
  "Ариунзаяа", "Дөлгөөн", "Хатанбаатар", "Ирээдүй", "Солонго", "Төгөлдөр",
];
const LAST_INITIAL = ["Б.", "Д.", "С.", "Э.", "Г.", "Т.", "М.", "Ц."];

const DISTRICTS = [
  { name: "Баянзүрх", weight: 22 },
  { name: "Сонгинохайрхан", weight: 20 },
  { name: "Хан-Уул", weight: 15 },
  { name: "Баянгол", weight: 15 },
  { name: "Сүхбаатар", weight: 10 },
  { name: "Чингэлтэй", weight: 8 },
  { name: "Налайх", weight: 4 },
  { name: "Багануур", weight: 3 },
  { name: "Багахангай", weight: 3 },
];

const SKILLS = [
  "Цэвэрлэгээ", "Засвар үйлчилгээ", "Тавилга угсралт", "Ачаа тээвэр нүүлгэлт",
  "Хүүхэд харах", "Гэр ахуйн туслах", "Хашаа цэцэрлэг", "Зөөгч үйлчилгээ",
];
const JOBS = [
  "Орон сууцны засвар", "Гэр цэвэрлэгээ", "Тавилга угсрах", "Нүүлгэлтийн ачаа",
  "Хүүхэд харах өдөр", "Хашааны ажил", "Хүлээн авалтын зөөгч", "Гал тогооны засвар",
  "Оффис цэвэрлэгээ", "Цонх угаах", "Хаалга солих", "Цэцэрлэгийн ажил",
  "Гэрийн туслах", "Ачаа хүргэлт", "Угаалгын өрөө засвар", "Бага зэргийн будалт",
];

function randomPassword() {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#%";
  return Array.from({ length: 20 }, () =>
    alphabet.charAt(Math.floor(Math.random() * alphabet.length)),
  ).join("");
}

function realisticName(index) {
  const first = FIRST[index % FIRST.length];
  const initial = LAST_INITIAL[Math.floor(index / FIRST.length) % LAST_INITIAL.length];
  return `${first} ${initial}`;
}

function pickDistrict() {
  const total = DISTRICTS.reduce((sum, row) => sum + row.weight, 0);
  let roll = Math.random() * total;
  let chosen = DISTRICTS[0];
  for (const row of DISTRICTS) {
    roll -= row.weight;
    if (roll <= 0) {
      chosen = row;
      break;
    }
  }
  return chosen;
}

async function signup(email, name, metadata) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/signup`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: randomPassword(),
      data: { full_name: name, ...metadata },
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`signup ${email.replace(/.*@/, `***@`)} failed: ${response.status} ${text.slice(0, 120)}`);
  }
  const body = await response.json();
  if (!body?.id) throw new Error("signup did not return a user id");
  return body.id;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to seed demo data in production.");
    process.exit(1);
  }
  if (!remove && process.env.ALLOW_DEMO_SEED !== "1") {
    console.error("Set ALLOW_DEMO_SEED=1 to seed demo data (dev only).");
    process.exit(1);
  }

  const existing = await withDb(async (client) => {
    const { rows } = await client.query(
      "select count(*)::int as total from auth.users where email like $1",
      [`%${DEMO_DOMAIN}`],
    );
    return rows[0].total;
  });

  if (remove) {
    const deleted = await withDb((client) =>
      client
        .query("delete from auth.users where email like $1 returning id", [`%${DEMO_DOMAIN}`])
        .then((result) => result.rowCount),
    );
    console.log(`Demo accounts removed: ${deleted} (previous count ${existing})`);
    return;
  }

  if (existing > 0) {
    console.error(`Demo accounts already exist (${existing}). Run with --remove first.`);
    process.exit(1);
  }

  const catalog = await withDb(async (client) => {
    const districts = await client.query("select id, name from districts");
    const skills = await client.query("select id, name from skills");
    return { districts: districts.rows, skills: skills.rows };
  });
  const districtByName = new Map(catalog.districts.map((row) => [row.name, row.id]));
  const skillByName = new Map(catalog.skills.map((row) => [row.name, row.id]));

  const accounts = [];
  for (let index = 0; index < 2; index += 1) {
    accounts.push({
      key: `admin-${index}`,
      kind: "admin",
      email: `demo-admin-${index + 1}${DEMO_DOMAIN}`,
      name: realisticName(index + 6),
    });
  }
  for (let index = 0; index < 12; index += 1) {
    accounts.push({
      key: `worker-${index}`,
      kind: "worker",
      email: `demo-worker-${index + 1}${DEMO_DOMAIN}`,
      name: realisticName(index + 3),
    });
  }
  for (let index = 0; index < 6; index += 1) {
    accounts.push({
      key: `customer-${index}`,
      kind: "customer",
      email: `demo-customer-${index + 1}${DEMO_DOMAIN}`,
      name: realisticName(index + 11),
    });
  }

  const ids = {};
  await withDb(async (client) => {
    for (const account of accounts) {
      const district = pickDistrict();
      const metadata =
        account.kind === "worker"
          ? { role: "worker", district_id: districtByName.get(district.name) ?? null }
          : { role: "customer" };
      const id = await signup(account.email, account.name, metadata);
      ids[account.key] = id;
      await client.query(
        "update auth.users set email_confirmed_at = now() where id = $1 and email_confirmed_at is null",
        [id],
      );
    }
  });

  await withDb(async (client) => {
    await client.query("begin");
    try {
      // Staff roles: demo accounts only, through SQL (API metadata cannot).
      for (let index = 0; index < 2; index += 1) {
        await client.query(
          "update profiles set role = 'admin', status = 'active', full_name = $2 where id = $1",
          [ids[`admin-${index}`], accounts.find((row) => row.key === `admin-${index}`).name],
        );
      }
      // Every demo user accepts the terms/privacy exactly like the real flow.
      for (const account of accounts) {
        if (account.kind === "admin") continue;
        await client.query(
          `update profiles
              set terms_version = $2, terms_accepted_at = now()
            where id = $1`,
          [ids[account.key], TERMS_VERSION],
        );
        const kinds =
          account.kind === "worker"
            ? ["terms", "privacy", "worker_declaration"]
            : ["terms", "privacy"];
        for (const kind of kinds) {
          await client.query(
            "insert into consents (user_id, kind, version) values ($1, $2, $3)",
            [ids[account.key], kind, TERMS_VERSION],
          );
        }
      }

      for (let index = 0; index < 12; index += 1) {
        const key = `worker-${index}`;
        const name = accounts.find((row) => row.key === key).name;
        const district = pickDistrict();
        await client.query(
          "update profiles set full_name = $2, status = 'active', district_id = $3 where id = $1",
          [ids[key], name, districtByName.get(district.name) ?? null],
        );
        // 5 / 4 / 3 assigned, the last 2 stay new for the intake queue.
        const adminIndex = index < 5 ? 0 : index < 9 ? 1 : null;
        await client.query(
          `update worker_details
              set admin_id = $2,
                  intake_status = $3,
                  assigned_at = case when $3 = 'assigned' then now() else null end,
                  has_transport = $4,
                  staff_note = $5
            where worker_id = $1`,
          [
            ids[key],
            adminIndex === null ? null : ids[`admin-${adminIndex}`],
            adminIndex === null ? "new" : "assigned",
            index % 3 === 0,
            `Демо тэмдэглэл: ${name} анхны утсаар ярьсан.`,
          ],
        );
        const skill = SKILLS[index % SKILLS.length];
        if (skillByName.get(skill)) {
          await client.query(
            "insert into worker_skills (worker_id, skill_id) values ($1, $2) on conflict do nothing",
            [ids[key], skillByName.get(skill)],
          );
        }
        // Availability for the next 14 days, a few days per worker.
        for (let day = 1; day <= 14; day += 1) {
          if (Math.random() > 0.45) continue;
          await client.query(
            `insert into availability (worker_id, day, slot, status, created_by_staff)
             values ($1, (public.today_ub() + $2::int), $3, $4, $5)
             on conflict (worker_id, day) do nothing`,
            [
              ids[key],
              day,
              Math.random() > 0.7 ? "am" : Math.random() > 0.5 ? "pm" : "full",
              Math.random() > 0.6 ? "confirmed" : "open",
              index % 4 === 0,
            ],
          );
        }
      }

      // Jobs: 16 total across statuses, districts capped at 25% of the batch.
      const cap = Math.ceil(16 * 0.25);
      const used = new Map();
      const customers = accounts.filter((row) => row.kind === "customer");
      const statuses = [
        "new", "new", "new", "new", "new", "new",
        "claimed", "claimed", "claimed",
        "matched", "matched", "matched",
        "confirmed", "confirmed", "done", "cancelled",
      ];
      for (let index = 0; index < 16; index += 1) {
        let district = pickDistrict();
        for (let attempt = 0; attempt < 20; attempt += 1) {
          if ((used.get(district.name) ?? 0) < cap) break;
          district = pickDistrict();
        }
        if ((used.get(district.name) ?? 0) >= cap) {
          // Deterministic fallback keeps the cap even when the roll repeats.
          district =
            DISTRICTS.find((row) => (used.get(row.name) ?? 0) < cap) ?? DISTRICTS[0];
        }
        used.set(district.name, (used.get(district.name) ?? 0) + 1);
        const status = statuses[index];
        const customer = customers[index % customers.length];
        const skill = SKILLS[index % SKILLS.length];
        const adminId =
          status === "new" ? null : ids[`admin-${index % 2}`];
        const { rows } = await client.query(
          `insert into jobs (
             customer_id, skill_id, title, description, district_id, job_date, job_slot,
             workers_needed, pay_offer, address_note, status, claimed_by,
             declaration_accepted_at
           ) values (
             $1,$2,$3,$4,$5,(public.today_ub() + $6::int),$7,$8,$9,$10,$11,$12, now()
           )
           returning id`,
          [
            ids[customer.key],
            skillByName.get(skill),
            JOBS[index],
            "Демо зар — зөвхөн хөгжүүлэлтийн орчинд.",
            districtByName.get(district.name),
            (index % 10) + 1,
            index % 3 === 0 ? "am" : index % 3 === 1 ? "pm" : "full",
            (index % 2) + 1,
            50000 + index * 5000,
            `${district.name} дүүрэг, демо хаяг ${index + 1}`,
            status === "cancelled" ? "cancelled" : status === "done" ? "done" : status,
            adminId,
          ],
        );
        const jobId = rows[0].id;
        // Same ledger row create_job writes for a real order.
        await client.query(
          "insert into consents (user_id, kind, version, job_id) values ($1, 'customer_declaration', $2, $3)",
          [ids[customer.key], TERMS_VERSION, jobId],
        );
        if (status === "matched" || status === "confirmed" || status === "done") {
          await client.query(
            `insert into assignments (job_id, worker_id, offered_by, status, answered_via)
             values ($1,$2,$3,$4,$5)`,
            [
              jobId,
              ids[`worker-${index % 12}`],
              adminId,
              status === "matched" ? "offered" : status === "confirmed" ? "confirmed" : "completed",
              index % 5 === 0 ? "admin_phone" : "app",
            ],
          );
        }
      }
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  });

  const summary = await withDb(async (client) => {
    const { rows } = await client.query(
      `select
         (select count(*)::int from auth.users where email like $1) as accounts,
         (select count(*)::int from jobs) as jobs,
         (select count(*)::int from availability) as availability,
         (select count(*)::int from assignments) as assignments`,
      [`%${DEMO_DOMAIN}`],
    );
    return rows[0];
  });

  console.log(
    `Demo seeded: ${summary.accounts} accounts, ${summary.jobs} jobs, ${summary.availability} availability rows, ${summary.assignments} assignments.`,
  );
  console.log("Passwords are random and were never printed. Remove with: npm run seed:demo -- --remove");
}

main().catch((error) => {
  console.error(`seed-demo failed: ${error.message}`);
  process.exit(1);
});
