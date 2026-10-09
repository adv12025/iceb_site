export const cx = (...a) => a.filter(Boolean).join(" ");

export const fmtDate = d =>
  new Date(d + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/* Links stored as "files/…" are uploads served from this site; respect the base path. */
export const href = u => {
  if (!u) return "#";
  if (/^https?:\/\//i.test(u)) return u;
  return (process.env.NEXT_PUBLIC_BASE_PATH || "") + "/" + u.replace(/^\/+/, "");
};

export function Chips({ items, value, onPick }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(i => (
        <button key={i} onClick={() => onPick(i)}
          className={cx("rounded-full border px-3.5 py-1.5 text-sm font-semibold capitalize transition",
            value === i ? "border-transparent bg-gradient-to-br from-sky-600 to-cyan-500 text-white" : "border-line bg-card text-ink hover:border-accent")}>
          {i}
        </button>
      ))}
    </div>
  );
}

export function Section({ id, title, icon, children }) {
  return (
    <section id={id} className="mx-auto max-w-[1080px] px-5 py-10">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-soft text-accent">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
        </span>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export const Empty = ({ children }) => <div className="rounded-2xl border border-dashed border-line p-6 text-center text-mute">{children}</div>;
