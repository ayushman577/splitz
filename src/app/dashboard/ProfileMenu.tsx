"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

type ProfileMenuProps = {
  name: string;
  email: string;
};

export default function ProfileMenu({
  name,
  email,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(name);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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

      // Refresh server-rendered dashboard data
      window.location.reload();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative">
      {/* Profile button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-[#181C21]"
      >
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-[#F4F7FA]">
            {name}
          </p>

          <p className="text-xs text-[#AAB2BD]">
            {email}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3B82F6]/15 text-sm font-semibold text-[#3B82F6]">
          {name.charAt(0).toUpperCase()}
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-[#343A40] bg-[#181C21] p-4 shadow-2xl">
          {!editing ? (
            <>
              {/* User information */}
              <div className="border-b border-[#343A40] pb-4">
                <p className="font-medium text-[#F4F7FA]">
                  {name}
                </p>

                <p className="mt-1 break-all text-xs text-[#AAB2BD]">
                  {email}
                </p>
              </div>

              {/* Edit name */}
              <button
                onClick={() => {
                  setEditing(true);
                  setMessage("");
                }}
                className="mt-3 w-full rounded-xl px-3 py-2.5 text-left text-sm text-[#F4F7FA] transition hover:bg-[#343A40]/40"
              >
                ✏️ Edit Name
              </button>

              {/* Sign out */}
              <button
                onClick={() =>
                  signOut({
                    callbackUrl: "/login",
                  })
                }
                className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm text-red-400 transition hover:bg-red-500/10"
              >
                ↪ Sign Out
              </button>
            </>
          ) : (
            <>
              <div className="border-b border-[#343A40] pb-4">
                <h3 className="font-semibold text-[#F4F7FA]">
                  Edit Name
                </h3>

                <p className="mt-1 text-xs text-[#AAB2BD]">
                  Change the name displayed on your account.
                </p>
              </div>

              <div className="mt-4">
                <label className="text-xs font-medium text-[#AAB2BD]">
                  Name
                </label>

                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#343A40] bg-[#101317] px-3 py-2.5 text-sm text-[#F4F7FA] outline-none transition focus:border-[#3B82F6]"
                  autoFocus
                />
              </div>

              {message && (
                <p className="mt-2 text-xs text-[#AAB2BD]">
                  {message}
                </p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setNewName(name);
                    setMessage("");
                  }}
                  className="flex-1 rounded-xl border border-[#343A40] px-3 py-2.5 text-sm transition hover:bg-[#343A40]/40"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-[#3B82F6] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-[#2563EB] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}