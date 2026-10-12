import { AUTH } from "./config";

/* Form checks used by the auth forms.
   Each validateX returns an object of { fieldName: "message" }; an empty object means valid.
   These only catch typos for the user. A real backend MUST repeat the checks (never trust the browser). */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normEmail = e => (e || "").trim().toLowerCase();
/* roll numbers are compared in capitals, without spaces: " 107125001 " and "107125001" are the same person */
export const normRoll = r => (r || "").replace(/\s+/g, "").toUpperCase();

export function checkRollNo(roll) {
  return AUTH.rollNoPattern.test(normRoll(roll)) ? "" : "Enter your roll number (6-12 letters/digits).";
}

export function checkEmail(email) {
  const e = normEmail(email);
  if (!EMAIL.test(e)) return "Enter a valid email address.";
  if (AUTH.emailDomain && !e.endsWith("@" + AUTH.emailDomain)) return `Use your @${AUTH.emailDomain} email.`;
  return "";
}

export function checkPassword(pw) {
  if ((pw || "").length < AUTH.passwordMinLength) return `Use at least ${AUTH.passwordMinLength} characters.`;
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Include at least one letter and one number.";
  return "";
}

const clean = o => Object.fromEntries(Object.entries(o).filter(([, v]) => v));

/* main login: roll number + password */
export function validateLogIn({ rollNo, password }) {
  return clean({
    rollNo: checkRollNo(rollNo),
    password: password ? "" : "Enter your password.",
  });
}

/* first-login / voluntary password change */
export function validateChangePassword({ current, next, confirm }) {
  return clean({
    current: current ? "" : "Enter your current password.",
    next: checkPassword(next) || (next === current ? "Choose a different password from the current one." : ""),
    confirm: next !== confirm ? "Passwords do not match." : "",
  });
}

/* only used when AUTH.resetMode is "email" */
export function validateReset({ email }) {
  return clean({ email: checkEmail(email) });
}

/* only used when AUTH.selfSignup is true */
export function validateSignUp({ name, rollNo, email, password, confirm }) {
  return clean({
    name: (name || "").trim().length < 2 ? "Enter your name." : "",
    rollNo:
      AUTH.rollNo === "hidden" ? ""
      : !(rollNo || "").trim() ? (AUTH.rollNo === "required" ? "Enter your roll number." : "")
      : checkRollNo(rollNo),
    email: checkEmail(email),
    password: checkPassword(password),
    confirm: password !== confirm ? "Passwords do not match." : "",
  });
}
