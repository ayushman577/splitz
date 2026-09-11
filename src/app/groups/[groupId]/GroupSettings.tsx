"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

type GroupSettingsProps = {
  groupId: string;
  initialName: string;
  initialDescription: string | null;
};

export default function GroupSettings({
  groupId,
  initialName,
  initialDescription,
}: GroupSettingsProps) {
  const router = useRouter();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(
    initialDescription || ""
  );

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpdate() {
    if (!name.trim()) {
      setMessage("Group name is required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to update group.");
        return;
      }

      setIsEditOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Update group error:", error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to delete group.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Delete group error:", error);
      setMessage("Something went wrong.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      {/* Group Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setMessage("");
            setIsEditOpen(true);
          }}
          className="group relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-xl border border-[#343A40] bg-[#181C21] px-3.5 text-xs font-semibold text-[#AAB2BD] shadow-sm transition-all duration-150 hover:border-[#3B82F6]/60 hover:bg-[#3B82F6]/10 hover:text-[#60A5FA] active:scale-95"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMessage("");
            setIsDeleteOpen(true);
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 text-xs font-semibold text-red-400 shadow-sm transition-all duration-150 hover:border-red-500/40 hover:bg-red-500/15 active:scale-95"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h10" />
          </svg>
          <span>Delete</span>
        </button>
      </div>

      {/* Edit Modal (Portaled) */}
      {isEditOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setIsEditOpen(false);
            }}
          >
            <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#343A40] bg-[#101317] shadow-2xl shadow-black/90">
              {/* Glow */}
              <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-72 -translate-x-1/2 rounded-full bg-[#3B82F6]/15 blur-[80px]" />

              {/* Header */}
              <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-[#343A40] bg-[#101317]/95 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#60A5FA]">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#F4F7FA]">Edit Group</h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  disabled={loading}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#343A40] bg-[#181C21] text-xs font-bold text-[#AAB2BD] transition-all hover:border-[#3B82F6]/50 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Form Body */}
              <div className="relative z-10 space-y-4 p-5 sm:p-6 text-[#F4F7FA]">
                <div className="rounded-2xl border border-[#343A40] bg-[#181C21]/90 p-3.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#AAB2BD]">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    className="mt-1.5 h-10 w-full rounded-xl border border-[#343A40] bg-[#101317] px-3 text-xs font-semibold text-[#F4F7FA] outline-none transition focus:border-[#3B82F6]"
                  />
                </div>

                <div className="rounded-2xl border border-[#343A40] bg-[#181C21]/90 p-3.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#AAB2BD]">
                    Description <span className="text-[10px] lowercase text-[#66707C]">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe your group..."
                    className="mt-1.5 w-full resize-none rounded-xl border border-[#343A40] bg-[#101317] p-3 text-xs text-[#F4F7FA] outline-none transition focus:border-[#3B82F6]"
                  />
                </div>

                {message && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-400">
                    {message}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="relative z-10 flex shrink-0 items-center justify-end gap-2.5 border-t border-[#343A40] bg-[#101317]/95 px-5 py-3.5 sm:px-6">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  disabled={loading}
                  className="h-10 rounded-xl border border-[#343A40] bg-[#181C21] px-4 text-xs font-semibold text-[#AAB2BD] transition-all hover:border-[#66707C] hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={loading}
                  className="group relative flex h-10 items-center justify-center overflow-hidden rounded-xl bg-[#3B82F6] px-5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all hover:bg-[#2563EB] active:scale-95 disabled:opacity-50"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span>{loading ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Modal (Portaled) */}
      {isDeleteOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setIsDeleteOpen(false);
            }}
          >
            <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-red-500/30 bg-[#101317] shadow-2xl shadow-black/90">
              {/* Glow */}
              <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-72 -translate-x-1/2 rounded-full bg-red-500/10 blur-[80px]" />

              <div className="relative z-10 p-6 sm:p-7 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A2 2 0 003.84 21h16.32a2 2 0 001.73-3.14l-8.18-14a2 2 0 00-3.42 0z" />
                  </svg>
                </div>

                <h2 className="mt-4 text-lg font-bold text-[#F4F7FA]">
                  Delete Group?
                </h2>

                <p className="mt-2 text-xs leading-relaxed text-[#AAB2BD]">
                  This will permanently delete <span className="font-semibold text-[#F4F7FA]">{initialName}</span> and all associated expenses and records.
                </p>

                <p className="mt-2 text-xs font-semibold text-red-400">
                  This action cannot be undone.
                </p>

                {message && (
                  <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-400">
                    {message}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsDeleteOpen(false)}
                    disabled={deleteLoading}
                    className="h-10 flex-1 rounded-xl border border-[#343A40] bg-[#181C21] px-4 text-xs font-semibold text-[#AAB2BD] transition-all hover:border-[#66707C] hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="h-10 flex-1 rounded-xl bg-red-500 px-5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all hover:bg-red-600 active:scale-95 disabled:opacity-50"
                  >
                    {deleteLoading ? "Deleting..." : "Delete Group"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}