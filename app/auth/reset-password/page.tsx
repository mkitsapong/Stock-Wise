"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function ResetPasswordPage() {
  const { session, isLoading, isConfigured, updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please check again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        setErrorMsg(error);
      } else {
        setIsDone(true);
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-black/20 dark:bg-black/40 px-3.5 py-2.5 text-sm text-foreground shadow-inner transition-all duration-200 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 placeholder:text-muted/50 font-mono tracking-wide";

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-white/10 bg-card-bg/95 p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-fade-in-up">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-emerald-400 opacity-80" />

        <h1 className="text-2xl font-extrabold tracking-tight text-foreground text-center">
          ตั้งรหัสผ่านใหม่
        </h1>
        <p className="mt-1 mb-6 text-center text-xs text-muted">Set a new password for your StockWise account</p>

        {!isConfigured ? (
          <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            Supabase is not configured.
          </p>
        ) : isLoading ? (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          </div>
        ) : isDone ? (
          <div className="space-y-4 text-center">
            <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              เปลี่ยนรหัสผ่านเรียบร้อยแล้ว
            </p>
            <Link
              href="/"
              className="inline-block w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 py-3 text-sm font-bold text-white shadow-lg"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        ) : !session ? (
          <div className="space-y-4 text-center">
            <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่จากหน้า Sign In
            </p>
            <Link href="/" className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline">
              กลับหน้าหลัก
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMsg && (
              <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {errorMsg}
              </p>
            )}
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-xs font-semibold text-foreground/80">
                New Password
              </label>
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="confirm-new-password" className="mb-1.5 block text-xs font-semibold text-foreground/80">
                Confirm New Password
              </label>
              <input
                id="confirm-new-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className={inputClass}
              />
            </div>
            <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="accent-indigo-600"
              />
              Show password
            </label>
            <button
              id="reset-password-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
