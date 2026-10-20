import { loadEnv, resolveAppBase, withDb } from "./env.mjs";
import {
  check,
  configError,
  enrollTotp,
  failedCount,
  hasCredentials,
  randomPassword,
  rest,
  sessionCookieHeader,
  signInSession,
  tomorrowISO,
} from "./lib/verify-helpers.mjs";

loadEnv();

const runId = `${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
const password = randomPassword();
const emails = {
  customerA: `verify-${runId}-ca@example.test`,
  customerB: `verify-${runId}-cb@example.test`,
  workerA: `verify-${runId}-wa@example.test`,
  workerB: `verify-${runId}-wb@example.test`,
  adminA: `verify-${runId}-aa@example.test`,
  adminB: `verify-${runId}-ab@example.test`,
  superAdmin: `verify-${runId}-sa@example.test`,
  rogue: `verify-${runId}-rg@example.test`,
};
const createdEmails = Object.values(emails);
let cleaned = false;
let crashed = false;
const APP_URL = process.env.APP_URL ? resolveAppBase() : "";
const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST || "zav.localhost:3000";
const STAFF_HOST = process.env.NEXT_PUBLIC_STAFF_HOST || "admin.zav.localhost:3000";

async function cleanup() {
  if (cleaned) return;
  cleaned = true;
  try {
    await withDb((client) =>
      client.query("delete from auth.users where email = any($1::text[])", [createdEmails]),
    );
  } catch (error) {
    console.error(`Fixture cleanup failed: ${error.message}`);
  }
}

process.on("SIGINT", () => {
  console.log("\nInterrupted — cleaning up fixtures…");
  cleanup().finally(() => process.exit(130));
});

async function countFixtures() {
  return withDb(async (client) => {
    const { rows } = await client.query(
      "select count(*)::int as total from auth.users where email = any($1::text[])",
      [createdEmails],
    );
    return rows[0].total;
  });
}

async function confirmEmails(list) {
  await withDb((client) =>
    client.query(
      "update auth.users set email_confirmed_at = now() where email = any($1::text[]) and email_confirmed_at is null",
      [list],
    ),
  );
}

async function createUsers(entries) {
  await withDb(async (client) => {
    for (const [email, metadata] of entries) {
      const { rows } = await client.query(
        `insert into auth.users (
           instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
           confirmation_token, recovery_token, email_change_token_new, email_change,
           raw_app_meta_data, raw_user_meta_data, created_at, updated_at
         ) values (
           '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
           'authenticated', $1, extensions.crypt($2, extensions.gen_salt('bf')), now(),
           '', '', '', '', '{"provider":"email","providers":["email"]}'::jsonb, $3::jsonb,
           now(), now()
         ) returning id`,
        [email, password, JSON.stringify(metadata)],
      );
      const id = rows[0].id;
      await client.query(
        `insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
         values (gen_random_uuid(), $1::uuid, $1::text, jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true), 'email', now(), now(), now())`,
        [id, email],
      );
    }
  });
}

async function loginSession(email) {
  try {
    return await signInSession(email, password);
  } catch {
    await confirmEmails([email]);
    return signInSession(email, password);
  }
}

async function httpStatus(path, host, cookie) {
  const response = await fetch(`${APP_URL}${path}`, {
    redirect: "manual",
    headers: {
      Host: host,
      "X-Forwarded-Host": host,
      ...(cookie ? { Cookie: cookie } : {}),
    },
  });
  return { status: response.status, location: response.headers.get("location") ?? "" };
}

/**
 * HTTP-level checks against a running app (set APP_URL, e.g. http://127.0.0.1:3000).
 * These prove the host/role separation from the outside.
 */
async function httpChecks(sessions) {
  const customer = sessionCookieHeader(sessions.customer);
  const worker = sessionCookieHeader(sessions.worker);
  const adminAal2 = sessionCookieHeader(sessions.adminAal2);
  const adminAal1 = sessionCookieHeader(sessions.adminAal1);
  const adminOther = sessionCookieHeader(sessions.adminB);
  const superAdmin = sessionCookieHeader(sessions.superAdmin);

  const staffPaths = [
    "/today",
    "/jobs",
    "/workers",
    "/calendar",
    "/notifications",
    "/security",
    "/super",
  ];

  let customerOk = true;
  for (const path of staffPaths) {
    const result = await httpStatus(path, STAFF_HOST, customer);
    if (result.status !== 404) {
      customerOk = false;
      check(`HTTP: customer 404 on staff ${path}`, false, String(result.status));
    }
  }
  check("HTTP: customer session gets 404 on every staff path", customerOk);

  let workerOk = true;
  for (const path of staffPaths) {
    const result = await httpStatus(path, STAFF_HOST, worker);
    if (result.status !== 404) {
      workerOk = false;
      check(`HTTP: worker 404 on staff ${path}`, false, String(result.status));
    }
  }
  check("HTTP: worker session gets 404 on every staff path", workerOk);

  const adminOnSuper = await httpStatus("/super", STAFF_HOST, adminAal2);
  check("HTTP: admin gets 404 on /super", adminOnSuper.status === 404, String(adminOnSuper.status));

  const adminToday = await httpStatus("/today", STAFF_HOST, adminAal2);
  check("HTTP: admin reaches /today at aal2", adminToday.status === 200, String(adminToday.status));

  const aal1Today = await httpStatus("/today", STAFF_HOST, adminAal1);
  check(
    "HTTP: staff at aal1 is redirected to /security",
    aal1Today.status >= 300 && aal1Today.status < 400 && aal1Today.location.includes("/security"),
    `${aal1Today.status} ${aal1Today.location}`,
  );

  const superSuper = await httpStatus("/super", STAFF_HOST, superAdmin);
  check("HTTP: super admin reaches /super", superSuper.status === 200, String(superSuper.status));

  const secondAdminSuper = await httpStatus("/super", STAFF_HOST, adminOther);
  check(
    "HTTP: second admin gets 404 on /super",
    secondAdminSuper.status === 404,
    String(secondAdminSuper.status),
  );

  const staffHome = await httpStatus("/", STAFF_HOST, customer);
  check(
    "HTTP: customer session on staff root is sent to /login",
    staffHome.status >= 300 && staffHome.status < 400 && staffHome.location.includes("/login"),
    `${staffHome.status} ${staffHome.location}`,
  );
}

async function insertJob(token, job) {
  const result = await rest("/rest/v1/jobs?select=*", {
    method: "POST",
    token,
    body: job,
    headers: { Prefer: "return=representation" },
  });
  if (!result.ok) throw new Error(`job insert failed: ${JSON.stringify(result.data)}`);
  return result.data[0];
}

function phoneFree(row) {
  return !Object.keys(row).some((key) => /worker.*phone|phone.*worker/i.test(key));
}

async function main() {
  if (!hasCredentials()) {
    console.error(configError);
    process.exitCode = 1;
    return;
  }

  const district = (await rest("/rest/v1/districts?select=id,name&limit=1")).data?.[0];
  const skills = (await rest("/rest/v1/skills?select=id,name&order=sort_order&limit=2")).data;
  if (!district || !skills?.length)
    throw new Error("Seed catalog is empty. Run npm run db:apply first.");
  const skill1 = skills[0].id;

  // Fixtures are inserted with the same raw_user_meta_data the signup API would send, so the
  // signup trigger (role whitelist, profile creation) is still exercised. The hosted project
  // confirms emails and rate-limits confirmation mails, so the HTTP signup call cannot be used
  // to create eight confirmed accounts in a row.
  await createUsers([
    [emails.customerA, { role: "customer", full_name: "Verify Customer A", phone: "88000001" }],
    [emails.customerB, { role: "customer", full_name: "Verify Customer B", phone: "88000002" }],
    [
      emails.workerA,
      {
        role: "worker",
        full_name: "Verify Worker A",
        phone: "88000003",
        district_id: district.id,
        skills: [skill1],
      },
    ],
    [
      emails.workerB,
      {
        role: "worker",
        full_name: "Verify Worker B",
        phone: "88000004",
        district_id: district.id,
        skills: [skill1],
      },
    ],
    [emails.adminA, { role: "customer", full_name: "Verify Admin A", phone: "88000005" }],
    [emails.adminB, { role: "customer", full_name: "Verify Admin B", phone: "88000006" }],
    [emails.superAdmin, { role: "customer", full_name: "Verify Super", phone: "88000007" }],
    [emails.rogue, { role: "admin", full_name: "Verify Rogue", phone: "88000008" }],
  ]);

  const ids = await withDb(async (client) => {
    const { rows } = await client.query(
      "select email, id from auth.users where email = any($1::text[])",
      [createdEmails],
    );
    return Object.fromEntries(rows.map((row) => [row.email, row.id]));
  });

  const idOf = (key) => ids[emails[key]];

  // Staff fixtures are promoted with SQL. Profile metadata can never do this.
  await withDb(async (client) => {
    await client.query(
      "update profiles set role = 'admin', status = 'active' where id = any($1::uuid[])",
      [[idOf("adminA"), idOf("adminB")]],
    );
    await client.query(
      "update profiles set role = 'super_admin', status = 'active' where id = $1",
      [idOf("superAdmin")],
    );
    await client.query("update profiles set status = 'active' where id = any($1::uuid[])", [
      [idOf("workerA"), idOf("workerB")],
    ]);
    await client.query(
      "update worker_details set admin_id = $1, intake_status = 'assigned' where worker_id = $2",
      [idOf("adminA"), idOf("workerA")],
    );
    await client.query(
      "update worker_details set admin_id = $1, intake_status = 'assigned' where worker_id = $2",
      [idOf("adminB"), idOf("workerB")],
    );
  });

  const rogueProfile = await withDb(async (client) => {
    const { rows } = await client.query("select role from profiles where id = $1", [idOf("rogue")]);
    return rows[0];
  });
  check(
    "signup metadata role=admin creates no staff",
    rogueProfile?.role === "customer",
    `role=${rogueProfile?.role}`,
  );

  const customerASession = await loginSession(emails.customerA);
  const customerAToken = customerASession.access_token;
  const customerBToken = (await loginSession(emails.customerB)).access_token;
  const workerASession = await loginSession(emails.workerA);
  const workerAToken = workerASession.access_token;
  const workerBToken = (await loginSession(emails.workerB)).access_token;

  const adminAal1 = await loginSession(emails.adminA);
  const poolAtAal1 = await rest("/rest/v1/rpc/pool_jobs", {
    method: "POST",
    token: adminAal1.access_token,
    body: {},
  });
  const workersAtAal1 = await rest("/rest/v1/profiles?select=id&role=eq.worker", {
    token: adminAal1.access_token,
  });
  check(
    "aal1 staff has no rights",
    poolAtAal1.ok &&
      Array.isArray(poolAtAal1.data) &&
      poolAtAal1.data.length === 0 &&
      Array.isArray(workersAtAal1.data) &&
      workersAtAal1.data.length === 0,
  );

  const adminASession = await enrollTotp(adminAal1.access_token);
  const adminAToken = adminASession.access_token;
  const adminBSession = await enrollTotp((await loginSession(emails.adminB)).access_token);
  const adminBToken = adminBSession.access_token;
  const superSession = await enrollTotp((await loginSession(emails.superAdmin)).access_token);
  const superToken = superSession.access_token;

  const day = tomorrowISO();
  const jobA = await insertJob(customerAToken, {
    customer_id: idOf("customerA"),
    skill_id: skill1,
    title: "Verify job A",
    description: "Verification fixture job",
    district_id: district.id,
    job_date: day,
    job_slot: "full",
    workers_needed: 1,
    pay_offer: 50000,
    address_note: "Verify district, building 1, entrance 2",
  });

  const otherCustomerRead = await rest(
    `/rest/v1/jobs?id=eq.${jobA.id}&select=id,customer_id,address_note`,
    { token: customerBToken },
  );
  check(
    "customer cannot read another customer's job",
    Array.isArray(otherCustomerRead.data) && otherCustomerRead.data.length === 0,
  );

  const workerBProfiles = await rest(`/rest/v1/profiles?id=eq.${idOf("workerA")}&select=id`, {
    token: workerBToken,
  });
  const workerBJobs = await rest(`/rest/v1/jobs?id=eq.${jobA.id}&select=id`, {
    token: workerBToken,
  });
  const workerBAssignments = await rest(
    `/rest/v1/assignments?worker_id=eq.${idOf("workerA")}&select=id`,
    { token: workerBToken },
  );
  const workerNotes = await rest(
    `/rest/v1/worker_details?worker_id=eq.${idOf("workerB")}&select=staff_note`,
    { token: workerBToken },
  );
  const workerOwnDetails = await rest(
    `/rest/v1/worker_details?worker_id=eq.${idOf("workerB")}&select=worker_id,experience_note,has_transport`,
    { token: workerBToken },
  );
  check(
    "worker cannot read other workers, others' jobs or staff_note",
    workerBProfiles.data?.length === 0 &&
      workerBJobs.data?.length === 0 &&
      workerBAssignments.data?.length === 0 &&
      !workerNotes.ok &&
      workerOwnDetails.ok,
    `staff_note status=${workerNotes.status}`,
  );

  const adminOtherWorker = await rest(
    `/rest/v1/worker_details?worker_id=eq.${idOf("workerB")}&select=worker_id`,
    { token: adminAToken },
  );
  const adminOwnWorkerProfile = await rest(
    `/rest/v1/profiles?id=eq.${idOf("workerA")}&select=id,phone`,
    { token: adminAToken },
  );
  check(
    "admin cannot read another admin's workers",
    adminOtherWorker.data?.length === 0 && adminOwnWorkerProfile.data?.length === 1,
  );

  const availability = await rest("/rest/v1/rpc/set_my_availability", {
    method: "POST",
    token: workerAToken,
    body: { p_day: day, p_slot: "full" },
  });
  check("worker can mark availability", availability.ok && availability.status === 204);

  const claimJobA = await rest("/rest/v1/rpc/claim_job", {
    method: "POST",
    token: adminAToken,
    body: { p_job: jobA.id },
  });
  check("admin can claim a pool job", claimJobA.ok, `status=${claimJobA.status}`);

  const offer = await rest("/rest/v1/rpc/offer_assignment", {
    method: "POST",
    token: adminAToken,
    body: { p_job: jobA.id, p_worker: idOf("workerA"), p_day: day },
  });
  check("admin can offer own free worker", offer.ok, JSON.stringify(offer.data).slice(0, 120));
  const assignmentId = offer.data;

  const workerBefore = await rest("/rest/v1/rpc/worker_jobs", {
    method: "POST",
    token: workerAToken,
    body: {},
  });
  const beforeRow = Array.isArray(workerBefore.data)
    ? workerBefore.data.find((row) => row.job_id === jobA.id)
    : null;
  check(
    "address_note hidden from worker until confirmed",
    Boolean(beforeRow) && beforeRow.address_note === null,
  );

  const jobB = await insertJob(customerBToken, {
    customer_id: idOf("customerB"),
    skill_id: skill1,
    title: "Verify job B",
    description: "Second fixture job",
    district_id: district.id,
    job_date: day,
    job_slot: "full",
    workers_needed: 1,
    pay_offer: null,
    address_note: "Verify district, building 3",
  });
  const claimB = await rest("/rest/v1/rpc/claim_job", {
    method: "POST",
    token: adminAToken,
    body: { p_job: jobB.id },
  });
  const doubleOffer = await rest("/rest/v1/rpc/offer_assignment", {
    method: "POST",
    token: adminAToken,
    body: { p_job: jobB.id, p_worker: idOf("workerA"), p_day: day },
  });
  check("double-booking blocked", claimB.ok && !doubleOffer.ok, `status=${doubleOffer.status}`);

  const jobC = await insertJob(customerBToken, {
    customer_id: idOf("customerB"),
    skill_id: skill1,
    title: "Verify job C",
    description: "Race fixture job",
    district_id: district.id,
    job_date: day,
    job_slot: "pm",
    workers_needed: 2,
    pay_offer: 30000,
    address_note: "Verify district, building 9",
  });
  const [claimA, claimB2] = await Promise.all([
    rest("/rest/v1/rpc/claim_job", {
      method: "POST",
      token: adminAToken,
      body: { p_job: jobC.id },
    }),
    rest("/rest/v1/rpc/claim_job", {
      method: "POST",
      token: adminBToken,
      body: { p_job: jobC.id },
    }),
  ]);
  check(
    "two admins claiming the same job -> exactly one wins",
    [claimA, claimB2].filter((result) => result.ok).length === 1,
  );

  const accept = await rest("/rest/v1/rpc/respond_assignment", {
    method: "POST",
    token: workerAToken,
    body: { p_assignment: assignmentId, p_accept: true },
  });
  const confirm = await rest("/rest/v1/rpc/confirm_assignment", {
    method: "POST",
    token: adminAToken,
    body: { p_assignment: assignmentId },
  });
  const workerAfter = await rest("/rest/v1/rpc/worker_jobs", {
    method: "POST",
    token: workerAToken,
    body: {},
  });
  const afterRow = Array.isArray(workerAfter.data)
    ? workerAfter.data.find((row) => row.job_id === jobA.id)
    : null;
  check(
    "worker sees address after confirmation",
    accept.ok && confirm.ok && afterRow?.address_note === jobA.address_note,
  );

  const customerAssignments = await rest("/rest/v1/rpc/customer_job_assignments", {
    method: "POST",
    token: customerAToken,
    body: { p_job: jobA.id },
  });
  const customerSeesWorker = await rest(`/rest/v1/profiles?id=eq.${idOf("workerA")}&select=id`, {
    token: customerAToken,
  });
  const assignmentRow = Array.isArray(customerAssignments.data)
    ? customerAssignments.data[0]
    : null;
  check(
    "customer never receives a worker phone",
    customerSeesWorker.data?.length === 0 &&
      assignmentRow &&
      phoneFree(assignmentRow) &&
      Boolean(assignmentRow.admin_phone),
    `row keys=${assignmentRow ? Object.keys(assignmentRow).join(",") : "none"}`,
  );

  const auditList = await rest("/rest/v1/audit_logs?select=id&limit=1", { token: superToken });
  const auditId = auditList.data?.[0]?.id;
  const auditUpdate = auditId
    ? await rest(`/rest/v1/audit_logs?id=eq.${auditId}`, {
        method: "PATCH",
        token: superToken,
        body: { action: "tampered" },
      })
    : { ok: false };
  const auditDelete = auditId
    ? await rest(`/rest/v1/audit_logs?id=eq.${auditId}`, { method: "DELETE", token: superToken })
    : { ok: false };
  check("audit_logs cannot be updated or deleted", !auditUpdate.ok && !auditDelete.ok);

  const roleChange = await rest(`/rest/v1/profiles?id=eq.${idOf("customerB")}`, {
    method: "PATCH",
    token: customerBToken,
    body: { role: "admin" },
  });
  const roleAfter = await rest(`/rest/v1/profiles?id=eq.${idOf("customerB")}&select=role`, {
    token: customerBToken,
  });
  check(
    "user cannot change their own role",
    !roleChange.ok && roleAfter.data?.[0]?.role === "customer",
  );

  const appReachable = APP_URL
    ? await httpStatus("/api/health", SITE_HOST)
        .then((result) => result.status === 200)
        .catch(() => false)
    : false;

  if (APP_URL && appReachable) {
    await httpChecks({
      customer: customerASession,
      worker: workerASession,
      adminAal1,
      adminAal2: adminASession,
      adminB: adminBSession,
      superAdmin: superSession,
    });
  } else {
    console.log(
      "SKIP  HTTP checks — start the app (npm run dev) and set APP_URL, e.g. http://127.0.0.1:3000",
    );
  }
}

main()
  .catch((error) => {
    console.error(`verify crashed: ${error.message}`);
    crashed = true;
    process.exitCode = 1;
  })
  .finally(async () => {
    if (!hasCredentials()) return;
    await cleanup();
    const remaining = await countFixtures().catch(() => -1);
    check("fixtures removed (zero rows remain)", remaining === 0, `remaining=${remaining}`);
    const failures = failedCount() + (crashed ? 1 : 0);
    console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
    if (failures > 0) process.exitCode = 1;
  });
