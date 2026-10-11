"use client";
import { useEffect } from "react";
import Attendance from "../Attendance";

/* Full-screen page for the tracker, opened from the button. Closes with the X, the Esc key or the browser Back button.
   Deep link: add #attendance to the address to open it directly. */
export default function TrackerModal({ open, onClose, timetable, changes }) {
  useEffect(() => {
    if (!open) return;
    const onKey = e => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";                 // page behind does not scroll
    return () => { removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label="Attendance tracker" className="fixed inset-0 z-40 overflow-y-auto bg-bg">
      <div className="sticky top-0 z-10 border-b border-line bg-card backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1080px] items-center gap-3 px-5 py-3">
          <button onClick={onClose} className="flex items-center gap-1.5 rounded-full border border-line bg-solid px-3.5 py-1.5 text-sm font-semibold transition hover:border-accent">← Back to hub</button>
          <b className="ml-1 text-lg">Attendance Tracker</b>
          <button onClick={onClose} aria-label="Close" className="ml-auto grid size-9 place-items-center rounded-full border border-line bg-solid text-lg hover:border-accent">✕</button>
        </div>
      </div>
      <div className="mx-auto max-w-[1080px] px-5 py-6">
        <Attendance timetable={timetable} changes={changes} />
      </div>
    </div>
  );
}
