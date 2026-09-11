"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type JoinGroupPageProps = {
  params: Promise<{
    joinCode: string;
  }>;
};

export default function JoinGroupPage({
  params,
}: JoinGroupPageProps) {
  const router = useRouter();

  // Next.js 16: params is a Promise
  const { joinCode } = use(params);

  const [code, setCode] = useState(joinCode.toUpperCase());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setError("Please enter an invite code or invite link.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/groups/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: trimmedCode,
        }),
      });

      const data = await response.json();

      // User is already a member
      if (response.status === 409 && data.alreadyMember) {
        router.push(`/groups/${data.group.id}`);
        return;
      }

      // Other errors
      if (!response.ok) {
        setError(data.message || "Unable to join group.");
        return;
      }

      // Successfully joined
      router.push(`/groups/${data.group.id}`);
      router.refresh();
    } catch (err) {
      console.error("Join group error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#101317] p-6 font-['Inter'] text-[#F4F7FA] selection:bg-[#3B82F6] selection:text-white sm:p-10 md:p-14">

      {/* Ambient background glow */}
      <div className="pointer-events-none fixed left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3B82F6]/10 blur-[150px]" />

      <div className="pointer-events-none fixed bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[#343A40]/30 blur-[160px]" />

      {/* Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="group inline-flex items-center gap-2 text-xs font-medium text-[#AAB2BD] transition-all hover:text-white"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">
            ←
          </span>

          <span>Back</span>
        </button>

        <Link
          href="/dashboard"
          className="text-xl font-bold tracking-tight text-[#F4F7FA] transition-transform active:scale-95"
        >
          <span className="bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#A78BFA] bg-clip-text text-transparent">
            SplitZ.
          </span>
        </Link>
      </header>

      {/* Main Join Container */}
      <div className="relative z-10 mx-auto my-auto w-full max-w-md">
        <div className="rounded-2xl border border-[#343A40] bg-[#101317]/85 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-8">

          {/* Key Icon */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#60A5FA] shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>

          {/* Heading */}
          <div className="mt-5 text-center">
            <h1 className="text-xl font-bold tracking-tight text-[#F4F7FA] sm:text-2xl">
              Join a Group
            </h1>

            <p className="mt-1.5 text-xs text-[#AAB2BD] sm:text-sm">
              Enter the invite code or paste the link shared with you.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-4"
          >
            <div>
              <label
                htmlFor="code"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#AAB2BD]"
              >
                Invite Code or Link
              </label>

              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase())
                }
                placeholder="e.g. K7X9P2"
                disabled={loading}
                autoFocus
                className="w-full rounded-xl border border-[#343A40] bg-[#343A40]/30 px-4 py-2.5 font-mono text-sm text-[#F4F7FA] outline-none transition-all placeholder:text-[#AAB2BD]/40 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] disabled:opacity-50"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-400">
                {error}
              </div>
            )}

            {/* Join Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex h-11 w-full items-center justify-center overflow-hidden rounded-xl bg-[#3B82F6] px-4 text-xs font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all duration-150 hover:bg-[#2563EB] hover:shadow-[0_0_28px_rgba(59,130,246,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Joining Group...</span>
                  </>
                ) : (
                  "Join Group"
                )}
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mx-auto w-full max-w-md text-center">
        <p className="text-[11px] text-[#AAB2BD]/50">
          © {new Date().getFullYear()} SplitZ. All rights reserved.
        </p>
      </footer>
    </main>
  );
}