"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      // Create account
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      // Automatically log in
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created, but automatic login failed.");
        return;
      }

      // Go to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setError("");
    setGoogleLoading(true);

    try {
      await signIn("google", {
        callbackUrl: "/dashboard",
      });
    } catch (err) {
      console.error(err);
      setError("Google sign up failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full bg-[#101317] text-[#F4F7FA] flex flex-col justify-center items-center p-6 selection:bg-[#3B82F6] selection:text-white overflow-hidden">
      {/* Ambient Blue Spotlight */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#3B82F6]/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Brand Logo */}
      <div className="relative z-10 mb-8 text-center">
        <Link
          href="/"
          className="group inline-block font-['Inter'] font-bold text-3xl tracking-tight text-[#F4F7FA] transition-transform duration-200 active:scale-95"
        >
          <span className="bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#A78BFA] bg-clip-text text-transparent transition-all duration-200 group-hover:opacity-90">
            SplitZ.
          </span>        </Link>
      </div>
      {/* Register Card */}
      <div className="relative z-10 w-full max-w-md bg-[#101317]/80 backdrop-blur-xl border border-[#343A40] rounded-2xl p-7 sm:p-9 shadow-2xl shadow-black/60">
        <div className="mb-7 text-center">
          <h1 className="font-['Inter'] font-bold text-2xl tracking-tight text-[#F4F7FA]">
            Create an account
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#AAB2BD]">
            Start managing and settling expenses easily
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-5 px-3.5 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#AAB2BD] tracking-wide">
              Full Name
            </label>
            <input
              name="name"
              type="text"
              placeholder="John Doe"
              required
              disabled={loading || googleLoading}
              className="w-full px-4 py-2.5 rounded-xl border border-[#343A40] bg-[#343A40]/30 text-[#F4F7FA] placeholder-[#AAB2BD]/40 text-sm outline-none transition-all duration-200 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#AAB2BD] tracking-wide">
              Email
            </label>
            <input
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              disabled={loading || googleLoading}
              className="w-full px-4 py-2.5 rounded-xl border border-[#343A40] bg-[#343A40]/30 text-[#F4F7FA] placeholder-[#AAB2BD]/40 text-sm outline-none transition-all duration-200 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#AAB2BD] tracking-wide">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={loading || googleLoading}
              className="w-full px-4 py-2.5 rounded-xl border border-[#343A40] bg-[#343A40]/30 text-[#F4F7FA] placeholder-[#AAB2BD]/40 text-sm outline-none transition-all duration-200 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] disabled:opacity-50"
            />
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="group relative overflow-hidden mt-2 w-full font-['Inter'] font-medium text-sm py-2.5 rounded-xl bg-[#3B82F6] text-white hover:bg-[#2563EB] hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            <span className="relative inline-flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </span>
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-[#343A40] w-full" />
          <span className="bg-[#101317] px-3 text-[11px] font-mono tracking-widest uppercase text-[#AAB2BD]/60 absolute">
            OR
          </span>
        </div>

        {/* Google Sign Up Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-[#343A40] bg-[#343A40]/30 text-[#F4F7FA] text-sm font-medium hover:bg-[#343A40]/70 hover:border-[#AAB2BD]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {googleLoading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-[#AAB2BD]/30 border-t-[#AAB2BD] rounded-full animate-spin" />
              Connecting to Google...
            </span>
          ) : (
            <>
              {/* Google Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.56 0 2.97.54 4.07 1.43l3.05-3.05C17.26 1.63 14.81 1 12 1 7.5 1 3.65 3.56 1.8 7.28l3.66 2.84C6.34 7.22 8.94 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.88c2.16-1.99 3.71-4.94 3.71-8.7z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.46 14.12c-.24-.72-.38-1.49-.38-2.12s.14-1.4.38-2.12L1.8 7.04C.65 9.33 0 10.6 0 12s.65 2.67 1.8 4.96l3.66-2.84z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.71-2.88c-1.08.72-2.45 1.16-4.22 1.16-3.06 0-5.66-2.22-6.54-5.12L1.8 16.08C3.65 19.8 7.5 23 12 23z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {/* Login Link */}
        <p className="mt-7 text-center text-xs text-[#AAB2BD]">
          Already have an account?{" "}
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