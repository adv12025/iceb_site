"use client";
import { SITE } from "@/data/site";
import { NAV } from "./nav";

/* Sticky top bar: logo, section links, dark-mode button. `active` = section currently on screen. */
export default function Header({ active }) {
  const toggleTheme = () => {
    const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    localStorage.setItem("theme", t);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-card backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1080px] items-center gap-4 px-5 py-3">
        <a href="#home" className="flex items-center gap-2 font-bold">
          <span className="rounded-lg bg-gradient-to-br from-sky-600 to-cyan-500 px-2 py-1 text-xs text-white">ICE</span>{SITE.title}
        </a>
        <nav className="ml-auto hidden gap-1 sm:flex" aria-label="Sections">
          {NAV.map(([id, label]) => (
            <a key={id} href={"#" + id} className={"rounded-full px-3 py-1.5 text-sm font-semibold transition hover:bg-soft " + (active === id ? "bg-soft text-accent" : "text-mute")}>{label}</a>
          ))}
        </nav>
        <button onClick={toggleTheme} aria-label="Toggle dark mode" title="Toggle theme" className="ml-auto grid size-9 place-items-center rounded-full border border-line bg-solid sm:ml-0">
          <span className="dark:hidden">🌙</span><span className="hidden dark:inline">☀️</span>
        </button>
      </div>
    </header>
  );
}
