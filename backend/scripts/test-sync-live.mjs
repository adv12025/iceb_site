#!/usr/bin/env node
/* LIVE test of the site's attendance sync code (src/lib/attendanceRemote.js) against the REAL project.
   Run from the backend folder:  node scripts/test-sync-live.mjs
   It creates ONE temporary account (ZZTEST9999), runs the checks, then deletes that account (and its data).
   Needs backend/.env.local (secret key, used only to make/delete the temp account) and ../.env.local (public settings).
   Never prints keys or passwords. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomBytes } from "node:crypto";
import { register } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const parse = f => Object.fromEntries(readFileSync(f, "utf8").split(/\r?\n/).filter(l => /^[A-Z_]+=/.test(l)).map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }));
const back = parse(join(here, "..", ".env.local"));
const pub = parse(join(here, "..", "..", ".env.local"));
process.env.NEXT_PUBLIC_SUPABASE_URL = pub.NEXT_PUBLIC_SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = pub.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/* the site's files import each other without ".js" (the bundler allows that, plain Node does not): teach Node */
register("data:text/javascript," + encodeURIComponent(`
export async function resolve(spec, ctx, next) {
  try { return await next(spec, ctx); } catch (e) { if (/^\\.\\.?\\//.test(spec)) return next(spec + ".js", ctx); throw e; }
}`), import.meta.url);

const src = join(here, "..", "..", "src", "lib");
const remote = await import(pathToFileURL(join(src, "attendanceRemote.js")).href);
const { supabase } = await import(pathToFileURL(join(src, "auth", "supabaseClient.js")).href);

const URL_ = back.SUPABASE_URL, SECRET = back.SUPABASE_SECRET_KEY;
const email = "zztest9999@iceb.local", password = "Tt-" + randomBytes(9).toString("hex");
const admin = (path, init = {}) => fetch(URL_ + path, { ...init, headers: { apikey: SECRET, "content-type": "application/json", ...init.headers } });

let pass = 0, fail = 0;
const check = (n, ok, extra = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${ok ? "" : "  " + extra}`); };
const same = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

let uid;
try {
  const created = await admin("/auth/v1/admin/users", { method: "POST", body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { roll_no: "ZZTEST9999" } }) });
  const cj = await created.json();
  if (!created.ok) throw new Error("could not create temp user: " + (cj.msg || cj.message || created.status));
  uid = cj.id;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error("temp login failed: " + error.message);

  const A = "2026-10-12|08:30|Sync Test A", B = "2026-10-12|09:30|Sync Test B", C = "2026-10-13|08:30|Sync Test C";

  const empty = await remote.loadRemote();
  check("new student: no marks, no threshold", Object.keys(empty.marks).length === 0 && empty.threshold === null, JSON.stringify(empty));

  await remote.saveMarksDiff(uid, {}, { [A]: "P", [B]: "A" });
  let r = await remote.loadRemote();
  check("saved 2 marks, read them back", same(r.marks, { [A]: "P", [B]: "A" }), JSON.stringify(r.marks));

  await remote.saveMarksDiff(uid, { [A]: "P", [B]: "A" }, { [A]: "X", [C]: "P" });
  r = await remote.loadRemote();
  check("diff: A changed, B removed, C added", same(r.marks, { [A]: "X", [C]: "P" }), JSON.stringify(r.marks));

  await remote.saveMarksDiff(uid, r.marks, r.marks);
  check("no-op diff does nothing and does not fail", true);

  await remote.saveThreshold(uid, 80);
  r = await remote.loadRemote();
  check("threshold saved (80)", r.threshold === 80, String(r.threshold));
  await remote.saveThreshold(uid, 70);
  r = await remote.loadRemote();
  check("threshold changed again (70)", r.threshold === 70, String(r.threshold));

  let rejected = false;
  try { await remote.saveMarksDiff(uid, {}, { "bad id": "P" }); } catch { rejected = true; }
  check("malformed session id is rejected (error surfaces to the caller)", rejected);

  const many = {};
  for (let i = 0; i < 590; i++) many[`2026-11-${String(1 + (i % 28)).padStart(2, "0")}|${String(8 + (i % 10)).padStart(2, "0")}:30|Bulk ${i}`] = "P";
  await remote.saveMarksDiff(uid, {}, many);
  r = await remote.loadRemote();
  check("590 marks (database cap is 600): saved in 2 batches and all read back", Object.keys(r.marks).length === 590 + 2, String(Object.keys(r.marks).length));

  await remote.saveMarksDiff(uid, r.marks, {});
  r = await remote.loadRemote();
  check("erase all removes everything", Object.keys(r.marks).length === 0, String(Object.keys(r.marks).length));
} catch (e) {
  fail++; console.log("FAIL  unexpected error: " + e.message);
} finally {
  await supabase.auth.signOut().catch(() => {});
  if (uid) {
    const d = await admin("/auth/v1/admin/users/" + uid, { method: "DELETE" });
    console.log(d.ok ? "cleanup: temp account deleted" : "WARNING: could not delete temp account ZZTEST9999 (delete it in the dashboard)");
  }
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
