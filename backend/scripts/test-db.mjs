#!/usr/bin/env node
/* Runs the database migrations and their security tests on a THROWAWAY local PostgreSQL.
   Nothing is installed or changed: it makes a temporary database in your temp folder, runs everything, then deletes it.

     node scripts/test-db.mjs           (or: npm run test:db  inside the backend folder)

   Needs PostgreSQL installed (the "initdb", "pg_ctl" and "psql" programs). It looks in the usual places;
   if yours is elsewhere set PG_BIN to its bin folder, e.g.  PG_BIN="C:/Program Files/PostgreSQL/18/bin" */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const sqlDir = join(here, "..", "supabase");
const PORT = "54329";                       // unusual port so it never clashes with a Postgres you already run
const exe = process.platform === "win32" ? ".exe" : "";

/* ---- find the PostgreSQL programs ---- */
function findBin() {
  const cands = [process.env.PG_BIN];
  for (const v of [19, 18, 17, 16, 15, 14]) {
    cands.push(`C:/Program Files/PostgreSQL/${v}/bin`, `/usr/lib/postgresql/${v}/bin`, `/opt/homebrew/opt/postgresql@${v}/bin`);
  }
  const hit = cands.filter(Boolean).find(d => existsSync(join(d, "initdb" + exe)));
  if (hit) return hit;
  const onPath = spawnSync("initdb", ["--version"]);
  if (!onPath.error) return "";             // empty = use PATH
  console.error("Could not find PostgreSQL. Install it, or set PG_BIN to its bin folder.");
  process.exit(2);
}
const BIN = findBin();
const pg = name => (BIN ? join(BIN, name + exe) : name);

/* detach = give the program no pipes. pg_ctl leaves the database server running in the background, and if it inherited our
   output pipes this script would wait for the server to exit and hang forever. */
function run(cmd, args, { quiet = false, check = true, detach = false } = {}) {
  const r = spawnSync(cmd, args, detach ? { stdio: "ignore", timeout: 60000 } : { encoding: "utf8", timeout: 60000 });
  if (!quiet && r.stdout?.trim()) console.log(r.stdout.trim());
  if (check && r.status !== 0) {
    console.error(`\nCommand failed: ${cmd} ${args.join(" ")}\n${r.stderr || r.stdout || r.error}`);
    throw new Error("command failed");
  }
  return r;
}
const psql = (file, db = "iceb_test") =>
  spawnSync(pg("psql"), ["-h", "127.0.0.1", "-p", PORT, "-U", "postgres", "-d", db, "-X", "-q", "-v", "ON_ERROR_STOP=1", "-f", file], { encoding: "utf8" });

/* ---- throwaway database ---- */
const dir = mkdtempSync(join(tmpdir(), "iceb-pg-"));
let started = false;
let failed = false;
try {
  run(pg("initdb"), ["-D", dir, "-U", "postgres", "-A", "trust", "-E", "UTF8", "--locale=C", "--no-instructions"], { quiet: true });
  run(pg("pg_ctl"), ["-D", dir, "-o", `-p ${PORT} -c listen_addresses=127.0.0.1 -c fsync=off`, "-l", join(dir, "log.txt"), "-w", "start"], { quiet: true, detach: true });
  started = true;
  run(pg("createdb"), ["-h", "127.0.0.1", "-p", PORT, "-U", "postgres", "iceb_test"], { quiet: true });

  const apply = (label, file) => {
    const r = psql(file);
    if (r.status !== 0) { failed = true; console.error(`\n[${label}] FAILED\n${(r.stderr || "").trim()}`); return false; }
    return r;
  };

  console.log("1) test scaffolding (stand-in for Supabase's auth schema)");
  if (!apply("stub", join(sqlDir, "tests", "_supabase_stub.sql"))) throw new Error("stub");

  const migrations = readdirSync(join(sqlDir, "migrations")).filter(f => f.endsWith(".sql")).sort();
  for (const m of migrations) {
    console.log(`2) migration ${m}`);
    if (!apply(m, join(sqlDir, "migrations", m))) throw new Error(m);
  }

  const tests = readdirSync(join(sqlDir, "tests")).filter(f => f.endsWith(".test.sql")).sort();
  for (const t of tests) {
    console.log(`3) tests ${t}`);
    const r = psql(join(sqlDir, "tests", t));
    const lines = (r.stderr || "").split(/\r?\n/).map(l => l.replace(/^psql:.*?NOTICE:\s*/, "").trim()).filter(Boolean);
    lines.forEach(l => console.log("   " + l));
    if (r.status !== 0) { failed = true; throw new Error(t); }
  }
} catch (e) {
  failed = true;
} finally {
  if (started) run(pg("pg_ctl"), ["-D", dir, "-m", "immediate", "stop"], { quiet: true, check: false, detach: true });
  try { rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { /* temp folder: fine if it lingers */ }
}
console.log(failed ? "\nDATABASE TESTS FAILED" : "\nDATABASE TESTS PASSED");
process.exit(failed ? 1 : 0);
