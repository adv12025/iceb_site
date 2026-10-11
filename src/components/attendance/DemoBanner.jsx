/* Shown at the top of the tracker while it is a demo. Delete this component when login arrives. */
export default function DemoBanner() {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm">
      <span className="rounded-full bg-amber-400/25 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-500">Demo</span>
      <span>
        Your marks are saved <b>only in this browser</b> (no login yet). Clearing site data erases them, so use <b>Backup</b> at the bottom now and then.
        Login and sync across devices will come later.
      </span>
    </div>
  );
}
