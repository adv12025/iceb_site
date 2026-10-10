"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ANNOUNCEMENTS } from "@/data/announcements";
import { NOTES } from "@/data/notes";
import { LINKS } from "@/data/links";
import { SCHEDULE_CHANGES, TIMETABLE } from "@/data/timetable";
import { buildData, loadSheet } from "@/lib/content";
import { Section } from "./ui";
import { NAV, ic } from "./nav";
import Background from "./Background";
import Header from "./Header";
import Hero from "./Hero";
import Footer from "./Footer";
import Schedule from "./Schedule";
import Announcements from "./Announcements";
import Notes from "./Notes";
import Links from "./Links";

const BASE = { announcements: ANNOUNCEMENTS, notes: NOTES, links: LINKS, changes: SCHEDULE_CHANGES, timetable: TIMETABLE };
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

  return (
    <>
      <Background />

      <Header active={active} />

      <main>
        <Hero q={q} setQ={setQ} search={search} />

        <Section id="schedule" title="Class Schedule" icon={ic.schedule}><Schedule changes={data.changes} timetable={data.timetable} /></Section>
        <Section id="announcements" title="Announcements" icon={ic.announcements}><Announcements items={data.announcements} q={query} /></Section>
        <Section id="notes" title="Notes" icon={ic.notes}><Notes notes={data.notes} q={query} /></Section>
        <Section id="links" title="Quick Links" icon={ic.links}><Links links={data.links} q={query} /></Section>
      </main>

      <Footer />
    </>
  );
}
