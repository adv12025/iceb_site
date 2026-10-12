import { AUTH } from "@/lib/auth/config";
import { cx } from "../ui";

/* Strip at the top of the tracker: who is using it, and the demo notice (delete the notice when the real backend arrives). */
export default function DemoBanner({ user, openAuth, guestCount, importGuest, hasMarks }) {
  const btn = "rounded-lg border border-line bg-solid px-3 py-1 text-sm font-semibold transition hover:border-accent";
  return (
    <div className="mb-5 grid gap-2">
      <div className={cx("flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-sm", user ? "border-emerald-400/40 bg-emerald-400/10" : "border-sky-400/40 bg-sky-400/10")}>
        {user ? (
          <>
            <span>Signed in as <b>{user.name}</b>. These marks belong to your account.</span>
            {guestCount > 0 && !hasMarks && (
              <button onClick={importGuest} className={btn + " ml-auto"}>Copy {guestCount} guest marks into my account</button>
            )}
          </>
        ) : (
          <>
            <span>You are using the tracker as a <b>guest</b>. Log in with your roll number to keep your marks under your own account.</span>
            <button onClick={() => openAuth("login")} className={btn + " ml-auto"}>Log in</button>
            {AUTH.selfSignup && <button onClick={() => openAuth("signup")} className={btn}>Sign up</button>}
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm">
        <span className="rounded-full bg-amber-400/25 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-500">Demo</span>
        <span>
          Marks are saved <b>only in this browser</b> (the server part is not built yet). Clearing site data erases them, so use <b>Backup</b> at the bottom now and then.
        </span>
      </div>
    </div>
  );
}
