"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const passwordLength = password.length >= 8;

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    if (password.length > 72) {
      setError(
        "Password must not exceed 72 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to reset your password."
        );
        return;
      }

      // Remove the email used during the reset flow
      sessionStorage.removeItem("resetEmail");

      // Send user back to login
      router.push("/login?reset=success");
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full bg-[#101317] text-[#F4F7FA] flex flex-col justify-center items-center p-6 overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#3B82F6]/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10 mb-8 text-center">
        <Link
          href="/"
          className="group inline-block font-['Inter'] font-bold text-3xl tracking-tight text-[#F4F7FA] transition-transform duration-200 active:scale-95"
        >
          Split
          <span className="text-[#3B82F6] inline-block transition-transform duration-200 group-hover:scale-110">
            Z
          </span>
        </Link>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-[#101317]/80 backdrop-blur-xl border border-[#343A40] rounded-2xl p-7 sm:p-9 shadow-2xl shadow-black/60">

        {/* Heading */}
        <div className="mb-7 text-center">
          <h1 className="font-['Inter'] font-bold text-2xl tracking-tight text-[#F4F7FA]">
            Create a new password
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-[#AAB2BD] leading-relaxed">
            Choose a strong password for your SplitZ
            account.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-3.5 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >

          {/* New password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#AAB2BD] tracking-wide">
              New Password
            </label>

            <div className="relative">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter your new password"
                autoComplete="new-password"
                disabled={loading}
                className="w-full px-4 py-2.5 pr-20 rounded-xl border border-[#343A40] bg-[#343A40]/30 text-[#F4F7FA] placeholder-[#AAB2BD]/40 text-sm outline-none transition-all duration-200 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (previous) => !previous
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#AAB2BD] hover:text-[#F4F7FA] transition-colors"
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>

            {/* Password requirement */}
            <p
              className={`text-[11px] mt-1 ${
                passwordLength
                  ? "text-green-400"
                  : "text-[#AAB2BD]"
              }`}
            >
              {passwordLength ? "✓" : "•"} At least
              8 characters
            </p>
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#AAB2BD] tracking-wide">
              Confirm Password
            </label>

            <div className="relative">
              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(
                    e.target.value
                  );
                  setError("");
                }}
                placeholder="Confirm your new password"
                autoComplete="new-password"
                disabled={loading}
                className={`w-full px-4 py-2.5 pr-20 rounded-xl border bg-[#343A40]/30 text-[#F4F7FA] placeholder-[#AAB2BD]/40 text-sm outline-none transition-all duration-200 disabled:opacity-50 ${
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? "border-green-500/60 focus:ring-1 focus:ring-green-500"
                      : "border-red-500/60 focus:ring-1 focus:ring-red-500"
                    : "border-[#343A40] focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
                }`}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (previous) => !previous
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#AAB2BD] hover:text-[#F4F7FA] transition-colors"
              >
                {showConfirmPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>

            {confirmPassword.length > 0 && (
              <p
                className={`text-[11px] mt-1 ${
                  passwordsMatch
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {passwordsMatch
                  ? "✓ Passwords match"
                  : "Passwords do not match"}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={
              loading ||
              !passwordLength ||
              !passwordsMatch
            }
            className="group relative overflow-hidden mt-1 w-full font-['Inter'] font-medium text-sm py-2.5 rounded-xl bg-[#3B82F6] text-white hover:bg-[#2563EB] hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <span className="relative inline-flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating password...
                </>
              ) : (
                "Reset Password"
              )}
            </span>
          </button>
        </form>

        {/* Back to login */}
        <p className="mt-7 text-center text-xs text-[#AAB2BD]">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-[#3B82F6] hover:underline"
          >
            Log In
          </Link>
        </p>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-8 text-center">
        <p className="font-['Inter'] text-xs text-[#AAB2BD]/60">
          © {new Date().getFullYear()} Splitz. All rights reserved.
        </p>
      </footer>
    </main>
  );
}