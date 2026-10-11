import ItemLink from "./ItemLink";
import { groupByExam } from "./kinds";

const Grid = ({ items, subject }) => (
  <div className="grid gap-2 sm:grid-cols-2">
    {items.map((i, k) => <ItemLink key={i.id || k} item={i} subject={subject} />)}
  </div>
);

/* One dropdown per kind inside a subject: "🖥️ Slides  6 ›". PYQs are further split by exam. */
export default function TypeGroup({ group, subject, forceOpen }) {
  const real = group.items.filter(i => i.url);

  /* nothing uploaded yet: a quiet, non-expandable row */
  if (!real.length) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-mute opacity-70">
        <span>{group.icon}</span><span className="flex-1">{group.label}</span><span className="text-sm">soon</span>
      </div>
    );
  }

  const exams = group.kind === "pyq" ? groupByExam(real) : [];
  return (
    <details open={forceOpen || undefined} className="group/t rounded-xl border border-line bg-solid/60">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 font-medium">
        <span>{group.icon}</span>
        <span className="flex-1">{group.label}</span>
        <span className="rounded-full bg-soft px-2 py-0.5 text-xs font-bold text-accent">{real.length}</span>
        <span className="text-mute transition group-open/t:rotate-90">›</span>
      </summary>
      <div className="grid gap-3 border-t border-line p-3">
        {exams.length > 1
          ? exams.map(e => (
              <div key={e.label}>
                <h4 className="mb-1.5 text-xs font-bold uppercase tracking-widest text-mute">{e.label}</h4>
                <Grid items={e.items} subject={subject} />
              </div>
            ))
          : <Grid items={real} subject={subject} />}
      </div>
    </details>
  );
}
