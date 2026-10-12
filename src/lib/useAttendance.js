"use client";
import { useEffect, useState } from "react";

/* STORAGE LAYER for attendance.  DEMO PHASE: everything is kept in this browser (localStorage), nothing is sent anywhere.
   Each login gets its own slot, so two people sharing one browser do not mix marks; logged-out use is the "guest" slot.
   When the real backend arrives, replace ONLY this file (load/save from the server for the signed-in user);
   the components talk to the app through the object returned by useAttendance() and do not care where data lives. */
const GUEST_KEY = "iceb-attendance-v1";                       // kept as-is so existing marks survive
const keyFor = userId => (userId ? `${GUEST_KEY}:u:${userId}` : GUEST_KEY);

const load = key => {
  try {
    const d = JSON.parse(localStorage.getItem(key) || "null");
    if (d && d.v === 1) return { marks: d.marks && typeof d.marks === "object" ? d.marks : {}, threshold: Number.isFinite(d.threshold) ? d.threshold : null };
  } catch { /* corrupt or blocked storage: start empty */ }
  return { marks: {}, threshold: null };
};

export function useAttendance(defaultThreshold, userId = null) {
  const key = keyFor(userId);
  const [marks, setMarks] = useState({});
  const [threshold, setThreshold] = useState(defaultThreshold);
  const [loadedKey, setLoadedKey] = useState(null);   // which slot `marks` currently belongs to (stops us writing user A's marks into user B's slot)
  const [guestCount, setGuestCount] = useState(0);    // marks waiting in the guest slot (offered to a freshly signed-in user)

  useEffect(() => {
    const d = load(key);
    setMarks(d.marks);
    setThreshold(d.threshold ?? defaultThreshold);
    setGuestCount(userId ? Object.keys(load(GUEST_KEY).marks).length : 0);
    setLoadedKey(key);
  }, [key, userId, defaultThreshold]);

  useEffect(() => {
    if (loadedKey !== key) return;
    try { localStorage.setItem(key, JSON.stringify({ v: 1, marks, threshold })); } catch { /* storage full or blocked */ }
  }, [marks, threshold, key, loadedKey]);

  /* tap the same status again to clear it */
  const mark = (id, status) => setMarks(m => {
    const n = { ...m };
    if (!status || n[id] === status) delete n[id]; else n[id] = status;
    return n;
  });
  const markMany = (ids, status) => setMarks(m => { const n = { ...m }; ids.forEach(i => (n[i] = status)); return n; });
  const reset = () => setMarks({});
  const importGuest = () => { setMarks(m => ({ ...load(GUEST_KEY).marks, ...m })); setGuestCount(0); };

  const exportJSON = () => JSON.stringify({ v: 1, app: "iceb-hub", exported: new Date().toISOString(), threshold, marks }, null, 1);
  const importJSON = text => {
    const d = JSON.parse(text);
    if (!d || d.v !== 1 || typeof d.marks !== "object") throw new Error("Not an attendance backup file");
    const ok = Object.fromEntries(Object.entries(d.marks).filter(([k, v]) => /^\d{4}-\d{2}-\d{2}\|/.test(k) && ["P", "A", "X"].includes(v)));
    setMarks(ok);
    if (Number.isFinite(d.threshold)) setThreshold(d.threshold);
  };

  return { marks, ready: loadedKey === key, threshold, setThreshold, mark, markMany, reset, exportJSON, importJSON, guestCount, importGuest };
}
