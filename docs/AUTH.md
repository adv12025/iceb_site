# Login system — how it works and how to change it

**Status: frontend finished, backend not built.**
Accounts are **pre-created by the CR** (no public sign-up): username = **roll number**, plus a **unique first password**
the CR sends to each student. On first login the student is forced to choose their own password.

Today everything runs on a **demo** store inside each visitor's own browser, with a couple of FAKE test students.
To go live you connect a real database by writing **one new file** and changing **one line** (section 6).

---------------------------------------------------------------------

> The real backend is being built in stages: see `backend/README.md` (database design and tests are done; connecting the live
> Supabase project is the next stage). Section 6 below describes the target; the database part is now in `backend/`.

---------------------------------------------------------------------

## 1. The student's journey

| Step | What happens |
|---|---|
| 1. CR creates the account | roll number + name (+ email optional) go into the database with a random first password (section 5) |
| 2. CR sends the password | privately to that student only |
| 3. Student clicks **Log in** (top bar) | enters roll number + the CR's password |
| 4. **Forced password change** | a dialog that cannot be closed asks for a new password. The CR's password stops working |
| 5. Normal use | avatar menu: name, roll no., *My attendance*, *Change password*, *Log out*. Attendance is saved per account |
| Forgot password | the dialog says: message your CR with your roll number; the CR issues a new temporary password and the student is forced to change it again |

Nothing on the public site is locked behind login yet (notes, schedule, announcements stay open to everyone).

### Try it now (demo)
Fake test students are built in (see `lib/auth/demoSeed.js`):

| Roll number | First password |
|---|---|
| `DEMO0001` | `Welcome-7421` |
| `DEMO0002` | `Welcome-5586` |

---------------------------------------------------------------------

## 2. The picture

```
 components/auth/*          the screens (forms, dialog, menu)         <- change LOOK here
        | calls useAuth()
        v
 lib/auth/AuthContext.jsx    app-wide state: user, status, dialog     <- change BEHAVIOUR here
        | calls auth.signIn(...) etc.
        v
 lib/auth/provider.js        ONE LINE: which backend to use           <- change BACKEND here
        |
        +-- lib/auth/mockProvider.js     (today)  browser-only demo accounts
        +-- lib/auth/<yours>Provider.js  (later)  Supabase / Firebase / own server

 lib/auth/config.js  validate.js  errors.js  passwordHash.js  demoSeed.js      settings, rules, error type, demo helpers
 scripts/make-roster.mjs                                                          local tool: random first passwords
```
Rule of thumb: **components never talk to storage or a server directly.** They only use `useAuth()`.

---------------------------------------------------------------------

## 3. File map

### `src/lib/auth/` (logic, no screens)

| File | Job |
|---|---|
| `config.js` | **Settings**: `selfSignup`, `forceChangeOnFirstLogin`, `resetMode`, roll-number pattern, password length, `demoMode`, `demoSeed` |
| `validate.js` | Form checks (roll number shape, password strength, matching passwords). Returns `{ field: "message" }` |
| `errors.js` | `AuthError(code, message, field)` and the list of error `CODES` every provider must use |
| `passwordHash.js` | PBKDF2-SHA256 hashing through WebCrypto. **Demo provider only** (a real backend hashes passwords itself) |
| `demoSeed.js` | The FAKE test students for the demo. **Never put real students here** (the repo is public) |
| `mockProvider.js` | The demo backend (localStorage). Also the best example of the provider contract |
| `provider.js` | **The switch.** One `export` line that picks the active provider |
| `AuthContext.jsx` | `AuthProvider` + `useAuth()` hook |

### `src/components/auth/` (screens)

| File | Job |
|---|---|
| `AuthRoot.jsx` | Wraps the whole app (used in `app/layout.jsx`) |
| `AuthModal.jsx` | The dialog shell. Also enforces the **forced password change** (cannot be closed until done) |
| `LoginForm.jsx` | Roll number + password |
| `ChangePasswordForm.jsx` | Used for the forced first change and the voluntary one in the avatar menu |
| `ForgotForm.jsx` | "Ask your CR" screen (or an email form if `resetMode: "email"`) |
| `SignupForm.jsx` | Dormant: only reachable if `selfSignup: true` |
| `useAuthForm.js` | Shared form logic: values, validation, busy state, errors under the right field |
| `Field.jsx` / `SubmitButton.jsx` | Small shared pieces |
| `UserMenu.jsx` | Top bar: "Log in" button, or avatar + menu |

### Elsewhere
| File | How it touches login |
|---|---|
| `src/app/layout.jsx` | wraps the page in `<AuthRoot>` |
| `src/components/Header.jsx` | shows `<UserMenu>` |
| `src/components/Attendance.jsx` + `src/lib/useAttendance.js` | one storage slot per user id; logged-out = "guest" slot |
| `scripts/make-roster.mjs` | generates the unique first passwords (section 5) |

---------------------------------------------------------------------

## 4. Common changes

| I want to... | Do this |
|---|---|
| Let students register themselves again | `config.js` -> `selfSignup: true` (shows "Create an account") |
| Skip the forced change on first login | `config.js` -> `forceChangeOnFirstLogin: false` (not recommended) |
| Make "forgot password" email a link | `config.js` -> `resetMode: "email"` (needs a real backend that sends email) |
| Change the roll-number format | `config.js` -> `rollNoPattern` |
| Change password rules | `config.js` (`passwordMinLength`) and `validate.js` -> `checkPassword` |
| Hide the yellow demo notices | `config.js` -> `demoMode: false` (only with a real backend) |
| Remove the fake test students | `config.js` -> `demoSeed: false` (do this before going live) |
| Open the dialog from my own button | `const { openAuth } = useAuth(); openAuth("login")` (`"login"`, `"forgot"`, `"password"`, `"signup"`) |
| Hide something until logged in | `const { user, status, openAuth } = useAuth(); if (status==="loading") return null; if (!user) return <button onClick={()=>openAuth("login")}>Log in</button>;` This only hides it in the browser; anything truly private needs backend rules (section 7) |
| Change colours / spacing | Tailwind classes in each component; theme in `app/globals.css` |

---------------------------------------------------------------------

## 5. Creating the student accounts

The class list **cannot live in this repo** (it is public, and a list of roll numbers with passwords or even password
hashes would be a leak). Accounts are created in the **database** by you, from your own computer:

1. Put the class list in `private/roster.csv` (the folder is git-ignored, so it can never be pushed):
   ```
   rollNo,name,email
   107125001,Student One,
   107125002,Student Two,two@example.com
   ```
2. Run `node scripts/make-roster.mjs`. It checks roll numbers, rejects duplicates, and writes
   `private/roster-passwords.csv` with a **random, unique** first password for each student (like `Kq7m-Xp3R`).
   - passwords use the OS secure random generator, never derived from roll numbers
   - it **will not overwrite** an existing file (you may have sent those passwords already); `--force` makes new ones for everyone
3. **Send each student only their own password, privately** (DM, never the group).
4. Import the file into the database when the backend exists (section 6, step 5), marking every account
   "must change password on first login".
5. Delete `private/roster-passwords.csv` after everyone has logged in and changed their password.

Resetting one student later: generate a new temporary password for them, set it in the database with "must change
password" turned on, and send it to them privately.

### Rules that keep this safe
- Roll numbers are guessable, so the **password is the only secret**: it must be random and unique (the tool does this). Do not use the same password for everyone or anything based on the roll number.
- The **forced change** means the CR's password is only valid until the student's first login.
- The backend must **limit failed attempts** (e.g. lock for a few minutes after 5 wrong tries). The browser cannot do this.
- Give the **same error** for unknown roll number and wrong password (the demo does; keep it that way).
- Never commit `private/`, `roster*.csv`, keys or exports. `.gitignore` already blocks the common names.

---------------------------------------------------------------------

## 6. Provider contract (what a real backend file must provide)

A provider is a plain object exported from its own file. All functions are `async`.

```js
export const myProvider = {
  name: "supabase",

  getSession(),                              // -> user | null        (called once on page load)
  signIn({ rollNo, password }),              // -> user               (rollNo arrives UPPERCASE, no spaces)
  signOut(),                                 // -> void
  changePassword({ current, next }),         // -> user               (checks `current`; clears mustChangePassword)
  onChange(callback),                        // callback(user|null) when the session changes elsewhere; RETURN an unsubscribe function

  // optional, only used if the matching switch in config.js is on:
  requestPasswordReset({ email }),           // resetMode: "email"    -> { sent: true }
  signUp({ name, rollNo, email, password }), // selfSignup: true      -> user
};
```

`user` is exactly:
`{ id, name, rollNo, email, createdAt, mustChangePassword }` (strings; `email` may be `""`; `mustChangePassword` is a boolean).
**Never** put a password, hash or token in it: it is passed around the whole UI.

**Errors:** throw `new AuthError(code, "friendly message", optionalFieldName)` with a code from `errors.js`:

| code | when | field |
|---|---|---|
| `INVALID` | input rejected | the offending field, e.g. `"rollNo"` |
| `BAD_CREDENTIALS` | wrong roll number **or** password (one message for both); wrong `current` in changePassword | `"current"` for changePassword, none for sign-in |
| `EMAIL_TAKEN` | only for self sign-up | `"rollNo"` |
| `UNAVAILABLE` | network down, storage blocked | none |

If a field is named, the message shows under that input; otherwise at the top of the form. Map your service's own
errors onto these codes so the screens never change.

### Going live, step by step
1. **Choose a service.** The site is a static export on GitHub Pages (no server of its own), so use a hosted auth + database
   called straight from the browser. **Supabase** fits best (login + Postgres + row-level security, free tier); Firebase also works.
   A Google Sheet **cannot** do secure login.
2. **Create the accounts** from `private/roster-passwords.csv` using the service's *server-side* admin API/dashboard
   (that is the only place a service key is allowed to be used: on your computer, never in this repo or the website).
   Store the roll number as the username (e.g. as `<ROLL>@iceb.local` if the service insists on an email) and set
   the "must change password" flag.
3. **Write `src/lib/auth/supabaseProvider.js`** with the functions above (~70 lines): call the service, return users in the
   shape above, convert its errors into `AuthError`. Public project URL + public ("anon") key go in `NEXT_PUBLIC_...`
   environment variables in the GitHub Actions workflow. Those two are meant to be public; protection comes from step 5.
4. **Change one line in `provider.js`:** `export { supabaseProvider as auth } from "./supabaseProvider";`
5. **Turn on database rules (row-level security)** so a user can only touch their own rows, and add login attempt limiting.
6. **Move attendance to the database.** Replace the body of `src/lib/useAttendance.js` so it loads/saves `marks` for `userId`.
   Keep the returned object identical (`marks, mark, markMany, reset, exportJSON, importJSON, threshold, setThreshold, guestCount, importGuest`)
   and no component changes. Suggested table `attendance_marks(user_id, session_id, status, updated_at)` with the rule
   "`user_id = auth.uid()`" for read and write.
7. `config.js`: `demoMode: false`, `demoSeed: false`. Delete `mockProvider.js`, `passwordHash.js`, `demoSeed.js` when nothing imports them.
8. Run the checklist in section 9.

---------------------------------------------------------------------

## 7. Security checklist for going live
- The browser is not trusted: **repeat every `validate.js` rule on the server/service**.
- Row-level rules protect data; hiding a button in React protects nothing.
- Keys meant to be public (anon/publishable) are fine in the page; **secret/service keys never go in this repo or the website**.
- The repo is **public**: no keys, no rosters, no password lists, no exports, ever.
- Passwords are hashed by the service; never log or store them yourself.
- The local admin tool (`ice-b-admin-next`) stays local-only and is not part of this login.

### What the demo does and does NOT do
Does: hashes passwords (salted PBKDF2-SHA256), normalises roll numbers, gives one error for unknown roll / wrong password,
forces the first-login change, syncs login/logout across tabs of the same browser.
Does **not**: share accounts between devices, limit guesses, survive "clear site data", or protect against someone with
dev-tools access on that computer. It exists to build and test the screens.

---------------------------------------------------------------------

## 8. Where things are saved (demo only)

| `localStorage` key | Contents |
|---|---|
| `iceb-auth-users-v2` | demo accounts (hashes only), created on first login of a seed student |
| `iceb-auth-session-v2` | who is logged in |
| `iceb-attendance-v1` | guest attendance marks |
| `iceb-attendance-v1:u:<userId>` | that account's attendance marks |

Reset while testing: browser dev tools -> Application -> Local Storage -> delete the keys above.

---------------------------------------------------------------------

## 9. Manual test checklist (run after any change here)
1. Open Log in: it asks for **Roll number** and Password; there is no "Create an account".
2. Submit empty -> errors. Roll number `abc` -> "6-12 letters/digits".
3. `DEMO0001` + wrong password -> "Roll number or password is incorrect." An unknown roll number gives the **same** message.
4. `DEMO0001` / `Welcome-7421` -> **Choose your password** dialog appears with no X; Esc and clicking outside do nothing.
5. Try the same password again, a short one, a mismatch -> each rejected with a message.
6. Set a good password -> dialog closes, avatar shows initials.
7. Menu shows roll number, *My attendance*, *Change password*. Mark some classes in the tracker.
8. Log out. The old (CR) password now fails; the new password works and is **not** forced again. Marks are back.
9. *Change password* from the menu opens a form that **can** be closed.
10. `DEMO0002` is independent (also forced to change); **Log out instead** works.
11. Forgot password -> asks for the roll number and builds a pre-filled message to the CR (WhatsApp if configured, otherwise copy). No email is sent.
12. Phone width: header fits, dialog scrolls if needed.
13. In dev tools check `iceb-auth-users-v2` contains no plain password.

---------------------------------------------------------------------

## 10. Troubleshooting

| Problem | Likely cause |
|---|---|
| "This browser cannot do secure login" | page opened over plain `http://` (not localhost); use https |
| "Could not save: browser storage is blocked" | private mode / storage disabled |
| Login takes ~1 s | the password hash is deliberately slow (anti-guessing); normal |
| `useAuth() must be used inside <AuthProvider>` | a component is rendered outside `AuthRoot` (check `app/layout.jsx`) |
| Marks missing after login | each account has its own slot; guest marks can be copied once via the tracker banner |
| Roster tool says "already exists" | on purpose, so you do not regenerate passwords you already sent; use `--force` only if you mean it |
| Everything vanished | site data was cleared; use the tracker's **Backup -> Download** regularly while in demo |
