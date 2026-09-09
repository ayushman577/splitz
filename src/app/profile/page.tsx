"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

type ProfilePageProps = {
  userName: string;
  email: string;
};

export default function ProfileClient({
  userName,
  email,
}: ProfilePageProps) {
  const [name, setName] = useState(userName);
  const [editing, setEditing] = useState(false);

  return (
    <main className="min-h-screen bg-[#101317] text-[#F4F7FA]">
      {/* Header */}
      <header className="border-b border-[#343A40] bg-[#101317]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-2xl font-bold tracking-tight">
            Split<span className="text-[#3B82F6]">Z</span>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3B82F6]/15 text-sm font-semibold text-[#3B82F6]">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className="hidden min-h-[calc(100vh-73px)] w-56 border-r border-[#343A40] px-4 py-6 md:block">
          <nav className="space-y-1">
            <a
              href="/dashboard"
              className="block rounded-xl px-4 py-3 text-sm text-[#AAB2BD] transition hover:bg-[#343A40]/40 hover:text-[#F4F7FA]"
            >
              Dashboard
            </a>

            <a
              href="/groups"
              className="block rounded-xl px-4 py-3 text-sm text-[#AAB2BD] transition hover:bg-[#343A40]/40 hover:text-[#F4F7FA]"
            >
              Groups
            </a>

            <a
              href="/expenses"
              className="block rounded-xl px-4 py-3 text-sm text-[#AAB2BD] transition hover:bg-[#343A40]/40 hover:text-[#F4F7FA]"
            >
              Expenses
            </a>

            <a
              href="/balances"
              className="block rounded-xl px-4 py-3 text-sm text-[#AAB2BD] transition hover:bg-[#343A40]/40 hover:text-[#F4F7FA]"
            >
              Balances
            </a>

            <a
              href="/payments"
              className="block rounded-xl px-4 py-3 text-sm text-[#AAB2BD] transition hover:bg-[#343A40]/40 hover:text-[#F4F7FA]"
            >
              Payments
            </a>

            {/* Profile */}
            <a
              href="/profile"
              className="block rounded-xl bg-[#3B82F6]/10 px-4 py-3 text-sm font-medium text-[#3B82F6]"
            >
              Profile
            </a>
          </nav>
        </aside>

        {/* Main */}
        <section className="w-full px-6 py-8 lg:px-10">
          <div className="mb-8">
            <p className="text-sm text-[#AAB2BD]">
              Manage your account
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Profile
            </h1>
          </div>

          <div className="max-w-2xl space-y-6">
            {/* Personal information */}
            <div className="rounded-2xl border border-[#343A40] bg-[#181C21] p-6">
              <h2 className="text-lg font-semibold">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-[#AAB2BD]">
                Update the information associated with your account.
              </p>

              {/* Name */}
              <div className="mt-6">
                <label className="text-sm font-medium">
                  Name
                </label>

                <div className="mt-2 flex gap-3">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!editing}
                    className="w-full rounded-xl border border-[#343A40] bg-[#101317] px-4 py-3 text-sm outline-none transition focus:border-[#3B82F6] disabled:cursor-not-allowed disabled:opacity-70"
                  />

                  <button
                    onClick={() => setEditing(!editing)}
                    className="rounded-xl border border-[#343A40] px-4 py-3 text-sm font-medium transition hover:bg-[#343A40]/40"
                  >
                    {editing ? "Cancel" : "Edit"}
                  </button>
                </div>
              </div>

              {/* Email */}
              <div className="mt-5">
                <label className="text-sm font-medium">
                  Email
                </label>

                <input
                  value={email}
                  disabled
                  className="mt-2 w-full rounded-xl border border-[#343A40] bg-[#101317] px-4 py-3 text-sm text-[#AAB2BD] opacity-70"
                />

                <p className="mt-2 text-xs text-[#777F89]">
                  Your email address cannot be changed.
                </p>
              </div>

              {editing && (
                <button
                  className="mt-5 rounded-xl bg-[#3B82F6] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#2563EB]"
                >
                  Save Changes
                </button>
              )}
            </div>

            {/* Sign out */}
            <div className="rounded-2xl border border-[#343A40] bg-[#181C21] p-6">
              <h2 className="text-lg font-semibold">
                Sign Out
              </h2>

              <p className="mt-1 text-sm text-[#AAB2BD]">
                Sign out of your SplitZ account on this device.
              </p>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
              >
                Sign Out
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}