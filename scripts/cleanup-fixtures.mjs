#!/usr/bin/env node
/**
 * Deletes accounts created by scripts/verify.mjs — only those.
 *
 * Refuses to touch anything that is not an exact fixture match, and refuses to
 * run when the fixture pattern would hit a real staff profile. Prints counts
 * only: no emails, names or connection strings.
 *
 * Usage: node scripts/cleanup-fixtures.mjs [--dry-run]
 */
import { withDb } from "./env.mjs";

const EMAIL_PATTERN = "verify-%@example.test";
const NAME_PATTERN = "Verify %";
const dryRun = process.argv.includes("--dry-run");

async function main() {
  await withDb(async (client) => {
    const fixtures = await client.query(
      `select u.id, u.email, p.role
         from auth.users u
         left join profiles p on p.id = u.id
        where u.email like $1 and (p.full_name like $2 or p.role in ('admin', 'super_admin', 'customer', 'worker'))
        order by u.created_at`,
      [EMAIL_PATTERN, NAME_PATTERN],
    );

    const unsafe = fixtures.rows.filter(
      (row) => !String(row.email ?? "").startsWith("verify-"),
    );
    if (unsafe.length > 0) {
      console.error(`Refusing to delete ${unsafe.length} account(s): not fixture emails.`);
      process.exitCode = 1;
      return;
    }

    const ids = fixtures.rows.map((row) => row.id);
    console.log(`Fixture accounts found: ${ids.length}`);

    if (dryRun || ids.length === 0) {
      if (dryRun) console.log("Dry run: nothing deleted.");
      return;
    }

    const removed = await client.query(
      "delete from auth.users where id = any($1::uuid[]) returning id",
      [ids],
    );
    console.log(`Fixture accounts deleted: ${removed.rowCount}`);

    const remaining = await client.query(
      "select count(*)::int as total from auth.users where email like $1",
      [EMAIL_PATTERN],
    );
    console.log(`Fixture accounts remaining: ${remaining.rows[0].total}`);

    const staffLeft = await client.query(
      `select count(*)::int as total
         from profiles p
         join auth.users u on u.id = p.id
        where p.role in ('admin', 'super_admin') and u.email like $1`,
      [EMAIL_PATTERN],
    );
    console.log(`Fixture-named staff roles remaining: ${staffLeft.rows[0].total}`);
  });
}

main().catch((error) => {
  console.error(`cleanup-fixtures failed: ${error.message}`);
  process.exit(1);
});
