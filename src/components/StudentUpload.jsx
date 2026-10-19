"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { cx, href } from "./ui";
import { shortTitle } from "./notes/kinds";

/* Student file upload: logged-in students drop a PPT/PDF (or paste a link),
   it lands under files/uploads/<userId>/ and is tagged with uploadedBy
   so it auto-segregates by account. Posts to the admin API.
   Also lists the account's own uploads (privacy: never anyone else's). */
export default function StudentUpload({ sems, subs, myUploads = [] }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [hot, setHot] = useState(false);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef(null);

  const API = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:5173";

  const pick = f => {
    setFile(f || null);
    const t = document.querySelector("#f-upload [name=title]");
    if (f && t && !t.value) t.value = f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  };

  /* Re-fetch own uploads after a successful upload so the list stays current */
  useEffect(() => {
    if (!msg?.startsWith("Uploaded")) return;
    // next render will pick up new items via parent re-render
  }, [msg]);

  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (file) fd.set("file", file);
    setMsg(null);
    setBusy(true);
    try {
      const r = await fetch(API + "/api/upload", {
        method: "POST",
        headers: { "X-User-Id": user.id },
        body: fd,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Upload failed");
      setMsg("Uploaded: " + (j.out || j.title || "done"));
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      form.reset();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  const msgClass = msg ? (msg.startsWith("Uploaded") ? "text-emerald-400" : "text-rose-400") : "text-mute";

  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-card backdrop-blur">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent uppercase">My uploads</span>
        <span className="text-sm text-mute">Files you upload are kept under your account only.</span>
      </div>

      <form id="f-upload" onSubmit={submit} className="mb-6">
        <div
          onClick={() => fileInput.current?.click()}
          onDragOver={e => { e.preventDefault(); setHot(true); }}
          onDragLeave={() => setHot(false)}
          onDrop={e => { e.preventDefault(); setHot(false); pick(e.dataTransfer.files[0]); }}
          className={"cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition " + (hot ? "border-cyan-400 bg-cyan-400/10" : "border-line text-mute hover:border-cyan-400")}>
          {file ? <>📄 <b className="text-ink">{file.name}</b> ({(file.size / 1048576).toFixed(1)} MB)</> : <>📎 <b className="text-ink">Drop a PPT / PDF here</b> or click to choose (max 100 MB)</>}
        </div>
        <input ref={fileInput} type="file" hidden onChange={e => pick(e.target.files[0])} />
        <div className="grid gap-3 sm:grid-cols-2 mt-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-mute mb-1">Semester</label>
            <input className="w-full rounded-xl border border-line bg-field px-3 py-2.5 text-ink outline-none focus:border-sky-500" name="semester" list="dl-sem" defaultValue="Semester 1" required />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-mute mb-1">Subject</label>
            <input className="w-full rounded-xl border border-line bg-field px-3 py-2.5 text-ink outline-none focus:border-sky-500" name="subject" list="dl-sub" placeholder="Choose or type" required />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 mt-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-mute mb-1">Type</label>
            <select className="w-full rounded-xl border border-line bg-field px-3 py-2.5 text-ink outline-none focus:border-sky-500" name="type">
              <option>notes</option>
              <option>slides</option>
              <option>pyq</option>
              <option>assignment</option>
              <option>lab</option>
              <option>other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-mute mb-1">Title</label>
            <input className="w-full rounded-xl border border-line bg-field px-3 py-2.5 text-ink outline-none focus:border-sky-500" name="title" placeholder="Unit 1 – Matrices" required />
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-mute mb-1">…or paste a link instead (Drive etc.)</label>
          <input className="w-full rounded-xl border border-line bg-field px-3 py-2.5 text-ink outline-none focus:border-sky-500" name="url" placeholder="https://" />
        </div>
        {msg && <p className={"mt-2 text-sm " + msgClass}>{msg}</p>}
        <button className="rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 px-4 py-2 font-bold text-white" disabled={busy}>
          {busy ? "Uploading…" : "Upload to my account"}
        </button>
      </form>

      {/* Your own uploaded files — private to this account */}
      <div>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-mute">Your files ({myUploads.length})</h3>
        {myUploads.length === 0 ? (
          <p className="text-mute text-sm">No uploads yet. Drop a file above.</p>
        ) : (
          <div className="grid gap-2">
            {myUploads.map(i => (
              <a key={i.id} href={href(i.url)} target="_blank" rel="noopener">
                <div className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 bg-card hover:border-accent transition">
                  <span className="text-lg">📎</span>
                  <span className="flex-1 truncate text-sm text-ink" title={i.title}>{shortTitle(i.title, i.subject || "")}</span>
                  <span className="text-xs text-mute">{i.semester}</span>
                  <span className="text-sm text-mute">{i.url ? "↗" : "soon"}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
