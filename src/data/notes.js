/* NOTES: semesters > subjects > items. Files uploaded from the admin tool live in content.json. */

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
