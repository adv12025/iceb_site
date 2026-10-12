# ICE B Hub backend (built slowly, one stage at a time)

The website is static (GitHub Pages) so it has no server of its own. The backend is a hosted **Supabase** project
(login + Postgres database) that the website talks to directly. Everything that must be secure is enforced **inside the
database** (row-level security), because the browser can never be trusted.

> Status: **Stage 1 done, stage 2 code done and tested; waiting for you to connect the project** (runbook at the bottom).
> The website keeps using the demo login until the two public settings exist, so nothing changes on the live site by itself.

---------------------------------------------------------------------

## Roadmap

| Stage | What | Needs from you | Status |
|---|---|---|---|
| **1** | Database design (students, attendance) + security rules + automatic tests on a local throwaway database | nothing | **done** |
| **2** | Load the design into your Supabase project; CR script that creates the student accounts; website login switches to the real backend (`supabaseProvider.js`) | follow the runbook at the bottom (project is created) | **code done, your steps pending** |
| **3** | Attendance saved in the database per student (replaces browser-only storage); copy existing browser marks into the account | stage 2 | planned |
| **4** | CR tools: reset a student's password, announcements/notes/links stored in the database, an admin screen that works from your phone | stage 3 | planned |
| **5** | Hardening: login-attempt limits, backups, monitoring, remove all demo code and fake students | stage 4 | planned |

Each stage ends with: tests pass, docs updated, and the demo keeps working until you choose to switch.

---------------------------------------------------------------------

## Folder map

```
backend/
├── README.md                          this file
├── package.json                       npm test (everything) / npm run test:db / npm run test:provider
├── .env.example                       template for backend/.env.local (your secret key; git-ignored)
├── scripts/
│   ├── test-db.mjs                    builds a throwaway local Postgres, applies migrations, runs the tests, deletes it
│   ├── test-provider.mjs              tests the website's Supabase login code against a fake Supabase (no network)
│   └── create-students.mjs            CR tool: creates accounts from your roster (dry run by default), resets one password
└── supabase/
    ├── migrations/
    │   └── 0001_identity_and_attendance.sql    THE DATABASE DESIGN (tables + security rules). Numbered; never edit an applied one, add 0002...
    └── tests/
        ├── _supabase_stub.sql                  test-only imitation of Supabase's login tables (never run on real Supabase)
        └── 0001_identity_and_attendance.test.sql   the security tests (Asha, Ravi and an anonymous visitor try to break the rules)
```

## Run the tests (any time, nothing is installed or changed)

```
cd backend
npm run test:db          # or: node scripts/test-db.mjs
```
Needs PostgreSQL installed (it is on your PC: `C:\Program Files\PostgreSQL\18`). It starts a temporary database on port
54329, runs everything and deletes it. You should see `ALL DATABASE TESTS PASSED`. Run it after **any** change to a `.sql` file.

---------------------------------------------------------------------

## The database design (stage 1)

Three tables, all with **row-level security ON**: a student can only ever see and change their own rows.

| Table | One row per | Who can do what |
|---|---|---|
| `profiles` | student | student: **read own row only**. Nobody but the CR's script (service role) can create or edit |
| `attendance_marks` | (student, class session) | student: read / add / change / delete **own rows only**. Status `P` present, `A` absent, `X` class not held. Max 600 rows per student |
| `attendance_settings` | student | student: read / save **own** attendance limit (50-100) |

`profiles` columns: `id` (matches the login account), `roll_no` (unique, 6-12 capital letters/digits), `name`, `email` (optional),
`role` (`student` or `cr`), `must_change_password` (true until the student picks their own password), `created_at`.

### How "username = roll number" works
Supabase Auth wants an email. Each student's account email is **`<roll number in lowercase>@iceb.local`** (not a real mailbox, never
emailed). The website turns the roll number they type into that address behind the scenes. Their real roll number is stored in `profiles.roll_no`.

### The forced password change is enforced by the database
A trigger clears `must_change_password` **only when the password hash really changes**. A student cannot switch it off by
calling something, and the website cannot lie about it. When the CR resets a student's password the same trigger would clear the flag,
so the reset script must set it back to `true` **after** setting the temporary password (the tests document this).

### What the tests prove (35 checks)
- a student sees only their own profile and attendance; cannot read, edit or delete another student's rows; cannot hand a row to someone else
- a student cannot make themselves CR, switch off the forced change, or create/delete profiles
- an anonymous visitor (not logged in) can read and write nothing
- bad data is refused (wrong roll-number shape, status other than P/A/X, malformed session id, limit outside 50-100, duplicates)
- the 600-row cap works
- a student can edit only their own optional nickname; no real name or email is stored
- the flag clears only on a real password change; deleting an account removes all its data

I also checked the tests themselves work: deliberately loosening one rule made them fail, then I restored it.

### What the database does NOT do (so you know the limits)
- It does not limit how many wrong passwords someone tries (Supabase Auth has built-in per-IP rate limits; stricter per-account lockout is stage 5).
- It cannot prove a roll number belongs to the person. That is why the first password is random, unique and sent privately by you.

---------------------------------------------------------------------

## Stage 2 runbook: connect your Supabase project (do these in order)

All code for this stage is written and tested without your project (`npm test` in this folder: 35 database checks + 30 login-logic checks).
What is left is the part only you can do, because it touches your account and your secret key. **Use FAKE pilot students first.**

### A. Load the design into your project
1. Supabase dashboard -> your project -> left menu **SQL Editor** -> **New query**.
2. Open `backend/supabase/migrations/0001_identity_and_attendance.sql` in Notepad or VS Code, copy **everything**, paste it into the editor, click **Run**.
3. You should see "Success". Then open **Table Editor**: three tables (`profiles`, `attendance_marks`, `attendance_settings`), each marked **RLS enabled**. If something errors, send me the red message.

### B. Put your secret settings on your PC (never in chat or git)
1. Copy `backend/.env.example` to `backend/.env.local`.
2. Fill in `SUPABASE_URL` (Project Settings -> API) and `SUPABASE_SECRET_KEY` (the **secret / service_role** key). Save. This file is git-ignored.

### C. Create fake pilot students
1. In the repo root create `private/roster.csv` (the `private` folder is git-ignored):
   ```
   rollNo,name,email
   PILOT0001,anything,
   PILOT0002,anything,
   PILOT0003,anything,
   ```
2. In the repo root run `node scripts/make-roster.mjs` -> writes `private/roster-passwords.csv` (a random first password each).
3. In this `backend` folder run `node scripts/create-students.mjs` (**dry run**, touches nothing). If it looks right:
   `node scripts/create-students.mjs --apply` and type `yes`.
4. Check: dashboard -> **Authentication -> Users** shows `pilot0001@iceb.local` etc.

### D. Try the real login on your own PC
1. In the repo root copy `.env.example` to `.env.local` and fill the **Project URL** and **publishable key** (both public).
2. Run `npm run dev`, open http://localhost:3000, click **Log in**.
3. Roll number `PILOT0001`, password from `private/roster-passwords.csv`. You must be forced to choose a new password. The yellow "Demo" notices must be gone.
4. Log out and in with the new password. Check **Authentication -> Users** still shows one user.
5. Reset test: `node scripts/create-students.mjs --reset PILOT0001` prints a new temporary password; log in with it; you must be forced to change again.

### E. Put it on the live site (only after D works)
GitHub repo -> **Settings -> Secrets and variables -> Actions -> Variables** tab -> add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (public values, so Variables not Secrets is fine). The deploy workflow passes them to the build; with them empty the site stays on the demo. Then push.

**Only after the pilot passes, for the real class:** replace `private/roster.csv` with the real list, run `node scripts/make-roster.mjs --force` (the pilot passwords are no longer needed, so overwriting is fine), then `node scripts/create-students.mjs` (dry run) and `--apply`. Finally delete the three PILOT users in the dashboard (**Authentication -> Users**).

### Keys: which is which
| Key | Where it may live | Why |
|---|---|---|
| Project URL, publishable (anon) key | the website, GitHub Variables, root `.env.local` | public by design; the database rules protect the data |
| secret / service_role key, database password | **only** `backend/.env.local` on your PC | bypasses all protection; leaking it = losing the database |

`.env*`, `private/` and `roster*.csv` are in `.gitignore`. Check `git status` before every commit anyway.

### What gets stored online (privacy)
Roll number + a random internal id + a salted password hash (Supabase hashes it) + your attendance marks (+ an optional nickname the student types).
**Not stored online:** real names, emails, phone numbers. Names stay in your private `roster.csv` on your PC.
