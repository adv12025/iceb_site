import { PERIODS } from "./data";

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

export const changeFor = (changes, date, course) => changes.find(c => c.date === date && (c.course === "*" || c.course === course));

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
