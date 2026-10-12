#!/usr/bin/env node
/* LIVE SECURITY TEST against the REAL Supabase project, using the pilot accounts PILOT0002 and PILOT0003.
   Run from the backend folder:  node scripts/test-live.mjs
   Reads the public URL + publishable key from ../.env.local and the pilot passwords from ../private/roster-passwords.csv.
   Never prints passwords or keys. It leaves no data behind (test rows are removed at the end).
   It only uses PILOT0002 / PILOT0003, so PILOT0001 and any real student are never touched. */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
  })
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!URL_ || !KEY || KEY.startsWith("sb_secret_")) { console.error("Root .env.local is missing or has the wrong key."); process.exit(1); }

const pw = {};
for (const line of readFileSync(join(root, "private", "roster-passwords.csv"), "utf8").split(/\r?\n/).slice(1)) {
  const p = line.split(",");
  if (p[0]) pw[p[0]] = p[p.length - 1];
}

const client = () => createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const email = (roll) => `${roll.toLowerCase()}@iceb.local`;

let pass = 0, fail = 0;
const check = (name, ok, extra = "") => { (ok ? pass++ : fail++); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  " + extra}`); };
const SID = "2026-10-12|08:30|LIVE SECURITY TEST";

async function login(roll, password) {
  const c = client();
  const { data, error } = await c.auth.signInWithPassword({ email: email(roll), password });
  return { c, user: data?.user, error };
}

/* 1. logged-out visitor */
{
  const c = client();
  for (const t of ["profiles", "attendance_marks", "attendance_settings"]) {
    const { data, error } = await c.from(t).select("*");
    check(`logged-out visitor reads nothing from ${t}`, !!error || (data ?? []).length === 0, JSON.stringify(data)?.slice(0, 80));
  }
  const { error } = await c.from("attendance_marks").insert({ session_id: SID, status: "P" });
  check("logged-out visitor cannot insert attendance", !!error);
}

/* 2. wrong password / unknown user */
{
  const r = await login("PILOT0002", "definitely-wrong-password-123");
  check("wrong password is rejected", !!r.error && !r.user);
  const r2 = await login("NOSUCH9999", "whatever-123456");
  check("unknown roll number is rejected", !!r2.error && !r2.user);
}

/* 3. two real students */
const a = await login("PILOT0002", pw.PILOT0002);
const b = await login("PILOT0003", pw.PILOT0003);
check("PILOT0002 can log in", !!a.user, a.error?.message);
check("PILOT0003 can log in", !!b.user, b.error?.message);
if (!a.user || !b.user) { console.log("Cannot continue without both logins."); process.exit(1); }

{
  const { data, error } = await a.c.from("profiles").select("*");
  check("student sees exactly 1 profile (their own)", !error && data.length === 1 && data[0].id === a.user.id, error?.message ?? `rows=${data?.length}`);
  check("profile roll_no is PILOT0002", data?.[0]?.roll_no === "PILOT0002", data?.[0]?.roll_no);
  check("pilot still flagged must_change_password (login alone does not clear it)", data?.[0]?.must_change_password === true);

  const r1 = await a.c.from("profiles").update({ role: "cr" }).eq("id", a.user.id).select();
  check("student cannot make themselves CR", !!r1.error || (r1.data ?? []).length === 0, JSON.stringify(r1.data));
  const r2 = await a.c.from("profiles").update({ must_change_password: false }).eq("id", a.user.id).select();
  check("student cannot switch off forced password change", !!r2.error || (r2.data ?? []).length === 0, JSON.stringify(r2.data));
  const r3 = await a.c.from("profiles").update({ roll_no: "HACKED001" }).eq("id", a.user.id).select();
  check("student cannot change their roll number", !!r3.error || (r3.data ?? []).length === 0, JSON.stringify(r3.data));
  const r4 = await a.c.from("profiles").update({ display_name: "Tester" }).eq("id", a.user.id).select();
  check("student CAN set their own nickname", !r4.error && r4.data?.length === 1, r4.error?.message);
  const r5 = await a.c.from("profiles").update({ display_name: "Hijack" }).eq("id", b.user.id).select();
  check("student cannot change someone else's nickname", !!r5.error || (r5.data ?? []).length === 0, JSON.stringify(r5.data));
  const r6 = await a.c.from("profiles").delete().eq("id", a.user.id).select();
  check("student cannot delete their profile", !!r6.error || (r6.data ?? []).length === 0);
  const r7 = await a.c.from("profiles").insert({ id: a.user.id, roll_no: "X", role: "cr" });
  check("student cannot insert a profile", !!r7.error);
}

{
  const ins = await a.c.from("attendance_marks").insert({ session_id: SID, status: "P" }).select();
  check("student can save their own attendance mark", !ins.error && ins.data?.[0]?.user_id === a.user.id, ins.error?.message);
  const forged = await a.c.from("attendance_marks").insert({ user_id: b.user.id, session_id: SID, status: "A" });
  check("student cannot write a mark as someone else", !!forged.error);
  const bad1 = await a.c.from("attendance_marks").insert({ session_id: "not-a-session", status: "P" });
  check("bad session id rejected", !!bad1.error);
  const bad2 = await a.c.from("attendance_marks").insert({ session_id: "2026-10-12|09:30|Other", status: "Z" });
  check("bad status rejected", !!bad2.error);

  const seenB = await b.c.from("attendance_marks").select("*");
  check("other student cannot see that mark", !seenB.error && seenB.data.length === 0, `rows=${seenB.data?.length}`);
  const updB = await b.c.from("attendance_marks").update({ status: "A" }).eq("session_id", SID).select();
  check("other student cannot change that mark", !!updB.error || (updB.data ?? []).length === 0);
  const delB = await b.c.from("attendance_marks").delete().eq("session_id", SID).select();
  check("other student cannot delete that mark", !!delB.error || (delB.data ?? []).length === 0);

  const stillThere = await a.c.from("attendance_marks").select("*").eq("session_id", SID);
  check("mark is still intact and still P", stillThere.data?.length === 1 && stillThere.data[0].status === "P");
  const up = await a.c.from("attendance_marks").update({ status: "A" }).eq("session_id", SID).select();
  check("owner can change their own mark", !up.error && up.data?.[0]?.status === "A", up.error?.message);

  const s1 = await a.c.from("attendance_settings").upsert({ threshold: 80 }).select();
  check("student can save their own threshold", !s1.error && s1.data?.[0]?.threshold === 80, s1.error?.message);
  const s2 = await a.c.from("attendance_settings").upsert({ threshold: 10 }).select();
  check("threshold below 50 rejected", !!s2.error);
  const sB = await b.c.from("attendance_settings").select("*");
  check("other student cannot see that threshold", !sB.error && sB.data.length === 0);
}

/* 4. cleanup */
await a.c.from("attendance_marks").delete().eq("session_id", SID);
await a.c.from("attendance_settings").delete().eq("user_id", a.user.id);
await a.c.from("profiles").update({ display_name: null }).eq("id", a.user.id);
const left = await a.c.from("attendance_marks").select("*").eq("session_id", SID);
check("cleanup: no test rows left", !left.error && left.data.length === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
