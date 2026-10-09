/* ============================================================
   ICE B HUB — base data. Admin-tool additions live in src/data/content.json.
   - Add an announcement: copy one block in ANNOUNCEMENTS, put newest first.
   - Add notes: add an item under the right semester > subject > type.
   - Add a link: add an item to LINKS. Leave url "" if you don't have it yet.
   ============================================================ */

/* Paste your Google Sheet ID here (the long part of its URL between /d/ and /edit).
   Leave "" to use only the data below. When set, the sheet's tabs
   (Announcements, Notes, Links, Changes) override the matching lists below. */
export const SHEET_ID = "";

export const SITE = {
  title: "ICE B Hub",
  subtitle: "Dept. of Instrumentation & Control Engineering · NIT Trichy",
  batch: "ICE · Section B",
  contact: "CR: Aditya",          // shown in footer
  whatsapp: ""                    // optional: class group invite link
};

/* tag: "clubs" | "events" | "scholarships" | "academic" */
export const ANNOUNCEMENTS = [
  {
    date: "2026-10-09",
    tag: "academic",
    pinned: true,
    title: "Welcome to the ICE B Hub",
    body: "All announcements, notes and important college links will be posted here. Bookmark this page.",
    link: ""
  }
];

/* type: "notes" | "slides" | "pyq" | "assignment" | "lab" | "other" */
const _T = () => [
  { type: "notes", title: "Notes", url: "" },
  { type: "slides", title: "Slides", url: "" },
  { type: "pyq", title: "Previous year papers", url: "" },
  { type: "assignment", title: "Assignments", url: "" }
];
export const NOTES = [
  {
    semester: "Semester 1",
    subjects: [
      { name: "Linear Algebra and Calculus", code: "MAIR12", items: _T() },
      { name: "Physics", code: "PHIR11", items: _T() },
      { name: "Energy and Environmental Engineering", code: "ENIR11", items: _T() },
      { name: "Introduction to Computer Programming", code: "CSIR11", items: _T() },
      { name: "Basics of Civil Engineering", code: "CEIR11", items: _T() },
      { name: "Basics of Mechanical Engineering", code: "MEIR11", items: _T() },
      { name: "Engineering Practice", code: "PRIR11", items: [{ type: "lab", title: "Manuals & files", url: "" }] },
      { name: "Physics Laboratory", code: "PHIR12", items: [{ type: "lab", title: "Lab manual", url: "" }, { type: "lab", title: "Record / viva questions", url: "" }] }
    ]
  }
];

/* group: used to section the link grid. icon: any emoji. */
export const LINKS = [
  { group: "Academics", icon: "🎓", name: "Academic Dashboard", desc: "Attendance, marks, courses", url: "https://misreg.nitt.edu/nitt-academics/" },
  { group: "Academics", icon: "🗂️", name: "MIS Portal", desc: "Student registration & records", url: "https://misreg.nitt.edu/STUDENTREG/" },
  { group: "Academics", icon: "📚", name: "Library", desc: "Catalogue & e-resources", url: "" },
  { group: "Academics", icon: "🏛️", name: "NITT Website", desc: "Official institute site", url: "https://www.nitt.edu" },
  { group: "Mail & Accounts", icon: "✉️", name: "Webmail Login", desc: "Institute email", url: "https://students.nitt.edu/rcmail/" },
  { group: "Campus Life", icon: "🍽️", name: "Mess Dashboard", desc: "Menu, billing, mess registration", url: "https://dashboard.nitt.edu/" },
  { group: "Campus Life", icon: "🏠", name: "Hostel Portal", desc: "Leave, room & complaints", url: "" },
  { group: "Department", icon: "⚙️", name: "ICE Department", desc: "Faculty, syllabus, notices", url: "" }
];

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
