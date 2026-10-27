#!/usr/bin/env node
/**
 * Read-only staff audit.
 *
 * Lists leftover fixtures (the pattern scripts/verify.mjs creates), every staff
 * profile, and what an "admin load" query returns. Never prints a connection
 * string and masks every email except the local part's first character.
 */
import { withDb } from "./env.mjs";

const FIXTURE_EMAIL = "verify-%@example.test";
const FIXTURE_NAME = "Verify %";

function maskEmail(email) {
  if (!email) return "(no email)";
  const [local, domain] = String(email).split("@");
  if (!domain) return "***";
  return `${local.slice(0, 1)}***@${domain}`;
}

async function main() {
  await withDb(async (client) => {
    const fixtures = await client.query(
      `select p.id, u.email, p.full_name, p.role, p.status, p.created_at
         from profiles p
         join auth.users u on u.id = p.id
        where u.email like $1 or p.full_name like $2
        order by p.created_at`,
      [FIXTURE_EMAIL, FIXTURE_NAME],
    );

    console.log(`\n== Fixture-pattern profiles (${fixtures.rowCount}) ==`);
    for (const row of fixtures.rows) {
      console.log(
        `  ${maskEmail(row.email)}  role=${row.role}  status=${row.status}  name="${row.full_name}"  created=${row.created_at.toISOString()}`,
      );
    }

    const staff = await client.query(
      `select p.id, u.email, p.full_name, p.role, p.status, p.created_at
         from profiles p
         join auth.users u on u.id = p.id
        where p.role in ('admin', 'super_admin')
        order by p.created_at`,
    );

    console.log(`\n== Staff profiles (${staff.rowCount}) ==`);
    for (const row of staff.rows) {
      const fixture = row.email?.startsWith("verify-") || row.full_name?.startsWith("Verify ");
      console.log(
        `  ${maskEmail(row.email)}  role=${row.role}  status=${row.status}  name="${row.full_name}"  created=${row.created_at.toISOString()}${fixture ? "  <-- FIXTURE" : ""}`,
      );
    }

    const loads = await client.query(
      `select p.id, p.full_name, p.role, p.status,
              (select count(*) from worker_details wd where wd.admin_id = p.id)::int as worker_count
         from profiles p
        where p.role in ('admin', 'super_admin')
        order by p.full_name`,
    );
    const activeAdmins = loads.rows.filter((row) => row.role === "admin" && row.status === "active");
    const duplicateIds = new Set();
    const seen = new Set();
    for (const row of activeAdmins) {
      if (seen.has(row.id)) duplicateIds.add(row.id);
      seen.add(row.id);
    }

    console.log(`\n== Admin load rows (${activeAdmins.length}) ==`);
    for (const row of activeAdmins) {
      console.log(`  ${row.full_name || "(no name)"}  workers=${row.worker_count}`);
    }
    console.log(`  duplicate profile ids: ${duplicateIds.size}`);
    console.log(
      `  non-admin rows: ${loads.rows.filter((row) => row.role !== "admin").length} (super admins are listed above for context only)`,
    );
    console.log(
      `  fixture rows with a staff role: ${fixtures.rows.filter((row) => row.role === "admin" || row.role === "super_admin").length}`,
    );
  });
}

main().catch((error) => {
  console.error(`staff-audit failed: ${error.message}`);
  process.exit(1);
});
