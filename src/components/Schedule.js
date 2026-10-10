"use client";
import { useEffect, useState } from "react";
import { PERIODS, TIMETABLE, TIMETABLE_META, FACULTY } from "@/lib/data";
import { DAYS, istNow, toMin, hhmm, dur, changeFor, extrasFor, dayCells } from "@/lib/schedule";
import { cx } from "./ui";

const Card = ({ live, children }) => (
  <div className={cx("rounded-2xl border bg-card p-4 shadow-card backdrop-blur", live ? "border-emerald-400" : "border-line")}>{children}</div>
);
const Label = ({ children }) => <small className="block text-xs font-bold uppercase tracking-wider text-mute">{children}</small>;

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

export default function Schedule({ changes }) {
  const [now, setNow] = useState(null); // set after mount so server and client markup match
  useEffect(() => {
    setNow(istNow());
    const t = setInterval(() => setNow(istNow()), 30000);
    return () => clearInterval(t);
  }, []);

  const upcoming = now ? changes.filter(c => c.date === now.date).sort((a, b) => (a.start || "").localeCompare(b.start || "")) : [];

  return (
    <>
      {upcoming.length > 0 && (
        <div className="mb-4 rounded-2xl border border-line bg-card p-4 shadow-card backdrop-blur">
          <Label>Schedule changes · today</Label>
          <ul className="mt-1 text-sm">
            {upcoming.map((c, i) => (
              <li key={i} className="flex flex-wrap justify-between gap-x-3 border-t border-line py-1.5 first:border-t-0">
                <span><b>{c.date}</b> · {c.action === "extra" ? "➕ Extra class" : c.action === "cancelled" ? "❌ Cancelled" : "ℹ️"} · {c.course === "*" ? "Whole day" : c.course}</span>
                <span className="text-mute">{c.action === "extra" ? `${hhmm(c.start)}–${hhmm(c.end)}` : ""}{c.note ? ` ${c.note}` : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
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
            {Object.entries(TIMETABLE).map(([day, list]) => (
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
