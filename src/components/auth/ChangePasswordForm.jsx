"use client";
import { AUTH } from "@/lib/auth/config";
import { useAuth } from "@/lib/auth/AuthContext";
import { validateChangePassword } from "@/lib/auth/validate";
import Field from "./Field";
import SubmitButton from "./SubmitButton";
import { useAuthForm } from "./useAuthForm";

/* Used twice: (1) forced right after the first login with the CR's password, (2) voluntarily from the avatar menu.
   `forced` only changes the wording and offers "Log out instead" in place of "Cancel". */
export default function ChangePasswordForm({ forced, onDone, onCancel }) {
  const { changePassword } = useAuth();
  const f = useAuthForm({
    initial: { current: "", next: "", confirm: "" },
    validate: validateChangePassword,
    submit: async v => { await changePassword(v); onDone(); },
  });
  return (
    <form onSubmit={f.onSubmit} noValidate className="grid gap-3.5">
      {forced && <p className="rounded-xl bg-sky-400/10 px-3 py-2 text-sm">For your security, choose your own password now. The one your CR sent will stop working.</p>}
      {f.formError && <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{f.formError}</p>}
      <Field label={forced ? "Password your CR sent" : "Current password"} type="password" autoComplete="current-password" autoFocus
        value={f.values.current} onChange={f.set("current")} error={f.errors.current} />
      <Field label="New password" type="password" autoComplete="new-password" value={f.values.next} onChange={f.set("next")} error={f.errors.next}
        hint={`At least ${AUTH.passwordMinLength} characters, with a letter and a number.`} />
      <Field label="Confirm new password" type="password" autoComplete="new-password" value={f.values.confirm} onChange={f.set("confirm")} error={f.errors.confirm} />
      <SubmitButton busy={f.busy}>Save password</SubmitButton>
      <button type="button" onClick={onCancel} className="justify-self-center text-sm font-semibold text-accent hover:underline">{forced ? "Log out instead" : "Cancel"}</button>
    </form>
  );
}
