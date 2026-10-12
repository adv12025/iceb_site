"use client";
import { useState } from "react";
import { AuthError } from "@/lib/auth/errors";

/* Shared form behaviour for all three auth forms, so each form file only describes its fields.

     const f = useAuthForm({ initial, validate, submit });
     f.values / f.set("email") (onChange handler) / f.errors / f.busy / f.formError / f.onSubmit

   - validate(values) -> { field: "message" }   (lib/auth/validate.js)
   - submit(values)   -> may throw AuthError; if it names a field the message appears under that input,
                         otherwise it appears at the top of the form. */
export function useAuthForm({ initial, validate, submit }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const set = name => e => {
    setValues(v => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors(x => ({ ...x, [name]: "" }));
  };

  const onSubmit = async e => {
    e.preventDefault();
    if (busy) return;
    const errs = validate(values);
    setErrors(errs);
    setFormError("");
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await submit(values);
    } catch (err) {
      if (err instanceof AuthError && err.field) setErrors({ [err.field]: err.message });
      else setFormError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return { values, set, errors, busy, formError, onSubmit };
}
