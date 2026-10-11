import { CAL } from "@/data/academic-calendar";
import { workingDayAsOf } from "@/lib/attendance";
import { cx } from "../ui";

export const TONE = {
  safe: { chip: "bg-emerald-500/15 text-emerald-500", bar: "bg-emerald-500", label: "Safe" },
  edge: { chip: "bg-amber-500/20 text-amber-500", bar: "bg-amber-500", label: "On the edge" },
  low: { chip: "bg-rose-500/15 text-rose-500", bar: "bg-rose-500", label: "Below limit" },
  none: { chip: "bg-soft text-mute", bar: "bg-mute", label: "No classes yet" },
};

const Tile = ({ k, v, sub, tone }) => (
  <div className="rounded-2xl border border-line bg-card p-4 shadow-card backdrop-blur">
    <div className="text-xs font-bold uppercase tracking-widest text-mute">{k}</div>
    <div className={cx("mt-1 text-3xl font-extrabold", tone)}>{v}</div>
    <div className="mt-0.5 text-sm text-mute">{sub}</div>
  </div>
);

/* Four headline numbers: overall %, classes held, working-day progress, unmarked */
export default function Summary({ overall, now, threshold }) {
  const dayNo = workingDayAsOf(now.date);
  const tone = { safe: "text-emerald-500", edge: "text-amber-500", low: "text-rose-500", none: "" }[overall.status];
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile k="Overall" v={overall.pct === null ? "–" : overall.pct.toFixed(1) + "%"} tone={tone} sub={`limit ${threshold}% · ${TONE[overall.status].label}`} />
      <Tile k="Classes attended" v={`${overall.P}/${overall.held}`} sub={`${overall.future} still to come this term`} />
      <Tile k="Working day" v={`${Math.min(dayNo, 70)}/70`} sub={`classes end ${new Date(CAL.lastClassDay + "T00:00:00Z").toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short" })}`} />
      <Tile k="Unmarked" v={overall.U} tone={overall.U ? "text-amber-500" : ""} sub={overall.U ? "counted as missed until marked" : "all caught up"} />
    </div>
  );
}
