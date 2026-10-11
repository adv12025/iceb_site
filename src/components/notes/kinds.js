/* Everything about WHAT KINDS of material exist (slides, notes, PYQs...) lives here.
   To add a new kind: add one line to KINDS. Unknown types from the admin or Sheet still work (shown under their own name). */
export const KINDS = {
  slides: { label: "Slides", icon: "🖥️" },
  notes: { label: "Notes", icon: "📝" },
  pyq: { label: "Previous year papers", icon: "📄" },
  assignment: { label: "Assignments", icon: "✏️" },
  lab: { label: "Lab", icon: "🧪" },
  other: { label: "Other", icon: "📁" },
};
const ORDER = Object.keys(KINDS);

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
export const kindMeta = k => KINDS[k] || { label: cap(k), icon: "📁" };

/* items -> [{ kind, label, icon, items }] in a fixed, sensible order */
export function groupByKind(items) {
  const m = new Map();
  for (const i of items) {
    const k = (i.type || "other").toLowerCase();
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(i);
  }
  const rank = k => (ORDER.includes(k) ? ORDER.indexOf(k) : ORDER.length);
  return [...m.keys()]
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .map(kind => ({ kind, ...kindMeta(kind), items: m.get(kind) }));
}

/* ---- previous year papers: split by exam so 12 PDFs are not one long list ---- */
const EXAMS = [
  ["Cycle Test 1", /(cycle\s*test|ct)[\s-]*(1|i)\b/i],
  ["Cycle Test 2", /(cycle\s*test|ct)[\s-]*(2|ii)\b/i],
  ["Quiz / Assessment", /quiz|assessment/i],
  ["End Sem", /end\s*sem|final/i],
];
export const examOf = title => (EXAMS.find(([, re]) => re.test(title)) || ["Other"])[0];

export function groupByExam(items) {
  const order = [...EXAMS.map(e => e[0]), "Other"];
  const m = new Map();
  for (const i of items) {
    const e = examOf(i.title || "");
    if (!m.has(e)) m.set(e, []);
    m.get(e).push(i);
  }
  return order.filter(e => m.has(e)).map(label => ({ label, items: m.get(label) }));
}

/* "PYQ Physics Final - 22 Dec 2025" under the Physics card -> "Final - 22 Dec 2025" (display only) */
export function shortTitle(title, subject) {
  let s = (title || "").replace(/^pyq[\s:-]*/i, "");
  if (subject && s.toLowerCase().startsWith(subject.toLowerCase())) s = s.slice(subject.length).replace(/^[\s:-]+/, "");
  return s || title;
}
