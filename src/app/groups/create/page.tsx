"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateGroupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Group name is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create group.");
        return;
      }

      router.replace(`/groups/${data.group.id}`);
      router.refresh();
    } catch (err) {
      console.error("Create group error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#101317] font-['Inter'] text-[#F4F7FA] selection:bg-[#3B82F6] selection:text-white flex flex-col justify-between p-6 sm:p-10 md:p-14">
      {/* Atmospheric lighting glows */}
      <div className="pointer-events-none fixed left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3B82F6]/10 blur-[150px]" />
      <div className="pointer-events-none fixed bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[#343A40]/30 blur-[160px]" />

      {/* Top Header */}
      <header className="relative z-10 mx-auto flex w-full max-w-xl items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="group inline-flex items-center gap-2 text-xs font-medium text-[#AAB2BD] transition-all hover:text-white"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">←</span>
          <span>Dashboard</span>
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

      {/* Main Content Card */}
      <div className="relative z-10 mx-auto my-auto w-full max-w-xl">
        <div className="rounded-2xl border border-[#343A40] bg-[#101317]/85 p-6 sm:p-9 backdrop-blur-xl shadow-2xl shadow-black/60">
          
          {/* Section Icon Badge */}
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>

          <div className="mt-5 text-center">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4F7FA]">
              Create a Group
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#AAB2BD]">
              Establish a new ledger for trips, roommates, or events.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            {/* Group Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#AAB2BD]"
              >
                Group Name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Goa Trip 2026"
                maxLength={100}
                disabled={loading}
                autoFocus
                className="w-full rounded-xl border border-[#343A40] bg-[#343A40]/30 px-4 py-2.5 text-sm text-[#F4F7FA] outline-none transition-all placeholder:text-[#AAB2BD]/40 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] disabled:opacity-50"
              />
            </div>

            {/* Description */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="description"
                  className="text-xs font-medium uppercase tracking-wider text-[#AAB2BD]"
                >
                  Description
                </label>
                <span className="text-[11px] text-[#AAB2BD]/50 font-mono">
                  Optional
                </span>
              </div>

              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Tracking shared hotel and food expenses"
                rows={3}
                maxLength={500}
                disabled={loading}
                className="w-full resize-none rounded-xl border border-[#343A40] bg-[#343A40]/30 px-4 py-2.5 text-sm text-[#F4F7FA] outline-none transition-all placeholder:text-[#AAB2BD]/40 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] disabled:opacity-50"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-400">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex h-11 w-full items-center justify-center overflow-hidden rounded-xl bg-[#3B82F6] px-4 text-xs sm:text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all duration-150 hover:bg-[#2563EB] hover:shadow-[0_0_28px_rgba(59,130,246,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Creating Group...</span>
                  </>
                ) : (
                  "Create Group"
                )}
              </span>
            </button>
          </form>

          
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 mx-auto w-full max-w-xl text-center">
        <p className="text-[11px] text-[#AAB2BD]/50">
          © {new Date().getFullYear()} SplitZ. All rights reserved.
        </p>
      </footer>
    </main>
  );
}