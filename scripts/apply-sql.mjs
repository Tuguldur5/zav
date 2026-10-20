import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { withDb } from "./env.mjs";

const dir = path.join(process.cwd(), "db");

async function main() {
  const files = readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No SQL files found in db/.");
    return;
  }

  await withDb(async (client) => {
    for (const file of files) {
      const sql = readFileSync(path.join(dir, file), "utf8");
      try {
        await client.query("begin");
        await client.query(sql);
        await client.query("commit");
        console.log(`Applied db/${file}`);
      } catch (error) {
        await client.query("rollback").catch(() => {});
        console.error(`Failed db/${file}: ${error.message}`);
        throw error;
      }
    }
  });

  console.log(`\nDone. ${files.length} file(s) applied.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
