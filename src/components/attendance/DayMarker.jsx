import { CAL } from "@/data/academic-calendar";
import { addDays, dayInfo, eventsOn, fmtDay, hasStarted, sessionsOn } from "@/lib/attendance";
import { hhmm } from "@/lib/schedule";
import { cx } from "../ui";

const BTN = [
  ["P", "Present", "bg-emerald-500 text-white border-emerald-500"],
  ["A", "Absent", "bg-rose-500 text-white border-rose-500"],
  ["X", "Not held", "bg-slate-500 text-white border-slate-500"],
];

/* Marks the classes of ONE selected day. Future classes cannot be marked. */
export default function DayMarker({ date, setDate, timetable, changes, marks, mark, now }) {
  const info = dayInfo(date);
  const sessions = sessionsOn(date, timetable, changes);
  const evs = eventsOn(date);
  const step = dir => {
    let d = addDays(date, dir);
    while (d >= CAL.start && d <= CAL.lastClassDay && dayInfo(d).kind !== "class") d = addDays(d, dir);
    if (d >= CAL.start && d <= CAL.lastClassDay) setDate(d);
  };
  const why = { holiday: info.holiday, weekend: "Weekend", assessment: info.note + " (no regular classes assumed)", exam: "Final assessment period", outside: "Not in this session" }[info.kind];

  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card backdrop-blur">
      <div className="mb-3 flex items-center gap-2">
        <button onClick={() => step(-1)} aria-label="Previous class day" className="grid size-9 place-items-center rounded-xl border border-line bg-solid hover:border-accent">‹</button>
        <div className="min-w-0 flex-1 text-center">
          <b className="block text-lg">{fmtDay(date, { weekday: "long", day: "numeric", month: "long" })}</b>
          <small className="text-mute">{info.n ? `Working day ${info.n}` : "Not a working day"}{date === now.date && " · today"}</small>
        </div>
        <button onClick={() => step(1)} aria-label="Next class day" className="grid size-9 place-items-center rounded-xl border border-line bg-solid hover:border-accent">›</button>
      </div>

      {evs.map(e => <div key={e.label} className="mb-2 rounded-xl bg-violet-500/10 px-3 py-2 text-sm text-violet-400">★ {e.label}</div>)}

      {info.kind !== "class" ? (
        <div className="rounded-xl border border-dashed border-line p-4 text-center text-mute">{why || "No classes"}</div>
      ) : !sessions.length ? (
        <div className="rounded-xl border border-dashed border-line p-4 text-center text-mute">No classes scheduled (cancelled or empty day).</div>
      ) : (
        <div className="grid gap-2">
          {sessions.map(s => {
            const started = hasStarted(s, now);
            const cur = marks[s.id];
            return (
              <div key={s.id} className={cx("flex flex-wrap items-center gap-3 rounded-xl border border-line bg-solid px-3 py-2.5", cur === "X" && "opacity-60")}>
                <div className="min-w-0 flex-1">
                  <b className="block truncate">{s.course}{s.extra && <span className="ml-2 rounded bg-soft px-1.5 text-xs text-accent">extra</span>}</b>
                  <small className="text-mute">{hhmm(s.start)} – {hhmm(s.end)}</small>
                </div>
                {started ? (
                  <div className="flex gap-1.5">
                    {BTN.map(([k, label, on]) => (
                      <button key={k} onClick={() => mark(s.id, k)} aria-pressed={cur === k}
                        className={cx("rounded-lg border px-3 py-1.5 text-sm font-semibold transition", cur === k ? on : "border-line bg-card hover:border-accent")}>
                        {label}
                      </button>
                    ))}
                  </div>
                ) : <span className="text-sm text-mute">hasn&apos;t started</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
