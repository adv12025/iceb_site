#!/usr/bin/env node
/* ROSTER TOOL: makes a unique random first password for every student.

   Usage (from the ice-b-hub-next folder):
     1. Put your class list in  private/roster.csv  with a header line:     rollNo,name,email
        (email is optional, leave it empty if you do not have it)
     2. Run:  node scripts/make-roster.mjs
     3. Open  private/roster-passwords.csv : each line is rollNo,name,email,initialPassword.
        Send each student ONLY their own password, privately (DM, not the group).
     4. Use the same file to create the accounts in the database (see docs/AUTH.md, "Creating the student accounts").

   Safety:
     - everything is written inside private/ which is git-ignored, so it can never be pushed to the public repo
     - it will NOT overwrite an existing roster-passwords.csv (you may already have sent those passwords);
       pass --force only if you really want new ones for everybody
     - passwords come from the operating system's secure random generator, are unique, and are NOT derived from roll numbers */
import { randomInt } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "private");
const input = join(dir, "roster.csv");
const output = join(dir, "roster-passwords.csv");
const force = process.argv.includes("--force");

mkdirSync(dir, { recursive: true });
if (!existsSync(input)) {
  writeFileSync(input, "rollNo,name,email\n107125001,Example Student,\n");
  console.log(`Created a sample ${input}\nReplace its contents with your class list, then run this again.`);
  process.exit(0);
}
if (existsSync(output) && !force) {
  console.error(`${output} already exists. You may have sent these passwords already, so I will not overwrite it.\nUse --force to generate NEW passwords for everyone.`);
  process.exit(1);
}

/* characters that are hard to mix up when read aloud / typed from a phone: no 0 O 1 l I */
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";
const pick = set => set[randomInt(set.length)];
function makePassword() {
  /* shape: 4 + 4 characters with a dash, e.g. "Kq7m-Xp3R": always has letters and digits (passes the site's rules) */
  const chars = [pick(LETTERS), pick(DIGITS), pick(LETTERS), pick(DIGITS), pick(LETTERS), pick(LETTERS), pick(DIGITS), pick(LETTERS)];
  for (let i = chars.length - 1; i > 0; i--) { const j = randomInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }   // shuffle so the pattern is not predictable
  return chars.slice(0, 4).join("") + "-" + chars.slice(4).join("");
}

const csvCell = s => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
const lines = readFileSync(input, "utf8").split(/\r?\n/).filter(l => l.trim());
const [head, ...rows] = lines;
if (!/^rollno\s*,\s*name/i.test(head)) { console.error('The first line of roster.csv must be:  rollNo,name,email'); process.exit(1); }

const seenRoll = new Set(), seenPw = new Set(), out = ["rollNo,name,email,initialPassword"];
let problems = 0;
for (const [i, line] of rows.entries()) {
  const [rollRaw = "", name = "", email = ""] = line.split(",").map(s => s.trim().replace(/^"|"$/g, ""));
  const roll = rollRaw.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z0-9]{6,12}$/.test(roll)) { console.error(`line ${i + 2}: "${rollRaw}" is not a valid roll number (6-12 letters/digits)`); problems++; continue; }
  if (seenRoll.has(roll)) { console.error(`line ${i + 2}: duplicate roll number ${roll}`); problems++; continue; }
  seenRoll.add(roll);
  let pw;
  do { pw = makePassword(); } while (seenPw.has(pw));
  seenPw.add(pw);
  out.push([roll, name, email, pw].map(csvCell).join(","));
}
if (problems) { console.error(`\n${problems} problem(s). Nothing was written. Fix roster.csv and run again.`); process.exit(1); }

writeFileSync(output, out.join("\n") + "\n");
console.log(`Done: ${seenRoll.size} students.\nPasswords are in ${output}\nThis folder is git-ignored. Keep the file private and delete it once everyone has logged in and changed their password.`);
