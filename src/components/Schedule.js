"use client";
import { useEffect, useState } from "react";
import { istNow, toMin, changeFor, todayClasses, nextLaterClass, upcomingExtras } from "@/lib/schedule";
import NowCards from "./schedule/NowCards";
import TodayBox from "./schedule/TodayBox";
import TimetableGrid from "./schedule/TimetableGrid";

/* Schedule section: works out what is on today / next, then lays out the three parts. */
export default function Schedule({ changes, timetable }) {
  const [now, setNow] = useState(null); // set after mount so server and client markup match
  useEffect(() => {
    setNow(istNow());
    const t = setInterval(() => setNow(istNow()), 30000);
    return () => clearInterval(t);
  }, []);

  if (!now) return <TimetableGrid timetable={timetable} now={null} />;

  const today = todayClasses(timetable, changes, now);
  const active = today.filter(c => !c.cx);
  const cur = active.find(c => now.min >= toMin(c.start) && now.min < toMin(c.end));
  const nxt = active.find(c => toMin(c.start) > now.min);
  const later = nxt ? null : nextLaterClass(timetable, changes, now);
  const holiday = changeFor(changes, now.date, "*");
  const notes = changes.filter(c => c.date === now.date && c.action === "note");

  return (
    <>
      <NowCards now={now} cur={cur} nxt={nxt} later={later} extras={upcomingExtras(changes, now)} />
      {(today.length > 0 || holiday || notes.length > 0) && <TodayBox now={now} today={today} holiday={holiday} notes={notes} />}
      <TimetableGrid timetable={timetable} now={now} />
    </>
  );
}
