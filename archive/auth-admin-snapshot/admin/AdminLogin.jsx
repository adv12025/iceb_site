"use client";
import { useAuth } from "@/lib/auth/AuthContext";
import { validateLogIn } from "@/lib/auth/validate";
import { useAuthForm } from "@/components/auth/useAuthForm";
import Field from "@/components/auth/Field";
import SubmitButton from "@/components/auth/SubmitButton";

/* Login screen for the admin panel. Only class rep accounts can proceed. */
export default function AdminLogin({ onLogin }) {
  const { signIn } = useAuth();
  const f = useAuthForm({
    initial: { rollNo: "", password: "" },
    validate: validateLogIn,
    submit: async v => { await signIn(v); onLogin?.(); },
  });
  return (
    <div className="min-h-screen flex items-center justify-center bg-solid px-4">
      <div className="rounded-3xl border border-line bg-solid p-6 sm:p-8 w-full max-w-md shadow-card">
        <h2 className="text-2xl font-extrabold text-ink mb-2">Admin panel</h2>
        <p className="text-mute text-sm mb-6">Class rep login — your roll number and the password you were given.</p>
        <form onSubmit={f.onSubmit} noValidate className="grid gap-3.5">
          {f.formError && <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{f.formError}</p>}
          <Field label="Roll number" autoComplete="username" autoCapitalize="characters" spellCheck={false} autoFocus
            value={f.values.rollNo} onChange={f.set("rollNo")} error={f.errors.rollNo} />
          <Field label="Password" type="password" autoComplete="current-password"
            value={f.values.password} onChange={f.set("password")} error={f.errors.password} />
          <SubmitButton busy={f.busy}>Log in</SubmitButton>
        </form>
        <p className="mt-4 text-xs text-mute text-center">Only class rep accounts can open the admin panel.</p>
      </div>
    </div>
  );
}
