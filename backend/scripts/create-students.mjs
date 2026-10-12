#!/usr/bin/env node
/* CREATE (or reset) STUDENT ACCOUNTS in your Supabase project, from your own computer.

   Reads private/roster-passwords.csv (made by scripts/make-roster.mjs in the repo root: rollNo,name,email,initialPassword).
   PRIVACY: only the roll number and the first password are sent. Names and emails in your roster are NOT uploaded.

   Usage (run inside the backend folder):
     node scripts/create-students.mjs                  DRY RUN (default): checks the file and shows what WOULD happen. Touches nothing.
     node scripts/create-students.mjs --apply          really create the accounts (asks you to confirm first)
     node scripts/create-students.mjs --reset 107125001   new temporary password for ONE student (printed once, forced change on next login)
     --file path/to/other.csv                          use a different roster file

   Secrets: reads SUPABASE_URL and SUPABASE_SECRET_KEY from backend/.env.local (copy .env.example). That file is git-ignored.
   The secret key can do ANYTHING in your project. It must only ever exist on your own computer. */
import { randomInt } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const backend = join(here, "..");
const repo = join(backend, "..");
const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = n => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);

const APPLY = flag("--apply");
const RESET = opt("--reset");
const file = opt("--file") || join(repo, "private", "roster-passwords.csv");

/* ---------- tiny helpers ---------- */
const die = msg => { console.error("\n" + msg); process.exit(1); };
const normRoll = r => (r || "").replace(/\s+/g, "").toUpperCase();
const rollOk = r => /^[A-Z0-9]{6,12}$/.test(r);
const pwOk = p => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
/* The account's email inside Supabase. NOT a real mailbox: it is never emailed. The website builds the same address from the roll number. */
const emailFor = roll => `${roll.toLowerCase()}@iceb.local`;

function loadEnv() {
  const f = join(backend, ".env.local");
  const env = { ...process.env };
  if (existsSync(f)) {
    for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !line.trim().startsWith("#")) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/).filter(l => l.trim())) {
    const cells = []; let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ",") { cells.push(cur); cur = ""; }
      else cur += c;
    }
    cells.push(cur);
    rows.push(cells.map(s => s.trim()));
  }
  return rows;
}

/* ---------- Supabase calls (plain fetch, no libraries) ---------- */
function makeApi(url, key) {
  /* new-style keys (sb_secret_...) go only in "apikey"; old-style JWT keys (eyJ...) are also sent as a Bearer token */
  const headers = { apikey: key, "Content-Type": "application/json", ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }) };
  const call = async (method, path, body, extra = {}) => {
    const res = await fetch(url + path, { method, headers: { ...headers, ...extra }, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let json; try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
    return { ok: res.ok, status: res.status, json };
  };
  return {
    createUser: (roll, password) => call("POST", "/auth/v1/admin/users", { email: emailFor(roll), password, email_confirm: true, user_metadata: { roll_no: roll } }),
    insertProfile: (id, roll) => call("POST", "/rest/v1/profiles", { id, roll_no: roll, must_change_password: true }, { Prefer: "return=minimal" }),
    findProfile: roll => call("GET", `/rest/v1/profiles?roll_no=eq.${encodeURIComponent(roll)}&select=id`),
    setPassword: (id, password) => call("PUT", `/auth/v1/admin/users/${id}`, { password }),
    flagChange: id => call("PATCH", `/rest/v1/profiles?id=eq.${id}`, { must_change_password: true }, { Prefer: "return=minimal" }),
    deleteUser: id => call("DELETE", `/auth/v1/admin/users/${id}`),
  };
}

const why = r => r.json?.msg || r.json?.message || r.json?.error_description || r.json?.error || r.json?.hint || JSON.stringify(r.json);

/* ---------- reset one student ---------- */
async function resetOne(api, rollRaw) {
  const roll = normRoll(rollRaw);
  if (!rollOk(roll)) die(`"${rollRaw}" is not a valid roll number.`);
  const pf = await api.findProfile(roll);
  if (!pf.ok) die(`Could not look up ${roll}: ${why(pf)}`);
  if (!pf.json?.length) die(`No account for ${roll}.`);
  const id = pf.json[0].id;
  const L = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz", D = "23456789";
  const pick = s => s[randomInt(s.length)];
  const c = [pick(L), pick(D), pick(L), pick(D), pick(L), pick(L), pick(D), pick(L)];
  for (let i = c.length - 1; i > 0; i--) { const j = randomInt(i + 1); [c[i], c[j]] = [c[j], c[i]]; }
  const temp = c.slice(0, 4).join("") + "-" + c.slice(4).join("");
  const a = await api.setPassword(id, temp);
  if (!a.ok) die(`Could not set the password: ${why(a)}`);
  /* order matters: changing the password clears "must change password", so set it back to true AFTER */
  const b = await api.flagChange(id);
  if (!b.ok) die(`Password was changed but forcing the change failed (${why(b)}). Run the reset again.`);
  console.log(`\nNew temporary password for ${roll}:  ${temp}\nSend it to them privately. They must choose their own on next login.`);
}

/* ---------- main ---------- */
const env = loadEnv();
const URL_ = (env.SUPABASE_URL || "").replace(/\/+$/, "");
const KEY = env.SUPABASE_SECRET_KEY || "";

if (RESET) {
  if (!URL_ || !KEY) die("Put SUPABASE_URL and SUPABASE_SECRET_KEY in backend/.env.local first (see .env.example).");
  await resetOne(makeApi(URL_, KEY), RESET);
  process.exit(0);
}

if (!existsSync(file)) die(`Roster not found: ${file}\nCreate it with:  node scripts/make-roster.mjs   (in the repo root)`);
const [head, ...rows] = parseCsv(readFileSync(file, "utf8"));
const col = n => (head || []).findIndex(h => h.toLowerCase() === n.toLowerCase());
const iRoll = col("rollNo"), iPw = col("initialPassword");
if (iRoll < 0 || iPw < 0) die("The roster must have columns rollNo and initialPassword (use make-roster.mjs to create it).");

const people = [], problems = [], seen = new Set();
rows.forEach((r, i) => {
  const roll = normRoll(r[iRoll]), pw = r[iPw] || "";
  if (!rollOk(roll)) return problems.push(`line ${i + 2}: "${r[iRoll]}" is not a valid roll number`);
  if (seen.has(roll)) return problems.push(`line ${i + 2}: duplicate roll number ${roll}`);
  if (!pwOk(pw)) return problems.push(`line ${i + 2}: password for ${roll} is too weak (8+ chars, letter and number)`);
  seen.add(roll);
  people.push({ roll, pw });
});
if (problems.length) die("Problems in the roster:\n  " + problems.join("\n  ") + "\nNothing was created.");

console.log(`Roster: ${file}\n${people.length} students, all valid. Only roll number + first password will be sent (no names, no emails).`);

if (!APPLY) {
  console.log("\nDRY RUN: nothing was created. First few accounts that WOULD be made:");
  people.slice(0, 5).forEach(p => console.log(`  ${p.roll}  ->  login email ${emailFor(p.roll)}  (must change password on first login)`));
  if (people.length > 5) console.log(`  ... and ${people.length - 5} more`);
  console.log(`\nWhen ready:  node scripts/create-students.mjs --apply`);
  process.exit(0);
}

if (!URL_ || !KEY) die("Put SUPABASE_URL and SUPABASE_SECRET_KEY in backend/.env.local first (see .env.example).");
if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(URL_)) die(`SUPABASE_URL looks wrong: "${URL_}". It should look like https://abcdefgh.supabase.co`);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ans = await rl.question(`\nAbout to create ${people.length} accounts in ${URL_}\nType "yes" to continue: `);
rl.close();
if (ans.trim().toLowerCase() !== "yes") die("Cancelled. Nothing was created.");

const api = makeApi(URL_, KEY);
const report = ["rollNo,result"];
let made = 0, existed = 0, failed = 0;
for (const p of people) {
  const u = await api.createUser(p.roll, p.pw);
  if (!u.ok) {
    const code = u.json?.error_code || u.json?.code;
    if (code === "email_exists" || u.status === 422 && /already|registered|exists/i.test(why(u))) { existed++; report.push(`${p.roll},already existed`); console.log(`  ${p.roll}: already exists, skipped`); continue; }
    failed++; report.push(`${p.roll},FAILED: ${why(u)}`); console.log(`  ${p.roll}: FAILED (${why(u)})`);
    if (u.status === 401 || u.status === 403) die("The secret key was rejected. Check SUPABASE_SECRET_KEY in backend/.env.local.");
    continue;
  }
  const id = u.json.id;
  const pr = await api.insertProfile(id, p.roll);
  if (!pr.ok) {
    await api.deleteUser(id);                 // do not leave a half-made account behind
    failed++; report.push(`${p.roll},FAILED profile: ${why(pr)}`); console.log(`  ${p.roll}: FAILED creating profile (${why(pr)}) - rolled back`);
    if (/relation .* does not exist|schema cache|Could not find the table/i.test(why(pr))) die("The database tables are missing. Load the migration into your project first (backend/README.md, step 'Load the design').");
    continue;
  }
  made++; report.push(`${p.roll},created`); console.log(`  ${p.roll}: created`);
  await new Promise(r => setTimeout(r, 120));   // be gentle with Supabase's rate limits
}
mkdirSync(join(repo, "private"), { recursive: true });
const out = join(repo, "private", `create-report-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`);
writeFileSync(out, report.join("\n") + "\n");
console.log(`\nDone. created ${made}, already existed ${existed}, failed ${failed}.\nReport (no passwords): ${out}`);
process.exit(failed ? 1 : 0);
