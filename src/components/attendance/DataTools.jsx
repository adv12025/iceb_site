import { useRef, useState } from "react";

/* Backup / restore / reset / change the attendance limit. Keeps demo data safe until login exists. */
export default function DataTools({ att }) {
  const file = useRef(null);
  const [msg, setMsg] = useState("");
  const say = t => { setMsg(t); setTimeout(() => setMsg(""), 4000); };

  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([att.exportJSON()], { type: "application/json" }));
    a.download = "iceb-attendance-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
    say("Backup downloaded.");
  };
  const restore = async e => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try { att.importJSON(await f.text()); say("Backup restored."); } catch (err) { say("Could not restore: " + err.message); }
  };
  const btn = "rounded-xl border border-line bg-solid px-3.5 py-2 text-sm font-semibold transition hover:border-accent";

  return (
    <div className="flex flex-wrap items-center gap-3 self-start rounded-2xl border border-line bg-card p-4 shadow-card backdrop-blur">
      <b className="mr-1">Backup</b>
      <button onClick={download} className={btn}>Download</button>
      <button onClick={() => file.current?.click()} className={btn}>Restore</button>
      <input ref={file} type="file" accept="application/json,.json" onChange={restore} hidden />
      <button onClick={() => confirm("Erase ALL your attendance marks? This also clears them from your account.") && att.reset()} className={btn + " text-rose-400"}>Erase all</button>
      <label className="ml-auto flex items-center gap-2 text-sm text-mute">
        Attendance limit
        <select value={att.threshold} onChange={e => att.setThreshold(+e.target.value)} className="rounded-lg border border-line bg-solid px-2 py-1 text-ink">
          {[65, 70, 75, 80, 85].map(n => <option key={n} value={n}>{n}%</option>)}
        </select>
      </label>
      {msg && <span className="w-full text-sm text-accent">{msg}</span>}
    </div>
  );
}
