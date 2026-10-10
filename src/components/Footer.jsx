import { SITE } from "@/data/site";

/* Footer: shown only if a contact or WhatsApp link is set in data/site.js. */
export default function Footer() {
  if (!SITE.contact && !SITE.whatsapp) return null;
  return (
    <footer className="mx-auto flex max-w-[1080px] items-center justify-between px-5 py-10 text-sm text-mute">
      <span>{SITE.contact}</span>
      {SITE.whatsapp && <a className="font-semibold text-accent" href={SITE.whatsapp} target="_blank" rel="noopener">Join class group ↗</a>}
    </footer>
  );
}
