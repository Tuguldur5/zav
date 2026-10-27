import crypto from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { withDb } from "./env.mjs";

const file = path.join(process.cwd(), ".env.push");

function readEnv() {
  if (!existsSync(file)) return new Map();
  const map = new Map();
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index > 0) map.set(line.slice(0, index).trim(), line.slice(index + 1).trim());
  }
  return map;
}

function writeEnv(values) {
  const body = [
    "# Web Push sender settings — NEVER commit this file.",
    ...Array.from(values.entries()).map(([key, value]) => `${key}=${value}`),
    "",
  ].join("\n");
  writeFileSync(file, body, { mode: 0o600 });
}

const role = "push_sender";
const password = crypto.randomBytes(24).toString("base64url");

await withDb(async (client) => {
  // The role is idempotent: create once, rotate the password on every run.
  const exists = await client.query("select 1 from pg_roles where rolname = $1", [role]);
  if (exists.rowCount === 0) {
    await client.query(`create role ${role} login password '${password.replace(/'/g, "''")}'`);
  } else {
    await client.query(`alter role ${role} with login password '${password.replace(/'/g, "''")}'`);
  }

  const { rows } = await client.query("select current_database() as db");
  const database = rows[0].db;

  await client.query(`grant connect on database "${database.replace(/"/g, '""')}" to ${role}`);
  await client.query(`grant usage on schema public to ${role}`);

  // Exactly the two tables the sender needs, nothing else.
  await client.query(`grant select, delete on table public.push_subscriptions to ${role}`);
  await client.query(`grant select, update on table public.push_outbox to ${role}`);

  // RLS policies for the restricted role (the tables have RLS enabled).
  const policies = [
    ["push_sender_subs_select", "push_subscriptions", "select", "using (true)"],
    ["push_sender_subs_delete", "push_subscriptions", "delete", "using (true)"],
    ["push_sender_outbox_select", "push_outbox", "select", "using (true)"],
    ["push_sender_outbox_update", "push_outbox", "update", "using (true) with check (true)"],
  ];
  for (const [name, table, command, clause] of policies) {
    await client.query(`drop policy if exists ${name} on public.${table}`);
    await client.query(
      `create policy ${name} on public.${table} for ${command} to ${role} ${clause}`,
    );
  }
});

const source = process.env.DATABASE_POOLER_URL || process.env.DATABASE_URL;
if (!source) {
  console.error("DATABASE_URL / DATABASE_POOLER_URL is missing in .env.local.");
  process.exit(1);
}

const url = new URL(source);
url.username = role;
url.password = password;

const values = readEnv();
values.set("PUSH_DATABASE_URL", url.toString());
values.set("VAPID_PUBLIC_KEY", values.get("VAPID_PUBLIC_KEY") ?? "");
values.set("VAPID_PRIVATE_KEY", values.get("VAPID_PRIVATE_KEY") ?? "");
values.set("VAPID_SUBJECT", values.get("VAPID_SUBJECT") ?? "mailto:admin@zav.baina.mn");
writeEnv(values);

console.log("push_sender role ready. PUSH_DATABASE_URL written to .env.push (never printed).");
