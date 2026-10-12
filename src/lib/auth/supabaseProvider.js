/* REAL AUTH PROVIDER: Supabase (login + database). Switched on automatically when the two public settings exist
   (see provider.js and lib/auth/config.js). Implements the provider contract in docs/AUTH.md, same as mockProvider.js.

   How "username = roll number" works: Supabase Auth wants an email, so a student's account email is
   "<roll number in lowercase>@iceb.local" (not a real mailbox; nothing is ever emailed). The website builds that address
   from the roll number typed in the login form. The CR's script (backend/scripts/create-students.mjs) creates accounts the same way.

   `createSupabaseProvider(client)` takes the Supabase client as an argument so it can be tested with a fake one
   (backend/scripts/test-provider.mjs). The real client is made in supabaseClient.js. */
import { AuthError, CODES } from "./errors";
import { normRoll, validateChangePassword, validateLogIn } from "./validate";

export const emailFor = roll => `${normRoll(roll).toLowerCase()}@iceb.local`;

const firstError = errs => { const [field, message] = Object.entries(errs)[0]; return new AuthError(CODES.INVALID, message, field); };

/* turn any Supabase error into our own AuthError, so the screens never see Supabase's wording */
function mapError(err, fallback = "Something went wrong. Please try again.") {
  if (err instanceof AuthError) return err;
  const code = err?.code || err?.error_code || "";
  const msg = (err?.message || "").toLowerCase();
  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) return new AuthError(CODES.BAD_CREDENTIALS, "Roll number or password is incorrect.");
  if (code === "over_request_rate_limit" || err?.status === 429) return new AuthError(CODES.UNAVAILABLE, "Too many attempts. Wait a few minutes and try again.");
  if (code === "weak_password") return new AuthError(CODES.INVALID, "That password is too weak. Use a longer one with letters and numbers.", "next");
  if (code === "same_password") return new AuthError(CODES.INVALID, "Choose a different password from the current one.", "next");
  if (err?.name === "AuthRetryableFetchError" || msg.includes("failed to fetch") || msg.includes("network")) return new AuthError(CODES.UNAVAILABLE, "Cannot reach the server. Check your internet and try again.");
  return new AuthError(CODES.UNAVAILABLE, fallback);
}

export function createSupabaseProvider(client) {
  /* The student's profile row (database rules let a student read only their own). Roll number, optional nickname, forced-change flag. */
  async function loadUser(authUser) {
    const { data, error } = await client.from("profiles").select("roll_no, display_name, must_change_password, created_at").eq("id", authUser.id).maybeSingle();
    if (error) throw mapError(error);
    if (!data) return null;                         // logged in but no profile: not one of our students
    return {
      id: authUser.id,
      name: data.display_name || data.roll_no,      // no real names are stored online: nickname if the student set one, else the roll number
      rollNo: data.roll_no,
      email: "",
      createdAt: data.created_at,
      mustChangePassword: !!data.must_change_password,
    };
  }

  async function getSession() {
    const { data, error } = await client.auth.getSession();
    if (error || !data?.session) return null;
    try {
      const user = await loadUser(data.session.user);
      if (!user) await client.auth.signOut();
      return user;
    } catch { return null; }
  }

  async function signIn(input) {
    const errs = validateLogIn(input);
    if (Object.keys(errs).length) throw firstError(errs);
    const { data, error } = await client.auth.signInWithPassword({ email: emailFor(input.rollNo), password: input.password });
    if (error) throw mapError(error);
    const user = await loadUser(data.user);
    if (!user) { await client.auth.signOut(); throw new AuthError(CODES.BAD_CREDENTIALS, "Roll number or password is incorrect."); }
    return user;
  }

  async function signOut() {
    await client.auth.signOut().catch(() => {});
  }

  /* Student changes their own password. We first check the current one by signing in again, then update.
     The database trigger clears "must change password" only because the password really changed. */
  async function changePassword(input) {
    const errs = validateChangePassword(input);
    if (Object.keys(errs).length) throw firstError(errs);
    const { data } = await client.auth.getSession();
    const email = data?.session?.user?.email;
    if (!email) throw new AuthError(CODES.UNAVAILABLE, "You are not logged in. Please log in again.");
    const check = await client.auth.signInWithPassword({ email, password: input.current });
    if (check.error) {
      const e = mapError(check.error);
      throw e.code === CODES.BAD_CREDENTIALS ? new AuthError(CODES.BAD_CREDENTIALS, "Current password is incorrect.", "current") : e;
    }
    const { data: up, error } = await client.auth.updateUser({ password: input.next });
    if (error) throw mapError(error);
    const user = await loadUser(up.user);
    if (!user) throw new AuthError(CODES.UNAVAILABLE, "Password saved, but your profile could not be loaded. Log in again.");
    return user;
  }

  /* only used when config resetMode is "email" (not the case: resets are done by the CR) */
  async function requestPasswordReset() {
    throw new AuthError(CODES.INVALID, "Password resets are done by your CR. Message them your roll number.");
  }

  /* self sign-up is closed in this project (turned off in the Supabase dashboard too) */
  async function signUp() {
    throw new AuthError(CODES.INVALID, "Sign-up is closed. Ask your CR for an account.");
  }

  /* Tell the app when login state changes (this tab, or another tab). Returns an unsubscribe function. */
  function onChange(callback) {
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      /* run outside Supabase's callback: calling Supabase again inside it can freeze the client */
      setTimeout(async () => {
        if (!session) return callback(null);
        try { callback(await loadUser(session.user)); } catch { callback(null); }
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }

  return { name: "supabase", getSession, signIn, signOut, changePassword, requestPasswordReset, signUp, onChange };
}
