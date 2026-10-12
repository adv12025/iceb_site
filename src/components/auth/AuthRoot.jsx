"use client";
import { AuthProvider } from "@/lib/auth/AuthContext";
import AuthModal from "./AuthModal";

/* Wrap the whole app in this once (app/layout.jsx). It provides login state and the log-in dialog to every page. */
export default function AuthRoot({ children }) {
  return (
    <AuthProvider>
      {children}
      <AuthModal />
    </AuthProvider>
  );
}
