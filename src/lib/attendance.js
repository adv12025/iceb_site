import { CAL, HOLIDAYS, NO_CLASS, EVENTS } from "@/data/academic-calendar";
import { DAYS, toMin, changeFor, extrasFor } from "@/lib/schedule";

/* Pure logic for the attendance tracker (no React, no storage). */

/* ---------- dates ---------- */
const iso = d => d.toISOString().slice(0, 10);
export const addDays = (date, n) => { const d = new Date(date + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
export const weekdayOf = date => DAYS[new Date(date + "T00:00:00Z").getUTCDay()];
export function eachDate(from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}
export const fmtDay = (date, o = { weekday: "short", day: "numeric", month: "short" }) =>
  new Date(date + "T00:00:00Z").toLocaleDateString("en-IN", { timeZone: "UTC", ...o });

/* ---------- the calendar: one record per date ---------- */
/* kind: class | assessment | holiday | weekend | exam (after last class day) | outside (not in session) */
let _days;
export function calendar() {
  if (_days) return _days;
  const days = {};
  let n = 0;
  const from = CAL.start, to = CAL.lastWorkingDay;
  for (const date of eachDate(addDays(from, -31), addDays(to, 40))) {
    const weekday = weekdayOf(date);
    const weekend = weekday === "Saturday" || weekday === "Sunday";
    const inTerm = date >= from && date <= to;
    const hol = HOLIDAYS[date];
    const nc = NO_CLASS.find(r => date >= r.from && date <= r.to);
    const rec = { date, weekday, inTerm, holiday: hol, n: 0 };
    if (!inTerm) rec.kind = hol ? "holiday" : weekend ? "weekend" : "outside";
    else if (weekend) rec.kind = "weekend";
    else if (hol) rec.kind = "holiday";
    else {
      rec.n = ++n;
      rec.kind = nc ? "assessment" : date > CAL.lastClassDay ? "exam" : "class";
      if (nc) rec.note = nc.label;
    }
    days[date] = rec;
  }
  _days = days;
  return days;
}
export const dayInfo = date => calendar()[date] || { date, weekday: weekdayOf(date), kind: "outside", n: 0 };
export const eventsOn = date => EVENTS.filter(e => e.date === date);

/* ---------- sessions (individual classes) ---------- */
const sid = (date, c) => `${date}|${c.start}|${c.course}`;

export function sessionsOn(date, timetable, changes) {
  if (dayInfo(date).kind !== "class") return [];
  const base = (timetable[weekdayOf(date)] || [])
    .filter(c => !changeFor(changes, date, c.course))          // cancelled by an announcement / holiday change
    .map(c => ({ id: sid(date, c), date, start: c.start, end: c.end, course: c.course }));
  const extra = extrasFor(changes, date).map(e => ({ id: sid(date, e), date, start: e.start, end: e.end, course: e.course, extra: true }));
  return [...base, ...extra].sort((a, b) => toMin(a.start) - toMin(b.start));
}

export function termSessions(timetable, changes) {
  return eachDate(CAL.start, CAL.lastClassDay).flatMap(d => sessionsOn(d, timetable, changes));
}

export const hasStarted = (s, now) => s.date < now.date || (s.date === now.date && toMin(s.start) <= now.min);

/* ---------- statistics ----------
   marks[sessionId] = "P" present | "A" absent | "X" class was not held.
   Past classes with no mark count as NOT attended (shown as "unmarked") until you mark them. */
export function courseStats(sessions, marks, now, threshold) {
  const valid = sessions.filter(s => marks[s.id] !== "X");
  const held = valid.filter(s => hasStarted(s, now));
  const P = held.filter(s => marks[s.id] === "P").length;
  const A = held.filter(s => marks[s.id] === "A").length;
  const U = held.length - P - A;
  const total = valid.length;
  const future = total - held.length;
  const t = threshold / 100;
  const pct = held.length ? (P / held.length) * 100 : null;
  const needTotal = Math.ceil(t * total - 1e-9);
  const needMore = Math.max(0, needTotal - P);
  const feasible = needMore <= future;
  const canMiss = feasible ? future - needMore : 0;
  const recover = pct !== null && pct < threshold ? Math.ceil((t * held.length - P) / (1 - t) - 1e-9) : 0;
  const status = pct === null ? "none" : pct >= threshold + 5 ? "safe" : pct >= threshold ? "edge" : "low";
  return { held: held.length, P, A, U, total, future, pct, needMore, feasible, canMiss, recover, status, unmarkedIds: held.filter(s => !marks[s.id]).map(s => s.id) };
}

export function allStats(timetable, changes, marks, now, threshold) {
  const sessions = termSessions(timetable, changes);
  const courses = [...new Set(sessions.map(s => s.course))];
  const per = courses.map(c => ({ course: c, ...courseStats(sessions.filter(s => s.course === c), marks, now, threshold) }));
  return { per, overall: courseStats(sessions, marks, now, threshold), sessions };
}

/* ---------- days: what to show on a calendar cell ---------- */
export function dayMood(date, timetable, changes, marks, now) {
  const ss = sessionsOn(date, timetable, changes).filter(s => marks[s.id] !== "X" && hasStarted(s, now));
  if (!ss.length) return null;
  const ok = ss.filter(s => marks[s.id] === "P").length;
  if (ok === ss.length) return "good";
  if (ss.some(s => !marks[s.id])) return "todo";
  return "bad";
}

export function nextEvents(now, count = 6) {
  return EVENTS.filter(e => e.date >= now.date).slice(0, count).map(e => ({
    ...e, days: Math.round((new Date(e.date + "T00:00:00Z") - new Date(now.date + "T00:00:00Z")) / 864e5),
  }));
}

/* number of the latest working day on or before `date` (0 before the session starts) */
export function workingDayAsOf(date) {
  let d = date;
  while (d >= CAL.start && !dayInfo(d).n) d = addDays(d, -1);
  return d < CAL.start ? 0 : dayInfo(d).n;
}

/* last class day on or before `date` (used to pick a sensible day to show) */
export function lastClassDayOnOrBefore(date) {
  let d = date > CAL.lastClassDay ? CAL.lastClassDay : date;
  while (d > CAL.start && dayInfo(d).kind !== "class") d = addDays(d, -1);
  return d;
}
