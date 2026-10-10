import { toMin, hhmm } from "@/lib/schedule";
import { cx } from "../ui";
import { Label } from "./parts";

/* "Today" list: every class today, cancelled ones struck through, extras marked, plus notes / holiday. */
export default function TodayBox({ now, today, holiday, notes }) {
  return (
    <div className="mb-4 rounded-2xl border border-line bg-card p-4 shadow-card backdrop-blur">
      <Label>Today · {now.day}{holiday && ` · ${holiday.action === "cancelled" ? "No classes" : ""} ${holiday.note || ""}`}</Label>
      <ul className="mt-1 text-sm">
        {today.map((c, i) => {
          const live = !c.cx && now.min >= toMin(c.start) && now.min < toMin(c.end);
          return (
            <li key={i} className={cx("flex flex-wrap justify-between gap-x-3 border-t border-line py-1.5 first:border-t-0", c.cx && "line-through opacity-60", !c.cx && toMin(c.end) <= now.min && "opacity-50", live && "font-semibold text-emerald-500")}>
              <span>{c.extra && "➕ "}{live && "● "}{c.course}{c.chg && ` — ${c.chg.note || c.chg.action}`}</span>
              <span className="text-mute">{hhmm(c.start)}–{hhmm(c.end)}</span>
            </li>
          );
        })}
        {notes.map((n, i) => <li key={"n" + i} className="border-t border-line py-1.5">ℹ️ {n.course === "*" ? "" : n.course + ": "}{n.note}</li>)}
      </ul>
    </div>
  );
}
