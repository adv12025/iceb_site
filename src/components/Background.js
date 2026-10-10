/* The soft glowing blobs behind the page. */
export default function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <i className="absolute -right-[10vmax] -top-[22vmax] size-[48vmax] animate-drift rounded-full bg-accent opacity-35 blur-[90px]" />
      <i className="absolute -left-[16vmax] -top-[18vmax] size-[48vmax] animate-drift rounded-full bg-accent2 opacity-25 blur-[90px] [animation-delay:-7s]" />
    </div>
  );
}
