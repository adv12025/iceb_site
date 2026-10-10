import { PERIODS, TIMETABLE_META, FACULTY } from "@/data/timetable";
import { toMin, hhmm, dayCells } from "@/lib/schedule";
import { cx } from "../ui";

function Cell({ c, day, now }) {
  if (c.gap) return <td className="bg-black/5 text-xs text-mute dark:bg-white/5">{c.gap}</td>;
  if (c.empty) return <td className="text-mute">—</td>;
  const live = now?.day === day && now.min >= toMin(c.cls.start) && now.min < toMin(c.cls.end);
  const lab = /lab|practice/i.test(c.cls.course);
  return (
    <td colSpan={c.span} className={cx("p-2 font-semibold", lab ? "text-[var(--events)]" : "text-accent", live && "outline-2 -outline-offset-2 outline-emerald-400")}>
      {c.cls.course}
      <small className="block font-normal text-mute">{FACULTY[c.cls.course]}</small>
      <small className="block font-normal text-mute">{hhmm(c.cls.start)}–{hhmm(c.cls.end)}</small>
    </td>
  );
}

/* The weekly grid (days x periods). */
export default function TimetableGrid({ timetable, now }) {
  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-line bg-card shadow-card backdrop-blur">
        <table className="w-full min-w-[820px] border-collapse text-center text-sm">
          <thead>
            <tr>
              <th className="p-3 text-left">Day</th>
              {PERIODS.map(p => (
                <th key={p.label} className="p-3">{p.kind === "period" && "Period "}{p.label}<small className="block font-normal text-mute">{hhmm(p.start)}–{hhmm(p.end)}</small></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(timetable).map(([day, list]) => (
              <tr key={day} className={cx("border-t border-line", now?.day === day && "bg-soft")}>
                <th className="p-3 text-left">{day}</th>
                {dayCells(list).map((c, i) => <Cell key={i} c={c} day={day} now={now} />)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm text-mute">{TIMETABLE_META.section} · {TIMETABLE_META.session}. Highlighted = happening now (IST).</p>
    </>
  );
}
