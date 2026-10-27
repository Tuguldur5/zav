import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";
import webpush from "web-push";

/**
 * Standalone sender. It is NOT imported by the Next.js app and has no access to
 * the app's service credentials: it connects as the restricted push_sender role.
 * Logs contain COUNTS only — never endpoints, keys or message text.
 */
const envFile = path.join(process.cwd(), ".env.push");
if (existsSync(envFile)) {
  for (const raw of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const required = ["PUSH_DATABASE_URL", "VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`push worker: missing ${missing.length} setting(s) in .env.push`);
  process.exit(1);
}

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

const connectionString = process.env.PUSH_DATABASE_URL;
const local = /localhost|127\.0\.0\.1/.test(connectionString);
const client = new pg.Client({
  connectionString,
  ssl: local ? false : { rejectUnauthorized: false },
});

const POLL_MS = 5000;
const BATCH = 50;
const MAX_ATTEMPTS = 5;

let running = true;
let timer = null;

function stop(signal) {
  if (!running) return;
  running = false;
  if (timer) clearTimeout(timer);
  console.log(`push worker: stopping (${signal})`);
  client
    .end()
    .catch(() => {})
    .finally(() => process.exit(0));
}

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));

async function deliver(row) {
  const { rows: subscriptions } = await client.query(
    "select id, endpoint, p256dh, auth from push_subscriptions where user_id = $1",
    [row.user_id],
  );

  let delivered = 0;
  let removed = 0;
  let failed = 0;

  const payload = JSON.stringify({ title: row.title, body: row.body, url: row.url });
  const urgency = /санал/i.test(row.title) ? "high" : "normal";

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        payload,
        { TTL: 6 * 60 * 60, urgency },
      );
      delivered += 1;
      await client.query(
        "update push_subscriptions set last_success_at = now(), failure_count = 0 where id = $1",
        [subscription.id],
      );
    } catch (error) {
      const statusCode = Number(error?.statusCode ?? 0);
      if (statusCode === 404 || statusCode === 410) {
        removed += 1;
        await client.query("delete from push_subscriptions where id = $1", [subscription.id]);
      } else {
        failed += 1;
        await client.query(
          "update push_subscriptions set failure_count = failure_count + 1 where id = $1",
          [subscription.id],
        );
      }
    }
  }

  const remaining = subscriptions.length - removed;
  const done = delivered > 0 || remaining === 0;

  await client.query(
    `update push_outbox
        set attempts = attempts + 1,
            sent_at = case when $2 then now() else sent_at end,
            last_error = case when $3 > 0 then 'delivery_failed' else null end
      where id = $1`,
    [row.id, done, failed],
  );

  return { delivered, removed, failed };
}

async function drain() {
  await client.query("begin");
  const { rows } = await client.query(
    `select id, user_id, title, body, url
       from push_outbox
      where sent_at is null
        and attempts < $1
        and created_at + (attempts * interval '30 seconds') <= now()
      order by created_at
      limit $2
      for update skip locked`,
    [MAX_ATTEMPTS, BATCH],
  );

  let delivered = 0;
  let failed = 0;
  let removed = 0;
  for (const row of rows) {
    const result = await deliver(row);
    delivered += result.delivered;
    failed += result.failed;
    removed += result.removed;
  }

  await client.query("commit");

  if (rows.length > 0) {
    console.log(
      `push worker: rows=${rows.length} delivered=${delivered} failed=${failed} removed=${removed}`,
    );
  }
}

async function loop() {
  if (!running) return;
  try {
    await drain();
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {
      // Connection may be gone; the next tick reconnects nothing and logs once.
    }
    console.error(`push worker: cycle failed (${error?.code ?? "unknown"})`);
  }
  if (!running) return;
  timer = setTimeout(loop, POLL_MS);
}

console.log("push worker: started");
client
  .connect()
  .then(() => loop())
  .catch((error) => {
    console.error(`push worker: cannot connect (${error?.code ?? "unknown"})`);
    process.exit(1);
  });
