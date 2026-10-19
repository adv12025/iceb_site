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
import TrackerModal from "./attendance/TrackerModal";
import Links from "./Links";
import StudentUpload from "./StudentUpload";
import { useAuth } from "@/lib/auth/AuthContext";

const BASE = { announcements: ANNOUNCEMENTS, notes: NOTES, links: LINKS, changes: SCHEDULE_CHANGES, timetable: TIMETABLE };
export default function Hub({ content }) {
  const [q, setQ] = useState("");
  const [sheet, setSheet] = useState(null);
  const [active, setActive] = useState("");
  const [tracker, setTracker] = useState(false);
  const { user } = useAuth();
  const openTracker = () => { history.pushState(null, "", "#attendance"); setTracker(true); };
  const closeTracker = () => { setTracker(false); if (location.hash === "#attendance") history.back(); };
  const search = useRef(null);
  const data = useMemo(() => buildData(BASE, content, sheet), [content, sheet]);
  const query = q.trim().toLowerCase();

  /* Datalist options for the student upload form */
  const sems = [...new Set(data.notes.flatMap(n => n.semester))];
  const subs = [...new Set(data.notes.flatMap(n => n.subjects.map(s => s.name)))];

  /* Flat list of every note item (for "My Uploads" segregation by account) */
  const allItems = useMemo(() => data.notes.flatMap(n =>
    n.subjects.flatMap(s => s.items.map(i => ({ ...i, subject: s.name, semester: n.semester })))
  ), [data.notes]);

  /* Only the current account's uploads — privacy: each student sees only their own */
  const myUploads = user ? allItems.filter(i => i.uploadedBy === user.id) : [];

  useEffect(() => { loadSheet(BASE).then(setSheet); }, []);

  /* #attendance in the address opens the tracker; Back closes it */
  useEffect(() => {
    const sync = () => setTracker(location.hash === "#attendance");
    sync();
    addEventListener("hashchange", sync);
    addEventListener("popstate", sync);
    return () => { removeEventListener("hashchange", sync); removeEventListener("popstate", sync); };
  }, []);

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

      <Header active={active} onOpenTracker={openTracker} />

      <main>
        <Hero q={q} setQ={setQ} search={search} onOpenTracker={openTracker} />

        <Section id="schedule" title="Class Schedule" icon={ic.schedule}><Schedule changes={data.changes} timetable={data.timetable} /></Section>
        <Section id="announcements" title="Announcements" icon={ic.announcements}><Announcements items={data.announcements} q={query} /></Section>
        <Section id="notes" title="Notes" icon={ic.notes}><Notes notes={data.notes} q={query} /></Section>
        {user && <Section id="my-uploads" title="My Uploads" icon={ic.notes}><StudentUpload sems={sems} subs={subs} myUploads={myUploads} /></Section>}
        <Section id="links" title="Quick Links" icon={ic.links}><Links links={data.links} q={query} /></Section>
      </main>

      <Footer />

      <TrackerModal open={tracker} onClose={closeTracker} timetable={data.timetable} changes={data.changes} />

      <datalist id="dl-sem">{sems.map(s => <option key={s} value={s} />)}</datalist>
      <datalist id="dl-sub">{subs.map(s => <option key={s} value={s} />)}</datalist>
    </>
  );
}
