import { requireEmail, withDb } from "./env.mjs";

const email = requireEmail();

async function main() {
  await withDb(async (client) => {
    const { rows } = await client.query(
      "select id from auth.users where lower(email) = lower($1) limit 1",
      [email],
    );

    if (rows.length === 0) {
      console.error(
        `No account found for ${email}. Register on the user host first, then run this script again.`,
      );
      process.exitCode = 1;
      return;
    }

    const id = rows[0].id;
    await client.query(
      "update profiles set role = 'super_admin', status = 'active' where id = $1",
      [id],
    );

    const count = await client.query(
      "select count(*)::int as total from profiles where role = 'super_admin' and status = 'active'",
    );

    console.log(`Super admin: ${email}`);
    console.log(`Active super admins: ${count.rows[0].total}`);
    console.log("\nNext steps:");
    console.log(
      "1. Open the staff host (prod: https://admin.zav.baina.mn, local: http://admin.zav.localhost:3000).",
    );
    console.log("2. Sign in with the same email and password.");
    console.log("3. You will be sent to /security — enroll TOTP MFA before using /super.");
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
