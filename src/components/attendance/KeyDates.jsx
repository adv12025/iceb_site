import { nextEvents, fmtDay } from "@/lib/attendance";
import { cx } from "../ui";

const DOT = { ccm: "bg-sky-400", assess: "bg-amber-500", admin: "bg-rose-400", fest: "bg-fuchsia-400", open: "bg-emerald-400" };
const when = d => (d === 0 ? "today" : d === 1 ? "tomorrow" : `in ${d} days`);

/* Next few things on the academic calendar */
export default function KeyDates({ now }) {
  const list = nextEvents(now, 7);
  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card backdrop-blur">
      <h3 className="mb-2 font-bold">Coming up</h3>
      <ul className="grid gap-2">
        {list.map(e => (
          <li key={e.date + e.label} className="flex items-start gap-3 text-sm">
            <i className={cx("mt-1.5 size-2.5 shrink-0 rounded-full", DOT[e.kind])} />
            <span className="flex-1">{e.label}</span>
            <span className="shrink-0 text-right text-mute">{fmtDay(e.date)}<br /><small>{when(e.days)}</small></span>
          </li>
        ))}
        {!list.length && <li className="text-sm text-mute">Nothing left on this calendar.</li>}
      </ul>
    </div>
  );
}
