import { FACULTY } from "@/data/timetable";
import { toMin, hhmm, dur } from "@/lib/schedule";
import { Card, Label } from "./parts";

/* Top cards: Happening now, Next class (today or a later day), upcoming Extra classes. */
export default function NowCards({ now, cur, nxt, later, extras }) {
  return (
    <div className="mb-4 grid gap-3 md:grid-cols-3">
      {cur && <Card live><Label>Happening now{cur.extra && " · extra class"}</Label><b className="text-lg">{cur.course}</b><span className="block text-sm text-mute">{FACULTY[cur.course]} · ends {hhmm(cur.end)} ({dur(toMin(cur.end) - now.min)} left)</span></Card>}
      {nxt && <Card><Label>Next class{nxt.extra && " · extra class"}</Label><b className="text-lg">{nxt.course}</b><span className="block text-sm text-mute">{FACULTY[nxt.course]} · {hhmm(nxt.start)}–{hhmm(nxt.end)} (in {dur(toMin(nxt.start) - now.min)})</span></Card>}
      {!nxt && (
        <Card>
          <Label>{cur ? "After this" : "Next class"}</Label>
          {later
            ? <><b className="text-lg">{later.course}{later.extra && " ➕"}</b><span className="block text-sm text-mute">{later.tomorrow ? "Tomorrow" : later.name + " " + later.date.slice(5)} · {hhmm(later.start)}–{hhmm(later.end)}</span></>
            : <b className="text-lg">No upcoming classes</b>}
        </Card>
      )}
      {extras.length > 0 && (
        <Card>
          <Label>➕ Extra classes</Label>
          <ul className="mt-1 text-sm">
            {extras.map((e, i) => (
              <li key={i} className="flex flex-wrap justify-between gap-x-3">
                <span>{e.course}{e.note && ` — ${e.note}`}</span>
                <span className="text-mute">{e.date === now.date ? "Today" : e.date.slice(5)} · {hhmm(e.start)}–{hhmm(e.end)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
