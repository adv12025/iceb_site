"use client";
import { AUTH } from "@/lib/auth/config";
import { useAuth } from "@/lib/auth/AuthContext";
import { validateLogIn } from "@/lib/auth/validate";
import Field from "./Field";
import SubmitButton from "./SubmitButton";
import { useAuthForm } from "./useAuthForm";

/* Username = roll number. The password is the one your CR sent you (you will be asked to change it). */
export default function LoginForm({ onDone, switchTo }) {
  const { signIn } = useAuth();
  const f = useAuthForm({
    initial: { rollNo: "", password: "" },
    validate: validateLogIn,
    submit: async v => { await signIn(v); onDone(); },
  });
  return (
    <form onSubmit={f.onSubmit} noValidate className="grid gap-3.5">
      {f.formError && <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{f.formError}</p>}
      <Field label="Roll number" autoComplete="username" autoCapitalize="characters" spellCheck={false} autoFocus
        value={f.values.rollNo} onChange={f.set("rollNo")} error={f.errors.rollNo} />
      <Field label="Password" type="password" autoComplete="current-password" value={f.values.password} onChange={f.set("password")} error={f.errors.password}
        hint={AUTH.forceChangeOnFirstLogin ? "First time? Use the password your CR sent you. You will then choose your own." : undefined} />
      <button type="button" onClick={() => switchTo("forgot")} className="justify-self-start text-sm font-semibold text-accent hover:underline">Forgot password?</button>
      <SubmitButton busy={f.busy}>Log in</SubmitButton>
      {AUTH.selfSignup && (
        <p className="text-center text-sm text-mute">New here? <button type="button" onClick={() => switchTo("signup")} className="font-semibold text-accent hover:underline">Create an account</button></p>
      )}
    </form>
  );
}
