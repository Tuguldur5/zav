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
const WORKER_HOST = process.env.NEXT_PUBLIC_WORKER_HOST || "ajil.zav.localhost:3000";
const STAFF_HOST = process.env.NEXT_PUBLIC_STAFF_HOST || "admin.zav.localhost:3000";
const TERMS_VERSION = "2026-10";

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

  let customerWorkerHostOk = true;
  for (const path of ["/home", "/offers", "/calendar", "/c"]) {
    const result = await httpStatus(path, WORKER_HOST, customer);
    if (result.status !== 404) {
      customerWorkerHostOk = false;
      check(`HTTP: customer 404 on worker ${path}`, false, String(result.status));
    }
  }
  check("HTTP: customer session gets 404 on every worker path", customerWorkerHostOk);

  const workerRoot = await httpStatus("/", WORKER_HOST);
  check(
    "HTTP: worker host root is a public landing page",
    workerRoot.status === 200,
    String(workerRoot.status),
  );

  const workerSiteRoot = await httpStatus("/", SITE_HOST);
  check(
    "HTTP: customer host root is a public landing page",
    workerSiteRoot.status === 200,
    String(workerSiteRoot.status),
  );

  const workerHome = await httpStatus("/home", WORKER_HOST, worker);
  check("HTTP: worker reaches /home on the worker host", workerHome.status === 200, String(workerHome.status));

  let customerOnWorkerPathsOk = true;
  for (const path of ["/c", "/c/new", "/c/jobs"]) {
    const result = await httpStatus(path, WORKER_HOST, worker);
    if (result.status !== 404) {
      customerOnWorkerPathsOk = false;
      check(`HTTP: /c path 404s on the worker host (${path})`, false, String(result.status));
    }
  }
  check("HTTP: no ordering screen exists on the worker host", customerOnWorkerPathsOk);

  let workerOnSitePathsOk = true;
  for (const path of ["/home", "/offers", "/calendar"]) {
    const result = await httpStatus(path, SITE_HOST, worker);
    if (result.status !== 404) {
      workerOnSitePathsOk = false;
      check(`HTTP: worker route 404s on the customer host (${path})`, false, String(result.status));
    }
  }
  check("HTTP: customer host serves no worker routes", workerOnSitePathsOk);

  const customerHome = await httpStatus("/c", SITE_HOST, customer);
  check("HTTP: customer reaches /c on the customer host", customerHome.status === 200, String(customerHome.status));

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

  const superPaths = [
    "/super",
    "/super/intake",
    "/super/admins",
    "/super/workers",
    "/super/jobs",
    "/super/settings",
    "/super/catalog",
    "/super/audit",
  ];
  let adminSuperOk = true;
  for (const path of superPaths) {
    const result = await httpStatus(path, STAFF_HOST, adminOther);
    if (result.status !== 404) {
      adminSuperOk = false;
      check(`HTTP: admin 404 on ${path}`, false, String(result.status));
    }
  }
  check("HTTP: admin gets 404 on every /super route", adminSuperOk);

  let superRedirectOk = true;
  for (const path of ["/today", "/jobs", "/workers", "/calendar"]) {
    const result = await httpStatus(path, STAFF_HOST, superAdmin);
    const redirected = result.status >= 300 && result.status < 400 && result.location.endsWith("/super");
    if (!redirected) {
      superRedirectOk = false;
      check(`HTTP: super redirect ${path} -> /super`, false, `${result.status} ${result.location}`);
    }
  }
  check("HTTP: super admin never renders an admin route", superRedirectOk);

  const staffHome = await httpStatus("/", STAFF_HOST, customer);
  check(
    "HTTP: customer session on staff root is sent to /login",
    staffHome.status >= 300 && staffHome.status < 400 && staffHome.location.includes("/login"),
    `${staffHome.status} ${staffHome.location}`,
  );
}

/** The only customer path to a job: the SECURITY DEFINER RPC with a declaration. */
async function createJob(token, job) {
  const result = await rest("/rest/v1/rpc/create_job", {
    method: "POST",
    token,
    body: {
      p_skill: job.skill_id,
      p_title: job.title,
      p_description: job.description ?? "",
      p_district: job.district_id,
      p_job_date: job.job_date,
      p_job_slot: job.job_slot,
      p_workers_needed: job.workers_needed,
      p_pay_offer: job.pay_offer,
      p_address_note: job.address_note,
      p_declaration: job.declaration ?? true,
      p_version: TERMS_VERSION,
    },
  });
  if (!result.ok) throw new Error(`create_job failed: ${JSON.stringify(result.data)}`);
  const created = await rest(`/rest/v1/jobs?id=eq.${result.data}&select=*`, { token });
  return created.data[0];
}

function phoneFree(row) {
  return !Object.keys(row).some((key) => /worker.*phone|phone.*worker/i.test(key));
}

/** Main districts only, weighted as in the product brief. Never "Бусад". */
const DISTRICT_WEIGHTS = {
  "Баянзүрх": 22, "Сонгинохайрхан": 20, "Хан-Уул": 15, "Баянгол": 15,
  "Сүхбаатар": 10, "Чингэлтэй": 8, "Налайх": 4, "Багануур": 3, "Багахангай": 3,
};

function pickWeighted(districts, exclude = []) {
  const pool = districts.filter((row) => DISTRICT_WEIGHTS[row.name] && !exclude.includes(row.id));
  const total = pool.reduce((sum, row) => sum + DISTRICT_WEIGHTS[row.name], 0);
  let roll = Math.random() * total;
  for (const row of pool) {
    roll -= DISTRICT_WEIGHTS[row.name];
    if (roll <= 0) return row;
  }
  return pool[0];
}

async function main() {
  if (!hasCredentials()) {
    console.error(configError);
    process.exitCode = 1;
    return;
  }

  const districts = (await rest("/rest/v1/districts?select=id,name")).data ?? [];
  const skills = (await rest("/rest/v1/skills?select=id,name&order=sort_order&limit=2")).data;
  if (districts.length === 0 || !skills?.length)
    throw new Error("Seed catalog is empty. Run npm run db:apply first.");
  // Fixtures must not all land in one district (that made every job look local).
  const district = pickWeighted(districts);
  const jobDistrict2 = pickWeighted(districts, [district.id]);
  if (!district) throw new Error("No main district found.");
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
  const jobA = await createJob(customerAToken, {
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

  const jobFields = {
    skill_id: skill1,
    title: "Verify declaration",
    description: "",
    district_id: district.id,
    job_date: day,
    job_slot: "full",
    workers_needed: 1,
    pay_offer: 10000,
    address_note: "Verify district, building 9",
  };

  const directInsert = await rest("/rest/v1/jobs?select=id", {
    method: "POST",
    token: customerAToken,
    body: { ...jobFields, customer_id: idOf("customerA"), status: "new" },
    headers: { Prefer: "return=representation" },
  });
  check(
    "customer cannot insert a job directly",
    !directInsert.ok,
    `status=${directInsert.status}`,
  );

  let declarationBlocked = false;
  try {
    await createJob(customerAToken, { ...jobFields, declaration: false });
  } catch {
    declarationBlocked = true;
  }
  check("create_job refuses p_declaration=false", declarationBlocked);

  const workerCreate = await rest("/rest/v1/rpc/create_job", {
    method: "POST",
    token: workerAToken,
    body: {
      p_skill: skill1,
      p_title: "Verify worker job",
      p_description: "",
      p_district: district.id,
      p_job_date: day,
      p_job_slot: "full",
      p_workers_needed: 1,
      p_pay_offer: 10000,
      p_address_note: "Verify district, building 9",
      p_declaration: true,
      p_version: TERMS_VERSION,
    },
  });
  check("worker cannot call create_job", !workerCreate.ok, `status=${workerCreate.status}`);

  const declarationRow = await rest(
    `/rest/v1/jobs?id=eq.${jobA.id}&select=declaration_accepted_at`,
    { token: customerAToken },
  );
  check(
    "create_job records the declaration time",
    Boolean(declarationRow.data?.[0]?.declaration_accepted_at),
  );

  const ownConsents = await rest(
    `/rest/v1/consents?user_id=eq.${idOf("customerA")}&select=id,kind,job_id`,
    { token: customerAToken },
  );
  check(
    "create_job writes a customer_declaration consent for the job",
    (ownConsents.data ?? []).some(
      (row) => row.kind === "customer_declaration" && row.job_id === jobA.id,
    ),
    JSON.stringify(ownConsents.data ?? []).slice(0, 120),
  );

  const otherConsents = await rest(
    `/rest/v1/consents?user_id=eq.${idOf("customerA")}&select=id`,
    { token: customerBToken },
  );
  check(
    "a user cannot read another user's consents",
    Array.isArray(otherConsents.data) && otherConsents.data.length === 0,
  );

  const consentId = ownConsents.data?.[0]?.id;
  const consentUpdate = consentId
    ? await rest(`/rest/v1/consents?id=eq.${consentId}`, {
        method: "PATCH",
        token: customerAToken,
        body: { kind: "terms" },
        headers: { Prefer: "return=representation" },
      })
    : { ok: false };
  const consentDelete = consentId
    ? await rest(`/rest/v1/consents?id=eq.${consentId}`, {
        method: "DELETE",
        token: customerAToken,
      })
    : { ok: false };
  check("consents cannot be updated or deleted", !consentUpdate.ok && !consentDelete.ok);

  const acceptTerms = await rest("/rest/v1/rpc/accept_consents", {
    method: "POST",
    token: workerAToken,
    body: { p_kinds: ["terms", "privacy", "worker_declaration"], p_version: TERMS_VERSION },
  });
  const workerProfileTerms = await rest(
    `/rest/v1/profiles?id=eq.${idOf("workerA")}&select=terms_version`,
    { token: workerAToken },
  );
  check(
    "accept_consents records terms on the profile",
    acceptTerms.ok && workerProfileTerms.data?.[0]?.terms_version === TERMS_VERSION,
    `status=${acceptTerms.status}`,
  );

  // ---------------------------------------------------------------- web push
  const subscription = await rest("/rest/v1/push_subscriptions?select=id", {
    method: "POST",
    token: workerAToken,
    body: {
      user_id: idOf("workerA"),
      endpoint: `https://push.example.test/verify-${runId}`,
      p256dh: "verify-p256dh",
      auth: "verify-auth",
    },
    headers: { Prefer: "return=representation" },
  });
  check(
    "worker can save their own push subscription",
    subscription.ok && subscription.data?.length === 1,
    `status=${subscription.status}`,
  );

  const otherSubscriptions = await rest(
    `/rest/v1/push_subscriptions?user_id=eq.${idOf("workerA")}&select=id`,
    { token: workerBToken },
  );
  const adminSubscriptions = await rest(
    `/rest/v1/push_subscriptions?user_id=eq.${idOf("workerA")}&select=id,endpoint`,
    { token: adminAToken },
  );
  const outboxRead = await rest("/rest/v1/push_outbox?select=id,body", {
    token: workerAToken,
  });
  check(
    "nobody else can read subscriptions or the outbox",
    (otherSubscriptions.data ?? []).length === 0 &&
      !adminSubscriptions.ok &&
      !outboxRead.ok,
    `worker_read=${otherSubscriptions.status} admin_read=${adminSubscriptions.status} outbox=${outboxRead.status}`,
  );

  const pushStatus = await rest("/rest/v1/rpc/worker_push_status", {
    method: "POST",
    token: adminAToken,
    body: { p_worker_id: idOf("workerA") },
  });
  check(
    "worker_push_status returns only a boolean for the managing admin",
    pushStatus.ok && pushStatus.data === true,
    JSON.stringify(pushStatus.data).slice(0, 40),
  );

  await withDb((client) =>
    client.query("insert into notifications (user_id, title, body, link) values ($1, $2, $3, $4)", [
      idOf("workerA"),
      "Verify notification",
      "Verification body",
      "/home",
    ]),
  );
  const outboxCount = await withDb(async (client) => {
    const { rows } = await client.query(
      "select count(*)::int as count from push_outbox where user_id = $1",
      [idOf("workerA")],
    );
    return rows[0].count;
  });
  check(
    "a notification for a subscribed user creates exactly one outbox row",
    outboxCount === 1,
    `rows=${outboxCount}`,
  );

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

  const jobB = await createJob(customerBToken, {
    customer_id: idOf("customerB"),
    skill_id: skill1,
    title: "Verify job B",
    description: "Second fixture job",
    district_id: (jobDistrict2 ?? district).id,
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

  const jobC = await createJob(customerBToken, {
    customer_id: idOf("customerB"),
    skill_id: skill1,
    title: "Verify job C",
    description: "Race fixture job",
    district_id: (jobDistrict2 ?? district).id,
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

  const loadRows = await rest("/rest/v1/rpc/admin_loads", {
    method: "POST",
    token: superToken,
    body: {},
  });
  const loadIds = Array.isArray(loadRows.data) ? loadRows.data.map((row) => row.id) : [];
  const uniqueLoadIds = new Set(loadIds);
  const adminProfiles = await withDb(async (client) => {
    const { rows } = await client.query(
      "select id from profiles where role = 'admin' and status = 'active'",
    );
    return rows.map((row) => row.id).sort();
  });
  check(
    "admin_loads returns one row per active admin (no duplicates)",
    loadRows.ok && uniqueLoadIds.size === loadIds.length,
    `rows=${loadIds.length} unique=${uniqueLoadIds.size}`,
  );
  check(
    "admin_loads returns no non-admin rows",
    loadRows.ok && [...uniqueLoadIds].sort().join(",") === adminProfiles.join(","),
    `returned=${loadIds.length} admins=${adminProfiles.length}`,
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
    const staffFixtures = await withDb(async (client) => {
      const { rows } = await client.query(
        `select count(*)::int as total
           from profiles p
           join auth.users u on u.id = p.id
          where p.role in ('admin', 'super_admin')
            and (u.email like 'verify-%@example.test' or p.full_name like 'Verify %')`,
      );
      return rows[0].total;
    }).catch(() => -1);
    check("no fixture account holds a staff role", staffFixtures === 0, `remaining=${staffFixtures}`);
    const failures = failedCount() + (crashed ? 1 : 0);
    console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
    if (failures > 0) process.exitCode = 1;
  });
