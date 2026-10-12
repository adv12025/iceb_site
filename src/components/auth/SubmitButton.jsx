/* The big gradient submit button used by every auth form. Shows "Please wait…" while busy. */
export default function SubmitButton({ busy, children }) {
  return (
    <button type="submit" disabled={busy}
      className="rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 px-4 py-2.5 font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70">
      {busy ? "Please wait…" : children}
    </button>
  );
}
