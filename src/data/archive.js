/* ARCHIVE — separate from the live site.
   Old papers, old announcements, old notices, retired data.
   Organized by type > year > items. Students can view everything at /archive.

   type: "paper" | "announcement" | "notice" | "syllabus" | "other"
   status: "archived" | "retired"  (archived = still useful reference, retired = no longer relevant)
   year: academic year, e.g. "2024-25"
   semester: optional, e.g. "Odd Sem" | "Even Sem"
   url: "" means placeholder (shown dimmed as "soon")
*/

export const ARCHIVE_TYPES = [
  { id: "papers", label: "Old Papers", icon: "📄", desc: "Previous cycle test & end semester papers" },
  { id: "slides", label: "Old Slides", icon: "🖥️", desc: "Old PPTs, slide decks, and lecture slides" },
  { id: "announcements", label: "Old Announcements", icon: "📢", desc: "Past announcements no longer on the live site" },
  { id: "notices", label: "Old Notices", icon: "📌", desc: "Past notices (exam schedules, results, holidays, etc.)" },
  { id: "retired", label: "Retired Data", icon: "🗄️", desc: "Old syllabi, handouts, and unused materials" },
];

export const ARCHIVE_YEARS = ["2026-27", "2025-26", "2024-25"];

/* All archive items, newest year first. Only the last 3 academic years are kept. */
export const ARCHIVE = [
  /* ================= 2026-27 ================= */
  {
    year: "2026-27",
    semester: "Odd Sem",
    items: [
      /* Papers */
      { id: "p26-1", type: "paper", title: "CSIR11 - Intro to Computer Programming - CT1", year: "2026-27", exam: "CT1", date: "2026-10-15", url: "", status: "archived" },
      { id: "p26-2", type: "paper", title: "MAIR12 - Linear Algebra and Calculus - CT1", year: "2026-27", exam: "CT1", date: "2026-10-16", url: "", status: "archived" },
      { id: "p26-3", type: "paper", title: "PHIR11 - Physics - CT1", year: "2026-27", exam: "CT1", date: "2026-10-17", url: "", status: "archived" },
      { id: "p26-4", type: "paper", title: "ENIR11 - Energy and Environmental Engineering - CT1", year: "2026-27", exam: "CT1", date: "2026-10-18", url: "", status: "archived" },
      { id: "p26-5", type: "paper", title: "CEIR11 - Basics of Civil Engineering - CT1", year: "2026-27", exam: "CT1", date: "2026-10-20", url: "", status: "archived" },
      { id: "p26-6", type: "paper", title: "MEIR11 - Basics of Mechanical Engineering - CT1", year: "2026-27", exam: "CT1", date: "2026-10-21", url: "", status: "archived" },
      /* Announcements */
      { id: "a26-1", type: "announcement", title: "Cycle Test 1 Schedule Released", year: "2026-27", date: "2026-10-01", body: "CT1 exams will be held from 15 Oct to 21 Oct 2026. Seating plan on notice board.", url: "", status: "archived" },
      { id: "a26-2", type: "announcement", title: "Mid-Semester Feedback Form", year: "2026-27", date: "2026-09-20", body: "All students to fill mid-semester feedback by 25 Sep 2026.", url: "", status: "archived" },
      /* Notices */
      { id: "n26-1", type: "notice", title: "Exam Seating Plan - CT1", year: "2026-27", date: "2026-10-14", body: "Seating arrangement for CT1 displayed outside the department office.", url: "", status: "archived" },
      /* Slides */
      { id: "s26-1", type: "slides", title: "CSIR11 - Unit 1 & 2 Slides (2026 batch)", year: "2026-27", semester: "Odd Sem", exam: "Slides", date: "2026-08-01", url: "", status: "archived" },
      { id: "s26-2", type: "slides", title: "MEIR11 - IC Engine Slides (2026 batch)", year: "2026-27", semester: "Odd Sem", exam: "Slides", date: "2026-08-05", url: "", status: "archived" },
    ],
  },

  /* ================= 2025-26 ================= */
  {
    year: "2025-26",
    semester: "Odd Sem",
    items: [
      /* Papers */
      { id: "p25-1", type: "paper", title: "CSIR11 - Intro to Computer Programming - CT1", year: "2025-26", exam: "CT1", date: "2025-10-15", url: "", status: "archived" },
      { id: "p25-2", type: "paper", title: "MAIR12 - Linear Algebra and Calculus - CT1", year: "2025-26", exam: "CT1", date: "2025-10-16", url: "", status: "archived" },
      { id: "p25-3", type: "paper", title: "PHIR11 - Physics - CT1", year: "2025-26", exam: "CT1", date: "2025-10-17", url: "", status: "archived" },
      { id: "p25-4", type: "paper", title: "ENIR11 - Energy and Environmental Engineering - CT1", year: "2025-26", exam: "CT1", date: "2025-10-18", url: "", status: "archived" },
      { id: "p25-5", type: "paper", title: "CEIR11 - Basics of Civil Engineering - CT1", year: "2025-26", exam: "CT1", date: "2025-10-20", url: "", status: "archived" },
      { id: "p25-6", type: "paper", title: "MEIR11 - Basics of Mechanical Engineering - CT1", year: "2025-26", exam: "CT1", date: "2025-10-21", url: "", status: "archived" },
      /* Announcements */
      { id: "a25-1", type: "announcement", title: "Cycle Test 1 Schedule Released", year: "2025-26", date: "2025-10-01", body: "CT1 exams will be held from 15 Oct to 21 Oct 2025. Seating plan on notice board.", url: "", status: "archived" },
      { id: "a25-2", type: "announcement", title: "Mid-Semester Feedback Form", year: "2025-26", date: "2025-09-20", body: "All students to fill mid-semester feedback by 25 Sep 2025.", url: "", status: "archived" },
      /* Notices */
      { id: "n25-1", type: "notice", title: "Exam Seating Plan - CT1", year: "2025-26", date: "2025-10-14", body: "Seating arrangement for CT1 displayed outside the department office.", url: "", status: "archived" },
      /* Slides */
      { id: "s25-1", type: "slides", title: "CSIR11 - Unit 1 & 2 Slides (2025 batch)", year: "2025-26", semester: "Odd Sem", exam: "Slides", date: "2025-08-01", url: "", status: "archived" },
      { id: "s25-2", type: "slides", title: "MEIR11 - IC Engine Slides (2025 batch)", year: "2025-26", semester: "Odd Sem", exam: "Slides", date: "2025-08-05", url: "", status: "archived" },
    ],
  },

  /* ================= 2024-25 ================= */
  {
    year: "2024-25",
    semester: "Even Sem",
    items: [
      { id: "p24-1", type: "paper", title: "CSIR11 - Intro to Computer Programming - End Sem", year: "2024-25", exam: "End Sem", date: "2025-04-28", url: "", status: "archived" },
      { id: "p24-2", type: "paper", title: "MAIR12 - Linear Algebra and Calculus - End Sem", year: "2024-25", exam: "End Sem", date: "2025-04-30", url: "", status: "archived" },
      { id: "p24-3", type: "paper", title: "PHIR11 - Physics - End Sem", year: "2024-25", exam: "End Sem", date: "2025-05-02", url: "", status: "archived" },
      { id: "p24-4", type: "paper", title: "CSIR11 - Intro to Computer Programming - CT2", year: "2024-25", exam: "CT2", date: "2025-03-10", url: "", status: "archived" },
      { id: "a24-1", type: "announcement", title: "End Semester Results Declared", year: "2024-25", date: "2025-06-15", body: "Even semester results for 2024-25 are now available on the MIS portal.", url: "", status: "archived" },
      { id: "n24-1", type: "notice", title: "End Sem Admit Cards", year: "2024-25", date: "2025-04-20", body: "Admit cards for end semester exams available from department office.", url: "", status: "archived" },
    ],
  },
  {
    year: "2024-25",
    semester: "Odd Sem",
    items: [
      { id: "p23-1", type: "paper", title: "CSIR11 - Intro to Computer Programming - CT1", year: "2024-25", exam: "CT1", date: "2024-10-15", url: "", status: "archived" },
      { id: "p23-2", type: "paper", title: "MAIR12 - Linear Algebra and Calculus - CT1", year: "2024-25", exam: "CT1", date: "2024-10-16", url: "", status: "archived" },
      { id: "p23-3", type: "paper", title: "PHIR11 - Physics - CT1", year: "2024-25", exam: "CT1", date: "2024-10-17", url: "", status: "archived" },
      { id: "a23-1", type: "announcement", title: "Cycle Test 1 Schedule", year: "2024-25", date: "2024-10-01", body: "CT1 exams scheduled from 15 Oct 2024.", url: "", status: "archived" },
    ],
  },
];

/* Group items by type within a year block */
export function groupByType(items) {
  const order = ["papers", "slides", "announcements", "notices", "retired"];
  const typeLabel = t => {
    const found = ARCHIVE_TYPES.find(x => x.id === t);
    return found ? found.label : t;
  };
  const typeIcon = t => {
    const found = ARCHIVE_TYPES.find(x => x.id === t);
    return found ? found.icon : "📁";
  };

  const m = new Map();
  for (const i of items) {
    /* Map item.type to archive type id */
    let tid = i.type;
    if (tid === "paper") tid = "papers";
    else if (tid === "slides") tid = "slides";
    else if (tid === "announcement") tid = "announcements";
    else if (tid === "notice") tid = "notices";
    else if (tid === "syllabus" || tid === "other") tid = "retired";
    if (!m.has(tid)) m.set(tid, []);
    m.get(tid).push(i);
  }
  return order
    .filter(t => m.has(t))
    .map(t => ({ id: t, label: typeLabel(t), icon: typeIcon(t), items: m.get(t) }));
}
