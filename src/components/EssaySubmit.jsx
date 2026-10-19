"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { cx, href } from "./ui";

/* Student essay submission: upload an essay file (PDF/DOC/etc).
   Stored under files/uploads/essays/<userId>/ and tagged with the
   student's account id so the teacher can review all submissions
   segregated by student. Also shows the student's own uploaded essays. */
export default function EssaySubmit() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [myEssays, setMyEssays] = useState([]);
  const fileInput = useRef(null);

  const API = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5173";
  const MAX_MB = 100;

  useEffect(() => {
    if (!user) return;
    fetch(API + "/api/essay", { headers: { "X-User-Id": user.id } })
      .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); })
      .then(j => setMyEssays(j.essays || []))
      .catch(() => {});
  }, [user, API]);

  const pick = f => {
    setFile(f || null);
    const t = document.querySelector("#f-essay [name=title]");
    if (f && t && !t.value) t.value = f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  };

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (file) fd.set("file", file);
    setMsg(null);
    setBusy(true);
    try {
      const r = await fetch(API + "/api/essay", {
        method: "POST",
        headers: { "X-User-Id": user.id },
        body: fd,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Submission failed");
      setMsg("Essay submitted successfully.");
      setFile(null);
      setTitle("");
      if (fileInput.current) fileInput.current.value = "";
      setMyEssays(prev => [...prev, j]);
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  const msgClass = msg ? (msg.startsWith("Essay submitted") ? "text-emerald-400" : "text-rose-400") : "text-mute";
  const sizeMB = file ? (file.size / 1048576).toFixed(1) : 0;

  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Submit Essay</h3>
          <p className="text-sm text-mute">Upload your essay file (PDF / DOC / DOCX, max {MAX_MB} MB). It will be collected and shown to your teacher.</p>
        </div>
      </div>

      <form id="f-essay" onSubmit={submit} className="space-y-4">
        <div
          onClick={() => fileInput.current?.click()}
          onDragOver={e => { e.preventDefault(); }}
          onDrop={e => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
          className="cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition hover:border-cyan-400 hover:bg-cyan-400/5">
          {file ? <>📄 <b className="text-ink">{file.name}</b> ({sizeMB} MB)</> : <>📎 <b className="text-ink">Drop an essay file here</b> or click to choose</>}
        </div>
        <input ref={fileInput} type="file" hidden accept=".pdf,.doc,.docx,.txt" onChange={e => pick(e.target.files[0])} />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-mute mb-1">Essay Title</label>
          <input
            className="w-full rounded-xl border border-line bg-field px-3 py-2.5 text-ink outline-none focus:border-sky-500"
            name="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Climate Change Essay" required />
        </div>

        {msg && <p className={"text-sm " + msgClass}>{msg}</p>}

        <button className="rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 px-4 py-2 font-bold text-white" disabled={busy || !file || !title}>
          {busy ? "Uploading…" : "Upload Essay to Teacher"}
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
                    <span className="text-xs text-mute">{e.filename}</span>
                  </div>
                  <a
                    href={href(e.url)}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-accent hover:border-accent transition"
                    title={e.filename}>
                    ↳ Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
