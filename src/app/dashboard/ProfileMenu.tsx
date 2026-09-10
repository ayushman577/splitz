"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";

type ProfileMenuProps = {
  name: string;
  email: string;
};

export default function ProfileMenu({ name, email }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(name);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSave() {
    if (!newName.trim()) {
      setMessage("Name cannot be empty.");
      return;
    }

    if (newName.trim().length < 2) {
      setMessage("Name must be at least 2 characters.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to update name.");
        return;
      }

      setEditing(false);
      setMessage("Name updated successfully.");
      window.location.reload();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative font-['Inter']" ref={menuRef}>
      {/* Profile Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="group flex items-center gap-2.5 rounded-xl border border-transparent p-1.5 transition-all duration-150 hover:border-[#343A40] hover:bg-[#181C21] active:scale-95"
      >
        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold text-[#F4F7FA] transition-colors group-hover:text-white">
            {name}
          </p>
          <p className="text-[11px] font-mono tracking-tight text-[#AAB2BD]/70">
            {email}
          </p>
        </div>

        {/* User Icon Badge with Brand Glow */}
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#60A5FA] shadow-[0_0_14px_rgba(59,130,246,0.25)] transition-all group-hover:border-[#3B82F6]/60">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
      </button>

      {/* Flyout Modal */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-[#343A40] bg-[#101317]/95 p-4 shadow-2xl shadow-black/80 backdrop-blur-xl">
          {!editing ? (
            <>
              {/* Account Identity Header */}
              <div className="border-b border-[#343A40]/80 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#60A5FA]">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#F4F7FA]">
                      {name}
                    </p>
                    <p className="truncate font-mono text-[11px] text-[#AAB2BD]/70">
                      {email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="mt-2.5 space-y-1">
                <button
                  onClick={() => {
                    setEditing(true);
                    setMessage("");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#F4F7FA] transition-colors hover:bg-[#343A40]/40"
                >
                  <svg
                    className="h-3.5 w-3.5 text-[#AAB2BD]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Name
                </button>

                <button
                  onClick={() =>
                    signOut({
                      callbackUrl: "/login",
                    })
                  }
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                >
                  <svg
                    className="h-3.5 w-3.5 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Edit Mode Header */}
              <div className="border-b border-[#343A40]/80 pb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#AAB2BD]">
                  Edit Name
                </h3>
                <p className="mt-0.5 text-[11px] text-[#AAB2BD]/60">
                  Update your public display identity.
                </p>
              </div>

              <div className="mt-3">
                <label className="text-[11px] font-medium text-[#AAB2BD]">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#343A40] bg-[#343A40]/30 px-3 py-2 text-xs text-[#F4F7FA] outline-none transition-all placeholder:text-[#AAB2BD]/40 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
                  autoFocus
                />
              </div>

              {message && (
                <p className="mt-2 text-[11px] text-red-400">{message}</p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setNewName(name);
                    setMessage("");
                  }}
                  className="flex-1 rounded-xl border border-[#343A40] py-2 text-xs font-medium text-[#AAB2BD] transition hover:bg-[#343A40]/40 hover:text-white active:scale-95"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="group relative flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-[#3B82F6] py-2 text-xs font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all hover:bg-[#2563EB] active:scale-95 disabled:opacity-50"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  {saving ? (
                    <span className="relative inline-flex items-center gap-1.5">
                      <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                      Saving...
                    </span>
                  ) : (
                    <span className="relative">Save</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}