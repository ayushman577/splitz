"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Member = {
  id: string;
  name: string | null;
  email: string;
};

type AddPaymentModalProps = {
  groupId: string;
  members: Member[];
};

export default function AddPaymentModal({
  groupId,
  members,
}: AddPaymentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState("");
  const [splitType, setSplitType] = useState<"EQUAL" | "CUSTOM">("EQUAL");

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [undoExpenseId, setUndoExpenseId] = useState<string | null>(null);
  const [undoSeconds, setUndoSeconds] = useState(0);
  const [undoLoading, setUndoLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (members.length > 0 && selectedMembers.length === 0) {
        setSelectedMembers(members.map((m) => m.id));
      }
      if (!payerId && members.length > 0) {
        setPayerId(members[0].id);
      }
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, members]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setAmount("");
    setPayerId("");
    setSplitType("EQUAL");
    setSelectedMembers([]);
    setCustomAmounts({});
    setError("");
  }

  function closeModal() {
    if (loading) return;
    setIsOpen(false);
    resetForm();
  }

  function toggleMember(userId: string) {
    setSelectedMembers((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  }

  function selectAllMembers() {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map((m) => m.id));
    }
  }

  function updateCustomAmount(userId: string, value: string) {
    setCustomAmounts((current) => ({
      ...current,
      [userId]: value,
    }));
  }

  useEffect(() => {
    if (!undoExpenseId || undoSeconds <= 0) return;
    const timer = setTimeout(() => {
      setUndoSeconds((s) => s - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [undoExpenseId, undoSeconds]);

  useEffect(() => {
    if (!undoExpenseId || undoSeconds !== 0) return;
    setUndoExpenseId(null);
    window.location.reload();
  }, [undoExpenseId, undoSeconds]);

  async function handleUndoExpense() {
    if (!undoExpenseId || undoLoading) return;
    try {
      setUndoLoading(true);
      const res = await fetch(
        `/api/groups/${groupId}/expenses/${undoExpenseId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to undo expense.");
      }
      setUndoExpenseId(null);
      setUndoSeconds(0);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to undo expense.");
    } finally {
      setUndoLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please provide an expense title.");
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid expense amount.");
      return;
    }

    if (!payerId) {
      setError("Please choose who covered the bill.");
      return;
    }

    if (selectedMembers.length === 0) {
      setError("Select at least one member to split with.");
      return;
    }

    let splits;
    if (splitType === "EQUAL") {
      splits = selectedMembers.map((userId) => ({ userId }));
    } else {
      splits = selectedMembers.map((userId) => ({
        userId,
        amount: Number(customAmounts[userId]),
      }));

      const invalidAmount = splits.some(
        (s) => !Number.isFinite(s.amount) || s.amount <= 0
      );

      if (invalidAmount) {
        setError("Every selected member must have a valid split amount.");
        return;
      }

      const customTotal = splits.reduce((acc, s) => acc + s.amount, 0);
      if (Math.round(customTotal * 100) !== Math.round(numericAmount * 100)) {
        setError(
          `Custom split must total ₹${numericAmount.toFixed(
            2
          )}. (Current total: ₹${customTotal.toFixed(2)})`
        );
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          amount: numericAmount,
          payerId,
          splitType,
          splits,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to log expense.");
        return;
      }

      setIsOpen(false);
      resetForm();
      setUndoExpenseId(data.expense.id);
      setUndoSeconds(5);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const numericVal = Number(amount) || 0;
  const equalShare =
    selectedMembers.length > 0 && numericVal > 0
      ? (numericVal / selectedMembers.length).toFixed(2)
      : "0.00";

  const triggerButton = (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className="group relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#3B82F6] px-4 text-xs font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-150 hover:bg-[#2563EB] hover:shadow-[0_0_24px_rgba(59,130,246,0.45)] active:scale-95"
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="text-sm font-bold leading-none">+</span>
      <span>Add Expense</span>
    </button>
  );

  const modalDialog =
    isOpen && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 sm:p-6 backdrop-blur-md"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            {/* Modal Card Box */}
            <div className="relative flex h-full max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#343A40] bg-[#101317] shadow-2xl shadow-black/90">
              
              {/* Background Ambient Glow */}
              <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-80 -translate-x-1/2 rounded-full bg-[#3B82F6]/15 blur-[90px]" />

              {/* Pinned Header */}
              <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-[#343A40] bg-[#101317]/95 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-xs font-bold text-[#60A5FA]">
                    ₹
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#F4F7FA]">
                      Add Expense
                    </h2>
                    
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#343A40] bg-[#181C21] text-xs font-bold text-[#AAB2BD] transition-all hover:border-[#3B82F6]/50 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form
                onSubmit={handleSubmit}
                className="relative z-10 flex min-h-0 flex-1 flex-col justify-between"
              >
                <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6 [scrollbar-width:thin] [scrollbar-color:#343A40_transparent]">
                  
                  {/* Top Metric Strip: Amount & Title */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                    {/* Amount Card */}
                    <div className="rounded-2xl border border-[#343A40] bg-[#181C21]/90 p-4 sm:col-span-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#AAB2BD]">
                        Amount
                      </span>
                      <div className="mt-1 flex items-baseline gap-1 font-mono [font-feature-settings:'zero']">
                        <span className="text-lg font-bold text-[#3B82F6]">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          autoFocus
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-transparent font-mono text-2xl font-bold tracking-tight text-[#F4F7FA] outline-none placeholder:text-[#343A40]"
                        />
                      </div>
                    </div>

                    {/* Title Card */}
                    <div className="flex flex-col justify-between rounded-2xl border border-[#343A40] bg-[#181C21]/90 p-4 sm:col-span-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#AAB2BD]">
                        Expense Title
                      </span>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Dinner, Uber, Groceries"
                        className="mt-1 w-full bg-transparent text-sm font-semibold text-[#F4F7FA] outline-none placeholder:text-[#66707C]"
                      />
                    </div>
                  </div>

                  {/* Payer & Split Mode Segment */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Payer Card */}
                    <div className="rounded-2xl border border-[#343A40] bg-[#181C21]/90 p-4">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#AAB2BD]">
                        Paid By
                      </label>
                      <div className="mt-1.5 flex h-10 items-center rounded-xl border border-[#343A40] bg-[#101317] px-3 focus-within:border-[#3B82F6]">
                        <select
                          value={payerId}
                          onChange={(e) => setPayerId(e.target.value)}
                          className="w-full bg-transparent text-xs font-medium text-[#F4F7FA] outline-none cursor-pointer"
                        >
                          {members.map((m) => (
                            <option key={m.id} value={m.id} className="bg-[#181C21] text-[#F4F7FA]">
                              {m.name || m.email.split("@")[0]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Split Mode Card */}
                    <div className="rounded-2xl border border-[#343A40] bg-[#181C21]/90 p-4">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#AAB2BD]">
                        Split Method
                      </label>
                      <div className="mt-1.5 flex h-10 items-center gap-1 rounded-xl border border-[#343A40] bg-[#101317] p-1">
                        <button
                          type="button"
                          onClick={() => setSplitType("EQUAL")}
                          className={`flex-1 rounded-lg py-1 text-xs font-semibold transition ${
                            splitType === "EQUAL"
                              ? "bg-[#3B82F6] text-white shadow-sm"
                              : "text-[#AAB2BD] hover:text-[#F4F7FA]"
                          }`}
                        >
                          Equally
                        </button>
                        <button
                          type="button"
                          onClick={() => setSplitType("CUSTOM")}
                          className={`flex-1 rounded-lg py-1 text-xs font-semibold transition ${
                            splitType === "CUSTOM"
                              ? "bg-[#3B82F6] text-white shadow-sm"
                              : "text-[#AAB2BD] hover:text-[#F4F7FA]"
                          }`}
                        >
                          Custom
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Note Description Input */}
                  <div className="rounded-2xl border border-[#343A40] bg-[#181C21]/90 p-4">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#AAB2BD]">
                      Note <span className="text-[10px] lowercase text-[#66707C]">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add receipt details, notes..."
                      className="mt-1.5 w-full rounded-xl border border-[#343A40] bg-[#101317] px-3.5 py-2.5 text-xs text-[#F4F7FA] outline-none placeholder:text-[#66707C] focus:border-[#3B82F6]"
                    />
                  </div>

                  {/* Split Participant Grid Container */}
                  <div className="rounded-2xl border border-[#343A40] bg-[#181C21]/90 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                        <span className="text-xs font-bold text-[#F4F7FA]">
                          Split With ({selectedMembers.length}/{members.length})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={selectAllMembers}
                        className="text-xs font-semibold text-[#3B82F6] hover:underline"
                      >
                        {selectedMembers.length === members.length ? "Deselect all" : "Select all"}
                      </button>
                    </div>

                    {/* Member Pill Tiles */}
                    <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 [scrollbar-width:thin] [scrollbar-color:#343A40_transparent]">
                      {members.map((member) => {
                        const selected = selectedMembers.includes(member.id);

                        return (
                          <div
                            key={member.id}
                            onClick={() => toggleMember(member.id)}
                            className={`flex cursor-pointer items-center justify-between gap-2.5 rounded-xl border p-2.5 transition-all ${
                              selected
                                ? "border-[#3B82F6]/60 bg-[#3B82F6]/10 text-white shadow-sm"
                                : "border-[#343A40] bg-[#101317] text-[#AAB2BD] hover:border-[#66707C]"
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              {/* Selection Box */}
                              <div
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-all ${
                                  selected
                                    ? "border-[#3B82F6] bg-[#3B82F6] text-white shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                                    : "border-[#343A40] bg-[#181C21]"
                                }`}
                              >
                                {selected && (
                                  <svg className="h-2.5 w-2.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                )}
                              </div>
                              <span className="truncate text-xs font-semibold">
                                {member.name || member.email.split("@")[0]}
                              </span>
                            </div>

                            {/* Share Value / Custom Input */}
                            {splitType === "CUSTOM" && selected ? (
                              <div
                                className="flex h-7 w-20 shrink-0 items-center rounded-lg border border-[#343A40] bg-[#101317] px-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="text-[10px] text-[#66707C]">₹</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={customAmounts[member.id] || ""}
                                  onChange={(e) => updateCustomAmount(member.id, e.target.value)}
                                  placeholder="0.00"
                                  className="w-full bg-transparent px-1 font-mono text-[11px] font-bold text-[#F4F7FA] outline-none"
                                />
                              </div>
                            ) : (
                              selected && (
                                <span className="font-mono text-xs font-semibold text-[#60A5FA]">
                                  ₹{equalShare}
                                </span>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Error Box */}
                  {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-400">
                      {error}
                    </div>
                  )}
                </div>

                {/* Pinned Bottom Footer */}
                <div className="flex shrink-0 items-center justify-between border-t border-[#343A40] bg-[#101317]/95 px-5 py-3.5 sm:px-6">
                  <div className="hidden font-mono text-xs text-[#AAB2BD] sm:block">
                    Total: <span className="font-bold text-[#F4F7FA]">₹{numericVal.toFixed(2)}</span>
                  </div>

                  <div className="flex w-full items-center justify-end gap-2.5 sm:w-auto">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={loading}
                      className="h-10 flex-1 rounded-xl border border-[#343A40] bg-[#181C21] px-4 text-xs font-semibold text-[#AAB2BD] transition-all hover:border-[#66707C] hover:text-white sm:flex-initial"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative flex h-10 flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-[#3B82F6] px-5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all hover:bg-[#2563EB] active:scale-95 disabled:opacity-50 sm:flex-initial"
                    >
                      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      <span>{loading ? "Adding..." : "Confirm & Split"}</span>
                      {!loading && <span>✓</span>}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {triggerButton}
      {modalDialog}

      {/* Undo Toast */}
      {undoExpenseId &&
        undoSeconds > 0 &&
        mounted &&
        createPortal(
          <div className="fixed bottom-6 left-1/2 z-[10000] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-[#343A40] bg-[#181C21]/95 px-4 py-3 shadow-2xl backdrop-blur-md">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#F4F7FA]">Expense logged</p>
              <p className="text-[11px] text-[#AAB2BD]">Undo available for {undoSeconds}s</p>
            </div>

            <button
              type="button"
              onClick={handleUndoExpense}
              disabled={undoLoading}
              className="flex h-8 items-center rounded-lg border border-[#3B82F6]/50 bg-[#3B82F6]/10 px-3 text-xs font-semibold text-[#60A5FA] transition-all hover:bg-[#3B82F6]/20 active:scale-95 disabled:opacity-50"
            >
              {undoLoading ? "Undoing..." : "Undo"}
            </button>
          </div>,
          document.body
        )}
    </>
  );
}