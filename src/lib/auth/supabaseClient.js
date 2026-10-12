import { createClient } from "@supabase/supabase-js";

/* The ONE place the real Supabase connection is made. Only the two PUBLIC settings are used here (they are
   safe in the website; the database rules, not secrecy, protect the data). The secret key is never used in the site. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,          // stay logged in after closing the tab
    autoRefreshToken: true,
    detectSessionInUrl: false,     // we never use email links
    storageKey: "iceb-supabase-auth",
  },
});
