"use client";
import { useState, useMemo, useEffect } from "react";
import { Section, Chips, Empty } from "@/components/ui";
import Header from "@/components/Header";
import { ARCHIVE, ARCHIVE_TYPES, ARCHIVE_YEARS, groupByType } from "@/data/archive";
import staticContent from "@/data/content.json";
import { href } from "@/components/ui";

/* Archive page — separate from the live site.
   Old papers, old announcements, old notices, retired data.
   Accessible at /archive (not in the main navigation).

   Reads admin-added archive items from content.json.
   Tries to fetch a fresh copy at runtime so admin-added archives show
   without rebuilding; falls back to the statically imported copy. */
export default function ArchivePage() {
  const [yr, setYr] = useState("all");
  const [type, setType] = useState("all");
  const [liveContent, setLiveContent] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/content.json")
      .then(async r => { if (!r.ok) throw new Error("failed"); return r.json(); })
      .then(data => { if (!cancelled) setLiveContent(data); })
      .catch(() => {}); // fall back to static import
    return () => { cancelled = true; };
  }, []);

  const content = liveContent || staticContent;

  /* Group admin-added archive items (from content.json) by year into blocks,
     then merge with built-in archive.js blocks. */
  const adminArchives = useMemo(() => (content?.archives || []).map(a => ({
    id: a.id,
    type: a.type,
    title: a.title,
    year: a.year,
    semester: a.semester || "",
    exam: a.exam || "",
    date: a.date,
    url: a.url,
    status: a.status || "archived",
  })), [content]);

  const adminByYear = useMemo(() => {
    const m = new Map();
    for (const a of adminArchives) {
      if (!m.has(a.year)) m.set(a.year, { year: a.year, semester: a.semester, items: [] });
      m.get(a.year).items.push(a);
    }
    return [...m.values()];
  }, [adminArchives]);

  const allArchive = useMemo(() => [...ARCHIVE, ...adminByYear], [adminByYear]);

  const years = useMemo(() => ["all", ...ARCHIVE_YEARS], []);
  const types = useMemo(() => ["all", ...ARCHIVE_TYPES.map(t => t.id)], []);

  const blocks = useMemo(() => {
    return allArchive.filter(b => {
      if (yr !== "all" && b.year !== yr) return false;
      return true;
    }).map(b => {
      const items = type === "all"
        ? b.items
        : b.items.filter(i => {
            let tid = i.type;
            if (tid === "paper") tid = "papers";
            else if (tid === "slides") tid = "slides";
            else if (tid === "announcement") tid = "announcements";
            else if (tid === "notice") tid = "notices";
            else if (tid === "syllabus" || tid === "other") tid = "retired";
            return tid === type;
          });
      return { ...b, items };
    }).filter(b => b.items && b.items.length > 0);
  }, [yr, type, allArchive]);

  const totalItems = blocks.reduce((n, b) => n + b.items.length, 0);
  const totalFiles = blocks.reduce((n, b) => n + b.items.filter(i => i.url).length, 0);

  const statusBadge = s => s === "retired"
    ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";

  const statusLabel = s => s === "retired" ? "Retired" : "Archived";

  const typeIcon = t => {
    const found = ARCHIVE_TYPES.find(x => x.id === t);
    return found ? found.icon : "📁";
  };

  return (
    <div className="min-h-screen bg-solid p-2 sm:p-4">
      <Header active="archive" onOpenTracker={() => {}} />

      <div className="pt-20"></div>
      <div className="max-w-[1080px] mx-auto mb-6">
        <div className="rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-card backdrop-blur">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-ink">Archive</h1>
              <p className="text-mute text-sm mt-1">
                Old papers, announcements, notices, slides and retired data — segregated by year and type.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-mute">
              <span>{totalItems} item{totalItems === 1 ? "" : "s"} · {totalFiles} file{totalFiles === 1 ? "" : "s"} available</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto mb-4 grid gap-3">
        <Chips items={years} value={yr} onPick={setYr} />
        <Chips items={types} value={type} onPick={setType} />
      </div>

      <div className="max-w-[1080px] mx-auto">
        {blocks.length === 0 ? (
          <Empty>No archive items match your filters.</Empty>
        ) : (
          <div className="grid gap-4">
            {blocks.map((block, bi) => (
              <section key={bi} className="rounded-2xl border border-line bg-card shadow-card backdrop-blur overflow-hidden">
                <div className="border-b border-line bg-soft p-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-ink">{block.year}</h2>
                    <p className="text-xs text-mute">{block.semester || ""}</p>
                  </div>
                  <span className="text-xs font-semibold text-accent">{block.items.length} item{block.items.length === 1 ? "" : "s"}</span>
                </div>

                {groupByType(block.items).map((group, gi) => (
                  <div key={gi} className="border-b border-line/50 last:border-0 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{group.icon}</span>
                      <span className="font-semibold text-ink">{group.label}</span>
                      <span className="ml-auto text-xs {statusBadge(group.items[0].status)} px-2 py-0.5 rounded-full uppercase">
                        {statusLabel(group.items[0].status)}
                      </span>
                    </div>
                    <div className="grid gap-2">
                      {group.items.map((item, ii) => (
                        <a
                          key={ii}
                          href={href(item.url)}
                          target="_blank"
                          rel="noopener"
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                            item.url
                              ? "border-line bg-card hover:border-accent"
                              : "border-dashed border-line/50 bg-soft pointer-events-none opacity-50"
                          }`}>
                          <span className="text-lg">{typeIcon(item.type)}</span>
                          <span className="flex-1 truncate text-sm text-ink" title={item.title}>{item.title}</span>
                          <span className="text-xs text-mute">{item.exam || ""}</span>
                          <span className="text-xs text-mute">{item.date}</span>
                          <span className="text-sm text-mute">{item.url ? "↗" : "soon"}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
