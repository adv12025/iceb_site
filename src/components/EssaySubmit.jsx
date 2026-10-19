"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

/* Student essay submission: write a ~500-word essay, submit it,
   it's stored tagged with the student's account id so the teacher
   can review all submissions segregated by student.
   Also shows the student's own submitted essays (privacy: only theirs). */
export default function EssaySubmit() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [myEssays, setMyEssays] = useState([]);

  const API = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5173";
  const WORD_LIMIT = 500;

  /* Fetch this student's own essays (server-side filtered by user id). */
  useEffect(() => {
    if (!user) return;
    fetch(API + "/api/essay", { headers: { "X-User-Id": user.id } })
      .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); })
      .then(j => setMyEssays(j.essays || []))
      .catch(() => {}); // non-fatal: form still works
  }, [user, API]);

  const words = body.trim() ? body.trim().split(/\s+/).filter(w => w.length > 0).length : 0;

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!title || !body) { setMsg("Title and essay text are required."); return; }
    if (words > WORD_LIMIT) { setMsg(`Essay is ${words} words — max ${WORD_LIMIT}.`); return; }

    setBusy(true);
    try {
      const r = await fetch(API + "/api/essay", {
        method: "POST",
        headers: { "X-User-Id": user.id, "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, studentName: user.name, studentRoll: user.rollNo, wordLimit: WORD_LIMIT }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Submission failed");
      setMsg("Essay submitted successfully.");
      setTitle("");
      setBody("");
      setMyEssays(prev => [...prev, j]); // optimistic add
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  const msgClass = msg ? (msg.startsWith("Essay submitted") ? "text-emerald-400" : "text-rose-400") : "text-mute";
  const overLimit = words > WORD_LIMIT;

  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Submit Essay</h3>
          <p className="text-sm text-mute">Write your essay ({WORD_LIMIT} words max). It will be collected and shown to your teacher.</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-mute mb-1">Essay Title</label>
          <input
            className="w-full rounded-xl border border-line bg-field px-3 py-2.5 text-ink outline-none focus:border-sky-500"
            name="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. The Impact of Climate Change" required />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-mute">Essay Text</label>
            <span className={`text-xs font-bold ${overLimit ? "text-rose-400" : "text-mute"}`}>{words} / {WORD_LIMIT} words</span>
          </div>
          <textarea
            className="w-full rounded-xl border border-line bg-field px-3 py-2.5 text-ink outline-none focus:border-sky-500"
            name="body" value={body} onChange={e => setBody(e.target.value)} rows={8}
            placeholder="Write your essay here..." required />
        </div>

        {msg && <p className={"text-sm " + msgClass}>{msg}</p>}

        <button className="rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 px-4 py-2 font-bold text-white" disabled={busy || !title || !body || overLimit}>
          {busy ? "Submitting…" : "Submit Essay to Teacher"}
        </button>
      </form>

      {/* Student's own submitted essays */}
      {myEssays.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-mute">Your Submitted Essays</h3>
          <div className="grid gap-2">
            {myEssays.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5 bg-card">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <b className="text-sm text-ink truncate">{e.title}</b>
                    <span className="text-xs text-mute">{e.assignment}</span>
                    <span className="text-xs text-mute">{e.date}</span>
                    <span className={`ml-auto text-xs font-bold rounded-full px-2 py-0.5 ${
                      e.wordCount > 450 ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" :
                      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    }`}>
                      {e.wordCount} words
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-mute line-clamp-1 truncate" title={e.body}>{e.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
