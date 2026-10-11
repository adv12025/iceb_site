import TypeGroup from "./TypeGroup";
import { groupByKind } from "./kinds";

/* One dropdown per subject. Inside it: one dropdown per kind (slides / notes / PYQs ...). */
export default function SubjectCard({ subject, semester, items, forceOpen, showSemester }) {
  const has = g => g.items.some(i => i.url);
  const groups = groupByKind(items).sort((a, b) => has(b) - has(a));   // kinds with files first, empty "soon" ones last
  const total = items.filter(i => i.url).length;
  return (
    <details open={forceOpen || undefined} className="group rounded-2xl border border-line bg-card shadow-card backdrop-blur">
      <summary className="flex cursor-pointer items-center gap-3 p-4">
        <span className="min-w-0 flex-1">
          <b className="block font-semibold">{subject.name}</b>
          <small className="block text-mute">{subject.code}{showSemester && " · " + semester}</small>
        </span>
        <span className="hidden flex-wrap justify-end gap-1.5 sm:flex">
          {groups.filter(has).map(g => (
            <span key={g.kind} title={g.label} className="rounded-full bg-soft px-2 py-0.5 text-xs font-semibold text-accent">
              {g.icon} {g.items.filter(i => i.url).length}
            </span>
          ))}
          {!total && <span className="text-xs text-mute">nothing yet</span>}
        </span>
        <span className="text-mute transition group-open:rotate-90">›</span>
      </summary>
      <div className="grid gap-2 border-t border-line p-3">
        {groups.map(g => <TypeGroup key={g.kind} group={g} subject={subject.name} forceOpen={forceOpen} />)}
      </div>
    </details>
  );
}
