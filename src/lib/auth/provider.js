/* ============================================================
   THE ONE PLACE THAT DECIDES WHERE ACCOUNTS LIVE.
   Everything else (forms, header menu, attendance) calls `auth` and never imports a provider directly.

   It switches by itself:
     - both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set  ->  real Supabase login
     - otherwise                                                                        ->  browser-only demo login
   (Locally: put them in a file called .env.local in the project root. On the live site: GitHub repo ->
    Settings -> Secrets and variables -> Actions -> Variables tab: SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.)
   ============================================================ */
import { LIVE } from "./config";
import { mockProvider } from "./mockProvider";

/* The Supabase code is only downloaded by visitors when it is actually used. */
function lazy(load) {
  let loaded;
  const get = () => (loaded ??= load());
  const call = name => async (...args) => (await get())[name](...args);
  return {
    name: "supabase",
    getSession: call("getSession"), signIn: call("signIn"), signOut: call("signOut"),
    changePassword: call("changePassword"), requestPasswordReset: call("requestPasswordReset"), signUp: call("signUp"),
    onChange(callback) {
      let off, dead = false;
      get().then(p => { if (!dead) off = p.onChange(callback); });
      return () => { dead = true; off?.(); };
    },
  };
}

export const auth = LIVE
  ? lazy(async () => {
      const [{ createSupabaseProvider }, { supabase }] = await Promise.all([import("./supabaseProvider"), import("./supabaseClient")]);
      return createSupabaseProvider(supabase);
    })
  : mockProvider;
