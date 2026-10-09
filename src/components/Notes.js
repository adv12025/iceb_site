"use client";
import { useState } from "react";
import { Chips, Empty, href, cx } from "./ui";

export default function Notes({ notes, q }) {
  const sems = notes.map(n => n.semester);
  const [sem, setSem] = useState(null);
  const [type, setType] = useState("all");
  const curSem = sems.includes(sem) ? sem : sems[sems.length - 1];
  const types = ["all", ...new Set(notes.flatMap(n => n.subjects.flatMap(s => s.items.map(i => i.type))))];
  const searching = !!q;
  const pool = searching ? notes : notes.filter(n => n.semester === curSem);

  const blocks = pool.flatMap(sem => sem.subjects.map(s => {
    const items = s.items.filter(i => (type === "all" || i.type === type) && (!searching || `${s.name} ${s.code} ${i.title} ${i.type}`.toLowerCase().includes(q)));
    return items.length ? { sem, s, items } : null;
  })).filter(Boolean);

  return (
    <>
      <div className="mb-4 grid gap-3">
        <Chips items={sems} value={curSem} onPick={setSem} />
        <Chips items={types} value={type} onPick={setType} />
      </div>
      <div className="grid gap-3">
        {blocks.length ? blocks.map(({ sem, s, items }) => (
          <details key={sem.semester + s.name} open={searching} className="group rounded-2xl border border-line bg-card shadow-card backdrop-blur">
            <summary className="flex cursor-pointer items-center justify-between p-4 font-semibold">
              <span>{s.name} <small className="ml-1 font-normal text-mute">{s.code}{searching && " · " + sem.semester}</small></span>
              <span className="text-mute transition group-open:rotate-90">›</span>
            </summary>
            <div className="grid gap-2 border-t border-line p-3 sm:grid-cols-2">
              {items.map((i, k) => (
                <a key={k} href={href(i.url)} target="_blank" rel="noopener"
                  className={cx("flex items-center gap-3 rounded-xl border border-line bg-solid px-3 py-2.5 transition hover:border-accent", !i.url && "pointer-events-none opacity-45")}>
                  <span className="rounded-md bg-soft px-2 py-0.5 text-xs font-bold uppercase text-accent">{i.type}</span>
                  <span className="flex-1 truncate">{i.title}</span>
                  <span className="text-sm text-mute">{i.url ? "↗" : "soon"}</span>
                </a>
              ))}
            </div>
          </details>
        )) : <Empty>No notes found.</Empty>}
      </div>
    </>
  );
}
