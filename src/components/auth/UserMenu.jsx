"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

const initials = name => (name || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

/* Top-bar account control: "Log in" when signed out, an avatar with a small menu when signed in. */
export default function UserMenu({ onOpenTracker }) {
  const { user, status, openAuth, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const away = e => !box.current?.contains(e.target) && setOpen(false);
    const esc = e => e.key === "Escape" && setOpen(false);
    addEventListener("mousedown", away);
    addEventListener("keydown", esc);
    return () => { removeEventListener("mousedown", away); removeEventListener("keydown", esc); };
  }, [open]);

  if (status === "loading") return <span className="size-9 animate-pulse rounded-full bg-soft" aria-hidden />;

  if (!user)
    return (
      <button onClick={() => openAuth("login")} className="whitespace-nowrap rounded-full border border-line bg-solid px-3.5 py-1.5 text-sm font-semibold transition hover:border-accent">
        Log in
      </button>
    );

  const item = "block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:bg-soft";
  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu" title={user.name}
        className="grid size-9 place-items-center rounded-full bg-soft text-sm font-bold text-accent ring-1 ring-line transition hover:ring-accent">
        {initials(user.name)}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-30 w-60 rounded-2xl border border-line bg-solid p-2 shadow-card">
          <div className="border-b border-line px-3 pb-2 pt-1">
            <b className="block truncate">{user.name}</b>
            <small className="block text-mute">Roll no. {user.rollNo}</small>
            {user.email && <small className="block truncate text-mute">{user.email}</small>}
          </div>
          <div className="pt-1">
            <button role="menuitem" className={item} onClick={() => { setOpen(false); onOpenTracker(); }}>My attendance</button>
            <button role="menuitem" className={item} onClick={() => { setOpen(false); openAuth("password"); }}>Change password</button>
            <button role="menuitem" className={item + " text-rose-400"} onClick={() => { setOpen(false); signOut(); }}>Log out</button>
          </div>
        </div>
      )}
    </div>
  );
}
