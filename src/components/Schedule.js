"use client";
import { useEffect, useState } from "react";
import { PERIODS, TIMETABLE, TIMETABLE_META, FACULTY } from "@/lib/data";
import { DAYS, istNow, toMin, hhmm, dur, changeFor, dayCells } from "@/lib/schedule";
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

  const today = now ? (TIMETABLE[now.day] || []).map(c => { const chg = changeFor(changes, now.date, c.course); return { ...c, chg, cx: chg?.action === "cancelled" }; }) : [];
  const active = today.filter(c => !c.cx);
  const cur = now && active.find(c => now.min >= toMin(c.start) && now.min < toMin(c.end));
  const nxt = now && active.find(c => toMin(c.start) > now.min);

  let nextDay = null;
  if (now && !cur && !nxt) {
    for (let d = 1; d <= 7; d++) {
      const name = DAYS[(DAYS.indexOf(now.day) + d) % 7];
      if (TIMETABLE[name]) { nextDay = { name, first: TIMETABLE[name][0] }; break; }
    }
  }
  const holiday = now && changeFor(changes, now.date, "*");

  return (
    <>
      {now && (
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {cur && <Card live><Label>Happening now</Label><b className="text-lg">{cur.course}</b><span className="block text-sm text-mute">{FACULTY[cur.course]} · ends {hhmm(cur.end)} ({dur(toMin(cur.end) - now.min)} left)</span></Card>}
          {nxt && <Card><Label>Up next</Label><b className="text-lg">{nxt.course}</b><span className="block text-sm text-mute">{FACULTY[nxt.course]} · {hhmm(nxt.start)} (in {dur(toMin(nxt.start) - now.min)})</span></Card>}
          {!cur && !nxt && (
            <Card>
              <Label>{holiday ? "Holiday" : "Done for today"}</Label>
              <b className="text-lg">{holiday ? holiday.note || "No classes" : TIMETABLE[now.day] ? "No more classes today 🎉" : "No classes today"}</b>
              {nextDay && <span className="block text-sm text-mute">Next: {nextDay.name} {hhmm(nextDay.first.start)} · {nextDay.first.course}</span>}
            </Card>
          )}
          {today.length > 0 && (
            <Card>
              <Label>Today · {now.day}</Label>
              <ul className="mt-1 text-sm">
                {today.map((c, i) => (
                  <li key={i} className={cx("flex justify-between gap-3", c.cx && "line-through opacity-60", !c.cx && toMin(c.end) <= now.min && "opacity-50")}>
                    <span>{c.course}{c.chg && ` — ${c.chg.note || c.chg.action}`}</span><span>{hhmm(c.start)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
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
