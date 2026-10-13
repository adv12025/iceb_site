import { LIVE } from "./auth/config";

/* SERVER SIDE of attendance: reads and writes the signed-in student's own rows in Supabase
   (tables attendance_marks and attendance_settings; the database rules let a student touch only their own rows).
   Every function throws on failure, the caller (useAttendance) decides what to show. */
export const REMOTE = LIVE;

const db = async () => (await import("./auth/supabaseClient")).supabase;
const PAGE = 1000;     // Supabase returns at most 1000 rows per request
const BATCH = 500;

const must = ({ error, data }) => { if (error) throw new Error(error.message); return data; };

export async function loadRemote() {
  const sb = await db();
  const marks = {};
  for (let from = 0; ; from += PAGE) {
    const rows = must(await sb.from("attendance_marks").select("session_id,status").order("session_id").range(from, from + PAGE - 1));
    rows.forEach(r => { marks[r.session_id] = r.status; });
    if (rows.length < PAGE) break;
  }
  const s = must(await sb.from("attendance_settings").select("threshold").maybeSingle());
  return { marks, threshold: s?.threshold ?? null };
}

/* Sends only what differs between `from` (what the server has) and `to` (what the screen has). */
export async function saveMarksDiff(userId, from, to) {
  const sb = await db();
  const up = Object.keys(to).filter(k => from[k] !== to[k]).map(k => ({ user_id: userId, session_id: k, status: to[k], updated_at: new Date().toISOString() }));
  const del = Object.keys(from).filter(k => !(k in to));
  for (let i = 0; i < up.length; i += BATCH) must(await sb.from("attendance_marks").upsert(up.slice(i, i + BATCH), { onConflict: "user_id,session_id" }));
  for (let i = 0; i < del.length; i += BATCH) must(await sb.from("attendance_marks").delete().in("session_id", del.slice(i, i + BATCH)));
}

export async function saveThreshold(userId, threshold) {
  const sb = await db();
  must(await sb.from("attendance_settings").upsert({ user_id: userId, threshold, updated_at: new Date().toISOString() }, { onConflict: "user_id" }));
}
