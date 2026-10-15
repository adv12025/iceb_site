"use client";
import { useState } from "react";
import { AUTH } from "@/lib/auth/config";
import { checkRollNo, checkPassword } from "@/lib/auth/validate";
import Field from "@/components/auth/Field";
import SubmitButton from "@/components/auth/SubmitButton";

/* CR creates a new student account. */
export default function CreateStudentForm({ onDone, onCancel, className }) {
  const [values, setValues] = useState({ rollNo: "", password: "", name: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = name => e => {
    setValues(v => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors(x => ({ ...x, [name]: "" }));
  };

  const submit = async e => {
    e.preventDefault();
    setErrors({});
    setFormError("");

    const roll = values.rollNo.trim();
    const rollError = checkRollNo(roll);
    const pwError = checkPassword(values.password);
    if (rollError) { setErrors({ rollNo: rollError }); return; }
    if (pwError) { setErrors({ password: pwError }); return; }

    setBusy(true);
    try {
      await onDone(roll, values.password, values.name.trim());
    } catch (e) {
      setFormError(e.message || "Could not create account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className={`rounded-xl border border-line bg-card p-4 shadow-sm ${className || ""}`}>
      <h3 className="text-sm font-bold text-ink mb-3">Create new student account</h3>
      {formError && <p role="alert" className="mb-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{formError}</p>}
      <Field label="Roll number" autoCapitalize="characters" spellCheck={false} autoFocus
        value={values.rollNo} onChange={set("rollNo")} error={errors.rollNo}
        hint="6-12 letters/digits, e.g. 107125001" />
      <Field label="First password" type="password" autoComplete="new-password"
        value={values.password} onChange={set("password")} error={errors.password}
        hint={`At least ${AUTH.passwordMinLength} characters, with a letter and a number.`} />
      <Field label="Name (optional)" autoComplete="off"
        value={values.name} onChange={set("name")}
        hint="Shown in the admin panel and user menu. Not stored on a real server." />
      <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-line">
        <SubmitButton busy={busy}>Create account</SubmitButton>
        <button type="button" onClick={onCancel} className="rounded-xl border border-line bg-solid px-3.5 py-2 text-sm font-semibold text-accent hover:bg-soft">
          Cancel
        </button>
      </div>
    </form>
  );
}
