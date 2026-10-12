"use client";
import { AUTH } from "@/lib/auth/config";
import { useAuth } from "@/lib/auth/AuthContext";
import { validateSignUp } from "@/lib/auth/validate";
import Field from "./Field";
import SubmitButton from "./SubmitButton";
import { useAuthForm } from "./useAuthForm";

export default function SignupForm({ onDone, switchTo }) {
  const { signUp } = useAuth();
  const f = useAuthForm({
    initial: { name: "", rollNo: "", email: "", password: "", confirm: "" },
    validate: validateSignUp,
    submit: async v => { await signUp(v); onDone(); },
  });
  return (
    <form onSubmit={f.onSubmit} noValidate className="grid gap-3.5">
      {f.formError && <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{f.formError}</p>}
      <Field label="Full name" autoComplete="name" autoFocus value={f.values.name} onChange={f.set("name")} error={f.errors.name} />
      {AUTH.rollNo !== "hidden" && (
        <Field label="Roll number" optional={AUTH.rollNo === "optional"} autoComplete="off" value={f.values.rollNo} onChange={f.set("rollNo")} error={f.errors.rollNo} />
      )}
      <Field label="Email" type="email" autoComplete="email" value={f.values.email} onChange={f.set("email")} error={f.errors.email}
        hint={AUTH.emailDomain ? `Must be your @${AUTH.emailDomain} address.` : undefined} />
      <Field label="Password" type="password" autoComplete="new-password" value={f.values.password} onChange={f.set("password")} error={f.errors.password}
        hint={`At least ${AUTH.passwordMinLength} characters, with a letter and a number.`} />
      <Field label="Confirm password" type="password" autoComplete="new-password" value={f.values.confirm} onChange={f.set("confirm")} error={f.errors.confirm} />
      <SubmitButton busy={f.busy}>Create account</SubmitButton>
      <p className="text-center text-sm text-mute">Already have an account? <button type="button" onClick={() => switchTo("login")} className="font-semibold text-accent hover:underline">Log in</button></p>
    </form>
  );
}
