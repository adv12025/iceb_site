import { cx } from "../ui";

/* Small building blocks shared by the schedule boxes. */
export const Card = ({ live, children }) => (
  <div className={cx("rounded-2xl border bg-card p-4 shadow-card backdrop-blur", live ? "border-emerald-400" : "border-line")}>{children}</div>
);
export const Label = ({ children }) => <small className="block text-xs font-bold uppercase tracking-wider text-mute">{children}</small>;
