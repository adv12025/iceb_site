import { href, cx } from "../ui";
import { shortTitle } from "./kinds";

/* One file row. No url = placeholder slot, shown dimmed as "soon". */
export default function ItemLink({ item, subject }) {
  return (
    <a href={href(item.url)} target="_blank" rel="noopener"
      className={cx("flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5 transition hover:border-accent", !item.url && "pointer-events-none opacity-45")}>
      <span className="flex-1 truncate" title={item.title}>{shortTitle(item.title, subject)}</span>
      <span className="text-sm text-mute">{item.url ? "↗" : "soon"}</span>
    </a>
  );
}
