import { useState } from "react";
import { CAL, EVENTS } from "@/data/academic-calendar";
import { addDays, dayInfo, dayMood, eachDate, fmtDay, weekdayOf } from "@/lib/attendance";
import { cx } from "../ui";

const MONTHS = [["2026-08", "Aug"], ["2026-09", "Sep"], ["2026-10", "Oct"], ["2026-11", "Nov"], ["2026-12", "Dec"]];
const HEAD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const KIND = {
  class: "bg-solid hover:border-accent",
  assessment: "bg-amber-500/20 text-amber-500",
  exam: "bg-violet-500/15 text-violet-400",
  holiday: "bg-rose-500/15 text-rose-400",
  weekend: "opacity-45",
  outside: "opacity-25",
};
const MOOD = { good: "bg-emerald-500", bad: "bg-rose-500", todo: "bg-amber-500" };

/* Month view of the academic calendar. Click a date to look at / mark it. */
export default function CalendarGrid({ selected, setSelected, timetable, changes, marks, now }) {
  const [month, setMonth] = useState(selected.slice(0, 7) >= "2026-08" && selected.slice(0, 7) <= "2026-12" ? selected.slice(0, 7) : "2026-08");
  const first = month + "-01";
  const lead = (["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]).indexOf(weekdayOf(first));
  const last = addDays(month === "2026-12" ? "2027-01-01" : MONTHS[MONTHS.findIndex(m => m[0] === month) + 1][0] + "-01", -1);
  const dates = eachDate(first, last);
  const evDates = new Set(EVENTS.map(e => e.date));

  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card backdrop-blur">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {MONTHS.map(([k, label]) => (
          <button key={k} onClick={() => setMonth(k)}
            className={cx("rounded-full border px-3.5 py-1 text-sm font-semibold transition", month === k ? "border-transparent bg-gradient-to-br from-sky-600 to-cyan-500 text-white" : "border-line bg-solid hover:border-accent")}>
            {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {HEAD.map(h => <div key={h} className="pb-1 text-xs font-bold uppercase tracking-wider text-mute">{h}</div>)}
        {Array.from({ length: lead }).map((_, i) => <div key={"l" + i} />)}
        {dates.map(d => {
          const info = dayInfo(d);
          const mood = dayMood(d, timetable, changes, marks, now);
          return (
            <button key={d} onClick={() => setSelected(d)} title={[info.holiday, info.note, info.n && "Working day " + info.n].filter(Boolean).join(" · ")}
              className={cx("relative grid aspect-square place-items-center rounded-xl border border-line text-sm font-semibold transition", KIND[info.kind],
                d === now.date && "ring-2 ring-accent", d === selected && "outline-2 outline-offset-1 outline-accent")}>
              {+d.slice(8)}
              {mood && <span className={cx("absolute bottom-1 size-1.5 rounded-full", MOOD[mood])} />}
              {evDates.has(d) && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-violet-400" />}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute">
        <span><i className="mr-1 inline-block size-2.5 rounded bg-solid ring-1 ring-line" />class day</span>
        <span><i className="mr-1 inline-block size-2.5 rounded bg-amber-500/40" />assessment</span>
        <span><i className="mr-1 inline-block size-2.5 rounded bg-rose-500/30" />holiday</span>
        <span><i className="mr-1 inline-block size-2.5 rounded bg-violet-400/40" />after last class day</span>
        <span><i className="mr-1 inline-block size-2 rounded-full bg-violet-400" />event</span>
        <span><i className="mr-1 inline-block size-2 rounded-full bg-emerald-500" />all present</span>
        <span><i className="mr-1 inline-block size-2 rounded-full bg-amber-500" />unmarked</span>
        <span><i className="mr-1 inline-block size-2 rounded-full bg-rose-500" />missed</span>
      </div>
      <p className="mt-1 text-xs text-mute">Dates are from the {CAL.source} calendar. Classes end {fmtDay(CAL.lastClassDay)}.</p>
    </div>
  );
}
