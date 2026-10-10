"use client";
import { useState } from "react";
import { Chips, Empty, fmtDate, href, cx } from "./ui";

const TAGS = ["all", "clubs", "events", "scholarships", "academic"];
const TAG_COLOR = { clubs: "text-[var(--clubs)]", events: "text-[var(--events)]", scholarships: "text-[var(--scholarships)]", academic: "text-[var(--academic)]" };

/* One contact per line; phone numbers and emails become tap-to-call / tap-to-mail links. */
function Contact({ line }) {
  const mail = line.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  const tel = line.match(/\+?\d[\d\s-]{7,}\d/);
  const link = mail ? "mailto:" + mail[0] : tel ? "tel:" + tel[0].replace(/[\s-]/g, "") : null;
  return <li>{link ? <a className="text-accent" href={link}>{line}</a> : line}</li>;
}

export default function Announcements({ items, q }) {
  const [tag, setTag] = useState("all");
  const list = [...items]
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.date.localeCompare(a.date))
    .filter(a => (tag === "all" || a.tag === tag) && `${a.title} ${a.body} ${a.tag} ${a.contacts || ""} ${a.venue || ""}`.toLowerCase().includes(q));
  return (
    <>
      <Chips items={TAGS} value={tag} onPick={setTag} />
      <div className="mt-4 grid gap-3">
        {list.length ? list.map((a, i) => (
          <article key={a.id || i} className={cx("rounded-2xl border bg-card p-5 shadow-card backdrop-blur", a.pinned ? "border-accent" : "border-line")}>
            <div className="flex flex-wrap items-center gap-2 text-sm text-mute">
              <span className={cx("rounded-full bg-soft px-2.5 py-0.5 text-xs font-bold uppercase", TAG_COLOR[a.tag] || "text-accent")}>{a.tag}</span>
              {fmtDate(a.date)}{a.pinned && " · 📌 Pinned"}
            </div>
            <h3 className="mt-2 text-lg font-bold">{a.title}</h3>
            {a.body && <p className="mt-1 text-mute">{a.body}</p>}
            {(a.eventDate || a.eventTime || a.venue) && (
              <p className="mt-2 text-sm font-semibold">
                {(a.eventDate || a.eventTime) && <span className="mr-4">📅 {[a.eventDate && fmtDate(a.eventDate), a.eventTime].filter(Boolean).join(" · ")}</span>}
                {a.venue && <span>📍 {a.venue}</span>}
              </p>
            )}
            {a.contacts && (
              <ul className="mt-2 grid gap-0.5 text-sm">
                {a.contacts.split("\n").map(l => l.trim()).filter(Boolean).map((l, k) => <Contact key={k} line={l} />)}
              </ul>
            )}
            {a.link && <a className="mt-3 inline-block font-semibold text-accent" href={href(a.link)} target="_blank" rel="noopener">{a.linkLabel || "Open"} ↗</a>}
          </article>
        )) : <Empty>No announcements found.</Empty>}
      </div>
    </>
  );
}
