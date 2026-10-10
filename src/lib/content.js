import { SHEET_ID } from "./data";

/* Merge base data + admin-tool content (+ optional Google Sheet) into what the page shows.
   Pure: never mutates its inputs, so re-running it can't duplicate items. */
export function buildData(base, content, sheet) {
  const src = sheet ?? base;
  const notes = structuredClone(src.notes);
  for (const n of content.notes || []) {
    let sem = notes.find(x => x.semester === n.semester);
    if (!sem) notes.push((sem = { semester: n.semester, subjects: [] }));
    let sub = sem.subjects.find(x => x.name === n.subject);
    if (!sub) sem.subjects.push((sub = { name: n.subject, code: n.code || "", items: [] }));
    const slot = sub.items.find(i => !i.url && i.type === n.type);
    if (slot) Object.assign(slot, { title: n.title, url: n.url });
    else sub.items.push({ type: n.type, title: n.title, url: n.url });
  }
  return {
    announcements: [...(content.announcements || []), ...src.announcements],
    links: [...src.links, ...(content.links || [])],
    changes: [...src.changes, ...(content.changes || [])],
    timetable: content.timetable || base.timetable,
    notes,
  };
}

/* ---------- Google Sheet (CSV via gviz) ---------- */
export function parseCSV(text) {
  const rows = [];
  let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const [head, ...body] = rows.filter(r => r.some(x => x.trim()));
  if (!head) return [];
  const keys = head.map(h => h.trim().toLowerCase());
  return body.map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

const isoDate = s => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d) ? s : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/* A tab that loads but is empty is a real (empty) list; only a failed fetch (null) falls back to the built-in data. */
const tab = name =>
  fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(parseCSV)
    .catch(() => null);

export async function loadSheet(base) {
  if (!SHEET_ID) return null;
  const [ann, notes, links, chg] = await Promise.all(["Announcements", "Notes", "Links", "Changes"].map(tab));
  if (!ann && !notes && !links && !chg) return null;

  const sems = new Map();
  (notes || []).filter(r => r.semester && r.subject).forEach(r => {
    const subs = sems.get(r.semester) ?? sems.set(r.semester, new Map()).get(r.semester);
    const s = subs.get(r.subject) ?? subs.set(r.subject, { name: r.subject, code: r.code, items: [] }).get(r.subject);
    if (r.title) s.items.push({ type: (r.type || "notes").toLowerCase(), title: r.title, url: r.url });
  });
  return {
    announcements: ann ? ann.filter(r => r.title).map(r => ({ date: isoDate(r.date), tag: (r.tag || "academic").toLowerCase(), pinned: /^(true|yes|1|y)$/i.test(r.pinned), title: r.title, body: r.body, link: r.link })) : base.announcements,
    notes: notes ? [...sems].map(([semester, subs]) => ({ semester, subjects: [...subs.values()] })) : base.notes,
    links: links ? links.filter(r => r.name).map(r => ({ group: r.group || "Links", icon: r.icon || "🔗", name: r.name, desc: r.desc, url: r.url })) : base.links,
    changes: chg ? chg.filter(r => r.date).map(r => ({ date: isoDate(r.date), course: r.course || "*", action: (r.action || "note").toLowerCase(), note: r.note })) : base.changes,
  };
}
