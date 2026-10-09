"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { SITE, ANNOUNCEMENTS, NOTES, LINKS, SCHEDULE_CHANGES } from "@/lib/data";
import { buildData, loadSheet } from "@/lib/content";
import { Section } from "./ui";
import Schedule from "./Schedule";
import Announcements from "./Announcements";
import Notes from "./Notes";
import Links from "./Links";

const BASE = { announcements: ANNOUNCEMENTS, notes: NOTES, links: LINKS, changes: SCHEDULE_CHANGES };
const NAV = [["schedule", "Schedule"], ["announcements", "Announcements"], ["notes", "Notes"], ["links", "Links"]];
const ic = {
  schedule: <><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M8 2v4M16 2v4M3 10h18" /></>,
  announcements: <><path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z" /><path d="M16 8.5a5 5 0 0 1 0 7" /></>,
  notes: <path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h13" />,
  links: <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></>,
};

export default function Hub({ content }) {
  const [q, setQ] = useState("");
  const [sheet, setSheet] = useState(null);
  const [active, setActive] = useState("");
  const search = useRef(null);
  const data = useMemo(() => buildData(BASE, content, sheet), [content, sheet]);
  const query = q.trim().toLowerCase();

  useEffect(() => { loadSheet(BASE).then(setSheet); }, []);

  useEffect(() => {
    const onKey = e => {
      if (e.key === "/" && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); search.current?.focus(); }
    };
    addEventListener("keydown", onKey);
    const spy = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-40% 0px -55% 0px" });
    NAV.forEach(([id]) => { const el = document.getElementById(id); if (el) spy.observe(el); });
    return () => { removeEventListener("keydown", onKey); spy.disconnect(); };
  }, []);

  const toggleTheme = () => {
    const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    localStorage.setItem("theme", t);
  };

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <i className="absolute -right-[10vmax] -top-[22vmax] size-[48vmax] animate-drift rounded-full bg-accent opacity-35 blur-[90px]" />
        <i className="absolute -left-[16vmax] -top-[18vmax] size-[48vmax] animate-drift rounded-full bg-accent2 opacity-25 blur-[90px] [animation-delay:-7s]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-line bg-card backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1080px] items-center gap-4 px-5 py-3">
          <a href="#home" className="flex items-center gap-2 font-bold">
            <span className="rounded-lg bg-gradient-to-br from-sky-600 to-cyan-500 px-2 py-1 text-xs text-white">ICE</span>{SITE.title}
          </a>
          <nav className="ml-auto hidden gap-1 sm:flex" aria-label="Sections">
            {NAV.map(([id, label]) => (
              <a key={id} href={"#" + id} className={"rounded-full px-3 py-1.5 text-sm font-semibold transition hover:bg-soft " + (active === id ? "bg-soft text-accent" : "text-mute")}>{label}</a>
            ))}
          </nav>
          <button onClick={toggleTheme} aria-label="Toggle dark mode" title="Toggle theme" className="ml-auto grid size-9 place-items-center rounded-full border border-line bg-solid sm:ml-0">
            <span className="dark:hidden">🌙</span><span className="hidden dark:inline">☀️</span>
          </button>
        </div>
      </header>

      <main>
        <section id="home" className="mx-auto max-w-[1080px] px-5 pb-6 pt-16">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-sm font-semibold text-mute">
            <span className="size-2 rounded-full bg-emerald-400" />{SITE.batch}
          </p>
          <h1 className="bg-gradient-to-br from-sky-600 to-cyan-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">{SITE.title}</h1>
          <p className="mt-3 max-w-xl text-lg text-mute">{SITE.subtitle}</p>
          <label className="relative mt-7 block max-w-xl">
            <input ref={search} value={q} onChange={e => setQ(e.target.value)} type="search" autoComplete="off"
              placeholder="Search announcements, notes, links…"
              className="w-full rounded-2xl border border-line bg-card py-3.5 pl-5 pr-12 shadow-card outline-none backdrop-blur focus:border-accent focus:ring-4 focus:ring-accent/20" />
            <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-md border border-b-2 border-line bg-solid px-2 text-xs font-semibold text-mute">/</kbd>
          </label>
        </section>

        <Section id="schedule" title="Class Schedule" icon={ic.schedule}><Schedule changes={data.changes} /></Section>
        <Section id="announcements" title="Announcements" icon={ic.announcements}><Announcements items={data.announcements} q={query} /></Section>
        <Section id="notes" title="Notes" icon={ic.notes}><Notes notes={data.notes} q={query} /></Section>
        <Section id="links" title="Quick Links" icon={ic.links}><Links links={data.links} q={query} /></Section>
      </main>

      {(SITE.contact || SITE.whatsapp) && (
        <footer className="mx-auto flex max-w-[1080px] items-center justify-between px-5 py-10 text-sm text-mute">
          <span>{SITE.contact}</span>
          {SITE.whatsapp && <a className="font-semibold text-accent" href={SITE.whatsapp} target="_blank" rel="noopener">Join class group ↗</a>}
        </footer>
      )}
    </>
  );
}
