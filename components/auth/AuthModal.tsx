"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    isConfigured,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (authModalMode === "signin") {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setErrorMsg(error);
        }
      } else {
        const { error } = await signUpWithEmail(email, password);
        if (error) {
          setErrorMsg(error);
        } else {
          setSuccessMsg("Account created! Check your email to confirm registration or sign in directly.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) setErrorMsg(error);
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={closeAuthModal}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-card-bg/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl animate-fade-in-up z-10">
        {/* Glow ambient decoration */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute right-5 top-5 p-2 text-muted hover:text-foreground rounded-full hover:bg-muted-bg/60 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-accent to-purple-600 shadow-lg shadow-accent/25 text-white font-bold text-lg mb-3">
            SW
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {authModalMode === "signin" ? "Welcome Back to StockWise" : "Create your Account"}
          </h2>
          <p className="text-xs text-muted mt-1.5 max-w-xs mx-auto">
            {authModalMode === "signin"
              ? "Sign in to sync your portfolio & watchlist across all devices"
              : "Start tracking your investments with cloud backup and real-time sync"}
          </p>
        </div>

        {/* Config Notice if Supabase not configured */}
        {!isConfigured && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            <span className="font-semibold block mb-0.5">⚠️ Supabase Credentials Not Set</span>
            Please configure <code className="bg-black/30 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-black/30 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code className="bg-black/30 px-1 py-0.5 rounded">.env.local</code>.
          </div>
        )}

        {/* Error / Success Messages */}
        {errorMsg && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
            <span>❌</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-start gap-2">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Social Login */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting || !isConfigured}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-border/80 bg-muted-bg/50 hover:bg-muted-bg text-foreground font-medium text-sm transition-all hover:border-border shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 6.3 10.1 6.3z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="w-full border-t border-border/60" />
          <span className="bg-card-bg px-3 text-[11px] font-medium uppercase tracking-wider text-muted">
            or with email
          </span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border/80 bg-muted-bg/40 px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-all focus:border-accent focus:bg-card-bg focus:outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-muted/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border/80 bg-muted-bg/40 px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-all focus:border-accent focus:bg-card-bg focus:outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-muted/50"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isConfigured}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-accent to-emerald-500 hover:from-accent-hover hover:to-emerald-600 text-white font-bold text-sm shadow-lg shadow-accent/20 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : authModalMode === "signin" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Switch Mode Footer */}
        <div className="mt-6 text-center text-xs text-muted">
          {authModalMode === "signin" ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  openAuthModal("signup");
                }}
                className="font-semibold text-accent hover:underline ml-1"
              >
                Sign up free
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  openAuthModal("signin");
                }}
                className="font-semibold text-accent hover:underline ml-1"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
