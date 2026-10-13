"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { REMOTE, loadRemote, saveMarksDiff, saveThreshold } from "./attendanceRemote";

/* STORAGE LAYER for attendance. The components talk only to the object returned by useAttendance().
   - Logged in on the real site: marks and the attendance limit are saved to the student's own rows in the database
     (see attendanceRemote.js), so they follow the student to any device. This browser also keeps a copy (instant start, safety net).
   - Demo mode (no Supabase settings): everything stays in this browser, one slot per demo login.
   `sync` says how saving is going: "off" (browser only) | "loading" | "saving" | "saved" | "error". */
const GUEST_KEY = "iceb-attendance-v1";                       // kept as-is so existing marks survive
const keyFor = userId => (userId ? `${GUEST_KEY}:u:${userId}` : GUEST_KEY);
const SAVE_DELAY_MS = 400;

const load = key => {
  try {
    const d = JSON.parse(localStorage.getItem(key) || "null");
    if (d && d.v === 1) return { marks: d.marks && typeof d.marks === "object" ? d.marks : {}, threshold: Number.isFinite(d.threshold) ? d.threshold : null };
  } catch { /* corrupt or blocked storage: start empty */ }
  return { marks: {}, threshold: null };
};

export function useAttendance(defaultThreshold, userId = null) {
  const key = keyFor(userId);
  const remote = REMOTE && !!userId;
  const [marks, setMarks] = useState({});
  const [threshold, setThreshold] = useState(defaultThreshold);
  const [loadedKey, setLoadedKey] = useState(null);   // which slot `marks` currently belongs to (stops us writing user A's marks into user B's slot)
  const [guestCount, setGuestCount] = useState(0);    // marks waiting in the guest slot (offered to a freshly signed-in user)
  const [sync, setSync] = useState(remote ? "loading" : "off");
  const [syncedKey, setSyncedKey] = useState(null);   // the slot whose server copy has been loaded: saving starts only after this (never overwrite the server with an unloaded blank)
  const [tick, setTick] = useState(0);                // bumped by retrySync()

  const server = useRef({ marks: {}, threshold: null });  // what the server is known to hold
  const latest = useRef({ marks: {}, threshold: defaultThreshold });
  latest.current = { marks, threshold };
  const queue = useRef(Promise.resolve());

  /* 1. switch slot: show the browser copy at once, then (if remote) fetch the server copy */
  useEffect(() => {
    const d = load(key);
    setMarks(d.marks);
    setThreshold(d.threshold ?? defaultThreshold);
    setGuestCount(userId ? Object.keys(load(GUEST_KEY).marks).length : 0);
    setLoadedKey(key);
    setSyncedKey(null);
    if (!remote) { setSync("off"); return; }

    let cancelled = false;
    setSync("loading");
    loadRemote().then(r => {
      if (cancelled) return;
      const serverEmpty = Object.keys(r.marks).length === 0 && r.threshold == null;
      const localHas = Object.keys(d.marks).length > 0 || d.threshold != null;
      if (serverEmpty && localHas) {
        /* first time on the server: keep what this browser had, the saver below uploads it */
        server.current = { marks: {}, threshold: null };
      } else {
        server.current = { marks: r.marks, threshold: r.threshold };
        setMarks(r.marks);
        setThreshold(r.threshold ?? defaultThreshold);
      }
      setSyncedKey(key);
      setSync("saved");
    }).catch(() => { if (!cancelled) setSync("error"); });
    return () => { cancelled = true; };
  }, [key, userId, defaultThreshold, remote, tick]);

  /* 2. browser copy */
  useEffect(() => {
    if (loadedKey !== key) return;
    try { localStorage.setItem(key, JSON.stringify({ v: 1, marks, threshold })); } catch { /* storage full or blocked */ }
  }, [marks, threshold, key, loadedKey]);

  /* 3. server copy: after a short pause, send what changed (one save at a time, newest screen state wins) */
  useEffect(() => {
    if (!remote || syncedKey !== key) return;
    const t = setTimeout(() => {
      queue.current = queue.current.then(async () => {
        const { marks: to, threshold: th } = latest.current;
        const from = server.current;
        const marksChanged = Object.keys(to).some(k => from.marks[k] !== to[k]) || Object.keys(from.marks).some(k => !(k in to));
        const thChanged = th !== (from.threshold ?? defaultThreshold);
        if (!marksChanged && !thChanged) return;
        setSync("saving");
        try {
          if (marksChanged) { await saveMarksDiff(userId, from.marks, to); server.current = { ...server.current, marks: { ...to } }; }
          if (thChanged) { await saveThreshold(userId, th); server.current = { ...server.current, threshold: th }; }
          setSync("saved");
        } catch { setSync("error"); }
      });
    }, SAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [marks, threshold, remote, syncedKey, key, userId, defaultThreshold, tick]);

  const retrySync = useCallback(() => setTick(n => n + 1), []);

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

  return { marks, ready: loadedKey === key, threshold, setThreshold, mark, markMany, reset, exportJSON, importJSON, guestCount, importGuest, sync, retrySync };
}
