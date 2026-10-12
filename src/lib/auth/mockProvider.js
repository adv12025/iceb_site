/* DEMO AUTH PROVIDER: accounts are kept in this browser's localStorage. NOT a real login system:
   anyone with access to the browser can read/erase the data, and nothing is shared between devices.
   It exists so the whole login UI can be built and tested before a backend is chosen.

   It implements the provider contract described in docs/AUTH.md ("Provider contract").
   To go live, write another file with the same functions (e.g. supabaseProvider.js) and change ONE line in provider.js.

   How accounts appear here: the few FAKE students in demoSeed.js are created the first time someone logs in as them
   (username = roll number, first password from the seed, mustChangePassword = true). Real students will be created by
   the CR in the real database, not here. */
import { AUTH } from "./config";
import { DEMO_SEED } from "./demoSeed";
import { AuthError, CODES } from "./errors";
import { hashPassword, verifyPassword } from "./passwordHash";
import { normEmail, normRoll, validateChangePassword, validateLogIn, validateReset, validateSignUp } from "./validate";

const USERS = "iceb-auth-users-v2";     // { [ROLLNO]: { id, name, rollNo, email, salt, hash, mustChange, createdAt } }
const SESSION = "iceb-auth-session-v2"; // { userId }

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; } catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { throw new AuthError(CODES.UNAVAILABLE, "Could not save: browser storage is blocked or full."); }
};
/* what the rest of the app is allowed to see (never the hash) */
const publicUser = u => ({ id: u.id, name: u.name, rollNo: u.rollNo, email: u.email || "", createdAt: u.createdAt, mustChangePassword: !!u.mustChange });
const firstError = errs => { const [field, message] = Object.entries(errs)[0]; return new AuthError(CODES.INVALID, message, field); };
const badLogin = () => new AuthError(CODES.BAD_CREDENTIALS, "Roll number or password is incorrect.");  // same text for both: do not reveal which

/* create a fake demo student the first time they log in (only if demoSeed is on and the roll number is in the seed list) */
async function seedUser(roll) {
  const s = AUTH.demoSeed && DEMO_SEED.find(x => normRoll(x.rollNo) === roll);
  if (!s) return null;
  const user = { id: crypto.randomUUID(), name: s.name, rollNo: roll, email: s.email || "", createdAt: new Date().toISOString(), mustChange: AUTH.forceChangeOnFirstLogin, ...(await hashPassword(s.initialPassword)) };
  write(USERS, { ...read(USERS, {}), [roll]: user });
  return user;
}

const findById = id => Object.values(read(USERS, {})).find(x => x.id === id);

async function getSession() {
  const s = read(SESSION, null);
  const u = s && findById(s.userId);
  return u ? publicUser(u) : null;
}

async function signIn(input) {
  const errs = validateLogIn(input);
  if (Object.keys(errs).length) throw firstError(errs);
  const roll = normRoll(input.rollNo);
  const u = read(USERS, {})[roll] || (await seedUser(roll));
  if (!u || !(await verifyPassword(input.password, u))) throw badLogin();
  write(SESSION, { userId: u.id });
  return publicUser(u);
}

async function signOut() {
  try { localStorage.removeItem(SESSION); } catch { /* nothing to clear */ }
}

/* Logged-in user changes their own password. Clears the "must change" flag. */
async function changePassword(input) {
  const errs = validateChangePassword(input);
  if (Object.keys(errs).length) throw firstError(errs);
  const s = read(SESSION, null);
  const u = s && findById(s.userId);
  if (!u) throw new AuthError(CODES.UNAVAILABLE, "You are not logged in. Please log in again.");
  if (!(await verifyPassword(input.current, u))) throw new AuthError(CODES.BAD_CREDENTIALS, "Current password is incorrect.", "current");
  const updated = { ...u, ...(await hashPassword(input.next)), mustChange: false };
  write(USERS, { ...read(USERS, {}), [u.rollNo]: updated });
  return publicUser(updated);
}

/* Only used when AUTH.resetMode is "email". A static site cannot send email; a real provider asks the backend to. */
async function requestPasswordReset(input) {
  const errs = validateReset(input);
  if (Object.keys(errs).length) throw firstError(errs);
  return { sent: false, demo: true };
}

/* Only used when AUTH.selfSignup is true (old self-service mode). */
async function signUp(input) {
  if (!AUTH.selfSignup) throw new AuthError(CODES.INVALID, "Sign-up is closed. Ask your CR for an account.");
  const errs = validateSignUp(input);
  if (Object.keys(errs).length) throw firstError(errs);
  const roll = normRoll(input.rollNo) || normEmail(input.email);
  const users = read(USERS, {});
  if (users[roll]) throw new AuthError(CODES.EMAIL_TAKEN, "An account with this roll number already exists. Try logging in.", "rollNo");
  const user = { id: crypto.randomUUID(), name: input.name.trim(), rollNo: normRoll(input.rollNo), email: normEmail(input.email), createdAt: new Date().toISOString(), mustChange: false, ...(await hashPassword(input.password)) };
  write(USERS, { ...users, [roll]: user });
  write(SESSION, { userId: user.id });
  return publicUser(user);
}

/* Called when the session changes in ANOTHER tab (log in/out there updates this tab too). Returns an unsubscribe function. */
function onChange(callback) {
  const handler = e => { if (e.key === SESSION || e.key === null) getSession().then(callback); };
  addEventListener("storage", handler);
  return () => removeEventListener("storage", handler);
}

export const mockProvider = { name: "mock (this browser only)", getSession, signIn, signOut, changePassword, requestPasswordReset, signUp, onChange };
