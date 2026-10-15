# Archive: Auth + Admin Role Snapshot

**Project:** ice-b-hub-next (`ice-b-admin-next` / icehub site)  
**Archived:** 2026-10-16  
**Status:** Built and tested locally; dev server stopped.

## What this archive contains

| File | Purpose |
|------|---------|
| `src/app/admin/page.jsx` | `/admin` route — CR-only dashboard (login → dashboard flow) |
| `src/components/admin/AdminLogin.jsx` | Admin login form |
| `src/components/admin/AdminDashboard.jsx` | CR dashboard: list students, reset passwords, create accounts, force password change |
| `src/components/admin/StudentCard.jsx` | One student row with reset + force-change buttons |
| `src/components/admin/CreateStudentForm.jsx` | Form to create a new student account |
| `src/lib/auth/config.js` | Added `adminPath`, `crRollNos` |
| `src/lib/auth/AuthContext.jsx` | Added `isCR`, `listUsers`, `resetUserPassword`, `createUser`, `setMustChange` |
| `src/lib/auth/mockProvider.js` | Demo CR backend (localStorage) with admin methods |
| `src/lib/auth/provider.js` | Exposed admin methods on the `auth` object |
| `src/lib/auth/supabaseProvider.js` | `role` in profiles; admin method stubs |
| `src/components/auth/UserMenu.jsx` | "Admin panel" menu item shown to CRs |
| `backend/scripts/create-students.mjs` | Added `--role cr` flag to make an account a class rep |

## How to restore

Copy everything back into `src/` and `backend/` in the ice-b-hub-next project, then:

```powershell
cd C:\Users\Aditya\ice-b-hub-next
npm run dev
# Open: http://localhost:3000/admin
```

## Demo accounts (mock provider only)

| Roll no | Password | Role |
|---------|----------|------|
| `CR0001` | `CR-Admin-7421` | cr |
| `CR0002` | `CR-Admin-5586` | cr |
| `DEMO0001` | `Welcome-7421` | student |
| `DEMO0002` | `Welcome-5586` | student |

## Real Supabase backend

Create a class rep account:

```powershell
cd C:\Users\Aditya\ice-b-hub-next\backend
node scripts/create-students.mjs --reset <YOUR-ROLL> --role cr
```

Requires `backend/.env.local` with `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.

---

**Note:** The `/demo` page was removed. Only `/admin` remains.
