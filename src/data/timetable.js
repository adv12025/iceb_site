/* WEEKLY TIMETABLE: periods, faculty names, the weekly classes and built-in one-off changes. */

/* ============================================================
   CLASS SCHEDULE: ICE Section B, July 2026 session (from the official timetable PDF).
   Times are 24h "HH:MM". One entry per class; a class that covers several
   periods (e.g. Engineering Practice) is just one entry with a longer span.
   ============================================================ */
export const TIMETABLE_META = { session: "July 2026 Session", section: "ICE · Section B" };

/* The columns of the grid. kind "period" = class slot. */
export const PERIODS = [
  { label: "1", start: "08:30", end: "09:20", kind: "period" },
  { label: "2", start: "09:20", end: "10:10", kind: "period" },
  { label: "Break", start: "10:10", end: "10:30", kind: "gap" },
  { label: "3", start: "10:30", end: "11:20", kind: "period" },
  { label: "4", start: "11:20", end: "12:10", kind: "period" },
  { label: "Lunch", start: "12:10", end: "13:30", kind: "gap" },
  { label: "Afternoon", start: "13:30", end: "17:30", kind: "period" }
];

export const FACULTY = {
  "Linear Algebra & Calculus": "Dr. Abhijit Das + Dr. Nishant Rathee",
  "Physics": "Dr. R. Sankaranarayanan",
  "Physics Lab": "Dr. N. Gopalakrishnan",
  "Intro to Computer Programming": "Dr. Aswani Devi Aguru",
  "Computer Programming Lab": "Dr. Aswani Devi Aguru",
  "Basics of Civil Engg.": "Dr. Aneesh Mathew",
  "Energy & Environmental Engg.": "Dr. Aditya Kumar",
  "Engineering Practice": "P. Ajay Palanivel",
  "Basics of Mechanical Engg.": "Dr. M. Shahul Hameed"
};

export const TIMETABLE = {
  Monday: [
    { start: "09:20", end: "10:10", course: "Linear Algebra & Calculus" },
    { start: "10:30", end: "11:20", course: "Intro to Computer Programming" },
    { start: "11:20", end: "12:10", course: "Physics" },
    { start: "13:30", end: "17:10", course: "Physics Lab" }
  ],
  Tuesday: [
    { start: "10:30", end: "12:10", course: "Engineering Practice" }
  ],
  Wednesday: [
    { start: "09:20", end: "10:10", course: "Physics" },
    { start: "10:30", end: "11:20", course: "Basics of Civil Engg." },
    { start: "11:20", end: "12:10", course: "Linear Algebra & Calculus" }
  ],
  Thursday: [
    { start: "08:30", end: "09:20", course: "Energy & Environmental Engg." },
    { start: "09:20", end: "10:10", course: "Basics of Mechanical Engg." },
    { start: "10:30", end: "11:20", course: "Linear Algebra & Calculus" },
    { start: "11:20", end: "12:10", course: "Basics of Civil Engg." }
  ],
  Friday: [
    { start: "08:30", end: "09:20", course: "Intro to Computer Programming" },
    { start: "09:20", end: "10:10", course: "Energy & Environmental Engg." },
    { start: "10:30", end: "11:20", course: "Physics" },
    { start: "11:20", end: "12:10", course: "Basics of Mechanical Engg." },
    { start: "13:30", end: "17:30", course: "Computer Programming Lab" }
  ]
};

/* One-off changes. course "*" = every class that day (holiday).
   action: "cancelled" | "note". Shows live on the schedule for that date.
   Example: { date: "2026-10-12", course: "Physics", action: "cancelled", note: "Faculty on leave" } */
export const SCHEDULE_CHANGES = [
];
