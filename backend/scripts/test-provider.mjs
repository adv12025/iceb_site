#!/usr/bin/env node
/* Tests src/lib/auth/supabaseProvider.js against a FAKE Supabase client (no network, no project needed).
   It checks our own logic: the roll-number -> email rule, error translation, forced password change flow, privacy of the user object.
   It does NOT prove real Supabase behaves as the fake does: that is checked later against the real project.

     node scripts/test-provider.mjs      (run inside the backend folder) */
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "lib", "auth");
const tmp = mkdtempSync(join(tmpdir(), "iceb-prov-"));
writeFileSync(join(tmp, "package.json"), '{"type":"module"}');
/* copy the files under test, adding ".js" to the relative imports so plain Node can load them */
for (const f of ["errors.js", "validate.js", "config.js", "supabaseProvider.js"]) {
  const code = readFileSync(join(src, f), "utf8").replace(/from "(\.\/[a-zA-Z]+)"/g, 'from "$1.js"');
  writeFileSync(join(tmp, f), code);
}
const { createSupabaseProvider, emailFor } = await import(pathToFileURL(join(tmp, "supabaseProvider.js")).href);
const { AuthError, CODES } = await import(pathToFileURL(join(tmp, "errors.js")).href);

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { if (cond) { pass++; console.log("  PASS ", name); } else { fail++; console.log("  FAIL ", name, extra); } };
const rejects = async (fn) => { try { await fn(); return null; } catch (e) { return e; } };

/* ---- a fake Supabase client ---- */
function fakeClient({ accounts = {}, profiles = {}, failWith = null } = {}) {
  const calls = { signIn: [], update: [], signOut: 0 };
  let session = null;
  const listeners = [];
  const client = {
    calls,
    auth: {
      async signInWithPassword({ email, password }) {
        calls.signIn.push(email);
        if (failWith) return { data: {}, error: failWith };
        const a = accounts[email];
        if (!a || a.password !== password) return { data: {}, error: { code: "invalid_credentials", message: "Invalid login credentials", status: 400 } };
        session = { user: { id: a.id, email } };
        return { data: { user: session.user, session }, error: null };
      },
      async getSession() { return { data: { session }, error: null }; },
      async signOut() { calls.signOut++; session = null; listeners.forEach(l => l("SIGNED_OUT", null)); return { error: null }; },
      async updateUser({ password }) {
        calls.update.push(password);
        const a = accounts[session.user.email];
        if (password === a.password) return { data: {}, error: { code: "same_password", message: "same", status: 422 } };
        if (password.length < 8) return { data: {}, error: { code: "weak_password", message: "weak", status: 422 } };
        a.password = password;
        profiles[a.id].must_change_password = false;      // what the database trigger does
        return { data: { user: session.user }, error: null };
      },
      onAuthStateChange(cb) { listeners.push(cb); return { data: { subscription: { unsubscribe() { listeners.splice(listeners.indexOf(cb), 1); } } } }; },
    },
    from(table) {
      return { select: () => ({ eq: (_c, id) => ({ maybeSingle: async () => ({ data: profiles[id] ?? null, error: null }) }) }) };
    },
    _listeners: listeners,
  };
  return client;
}
const world = () => ({
  accounts: { "pilot0001@iceb.local": { id: "u1", password: "Temp-1234" }, "pilot0002@iceb.local": { id: "u2", password: "Temp-5678" } },
  profiles: {
    u1: { roll_no: "PILOT0001", display_name: null, must_change_password: true, created_at: "2026-10-12T00:00:00Z" },
    u2: { roll_no: "PILOT0002", display_name: "Ravi", must_change_password: false, created_at: "2026-10-12T00:00:00Z" },
  },
});

console.log("emailFor");
ok("roll number becomes lowercase iceb.local email", emailFor(" pilot0001 ") === "pilot0001@iceb.local");

console.log("signIn");
{
  const c = fakeClient(world()); const p = createSupabaseProvider(c);
  const u = await p.signIn({ rollNo: "pilot0001", password: "Temp-1234" });
  ok("lowercase roll typed in the form still logs in", u.rollNo === "PILOT0001");
  ok("login used the lowercase iceb.local email", c.calls.signIn[0] === "pilot0001@iceb.local");
  ok("no nickname -> name falls back to roll number (no real names online)", u.name === "PILOT0001");
  ok("first login is flagged mustChangePassword", u.mustChangePassword === true);
  ok("user object has no email, password or token", u.email === "" && !("password" in u) && !("token" in u) && !("access_token" in u));
  const u2 = await createSupabaseProvider(fakeClient(world())).signIn({ rollNo: "PILOT0002", password: "Temp-5678" });
  ok("nickname is used as the display name", u2.name === "Ravi");
  ok("a student who already changed password is not forced again", u2.mustChangePassword === false);
}
{
  const c = fakeClient(world()); const p = createSupabaseProvider(c);
  let e = await rejects(() => p.signIn({ rollNo: "PILOT0001", password: "wrong" }));
  ok("wrong password -> BAD_CREDENTIALS", e instanceof AuthError && e.code === CODES.BAD_CREDENTIALS && /incorrect/.test(e.message));
  const msg1 = e.message;
  e = await rejects(() => p.signIn({ rollNo: "NOBODY999", password: "whatever1" }));
  ok("unknown roll -> SAME message (no hint which part was wrong)", e.code === CODES.BAD_CREDENTIALS && e.message === msg1);
  const before = c.calls.signIn.length;
  e = await rejects(() => p.signIn({ rollNo: "abc", password: "x" }));
  ok("malformed roll number is refused before contacting the server", e.code === CODES.INVALID && e.field === "rollNo" && c.calls.signIn.length === before);
  e = await rejects(() => p.signIn({ rollNo: "PILOT0001", password: "" }));
  ok("empty password refused locally", e.code === CODES.INVALID && e.field === "password");
}
{
  const w = world(); delete w.profiles.u1;
  const c = fakeClient(w); const p = createSupabaseProvider(c);
  const e = await rejects(() => p.signIn({ rollNo: "PILOT0001", password: "Temp-1234" }));
  ok("a login without a student profile is rejected and signed out", e.code === CODES.BAD_CREDENTIALS && c.calls.signOut === 1);
}
{
  let e = await rejects(() => createSupabaseProvider(fakeClient({ ...world(), failWith: { status: 429, code: "over_request_rate_limit", message: "rate" } })).signIn({ rollNo: "PILOT0001", password: "Temp-1234" }));
  ok("rate limit -> friendly 'too many attempts'", e.code === CODES.UNAVAILABLE && /Too many/.test(e.message));
  e = await rejects(() => createSupabaseProvider(fakeClient({ ...world(), failWith: { name: "AuthRetryableFetchError", message: "Failed to fetch" } })).signIn({ rollNo: "PILOT0001", password: "Temp-1234" }));
  ok("network failure -> 'cannot reach the server'", e.code === CODES.UNAVAILABLE && /Cannot reach/.test(e.message));
}

console.log("changePassword (forced first change)");
{
  const c = fakeClient(world()); const p = createSupabaseProvider(c);
  await p.signIn({ rollNo: "PILOT0001", password: "Temp-1234" });
  let e = await rejects(() => p.changePassword({ current: "nottherightone", next: "MyOwnPass99", confirm: "MyOwnPass99" }));
  ok("wrong current password -> error on the 'current' field", e.code === CODES.BAD_CREDENTIALS && e.field === "current");
  ok("...and nothing was changed", c.calls.update.length === 0);
  e = await rejects(() => p.changePassword({ current: "Temp-1234", next: "short", confirm: "short" }));
  ok("weak new password refused locally", e.code === CODES.INVALID && e.field === "next" && c.calls.update.length === 0);
  e = await rejects(() => p.changePassword({ current: "Temp-1234", next: "Temp-1234", confirm: "Temp-1234" }));
  ok("reusing the CR password refused locally", e.code === CODES.INVALID && e.field === "next");
  const u = await p.changePassword({ current: "Temp-1234", next: "MyOwnPass99", confirm: "MyOwnPass99" });
  ok("good change succeeds and clears the forced flag", u.mustChangePassword === false && c.calls.update[0] === "MyOwnPass99");
  const again = await rejects(() => createSupabaseProvider(c).signIn({ rollNo: "PILOT0001", password: "Temp-1234" }));
  ok("old CR password no longer works", again?.code === CODES.BAD_CREDENTIALS);
  const ok2 = await createSupabaseProvider(c).signIn({ rollNo: "PILOT0001", password: "MyOwnPass99" });
  ok("new password works and is not forced again", ok2.mustChangePassword === false);
}
{
  const p = createSupabaseProvider(fakeClient(world()));
  const e = await rejects(() => p.changePassword({ current: "a", next: "MyOwnPass99", confirm: "MyOwnPass99" }));
  ok("changePassword while logged out is refused", e instanceof AuthError && e.code === CODES.UNAVAILABLE);
}

console.log("session + changes");
{
  const c = fakeClient(world()); const p = createSupabaseProvider(c);
  ok("no session -> getSession is null", (await p.getSession()) === null);
  await p.signIn({ rollNo: "PILOT0002", password: "Temp-5678" });
  const s = await p.getSession();
  ok("getSession returns the logged-in student", s?.rollNo === "PILOT0002");
  const got = [];
  const off = p.onChange(u => got.push(u));
  c._listeners.forEach(l => l("SIGNED_OUT", null));
  await new Promise(r => setTimeout(r, 20));
  ok("onChange reports a logout", got.length === 1 && got[0] === null);
  off();
  ok("unsubscribe removes the listener", c._listeners.length === 0);
  await p.signOut();
  ok("signOut clears the session", (await p.getSession()) === null);
}

console.log("closed doors");
{
  const p = createSupabaseProvider(fakeClient(world()));
  ok("self sign-up is refused", (await rejects(() => p.signUp({}))).code === CODES.INVALID);
  ok("email password reset is refused (CR does resets)", (await rejects(() => p.requestPasswordReset({}))).code === CODES.INVALID);
}

rmSync(tmp, { recursive: true, force: true });
console.log(`\n${fail ? "PROVIDER TESTS FAILED" : "PROVIDER TESTS PASSED"}  (${pass} passed, ${fail} failed)`);
process.exit(fail ? 1 : 0);
