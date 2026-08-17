"use client";

import React, { useState, useEffect } from "react";
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasErrorShake, setHasErrorShake] = useState(false);
  const [isEmailConfirmationView, setIsEmailConfirmationView] = useState(false);

  // Reset fields when modal is closed or opened
  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsEmailConfirmationView(false);
    }
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  // Password strength calculator (for sign up)
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-muted/30" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: "Weak", color: "bg-rose-500", textColor: "text-rose-400" };
      case 2:
        return { score: 2, label: "Fair", color: "bg-amber-500", textColor: "text-amber-400" };
      case 3:
        return { score: 3, label: "Good", color: "bg-blue-500", textColor: "text-blue-400" };
      case 4:
        return { score: 4, label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-400" };
      default:
        return { score: 0, label: "", color: "bg-muted/30", textColor: "text-muted" };
    }
  };

  const strength = getPasswordStrength(password);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setHasErrorShake(true);
    setTimeout(() => setHasErrorShake(false), 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      triggerError("Please enter both email and password.");
      return;
    }

    if (password.length < 6) {
      triggerError("Password must be at least 6 characters.");
      return;
    }

    if (authModalMode === "signup" && confirmPassword && password !== confirmPassword) {
      triggerError("Passwords do not match. Please check again.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (authModalMode === "signin") {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          if (error.toLowerCase().includes("email not confirmed")) {
            triggerError("Email not confirmed yet. Please verify your email first.");
            setIsEmailConfirmationView(true);
          } else {
            triggerError(error);
          }
        }
      } else {
        const { error, needsEmailConfirmation } = await signUpWithEmail(email, password);
        if (error) {
          if (error.toLowerCase().includes("already registered") || error.toLowerCase().includes("already exists")) {
            triggerError("This email is already registered. Please sign in instead.");
          } else {
            triggerError(error);
          }
        } else if (needsEmailConfirmation) {
          setIsEmailConfirmationView(true);
        }
      }
    } catch (err: any) {
      triggerError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) triggerError(error);
    } catch (err: any) {
      triggerError(err.message || "Google sign in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      triggerError("Please enter your email address above to receive reset instructions.");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(`Password reset link has been sent to ${email}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Dynamic Backdrop with Blur */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xl transition-all duration-300 animate-fade-in"
        onClick={closeAuthModal}
      />

      {/* Ambient Moving Mesh Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-indigo-600/20 blur-[100px] animate-glow-breathe" />
        <div
          className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-emerald-500/15 blur-[100px] animate-glow-breathe"
          style={{ animationDelay: "-2s" }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-purple-600/15 blur-[90px] animate-glow-breathe"
          style={{ animationDelay: "-3.5s" }}
        />
      </div>

      {/* Main Glassmorphism Card */}
      <div
        className={`relative w-full max-w-[440px] overflow-hidden rounded-[28px] border border-white/10 dark:border-white/10 bg-card-bg/95 dark:bg-[#0c121e]/90 p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-modal-pop z-10 ${
          hasErrorShake ? "animate-shake" : ""
        }`}
      >
        {/* Top Highlight Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-emerald-400 opacity-80" />

        {/* Ambient Corner Glow */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="group absolute right-5 top-5 p-2 text-muted hover:text-foreground rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-200 active:scale-95 z-20"
          aria-label="Close modal"
        >
          <svg className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ================================================================= */}
        {/* EMAIL CONFIRMATION REQUIRED VIEW */}
        {/* ================================================================= */}
        {isEmailConfirmationView ? (
          <div className="py-2 text-center animate-fade-in">
            {/* Animated Email Verification Icon */}
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500 opacity-60 blur-md animate-pulse-dot" />
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-indigo-600/30 border border-emerald-500/40 text-emerald-400 shadow-xl">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <h3 className="text-xl font-extrabold text-foreground tracking-tight mb-2">
              ยืนยันอีเมลของคุณ
            </h3>
            <p className="text-xs text-muted leading-relaxed mb-4 max-w-xs mx-auto">
              ระบบได้ส่งลิงก์ยืนยันตัวตนไปที่กล่องข้อความอีเมลของคุณเรียบร้อยแล้ว
            </p>

            {/* Highlighted Email Badge */}
            <div className="inline-block max-w-full px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-semibold break-all mb-5">
              📩 {email}
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/5 dark:bg-black/30 p-3.5 text-left text-xs text-muted mb-5 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">1.</span>
                <span>เปิดแอปอีเมลของคุณ (หรือโฟลเดอร์ Spam/Junk)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">2.</span>
                <span>กดปุ่ม <strong>Confirm your email</strong> ในอีเมลจาก Supabase</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">3.</span>
                <span>กลับมาที่หน้านี้แล้วกดปุ่มด้านล่างเพื่อเข้าสู่ระบบ</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsEmailConfirmationView(false);
                openAuthModal("signin");
              }}
              className="btn-shine-sweep w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>ไปหน้า Sign In (เข้าสู่ระบบ)</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsEmailConfirmationView(false);
              }}
              className="mt-3 text-xs text-muted hover:text-foreground underline transition-colors"
            >
              แก้ไขอีเมล หรือลองใหม่อีกครั้ง
            </button>
          </div>
        ) : (
          /* ================================================================= */
          /* MAIN SIGN IN / SIGN UP FORM */
          /* ================================================================= */
          <>
            {/* Brand Header */}
            <div className="text-center mb-5">
              {/* Logo with pulsing halo ring */}
              <div className="relative inline-flex items-center justify-center mb-3">
                <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 opacity-70 blur-sm animate-pulse-dot" />
                <div className="relative flex items-center justify-center w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white font-black text-xl shadow-xl border border-white/20">
                  <svg className="w-6 h-6 text-emerald-400 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                  <span className="bg-gradient-to-r from-white via-slate-100 to-emerald-200 bg-clip-text text-transparent">SW</span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-foreground font-sans">
                {authModalMode === "signin" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-xs text-muted mt-1 max-w-xs mx-auto leading-relaxed">
                {authModalMode === "signin"
                  ? "Sign in to sync your real-time portfolio & watchlist"
                  : "Join StockWise Pro for intelligent analytics & cloud backup"}
              </p>

              {/* Secure Sync Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>End-to-End Encrypted Cloud Sync</span>
              </div>
            </div>

            {/* Interactive Segmented Switcher (Sign In vs Sign Up) */}
            <div className="relative flex items-center p-1 mb-5 rounded-2xl bg-black/20 dark:bg-black/40 border border-white/5 backdrop-blur-md">
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-md transition-all duration-300 ease-out ${
                  authModalMode === "signin" ? "left-1" : "left-[calc(50%+2px)]"
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  openAuthModal("signin");
                }}
                className={`relative flex-1 py-1.5 text-xs font-semibold rounded-xl transition-colors duration-200 text-center z-10 ${
                  authModalMode === "signin" ? "text-white" : "text-muted hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  openAuthModal("signup");
                }}
                className={`relative flex-1 py-1.5 text-xs font-semibold rounded-xl transition-colors duration-200 text-center z-10 ${
                  authModalMode === "signup" ? "text-white" : "text-muted hover:text-foreground"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Supabase Notice if not configured */}
            {!isConfigured && (
              <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-start gap-2.5">
                <span className="text-base leading-none">⚠️</span>
                <div className="flex-1">
                  <span className="font-semibold block mb-0.5">Supabase Not Connected</span>
                  Add <code className="bg-black/40 px-1 py-0.5 rounded text-[11px]">NEXT_PUBLIC_SUPABASE_URL</code> in <code className="bg-black/40 px-1 py-0.5 rounded text-[11px]">.env.local</code>.
                </div>
              </div>
            )}

            {/* Error Notification */}
            {errorMsg && (
              <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2.5 animate-fade-in">
                <svg className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="flex-1 font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Success Notification */}
            {successMsg && (
              <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-start gap-2.5 animate-fade-in">
                <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="flex-1 font-medium">{successMsg}</span>
              </div>
            )}

            {/* Continue with Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || !isConfigured}
              className="group relative w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl border border-white/10 bg-white/5 dark:bg-slate-900/60 hover:bg-white/10 dark:hover:bg-slate-800 text-foreground font-semibold text-sm transition-all duration-200 hover:border-white/20 hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out pointer-events-none" />
              
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </button>

            {/* Divider with Subtle Glow */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="w-full border-t border-white/10" />
              <span className="relative bg-card-bg dark:bg-[#0c121e] px-3 text-[10px] font-bold uppercase tracking-wider text-muted">
                or continue with email
              </span>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-muted pointer-events-none">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 dark:bg-black/40 pl-10 pr-3.5 py-2.5 text-sm text-foreground shadow-inner transition-all duration-200 focus:border-indigo-500 focus:bg-black/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 placeholder:text-muted/50"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-foreground/80">
                    Password
                  </label>
                  {authModalMode === "signin" && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-muted pointer-events-none">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth={2} />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={authModalMode === "signin" ? "••••••••" : "Min. 6 characters"}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 dark:bg-black/40 pl-10 pr-10 py-2.5 text-sm text-foreground shadow-inner transition-all duration-200 focus:border-indigo-500 focus:bg-black/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 placeholder:text-muted/50 font-mono tracking-wide"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-muted hover:text-foreground transition-colors p-0.5"
                    tabIndex={-1}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator (Sign Up mode only) */}
                {authModalMode === "signup" && password.length > 0 && (
                  <div className="mt-2 space-y-1.5 animate-fade-in">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted">Password Strength</span>
                      <span className={`font-semibold ${strength.textColor}`}>{strength.label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color : "bg-white/10"}`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : "bg-white/10"}`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color : "bg-white/10"}`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 4 ? strength.color : "bg-white/10"}`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password (Sign Up mode only) */}
              {authModalMode === "signup" && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-muted pointer-events-none">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth={2} />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11V7a5 5 0 0110 0v4" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className={`w-full rounded-2xl border bg-black/20 dark:bg-black/40 pl-10 pr-10 py-2.5 text-sm text-foreground shadow-inner transition-all duration-200 focus:outline-none focus:ring-2 placeholder:text-muted/50 font-mono tracking-wide ${
                        confirmPassword && confirmPassword === password
                          ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/25"
                          : confirmPassword && confirmPassword !== password
                          ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/25"
                          : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/25"
                      }`}
                    />
                    {confirmPassword && confirmPassword === password && (
                      <div className="absolute right-3.5 text-emerald-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Remember Me Checkbox (Sign In mode) */}
              {authModalMode === "signin" && (
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-black/30 text-indigo-600 focus:ring-indigo-500/30 focus:ring-offset-0 transition-colors cursor-pointer accent-indigo-600"
                  />
                  <label htmlFor="rememberMe" className="text-xs text-muted select-none cursor-pointer hover:text-foreground">
                    Remember me on this device
                  </label>
                </div>
              )}

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={isSubmitting || !isConfigured}
                className="btn-shine-sweep group relative w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:via-indigo-600 hover:to-emerald-400 text-white font-bold text-sm shadow-[0_10px_25px_-5px_rgba(99,102,241,0.4)] hover:shadow-[0_12px_30px_-5px_rgba(99,102,241,0.6)] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{authModalMode === "signin" ? "Signing In..." : "Creating Account..."}</span>
                  </>
                ) : (
                  <>
                    <span>{authModalMode === "signin" ? "Sign In to StockWise" : "Get Started Free"}</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Security & Feature Badges */}
            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-muted font-medium">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                256-Bit SSL
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Real-Time Sync
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                AI Intelligence
              </span>
            </div>

            {/* Footer Mode Switcher */}
            <div className="mt-3 text-center text-xs text-muted">
              {authModalMode === "signin" ? (
                <>
                  Don't have an account yet?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      openAuthModal("signup");
                    }}
                    className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline ml-1 transition-colors"
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
                    className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline ml-1 transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
