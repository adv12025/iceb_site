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
| Things added from the admin (do not edit by hand) | `src/data/content.json` |

## Page layout (`src/components/`)
| What you see | File |
|---|---|
| Whole page, wires everything together | `Hub.js` |
| Top bar (logo, menu, dark mode button) | `Header.js` |
| Menu links + section icons | `nav.js` |
| Big title + search box | `Hero.js` |
| Footer | `Footer.js` |
| Background glow | `Background.js` |
| Announcement cards | `Announcements.js` |
| Notes section | `Notes.js` |
| Quick Links section | `Links.js` |
| Shared bits (section heading, filter chips, helpers) | `ui.js` |

### Schedule section
| What you see | File |
|---|---|
| Decides what is on now / next, assembles the 3 parts | `Schedule.js` |
| Cards: Happening now, Next class, Extra classes | `schedule/NowCards.js` |
| "Today" list | `schedule/TodayBox.js` |
| Weekly grid | `schedule/TimetableGrid.js` |
| Small card/label pieces | `schedule/parts.js` |
| The logic (today's classes, next class, extras, IST time) | `lib/schedule.js` |

## Other
- `lib/content.js`: merges built-in data + admin content (+ optional Google Sheet).
- `app/globals.css`: colours and theme. `app/layout.js`: page title / fonts.
- Colours and spacing are Tailwind classes written directly in each component.
