"use client";
import { useState } from "react";
import { SITE } from "@/data/site";
import { AUTH } from "@/lib/auth/config";
import { useAuth } from "@/lib/auth/AuthContext";
import { validateReset } from "@/lib/auth/validate";
import Field from "./Field";
import SubmitButton from "./SubmitButton";
import { useAuthForm } from "./useAuthForm";

/* Two modes, chosen by AUTH.resetMode:
   "contact": there are no self-service resets; the CR issues a new temporary password (shown as an instruction).
   "email":   asks the backend to email a reset link (needs a real backend). */
export default function ForgotForm({ switchTo }) {
  const back = <button type="button" onClick={() => switchTo("login")} className="justify-self-center text-sm font-semibold text-accent hover:underline">← Back to log in</button>;

  if (AUTH.resetMode === "contact")
    return (
      <div className="grid gap-4">
        <p className="text-sm">Passwords are reset by your <b>CR</b>. Message them your <b>roll number</b>; they will send you a new temporary password, and you will choose your own again when you log in.</p>
        {SITE.whatsapp && <a href={SITE.whatsapp} target="_blank" rel="noopener" className="justify-self-start rounded-xl border border-line bg-card px-3.5 py-2 text-sm font-semibold hover:border-accent">Open the class WhatsApp group</a>}
        {back}
      </div>
    );
  return <EmailReset back={back} />;
}

function EmailReset({ back }) {
  const { resetPassword } = useAuth();
  const [done, setDone] = useState(null);
  const f = useAuthForm({ initial: { email: "" }, validate: validateReset, submit: async v => setDone(await resetPassword(v)) });

  if (done)
    return (
      <div className="grid gap-4">
        <p className="rounded-xl bg-emerald-500/10 px-3 py-3 text-sm text-emerald-400">
          {done.demo ? "Demo mode: no email is sent (there is no server yet)." : "If an account exists for that email, a reset link is on its way."}
        </p>
        {back}
      </div>
    );
  return (
    <form onSubmit={f.onSubmit} noValidate className="grid gap-3.5">
      {f.formError && <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{f.formError}</p>}
      <Field label="Email" type="email" autoComplete="email" autoFocus value={f.values.email} onChange={f.set("email")} error={f.errors.email} />
      <SubmitButton busy={f.busy}>Send reset link</SubmitButton>
      {back}
    </form>
  );
}
