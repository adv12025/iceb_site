"use client";
import { useState } from "react";
import { SITE } from "@/data/site";
import { AUTH } from "@/lib/auth/config";
import { useAuth } from "@/lib/auth/AuthContext";
import { checkRollNo, validateReset } from "@/lib/auth/validate";
import Field from "./Field";
import SubmitButton from "./SubmitButton";
import { useAuthForm } from "./useAuthForm";

/* Forgot password. This project does not email reset links: accounts use <roll>@iceb.local, which is not a real inbox.
   The student tells their CR the roll number; the CR issues a new temporary password
   (backend/scripts/create-students.mjs --reset) and the student chooses their own again at next login.
   
   Two modes, chosen by AUTH.resetMode:
   "contact": student enters their roll number and gets a pre-filled message to send the CR.
   "email":   asks the backend to email a reset link (needs a real backend). */
export default function ForgotForm({ switchTo }) {
  const back = <button type="button" onClick={() => switchTo("login")} className="justify-self-center text-sm font-semibold text-accent hover:underline">← Back to log in</button>;

  if (AUTH.resetMode === "email")
    return <EmailReset back={back} />;

  return <ContactReset back={back} />;
}

/* Contact the CR: pre-fill a message with the student's roll number. */
function ContactReset({ back }) {
  const [values, setValues] = useState({ rollNo: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const set = name => e => {
    setValues(v => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors(x => ({ ...x, [name]: "" }));
  };

  const roll = values.rollNo.trim();
  const rollError = checkRollNo(roll);
  const message = `Please reset my password.\nRoll number: ${roll}`;

  const whatsappUrl = SITE.whatsapp
    ? SITE.whatsapp + (SITE.whatsapp.includes("?") ? "&" : "?") + "text=" + encodeURIComponent(message)
    : null;

  async function request() {
    setErrors({});
    setFormError("");
    if (rollError) { setErrors({ rollNo: rollError }); return; }
    setBusy(true);
    try {
      if (whatsappUrl) {
        const win = window.open(whatsappUrl, "_blank");
        if (!win) setFormError("Could not open WhatsApp. Copy the message below instead.");
      }
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  if (sent)
    return (
      <div className="grid gap-4">
        <p className="text-sm">Send the message below to your <b>CR</b>. They will issue a new temporary password; when you log in with it you will be asked to choose your own again.</p>
        <div className="rounded-xl border border-line bg-card p-3 text-sm whitespace-pre-wrap break-words">{message}</div>
        <div className="flex flex-col sm:flex-row gap-2">
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener" className="rounded-xl border border-line bg-card px-3.5 py-2 text-sm font-semibold text-center hover:bg-accent/10">
              Send via WhatsApp
            </a>
          )}
          <button type="button" onClick={() => navigator.clipboard.writeText(message).then(() => setFormError("Message copied")).catch(() => {})}
            className="rounded-xl border border-line bg-card px-3.5 py-2 text-sm font-semibold text-center hover:bg-accent/10">
            Copy message
          </button>
        </div>
        {back}
      </div>
    );

  return (
    <form onSubmit={e => { e.preventDefault(); request(); }} noValidate className="grid gap-3.5">
      {formError && <p role="alert" className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{formError}</p>}
      <Field label="Your roll number" autoCapitalize="characters" spellCheck={false} autoFocus
        value={values.rollNo} onChange={set("rollNo")} error={errors.rollNo || rollError}
        hint="The same roll number you use to log in." />
      <SubmitButton busy={busy}>Request reset</SubmitButton>
      {back}
    </form>
  );
}

/* Only used when AUTH.resetMode is "email". A static site cannot send email; a real provider asks the backend to. */
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
