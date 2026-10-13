"use client";
import { useEffect, useMemo, useState } from "react";
import { CAL } from "@/data/academic-calendar";
import { allStats, lastClassDayOnOrBefore } from "@/lib/attendance";
import { istNow } from "@/lib/schedule";
import { useAttendance } from "@/lib/useAttendance";
import { useAuth } from "@/lib/auth/AuthContext";
import DemoBanner from "./attendance/DemoBanner";
import Summary from "./attendance/Summary";
import DayMarker from "./attendance/DayMarker";
import CalendarGrid from "./attendance/CalendarGrid";
import SubjectStats from "./attendance/SubjectStats";
import KeyDates from "./attendance/KeyDates";
import DataTools from "./attendance/DataTools";

/* Attendance tracker (DEMO): wires the pieces in ./attendance together.
   Logic lives in lib/attendance.js, storage in lib/useAttendance.js, dates in data/academic-calendar.js. */
export default function Attendance({ timetable, changes }) {
  const { user, status, openAuth } = useAuth();
  const att = useAttendance(CAL.minAttendance, user?.id);
  /* The clock is read only after mount: the page is pre-built, so a build-time "now" would be wrong and mismatch on hydration. */
  const [now, setNow] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const n = istNow();
    setNow(n);
    setSelected(lastClassDayOnOrBefore(n.date));
    const t = setInterval(() => setNow(istNow()), 60_000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(
    () => (now ? allStats(timetable, changes, att.marks, now, att.threshold) : null),
    [timetable, changes, att.marks, now, att.threshold]
  );
  /* The tracker is for logged-in students only. */
  if (status === "loading") return <div className="rounded-2xl border border-dashed border-line p-6 text-center text-mute">Checking your login…</div>;
  if (status === "out") {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-3xl border border-line bg-card p-8 text-center shadow-card">
        <div className="mb-3 text-4xl">🔒</div>
        <h3 className="mb-2 text-xl font-bold">Log in to use the Attendance Tracker</h3>
        <p className="mb-5 text-sm text-mute">Your marks are saved under your own account. Log in with your roll number and the password the CR gave you.</p>
        <button onClick={() => openAuth("login")} className="rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 px-6 py-2.5 font-bold text-white transition hover:brightness-110">Log in</button>
      </div>
    );
  }
  if (!stats || !selected) return <div className="rounded-2xl border border-dashed border-line p-6 text-center text-mute">Loading tracker…</div>;
  const { per, overall } = stats;

  return (
    <>
      <DemoBanner user={user} openAuth={openAuth} guestCount={att.guestCount} importGuest={att.importGuest} hasMarks={Object.keys(att.marks).length > 0} sync={att.sync} retrySync={att.retrySync} />
      <Summary overall={overall} now={now} threshold={att.threshold} />
      <div className="mb-5 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <DayMarker date={selected} setDate={setSelected} timetable={timetable} changes={changes} marks={att.marks} mark={att.mark} now={now} />
        <CalendarGrid selected={selected} setSelected={setSelected} timetable={timetable} changes={changes} marks={att.marks} now={now} />
      </div>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-mute">Subject by subject</h3>
      <div className="mb-5"><SubjectStats per={per} threshold={att.threshold} markMany={att.markMany} /></div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <KeyDates now={now} />
        <DataTools att={att} />
      </div>
      <p className="mt-4 text-xs text-mute">
        How it counts: each timetable entry is one class (a lab block counts once); no regular classes are assumed on assessment days;
        past classes you have not marked count as missed; &quot;Not held&quot; removes a class from the totals. The {att.threshold}% limit is an assumption. Check your department&apos;s rule.
      </p>
    </>
  );
}
