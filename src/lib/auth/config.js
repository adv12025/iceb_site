/* LOGIN SETTINGS. Change behaviour here, not in the components. */

/* true when the real Supabase project is configured (the two public settings exist). Then the demo is switched off automatically. */
export const LIVE = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export const AUTH = {
  /* ---- how people get an account ---- */
  /* false = NO public sign-up. The CR creates every account in the database (username = roll number) and
     sends each student a unique first password. true = also show "Create an account" (old self-service mode). */
  selfSignup: false,

  /* Make a student choose their own password the first time they log in with the CR's password. */
  forceChangeOnFirstLogin: true,

  /* What "Forgot password" does: "contact" = tells the student to ask the CR for a new temporary password;
     "email" = asks the backend to email a reset link (needs a real backend). */
  resetMode: "contact",

  /* ---- rules ---- */
  rollNoPattern: /^[A-Za-z0-9]{6,12}$/,   // what a roll number looks like (checked in the browser only)
  passwordMinLength: 8,                    // applies to passwords people choose themselves

  /* ---- only used when selfSignup is true ---- */
  emailDomain: "",        // e.g. "nitt.edu" to restrict sign-up emails; "" = any
  rollNo: "optional",     // "required" | "optional" | "hidden" on the sign-up form

  /* ---- demo phase ---- */
  /* Accounts live in this browser only. Set false when a real backend is connected (hides the yellow notices). */
  demoMode: !LIVE,
  /* Demo only: pre-load a few FAKE test students (see lib/auth/demoSeed.js) so the login can be tried.
     Real students are never listed in this repo. Set false before going live. */
  demoSeed: !LIVE,
};
