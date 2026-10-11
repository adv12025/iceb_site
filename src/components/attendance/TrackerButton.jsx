import { ic } from "../nav";

/* The button that opens the tracker. `big` = the larger version used under the hero search box. */
export default function TrackerButton({ onClick, big }) {
  const icon = (
    <svg viewBox="0 0 24 24" className={big ? "size-5" : "size-4"} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ic.attendance}</svg>
  );
  return big ? (
    <button onClick={onClick} className="mt-5 inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 px-5 py-3 font-bold text-white shadow-card transition hover:-translate-y-0.5 hover:brightness-110">
      {icon} Attendance Tracker <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-semibold">demo</span>
    </button>
  ) : (
    <button onClick={onClick} className="ml-auto flex items-center gap-1.5 rounded-full sm:ml-0 bg-gradient-to-br from-sky-600 to-cyan-500 px-3.5 py-1.5 text-sm font-bold text-white transition hover:brightness-110">
      {icon}<span>Attendance</span>
    </button>
  );
}
