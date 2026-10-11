"use client";
import { useEffect, useState } from "react";

/* STORAGE LAYER for attendance.  DEMO PHASE: everything is kept in this browser (localStorage), nothing is sent anywhere.
   When the login system arrives, replace ONLY this file (load/save from the server for the signed-in user);
   the components talk to the app through the object returned by useAttendance() and do not care where data lives. */
const KEY = "iceb-attendance-v1";

export function useAttendance(defaultThreshold) {
  const [marks, setMarks] = useState({});
  const [threshold, setThreshold] = useState(defaultThreshold);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "null");
      if (d && d.v === 1) {
        if (d.marks && typeof d.marks === "object") setMarks(d.marks);
        if (Number.isFinite(d.threshold)) setThreshold(d.threshold);
      }
    } catch { /* corrupt or blocked storage: start empty */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, marks, threshold })); } catch { /* storage full or blocked */ }
  }, [marks, threshold, ready]);

  /* tap the same status again to clear it */
  const mark = (id, status) => setMarks(m => {
    const n = { ...m };
    if (!status || n[id] === status) delete n[id]; else n[id] = status;
    return n;
  });
  const markMany = (ids, status) => setMarks(m => { const n = { ...m }; ids.forEach(i => (n[i] = status)); return n; });
  const reset = () => setMarks({});

  const exportJSON = () => JSON.stringify({ v: 1, app: "iceb-hub", exported: new Date().toISOString(), threshold, marks }, null, 1);
  const importJSON = text => {
    const d = JSON.parse(text);
    if (!d || d.v !== 1 || typeof d.marks !== "object") throw new Error("Not an attendance backup file");
    const ok = Object.fromEntries(Object.entries(d.marks).filter(([k, v]) => /^\d{4}-\d{2}-\d{2}\|/.test(k) && ["P", "A", "X"].includes(v)));
    setMarks(ok);
    if (Number.isFinite(d.threshold)) setThreshold(d.threshold);
  };

  return { marks, ready, threshold, setThreshold, mark, markMany, reset, exportJSON, importJSON };
}
