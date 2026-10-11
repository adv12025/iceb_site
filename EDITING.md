# ICE B Hub: where to edit what

Everything lives in `src/`. Each file does one job.

## Content you change often (no coding)
Use the admin tool (`ice-b-admin-next\Admin.bat`) for announcements, notes, links, schedule changes and the weekly timetable. It writes `src/data/content.json` and publishes.

## Built-in content (edit by hand, then push)
| What | File |
|---|---|
| Site title, subtitle, footer contact, WhatsApp link, Google Sheet ID | `src/data/site.js` |
| Built-in announcements | `src/data/announcements.js` |
| Subjects and notes slots per semester | `src/data/notes.js` |
| Quick links (portals etc.) | `src/data/links.js` |
| Default weekly timetable, period times, faculty names | `src/data/timetable.js` |
| Academic calendar (holidays, assessments, last class day, attendance limit) | `src/data/academic-calendar.js` |
| Things added from the admin (do not edit by hand) | `src/data/content.json` |

## Page layout (`src/components/`)
| What you see | File |
|---|---|
| Whole page, wires everything together | `Hub.jsx` |
| Top bar (logo, menu, dark mode button) | `Header.jsx` |
| Menu links + section icons | `nav.jsx` |
| Big title + search box | `Hero.jsx` |
| Footer | `Footer.jsx` |
| Background glow | `Background.jsx` |
| Announcement cards | `Announcements.jsx` |
| Notes section: filters + list of subjects | `Notes.jsx` |
| Quick Links section | `Links.jsx` |
| Shared bits (section heading, filter chips, helpers) | `ui.jsx` |

### Schedule section
| What you see | File |
|---|---|
| Decides what is on now / next, assembles the 3 parts | `Schedule.jsx` |
| Cards: Happening now, Next class, Extra classes | `schedule/NowCards.jsx` |
| "Today" list | `schedule/TodayBox.jsx` |
| Weekly grid | `schedule/TimetableGrid.jsx` |
| Small card/label pieces | `schedule/parts.jsx` |
| The logic (today's classes, next class, extras, IST time) | `lib/schedule.js` |

### Attendance tracker (demo: saved in the browser only, no login yet)
| What you see | File |
|---|---|
| Wires the tracker together | `Attendance.jsx` |
| Demo notice (delete when login arrives) | `attendance/DemoBanner.jsx` |
| 4 headline numbers | `attendance/Summary.jsx` |
| Mark one day's classes (Present / Absent / Not held) | `attendance/DayMarker.jsx` |
| Month calendar | `attendance/CalendarGrid.jsx` |
| Per-subject bars + advice | `attendance/SubjectStats.jsx` |
| "Coming up" list | `attendance/KeyDates.jsx` |
| Backup / restore / erase / attendance limit | `attendance/DataTools.jsx` |
| All the maths (sessions, %, how many you can miss) | `lib/attendance.js` |
| Where data is stored (swap this for the server when login exists) | `lib/useAttendance.js` |

### Notes section (dropdown inside dropdown)
Subject dropdown > one dropdown per kind (Slides, Notes, PYQs...) > files. PYQs are split by exam.
| What you see | File |
|---|---|
| One subject dropdown (name, code, count badges) | `notes/SubjectCard.jsx` |
| One kind dropdown inside it (Slides / PYQs / ...) | `notes/TypeGroup.jsx` |
| One file row | `notes/ItemLink.jsx` |
| Kinds, icons, order, PYQ exam grouping, title shortening | `notes/kinds.js` |

To add a new kind (e.g. "tutorial"): add one line to `KINDS` in `notes/kinds.js`. Unknown kinds still show up under their own name.

## Other
- `lib/content.js`: merges built-in data + admin content (+ optional Google Sheet).
- `app/globals.css`: colours and theme. `app/layout.jsx`: page title / fonts.
- Colours and spacing are Tailwind classes written directly in each component.
