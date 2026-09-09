"use client";

import { useState } from "react";

type Member = {
    id: string;
    name: string | null;
    email: string;
};

type Split = {
    userId: string;
    amount: number;
};

type ExpenseActionsProps = {
    groupId: string;
    expenseId: string;
    title: string;
    description: string | null;
    amount: number;
    payerId: string;
    splits: Split[];
    members: Member[];
    isOwner: boolean;
};

export default function ExpenseActions({
    groupId,
    expenseId,
    title,
    description,
    amount,
    payerId,
    splits,
    members,
    isOwner,
}: ExpenseActionsProps) {
    const [editing, setEditing] = useState(false);

    const [formTitle, setFormTitle] = useState(title);
    const [formDescription, setFormDescription] =
        useState(description || "");
    const [formAmount, setFormAmount] =
        useState(amount.toFixed(2));
    const [formPayerId, setFormPayerId] =
        useState(payerId);

    const [splitAmounts, setSplitAmounts] = useState<
        Record<string, string>
    >(
        Object.fromEntries(
            splits.map((split) => [
                split.userId,
                split.amount.toFixed(2),
            ])
        )
    );

    const [saving, setSaving] = useState(false);

    function resetForm() {
        setFormTitle(title);
        setFormDescription(description || "");
        setFormAmount(amount.toFixed(2));
        setFormPayerId(payerId);

        setSplitAmounts(
            Object.fromEntries(
                splits.map((split) => [
                    split.userId,
                    split.amount.toFixed(2),
                ])
            )
        );
    }

    function closeModal() {
        if (saving) return;

        resetForm();
        setEditing(false);
    }

    function toggleMember(userId: string) {
        setSplitAmounts((current) => {
            const next = { ...current };

            if (userId in next) {
                delete next[userId];
            } else {
                next[userId] = "0.00";
            }

            return next;
        });
    }

    function updateSplitAmount(
        userId: string,
        value: string
    ) {
        setSplitAmounts((current) => ({
            ...current,
            [userId]: value,
        }));
    }

    async function handleSave() {
        try {
            setSaving(true);

            const amountNumber = Number(formAmount);

            const splitEntries = Object.entries(
                splitAmounts
            );

            if (!formTitle.trim()) {
                alert("Payment title is required.");
                return;
            }

            if (
                !Number.isFinite(amountNumber) ||
                amountNumber <= 0
            ) {
                alert("Amount must be greater than zero.");
                return;
            }

            if (!splitEntries.length) {
                alert(
                    "At least one member must be selected."
                );
                return;
            }

            const splitTotal = splitEntries.reduce(
                (total, [, value]) =>
                    total + Number(value || 0),
                0
            );

            if (
                Math.round(splitTotal * 100) !==
                Math.round(amountNumber * 100)
            ) {
                alert(
                    `Split total must equal ₹${amountNumber.toFixed(
                        2
                    )}. Current total is ₹${splitTotal.toFixed(
                        2
                    )}.`
                );
                return;
            }

            const response = await fetch(
                `/api/groups/${groupId}/expenses/${expenseId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title: formTitle,
                        description: formDescription,
                        amount: amountNumber,
                        payerId: formPayerId,
                        splitType: "CUSTOM",
                        splits: splitEntries.map(
                            ([userId, value]) => ({
                                userId,
                                amount: Number(value),
                            })
                        ),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to update payment."
                );
            }

            window.location.reload();
        } catch (error) {
            console.error("Edit payment error:", error);

            alert(
                error instanceof Error
                    ? error.message
                    : "Something went wrong."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="rounded-lg border border-[#343A40] px-3 py-2 text-xs font-medium text-[#AAB2BD] transition hover:border-[#66707C] hover:text-white"
                >
                    Edit
                </button>

                
            </div>

            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#343A40] bg-[#181C21] p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    Edit Payment
                                </h2>

                                <p className="mt-1 text-sm text-[#AAB2BD]">
                                    Update the expense details and split.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                className="text-xl text-[#66707C] transition hover:text-white"
                            >
                                ×
                            </button>
                        </div>

                        {/* Title */}
                        <div className="mt-6">
                            <label className="text-sm font-medium">
                                Payment title
                            </label>

                            <input
                                value={formTitle}
                                onChange={(e) =>
                                    setFormTitle(e.target.value)
                                }
                                maxLength={100}
                                className="mt-2 w-full rounded-xl border border-[#343A40] bg-[#101317] px-4 py-3 text-sm text-white outline-none transition focus:border-[#3B82F6]"
                            />
                        </div>

                        {/* Description */}
                        <div className="mt-4">
                            <label className="text-sm font-medium">
                                Description
                            </label>

                            <textarea
                                value={formDescription}
                                onChange={(e) =>
                                    setFormDescription(
                                        e.target.value
                                    )
                                }
                                rows={3}
                                className="mt-2 w-full resize-none rounded-xl border border-[#343A40] bg-[#101317] px-4 py-3 text-sm text-white outline-none transition focus:border-[#3B82F6]"
                            />
                        </div>

                        {/* Amount */}
                        <div className="mt-4">
                            <label className="text-sm font-medium">
                                Amount
                            </label>

                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={formAmount}
                                onChange={(e) =>
                                    setFormAmount(
                                        e.target.value
                                    )
                                }
                                className="mt-2 w-full rounded-xl border border-[#343A40] bg-[#101317] px-4 py-3 text-sm text-white outline-none transition focus:border-[#3B82F6]"
                            />
                        </div>

                        {/* Payer */}
                        <div className="mt-4">
                            <label className="text-sm font-medium">
                                Paid by
                            </label>

                            <select
                                value={formPayerId}
                                onChange={(e) =>
                                    setFormPayerId(e.target.value)
                                }
                                disabled={!isOwner}
                                className="mt-2 w-full rounded-xl border border-[#343A40] bg-[#101317] px-4 py-3 text-sm text-white outline-none focus:border-[#3B82F6] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {members.map((member) => (
                                    <option
                                        key={member.id}
                                        value={member.id}
                                    >
                                        {member.name || member.email}
                                    </option>
                                ))}
                            </select>

                            {!isOwner && (
                                <p className="mt-2 text-xs text-[#66707C]">
                                    Only the group owner can change who paid.
                                </p>
                            )}
                        </div>

                        {/* Members */}
                        <div className="mt-6">
                            <p className="text-sm font-medium">
                                Split between
                            </p>

                            <div className="mt-3 space-y-2">
                                {members.map((member) => {
                                    const selected =
                                        member.id in
                                        splitAmounts;

                                    return (
                                        <div
                                            key={member.id}
                                            className="flex items-center gap-3 rounded-xl bg-[#101317] px-4 py-3"
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleMember(
                                                        member.id
                                                    )
                                                }
                                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected
                                                        ? "border-[#3B82F6] bg-[#3B82F6]"
                                                        : "border-[#66707C]"
                                                    }`}
                                            >
                                                {selected && (
                                                    <span className="text-xs font-bold text-white">
                                                        ✓
                                                    </span>
                                                )}
                                            </button>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {member.name ||
                                                        member.email}
                                                </p>

                                                <p className="truncate text-xs text-[#66707C]">
                                                    {member.email}
                                                </p>
                                            </div>

                                            {selected && (
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={
                                                        splitAmounts[
                                                        member.id
                                                        ]
                                                    }
                                                    onChange={(e) =>
                                                        updateSplitAmount(
                                                            member.id,
                                                            e.target
                                                                .value
                                                        )
                                                    }
                                                    className="w-28 rounded-lg border border-[#343A40] bg-[#181C21] px-3 py-2 text-right text-sm text-white outline-none focus:border-[#3B82F6]"
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Split Total */}
                        <div className="mt-4 flex items-center justify-between rounded-xl border border-[#343A40] bg-[#101317] px-4 py-3">
                            <span className="text-sm text-[#AAB2BD]">
                                Split total
                            </span>

                            <span className="text-sm font-semibold">
                                ₹
                                {Object.values(
                                    splitAmounts
                                )
                                    .reduce(
                                        (total, value) =>
                                            total +
                                            Number(
                                                value || 0
                                            ),
                                        0
                                    )
                                    .toFixed(2)}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                className="rounded-xl border border-[#343A40] px-4 py-2.5 text-sm font-medium text-[#AAB2BD] transition hover:border-[#66707C] hover:text-white disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="rounded-xl bg-[#3B82F6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}