"use client";
import { useState } from "react";
import { Chips, Empty } from "./ui";
import SubjectCard from "./notes/SubjectCard";
import { kindMeta } from "./notes/kinds";

/* Notes section = filters + a list of SubjectCards.
   Layout of one subject (dropdown > dropdown) is in notes/SubjectCard.jsx and notes/TypeGroup.jsx. */
export default function Notes({ notes, q }) {
  const sems = notes.map(n => n.semester);
  const [sem, setSem] = useState(null);
  const [type, setType] = useState("all");
  const [bulk, setBulk] = useState({ open: false, n: 0 });   // "expand all" / "collapse all"
  const curSem = sems.includes(sem) ? sem : sems[sems.length - 1];
  const types = ["all", ...new Set(notes.flatMap(n => n.subjects.flatMap(s => s.items.map(i => i.type))))];
  const searching = !!q;
  const pool = searching ? notes : notes.filter(n => n.semester === curSem);

  const blocks = pool.flatMap(sem => sem.subjects.map(s => {
    const items = s.items.filter(i => (type === "all" || i.type === type) && (!searching || `${s.name} ${s.code} ${i.title} ${i.type}`.toLowerCase().includes(q)));
    return items.length ? { sem, s, items } : null;
  })).filter(Boolean);

  const files = blocks.reduce((n, b) => n + b.items.filter(i => i.url).length, 0);
  const forceOpen = searching || bulk.open;

  return (
    <>
      <div className="mb-4 grid gap-3">
        <Chips items={sems} value={curSem} onPick={setSem} />
        <Chips items={types} value={type} onPick={setType} label={kindMeta} />
        <div className="flex items-center gap-3 text-sm text-mute">
          <span>{files} file{files === 1 ? "" : "s"} in {blocks.length} subject{blocks.length === 1 ? "" : "s"}</span>
          <button onClick={() => setBulk(b => ({ open: true, n: b.n + 1 }))} className="font-semibold text-accent hover:underline">Expand all</button>
          <button onClick={() => setBulk(b => ({ open: false, n: b.n + 1 }))} className="font-semibold text-accent hover:underline">Collapse all</button>
        </div>
      </div>
      {/* key changes on expand/collapse so every dropdown re-reads its default state */}
      <div key={bulk.n} className="grid gap-3">
        {blocks.length
          ? blocks.map(({ sem, s, items }) => (
              <SubjectCard key={sem.semester + s.name} subject={s} semester={sem.semester} items={items} forceOpen={forceOpen} showSemester={searching} />
            ))
          : <Empty>No notes found.</Empty>}
      </div>
    </>
  );
}
