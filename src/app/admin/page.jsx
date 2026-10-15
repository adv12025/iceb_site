"use client";
import { useAuth } from "@/lib/auth/AuthContext";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminDashboard from "@/components/admin/AdminDashboard";

/* Admin panel: /admin. Only a class rep (role "cr") may open it.
   Not logged in → login form.  Logged in but not CR → access denied.  CR → dashboard. */
export default function AdminPage() {
  const { user, status, isCR, signOut } = useAuth();

  /* While the initial session check is in flight and we have no user yet, show the login form. */
  if (status === "loading" && !user) {
    return <AdminLogin />;
  }

  if (!user) return <AdminLogin />;

  if (!isCR) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-solid px-4">
        <div className="rounded-2xl border border-line bg-card p-6 sm:p-8 w-full max-w-md shadow-card text-center">
          <h2 className="text-lg font-bold text-ink mb-2">Admin panel — class rep only</h2>
          <p className="text-mute text-sm mb-4">
            You are logged in as <b>{user.rollNo}</b>, but this account is not a class rep.
          </p>
          <button onClick={() => signOut()} className="rounded-xl border border-line bg-solid px-4 py-2 text-sm font-semibold text-accent hover:bg-soft">
            Log out
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboard user={user} onSignOut={signOut} />;
}
