"use client";
import { useState } from "react";
import { AUTH } from "@/lib/auth/config";

/* One student row: roll number, name, status badges, reset password button, force-change toggle. */
export default function StudentCard({ student, onReset, onForceChange, busy }) {
  const [showTemp, setShowTemp] = useState(null);  // temp password string while revealing
  const mustChange = student.mustChangePassword;

  return (
    <div className="rounded-xl border border-line bg-card p-3.5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink">{student.rollNo}</span>
            {mustChange && (
              <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-xs font-semibold text-amber-600">
                Must change password
              </span>
            )}
            {!mustChange && (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                Own password
              </span>
            )}
          </div>
          <p className="text-sm text-mute mt-1">{student.name || "—"}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button onClick={() => onReset()} disabled={busy}
            className={`w-full sm:w-auto rounded-xl border border-line px-3 py-2 text-sm font-semibold transition ${
              busy
                ? "bg-soft text-mute cursor-not-allowed"
                : "bg-solid text-accent hover:bg-accent/10"
            }`}>
            {busy ? "Resetting…" : "Reset password"}
          </button>
          <button onClick={() => onForceChange(!mustChange)}
            className={`w-full sm:w-auto rounded-xl border border-line px-3 py-2 text-sm font-semibold transition bg-solid text-accent hover:bg-accent/10`}>
            {mustChange ? "Clear forced change" : "Force change next login"}
          </button>
        </div>
      </div>

      {showTemp && (
        <div className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
          <p className="text-xs text-emerald-700 mb-2">New temporary password — send this to the student privately:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-bold text-emerald-700 bg-emerald-500/30 rounded-lg px-2 py-1 break-all">{showTemp}</code>
            <button onClick={() => navigator.clipboard.writeText(showTemp).then(() => setShowTemp(null))}
              className="rounded-lg border border-emerald-400/30 bg-solid px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/30">
              Copy
            </button>
          </div>
          <p className="text-xs text-emerald-600 mt-1">They must choose their own password on next login.</p>
        </div>
      )}

      {/* We expose the temp password via the notice in AdminDashboard after reset, so this stays as a reveal UI hook */}
    </div>
  );
}
