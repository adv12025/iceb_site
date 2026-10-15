"use client";
import { useId, useState } from "react";
import { cx } from "../ui";

/* One labelled input with an error line. type="password" gets a show/hide button automatically. */
export default function Field({ label, error, hint, type = "text", optional, ...input }) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPw = type === "password";
  return (
    <div>
      <label htmlFor={id} className="mb-1 flex items-baseline justify-between text-sm font-semibold">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-mute">optional</span>}
      </label>
      <div className="relative">
        <input id={id} type={isPw && shown ? "text" : type} aria-invalid={!!error} aria-describedby={error || hint ? id + "-m" : undefined}
          className={cx("w-full rounded-xl border bg-card px-3.5 py-2.5 outline-none transition focus:ring-4 focus:ring-accent/20",
            error ? "border-rose-500 focus:border-rose-500" : "border-line focus:border-accent", isPw && "pr-14")}
          {...input} />
        {isPw && (
          <button type="button" onClick={() => setShown(s => !s)} aria-pressed={shown} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-md bg-card border border-line px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-soft transition focus:outline-none">
            {shown ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {(error || hint) && <p id={id + "-m"} className={cx("mt-1 text-xs", error ? "text-rose-400" : "text-mute")}>{error || hint}</p>}
    </div>
  );
}
