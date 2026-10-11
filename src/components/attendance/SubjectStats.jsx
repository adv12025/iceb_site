import { cx } from "../ui";
import { TONE } from "./Summary";

/* What to do next, in plain words, from the numbers computed in lib/attendance.js */
function advice(c, threshold) {
  if (!c.held) return "No classes yet.";
  if (c.pct < threshold) {
    if (c.U > 0 && !c.feasible) return `You have ${c.U} unmarked past ${c.U === 1 ? "class" : "classes"}, which count as missed. Mark them first for a true picture.`;
    if (!c.feasible) return `Even attending every remaining class you cannot reach ${threshold}% this term. Talk to your faculty / CR now.`;
    return `Attend the next ${c.recover} in a row to get back to ${threshold}%. Over the whole term you need ${c.needMore} of the remaining ${c.future}.`;
  }
  if (c.canMiss === 0) return `Right on the line: do not miss any of the remaining ${c.future} classes.`;
  return `You can still miss ${c.canMiss} of the remaining ${c.future} classes and finish at ${threshold}%.`;
}

export default function SubjectStats({ per, threshold, markMany }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {per.map(c => (
        <div key={c.course} className="rounded-2xl border border-line bg-card p-4 shadow-card backdrop-blur">
          <div className="flex items-start justify-between gap-2">
            <b className="leading-snug">{c.course}</b>
            <span className={cx("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold", TONE[c.status].chip)}>{c.pct === null ? "–" : c.pct.toFixed(0) + "%"}</span>
          </div>
          <div className="relative mt-3 h-2.5 rounded-full bg-soft">
            <div className={cx("h-full rounded-full transition-all", TONE[c.status].bar)} style={{ width: (c.pct || 0) + "%" }} />
            <span className="absolute -top-1 h-4.5 w-0.5 bg-ink/60" style={{ left: threshold + "%" }} title={`${threshold}% limit`} />
          </div>
          <div className="mt-2 text-sm text-mute">
            {c.P} attended of {c.held} held · {c.total} planned this term
            {c.A > 0 && <> · <span className="text-rose-400">{c.A} absent</span></>}
          </div>
          <p className="mt-1.5 text-sm">{advice(c, threshold)}</p>
          {c.U > 0 && (
            <button onClick={() => markMany(c.unmarkedIds, "P")} className="mt-2 text-sm font-semibold text-accent hover:underline">
              {c.U} unmarked: mark all as present
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
