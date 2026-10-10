import { Empty, href, cx } from "./ui";

export default function Links({ links, q }) {
  const groups = {};
  links.filter(l => `${l.name} ${l.desc} ${l.group}`.toLowerCase().includes(q)).forEach(l => (groups[l.group] ??= []).push(l));
  const entries = Object.entries(groups);
  if (!entries.length) return <Empty>No links found.</Empty>;
  return entries.map(([g, ls]) => (
    <div key={g} className="mb-6">
      <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-mute">{g}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ls.map((l, i) => (
          <a key={l.id || i} href={href(l.url)} target="_blank" rel="noopener"
            className={cx("flex items-center gap-3 rounded-2xl border border-line bg-card p-4 shadow-card backdrop-blur transition hover:-translate-y-0.5 hover:border-accent", !l.url && "pointer-events-none border-dashed opacity-50")}>
            <span className="grid size-10 place-items-center rounded-xl bg-soft text-xl">{l.icon}</span>
            <span className="min-w-0"><b className="block">{l.name}</b><small className="block truncate text-mute">{l.url ? l.desc : "link coming soon"}</small></span>
          </a>
        ))}
      </div>
    </div>
  ));
}
