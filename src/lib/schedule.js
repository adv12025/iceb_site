import { PERIODS } from "@/data/timetable";

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const toMin = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
export const hhmm = t => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
export const dur = m => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? m % 60 + "m" : ""}`.trim() : `${m} min`);

/* Always evaluated in IST, whatever the viewer's timezone. */
export function istNow() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(new Date()).map(x => [x.type, x.value])
  );
  return { day: p.weekday, date: `${p.year}-${p.month}-${p.day}`, min: (+p.hour % 24) * 60 + +p.minute };
}

const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
export const changeFor = (changes, date, course) =>
  changes.find(c => c.action !== "extra" && c.date === date && (c.course === "*" || same(c.course, course)));
export const extrasFor = (changes, date) => changes.filter(c => c.action === "extra" && c.date === date && c.start && c.end);

/* Turn one day's classes into grid cells, merging multi-period classes with colSpan. */
export function dayCells(list) {
  const cells = [];
  for (let i = 0; i < PERIODS.length; i++) {
    const col = PERIODS[i];
    if (col.kind === "gap") { cells.push({ gap: col.label }); continue; }
    const s = list.find(c => toMin(c.start) >= toMin(col.start) && toMin(c.start) < toMin(col.end));
    if (!s) { cells.push({ empty: true }); continue; }
    let span = 1;
    while (PERIODS[i + span] && PERIODS[i + span].kind === "period" && toMin(PERIODS[i + span].end) <= toMin(s.end)) span++;
    i += span - 1;
    cells.push({ cls: s, span });
  }
  return cells;
}

/* ---------- what the schedule section shows, computed from the timetable + one-off changes ---------- */

/* Today's classes (weekly timetable + extra classes), cancelled ones flagged `cx`, sorted by time. */
export function todayClasses(timetable, changes, now) {
  return [
    ...(timetable[now.day] || []).map(c => { const chg = changeFor(changes, now.date, c.course); return { ...c, chg, cx: chg?.action === "cancelled" }; }),
    ...extrasFor(changes, now.date).map(e => ({ start: e.start, end: e.end, course: e.course, chg: { note: e.note || "extra class" }, extra: true })),
  ].sort((a, b) => toMin(a.start) - toMin(b.start));
}

/* Next class on a later day (looks up to 2 weeks ahead; respects cancellations and extra classes). */
export function nextLaterClass(timetable, changes, now) {
  for (let d = 1; d <= 14; d++) {
    const dt = new Date(now.date + "T00:00:00Z");
    dt.setUTCDate(dt.getUTCDate() + d);
    const date = dt.toISOString().slice(0, 10), name = DAYS[dt.getUTCDay()];
    const list = [
      ...(timetable[name] || []).filter(c => !changeFor(changes, date, c.course)).map(c => ({ ...c })),
      ...extrasFor(changes, date).map(e => ({ start: e.start, end: e.end, course: e.course, extra: true })),
    ].sort((a, b) => toMin(a.start) - toMin(b.start));
    if (list.length) return { ...list[0], date, name, tomorrow: d === 1 };
  }
  return null;
}

/* Extra classes from today onward. */
export const upcomingExtras = (changes, now) =>
  changes.filter(c => c.action === "extra" && c.date >= now.date && c.start && c.end).sort((a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start));
