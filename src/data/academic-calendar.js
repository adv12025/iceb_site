/* ACADEMIC CALENDAR: B.Tech. (I) / B.Arch. (I), July 2026 session (NIT Tiruchirappalli, Academic Office PDF).
   Used by the Attendance tracker. Dates are "YYYY-MM-DD".
   Rule from the PDF: a day with a number in brackets "(n)" is a cumulative working day.
   Mon-Fri days without a number are holidays. This file lists exactly those holidays, and the
   code recreates the (n) numbering from them (checked against the PDF: 27 Aug = 1, 10 Dec = 70, 24 Dec = 80). */

export const CAL = {
  title: "Academic Calendar · July 2026 Session",
  source: "NIT Tiruchirappalli, Academic Office",
  start: "2026-08-27",          // institute opens (working day 1)
  lastClassDay: "2026-12-10",   // "closure of all class work and final attendance submission in MIS" (day 70)
  lastWorkingDay: "2026-12-24", // final assessment (theory) ends (day 80)
  minAttendance: 75,            // ASSUMPTION: usual 75% rule. The calendar only mentions a "prevented list"; change if your rule differs.
};

/* Mon-Fri days with no working-day number */
export const HOLIDAYS = {
  "2026-08-15": "Independence Day",
  "2026-08-26": "Milad-un-Nabi",
  "2026-09-04": "Sportsfete",
  "2026-09-14": "Ganesh Chaturthi",
  "2026-09-25": "Festember",
  "2026-10-02": "Mahatma Gandhi's Birthday",
  "2026-10-20": "Dussehra (Vijayadashami)",
  "2026-11-24": "Guru Nanak's Birthday",
  "2026-12-25": "Christmas",
};

/* Working days (they have a number) on which no regular classes are assumed: assessments.
   ASSUMPTION: regular timetable classes are suspended on assessment days. */
export const NO_CLASS = [
  { from: "2026-10-12", to: "2026-10-14", label: "1st Assessment" },
  { from: "2026-11-25", to: "2026-11-27", label: "2nd Assessment" },
  { from: "2026-12-07", to: "2026-12-09", label: "Compensation Assessment" },
];

/* kind: ccm | assess | admin | fest | open | holiday  (only used for labels and colours) */
export const EVENTS = [
  { date: "2026-08-27", label: "Institute opens for July 2026 session", kind: "open" },
  { date: "2026-09-04", label: "Sportsfete (to 6 Sep)", kind: "fest" },
  { date: "2026-09-08", label: "1st CCM and course plan approval", kind: "ccm" },
  { date: "2026-09-25", label: "Festember (to 27 Sep)", kind: "fest" },
  { date: "2026-10-12", label: "1st Assessment (to 14 Oct)", kind: "assess" },
  { date: "2026-10-22", label: "2nd CCM", kind: "ccm" },
  { date: "2026-11-25", label: "2nd Assessment (to 27 Nov)", kind: "assess" },
  { date: "2026-12-04", label: "3rd CCM", kind: "ccm" },
  { date: "2026-12-07", label: "Compensation Assessment (to 9 Dec)", kind: "assess" },
  { date: "2026-12-10", label: "LAST CLASS DAY: closure of class work, final attendance submitted in MIS", kind: "admin" },
  { date: "2026-12-11", label: "Attendance compiled, PREVENTED LIST displayed", kind: "admin" },
  { date: "2026-12-12", label: "Student feedback and hall ticket download (to 13 Dec)", kind: "admin" },
  { date: "2026-12-14", label: "Final assessment: Laboratory (to 15 Dec)", kind: "assess" },
  { date: "2026-12-16", label: "Final assessment: Theory begins", kind: "assess" },
  { date: "2026-12-24", label: "Final assessment: Theory ends", kind: "assess" },
  { date: "2026-12-31", label: "PAC meeting (B.Tech./B.Arch.)", kind: "admin" },
  { date: "2027-01-01", label: "Last date for submission of control sheet", kind: "admin" },
  { date: "2027-01-04", label: "Institute opens for January 2027 session", kind: "open" },
];
