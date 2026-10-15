"use client";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import StudentCard from "@/components/admin/StudentCard";
import CreateStudentForm from "@/components/admin/CreateStudentForm";

/* Admin dashboard: view all students, reset passwords, create accounts. CR only. */
export default function AdminDashboard({ user, onSignOut }) {
  const { listUsers, resetUserPassword, createUser, setMustChange, signOut } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);   // { type: "ok" | "error", text: string }
  const [showCreate, setShowCreate] = useState(false);
  const [resetBusy, setResetBusy] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const data = await listUsers();
      setStudents(data.sort((a, b) => a.rollNo.localeCompare(b.rollNo)));
    } catch (e) {
      setNotice({ type: "error", text: e.message || "Could not load students." });
    } finally {
      setLoading(false);
    }
  }, [listUsers]);

  useEffect(() => { load(); }, [load]);

  const notify = (type, text) => { setNotice({ type, text }); setTimeout(() => setNotice(null), 6000); };

  const handleReset = async (rollNo) => {
    setResetBusy(s => new Set(s).add(rollNo));
    setNotice(null);
    try {
      const result = await resetUserPassword(rollNo);
      notify("ok", `Temporary password for ${result.rollNo}: <b>${result.tempPassword}</b>. Send it privately — they must choose their own on next login.`);
      await load();
    } catch (e) {
      notify("error", e.message || "Reset failed.");
    } finally {
      setResetBusy(s => { const n = new Set(s); n.delete(rollNo); return n; });
    }
  };

  const handleCreate = async (rollNo, password, name) => {
    setNotice(null);
    try {
      await createUser(rollNo, password, name);
      notify("ok", `Account created for ${rollNo}. They must choose their own password on first login.`);
      setShowCreate(false);
      await load();
    } catch (e) {
      notify("error", e.message || "Could not create account.");
    }
  };

  const handleForceChange = async (rollNo, flag) => {
    try {
      await setMustChange(rollNo, flag);
      await load();
    } catch (e) {
      notify("error", e.message || "Could not update.");
    }
  };

  return (
    <div className="min-h-screen bg-solid p-2 sm:p-4">
      <div className="max-w-[760px] mx-auto">
        {/* header bar */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-ink">Admin panel</h1>
            <p className="text-sm text-mute">Class rep: <b>{user.name}</b> ({user.rollNo}) · {students.length} student{(students.length !== 1 ? "s" : "")}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(true)} className="rounded-xl border border-line bg-solid px-3.5 py-2 text-sm font-semibold text-accent hover:bg-soft">
              + New student
            </button>
            <button onClick={load} className="rounded-xl border border-line bg-solid px-3.5 py-2 text-sm font-semibold text-accent hover:bg-soft">
              Refresh
            </button>
            <button onClick={() => onSignOut()} className="rounded-xl border border-line bg-solid px-3.5 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/10">
              Log out
            </button>
          </div>
        </div>

        {notice && (
          <p className={`mb-4 rounded-xl px-3 py-2 text-sm ${
            notice.type === "ok" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
          }`} dangerouslySetInnerHTML={{ __html: notice.text }} />
        )}

        {loading && (
          <div className="rounded-xl border border-line bg-card p-6 text-center text-sm text-mute">Loading students…</div>
        )}

        {!loading && students.length === 0 && (
          <div className="rounded-xl border border-line bg-card p-6 text-center text-sm text-mute">
            No students yet. Create your first account below.
          </div>
        )}

        {!loading && students.length > 0 && (
          <div className="space-y-2">
            {students.map(s => (
              <StudentCard
                key={s.rollNo}
                student={s}
                onReset={() => handleReset(s.rollNo)}
                onForceChange={(flag) => handleForceChange(s.rollNo, flag)}
                busy={resetBusy.has(s.rollNo)}
              />
            ))}
          </div>
        )}

        {showCreate && (
          <CreateStudentForm onDone={handleCreate} onCancel={() => setShowCreate(false)} className="mt-4" />
        )}
      </div>
    </div>
  );
}
