"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VerifyResetCodePage() {
  const router = useRouter();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(10 * 60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get email from sessionStorage
  useEffect(() => {
    const storedEmail = sessionStorage.getItem("resetEmail");

    if (!storedEmail) {
      router.replace("/forgot-password");
      return;
    }

    setEmail(storedEmail);
    inputRefs.current[0]?.focus();
  }, [router]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");

  const seconds = (timeLeft % 60)
    .toString()
    .padStart(2, "0");

  function handleChange(
    index: number,
    value: string
  ) {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);

    const newCode = [...code];
    newCode[index] = digit;

    setCode(newCode);
    setError("");

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(
    e: React.ClipboardEvent<HTMLInputElement>
  ) {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    const newCode = ["", "", "", "", "", ""];

    pasted.split("").forEach((digit, index) => {
      newCode[index] = digit;
    });

    setCode(newCode);
    setError("");

    const nextIndex = Math.min(pasted.length, 5);

    inputRefs.current[nextIndex]?.focus();
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const verificationCode = code.join("");

    if (verificationCode.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    if (timeLeft <= 0) {
      setError("This verification code has expired. Please request a new one.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/auth/verify-reset-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            code: verificationCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Invalid verification code."
        );
        return;
      }

      router.push("/reset-password");
    } catch (error) {
      console.error(
        "Verify reset code error:",
        error
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Unable to resend code."
        );
        return;
      }

      setCode(["", "", "", "", "", ""]);
      setTimeLeft(10 * 60);

      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error(
        "Resend code error:",
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
            Verify your email
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-[#AAB2BD] leading-relaxed">
            Enter the 6-digit verification code we sent to
          </p>

          <p className="mt-1 text-sm font-medium text-[#F4F7FA] break-all">
            {email}
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
          className="flex flex-col"
        >

          {/* OTP boxes */}
          <div className="flex justify-center gap-2 sm:gap-3">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={
                  index === 0
                    ? "one-time-code"
                    : "off"
                }
                maxLength={1}
                value={digit}
                disabled={loading}
                onChange={(e) =>
                  handleChange(
                    index,
                    e.target.value
                  )
                }
                onKeyDown={(e) =>
                  handleKeyDown(index, e)
                }
                onPaste={handlePaste}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-semibold rounded-xl border border-[#343A40] bg-[#343A40]/30 text-[#F4F7FA] outline-none transition-all duration-200 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] disabled:opacity-50"
              />
            ))}
          </div>

          {/* Timer */}
          <div className="mt-6 text-center">
            {timeLeft > 0 ? (
              <p className="text-xs text-[#AAB2BD]">
                Code expires in{" "}
                <span className="font-semibold text-[#3B82F6]">
                  {minutes}:{seconds}
                </span>
              </p>
            ) : (
              <p className="text-xs text-red-400">
                This code has expired.
              </p>
            )}
          </div>

          {/* Verify */}
          <button
            type="submit"
            disabled={
              loading ||
              code.join("").length !== 6 ||
              timeLeft <= 0
            }
            className="group relative overflow-hidden mt-6 w-full font-['Inter'] font-medium text-sm py-2.5 rounded-xl bg-[#3B82F6] text-white hover:bg-[#2563EB] hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <span className="relative inline-flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </span>
          </button>
        </form>

        {/* Resend */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[#AAB2BD]">
            Didn&apos;t receive the code?
          </p>

          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="mt-1 text-xs font-medium text-[#3B82F6] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Resend Code
          </button>
        </div>

        {/* Back */}
        <p className="mt-7 text-center text-xs text-[#AAB2BD]">
          <Link
            href="/forgot-password"
            className="font-medium text-[#3B82F6] hover:underline"
          >
            ← Change email
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