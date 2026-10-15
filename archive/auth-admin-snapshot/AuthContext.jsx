"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "./provider";

/* App-wide login state. Wrap the app once (components/auth/AuthRoot.jsx), read it anywhere with useAuth():

     const { user, status, openAuth, signOut } = useAuth();
     status: "loading" (checking saved login) | "in" | "out"
     user:   { id, name, rollNo, email, role, createdAt, mustChangePassword } or null
     isCR:   true when the logged-in account is a class rep (role "cr")
     openAuth("login" | "signup" | "forgot" | "password")  opens the dialog;  closeAuth() closes it
     (if user.mustChangePassword is true the dialog is forced open on "password" and cannot be closed: see AuthModal)
*/
const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [dialog, setDialog] = useState(null);        // null | "login" | "signup" | "forgot" | "password"

  const apply = useCallback(u => { setUser(u); setStatus(u ? "in" : "out"); }, []);

  useEffect(() => {
    let alive = true;
    auth.getSession().then(u => alive && apply(u)).catch(() => alive && apply(null));
    const off = auth.onChange(u => alive && apply(u));
    return () => { alive = false; off?.(); };
  }, [apply]);

  const value = useMemo(() => ({
    user, status, dialog,
    /* true when the logged-in account is a class rep (role "cr") */
    isCR: user?.role === "cr",
    openAuth: (mode = "login") => setDialog(mode),
    closeAuth: () => setDialog(null),
    /* these throw an AuthError (see lib/auth/errors.js): the forms catch it and show the message */
    signIn: async input => { const u = await auth.signIn(input); apply(u); return u; },
    signUp: async input => { const u = await auth.signUp(input); apply(u); return u; },
    changePassword: async input => { const u = await auth.changePassword(input); apply(u); return u; },
    signOut: async () => { await auth.signOut(); apply(null); },
    resetPassword: input => auth.requestPasswordReset(input),
    /* CR-only tools: list students, reset a password, create an account, force password change */
    listUsers: () => auth.listUsers(),
    resetUserPassword: (rollNo) => auth.resetPassword(rollNo),
    createUser: (rollNo, password, name) => auth.createUser(rollNo, password, name),
    setMustChange: (rollNo, flag) => auth.setMustChange(rollNo, flag),
  }), [user, status, dialog, apply]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth() must be used inside <AuthProvider> (see components/auth/AuthRoot.jsx).");
  return v;
}
