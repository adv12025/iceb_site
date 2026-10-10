import { SITE } from "@/data/site";

/* Big title + the search box. */
export default function Hero({ q, setQ, search }) {
  return (
    <section id="home" className="mx-auto max-w-[1080px] px-5 pb-6 pt-16">
      <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-sm font-semibold text-mute">
        <span className="size-2 rounded-full bg-emerald-400" />{SITE.batch}
      </p>
      <h1 className="bg-gradient-to-br from-sky-600 to-cyan-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">{SITE.title}</h1>
      <p className="mt-3 max-w-xl text-lg text-mute">{SITE.subtitle}</p>
      <label className="relative mt-7 block max-w-xl">
        <input ref={search} value={q} onChange={e => setQ(e.target.value)} type="search" autoComplete="off"
          placeholder="Search announcements, notes, links…"
          className="w-full rounded-2xl border border-line bg-card py-3.5 pl-5 pr-12 shadow-card outline-none backdrop-blur focus:border-accent focus:ring-4 focus:ring-accent/20" />
        <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-md border border-b-2 border-line bg-solid px-2 text-xs font-semibold text-mute">/</kbd>
      </label>
    </section>
  );
}
