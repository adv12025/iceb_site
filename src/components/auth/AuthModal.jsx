"use client";
import { useEffect } from "react";
import { AUTH } from "@/lib/auth/config";
import { useAuth } from "@/lib/auth/AuthContext";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import ForgotForm from "./ForgotForm";
import ChangePasswordForm from "./ChangePasswordForm";

const TITLES = { login: "Log in", signup: "Create your account", forgot: "Forgot password?", password: "Choose your password" };

/* The login dialog. Open it from anywhere with useAuth().openAuth("login").
   FORCED mode: while the logged-in user still has the CR's first password (user.mustChangePassword) the dialog
   shows the change-password form and cannot be dismissed; the only way out is to change it or log out. */
export default function AuthModal() {
  const { user, dialog, openAuth, closeAuth, signOut } = useAuth();
  const forced = !!user?.mustChangePassword;
  const mode = forced ? "password" : dialog === "signup" && !AUTH.selfSignup ? "login" : dialog;

  useEffect(() => {
    if (!mode || forced) return;
    const onKey = e => e.key === "Escape" && closeAuth();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [mode, forced, closeAuth]);

  if (!mode) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/55 p-4 backdrop-blur-sm"
      onMouseDown={e => e.target === e.currentTarget && !forced && closeAuth()}>
      <div role="dialog" aria-modal="true" aria-label={TITLES[mode]} className="my-auto w-full max-w-md rounded-3xl border border-line bg-solid p-6 shadow-card">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold">{TITLES[mode]}</h2>
            <p className="text-sm text-mute">{forced ? `Hi ${user.name.split(" ")[0]}!` : "ICE B Hub"}</p>
          </div>
          {!forced && <button onClick={closeAuth} aria-label="Close" className="grid size-8 place-items-center rounded-full border border-line hover:border-accent">✕</button>}
        </div>

        {AUTH.demoMode && (
          <p className="mb-4 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs">
            <b className="text-amber-500">Demo.</b> Accounts are saved only in this browser, not on a server.
            {AUTH.demoSeed && mode === "login" && <> Try roll no. <b>DEMO0001</b> with password <b>Welcome-7421</b>.</>}
          </p>
        )}

        {/* key = mode, so switching starts a fresh form */}
        {mode === "login" && <LoginForm key="login" onDone={closeAuth} switchTo={openAuth} />}
        {mode === "signup" && <SignupForm key="signup" onDone={closeAuth} switchTo={openAuth} />}
        {mode === "forgot" && <ForgotForm key="forgot" switchTo={openAuth} />}
        {mode === "password" && (
          <ChangePasswordForm key="password" forced={forced} onDone={closeAuth} onCancel={forced ? signOut : closeAuth} />
        )}
      </div>
    </div>
  );
}
