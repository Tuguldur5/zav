import { withDb } from "./env.mjs";

async function main() {
  await withDb(async (client) => {
    const { rows } = await client.query(
      `select u.email,
              p.role,
              p.status,
              p.full_name,
              p.created_at,
              u.last_sign_in_at
         from profiles p
         join auth.users u on u.id = p.id
        where p.role in ('admin', 'super_admin')
        order by p.role, p.created_at`,
    );

    if (rows.length === 0) {
      console.log(
        "No staff accounts yet. Invite an admin from /super/admins or run npm run super:make.",
      );
      return;
    }

    console.table(
      rows.map((row) => ({
        email: row.email,
        role: row.role,
        status: row.status,
        name: row.full_name,
        created: row.created_at?.toISOString?.() ?? row.created_at,
        lastLogin: row.last_sign_in_at?.toISOString?.() ?? "never",
      })),
    );
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
