"use client";

import { useState } from "react";

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

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [payerId, setPayerId] = useState("");
    const [splitType, setSplitType] = useState<"EQUAL" | "CUSTOM">(
        "EQUAL"
    );

    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [customAmounts, setCustomAmounts] = useState<
        Record<string, string>
    >({});

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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
        setSelectedMembers((current) => {
            if (current.includes(userId)) {
                return current.filter((id) => id !== userId);
            }

            return [...current, userId];
        });
    }

    function updateCustomAmount(
        userId: string,
        value: string
    ) {
        setCustomAmounts((current) => ({
            ...current,
            [userId]: value,
        }));
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError("");

        if (!title.trim()) {
            setError("Payment title is required.");
            return;
        }

        const numericAmount = Number(amount);

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            setError("Enter a valid amount.");
            return;
        }

        if (!payerId) {
            setError("Please select who paid.");
            return;
        }

        if (selectedMembers.length === 0) {
            setError("Select at least one member.");
            return;
        }

        let splits;

        if (splitType === "EQUAL") {
            splits = selectedMembers.map((userId) => ({
                userId,
            }));
        } else {
            splits = selectedMembers.map((userId) => ({
                userId,
                amount: Number(customAmounts[userId]),
            }));

            const invalidAmount = splits.some(
                (split) =>
                    !Number.isFinite(split.amount) ||
                    split.amount <= 0
            );

            if (invalidAmount) {
                setError(
                    "Enter a valid amount for every selected member."
                );
                return;
            }

            const customTotal = splits.reduce(
                (total, split) => total + split.amount,
                0
            );

            if (
                Math.round(customTotal * 100) !==
                Math.round(numericAmount * 100)
            ) {
                setError(
                    `Custom split must total ₹${numericAmount.toFixed(
                        2
                    )}. Current total is ₹${customTotal.toFixed(2)}.`
                );
                return;
            }
        }

        setLoading(true);

        try {
            const response = await fetch(
                `/api/groups/${groupId}/expenses`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        title: title.trim(),
                        description:
                            description.trim() || null,
                        amount: numericAmount,
                        payerId,
                        splitType,
                        splits,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(
                    data.message ||
                        "Failed to add payment."
                );
                return;
            }

            setIsOpen(false);
            resetForm();

            // Refresh the current server-rendered group page.
            window.location.reload();
        } catch (error) {
            console.error(
                "Add payment error:",
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
        <>
            {/* Add Payment Button */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="rounded-xl bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2563EB]"
            >
                Add Payment
            </button>

            {/* Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeModal();
                        }
                    }}
                >
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#343A40] bg-[#181C21] shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-[#343A40] px-6 py-5">
                            <div>
                                <h2 className="text-xl font-bold">
                                    Add Payment
                                </h2>

                                <p className="mt-1 text-sm text-[#AAB2BD]">
                                    Record a payment and split it
                                    between group members.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={loading}
                                className="rounded-lg px-3 py-2 text-xl text-[#AAB2BD] transition hover:bg-[#101317] hover:text-white"
                            >
                                ×
                            </button>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-6 p-6"
                        >
                            {/* Title */}
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Payment title
                                </label>

                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) =>
                                        setTitle(
                                            e.target.value
                                        )
                                    }
                                    placeholder="e.g. Dinner"
                                    maxLength={100}
                                    className="w-full rounded-xl border border-[#343A40] bg-[#101317] px-4 py-3 text-sm text-[#F4F7FA] outline-none transition placeholder:text-[#66707C] focus:border-[#3B82F6]"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Description
                                    <span className="ml-2 text-xs text-[#66707C]">
                                        Optional
                                    </span>
                                </label>

                                <textarea
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(
                                            e.target.value
                                        )
                                    }
                                    placeholder="What was this payment for?"
                                    rows={3}
                                    className="w-full resize-none rounded-xl border border-[#343A40] bg-[#101317] px-4 py-3 text-sm text-[#F4F7FA] outline-none transition placeholder:text-[#66707C] focus:border-[#3B82F6]"
                                />
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Amount
                                </label>

                                <div className="flex items-center rounded-xl border border-[#343A40] bg-[#101317] focus-within:border-[#3B82F6]">
                                    <span className="px-4 text-[#AAB2BD]">
                                        ₹
                                    </span>

                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) =>
                                            setAmount(
                                                e.target.value
                                            )
                                        }
                                        placeholder="0.00"
                                        className="w-full bg-transparent px-2 py-3 text-sm text-[#F4F7FA] outline-none"
                                    />
                                </div>
                            </div>

                            {/* Payer */}
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Who paid?
                                </label>

                                <select
                                    value={payerId}
                                    onChange={(e) =>
                                        setPayerId(
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-xl border border-[#343A40] bg-[#101317] px-4 py-3 text-sm text-[#F4F7FA] outline-none focus:border-[#3B82F6]"
                                >
                                    <option value="">
                                        Select payer
                                    </option>

                                    {members.map(
                                        (member) => (
                                            <option
                                                key={
                                                    member.id
                                                }
                                                value={
                                                    member.id
                                                }
                                            >
                                                {member.name ||
                                                    member.email}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* Split Type */}
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Split
                                </label>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSplitType(
                                                "EQUAL"
                                            )
                                        }
                                        className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                                            splitType ===
                                            "EQUAL"
                                                ? "border-[#3B82F6] bg-[#3B82F6]/10 text-[#3B82F6]"
                                                : "border-[#343A40] bg-[#101317] text-[#AAB2BD] hover:border-[#66707C]"
                                        }`}
                                    >
                                        Equal Split
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSplitType(
                                                "CUSTOM"
                                            )
                                        }
                                        className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                                            splitType ===
                                            "CUSTOM"
                                                ? "border-[#3B82F6] bg-[#3B82F6]/10 text-[#3B82F6]"
                                                : "border-[#343A40] bg-[#101317] text-[#AAB2BD] hover:border-[#66707C]"
                                        }`}
                                    >
                                        Custom Split
                                    </button>
                                </div>
                            </div>

                            {/* Members */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="text-sm font-medium">
                                        Split between
                                    </label>

                                    <span className="text-xs text-[#AAB2BD]">
                                        {
                                            selectedMembers.length
                                        }{" "}
                                        selected
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {members.map(
                                        (member) => {
                                            const selected =
                                                selectedMembers.includes(
                                                    member.id
                                                );

                                            return (
                                                <div
                                                    key={
                                                        member.id
                                                    }
                                                    className={`rounded-xl border p-3 transition ${
                                                        selected
                                                            ? "border-[#3B82F6] bg-[#3B82F6]/5"
                                                            : "border-[#343A40] bg-[#101317]"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                selected
                                                            }
                                                            onChange={() =>
                                                                toggleMember(
                                                                    member.id
                                                                )
                                                            }
                                                            className="h-4 w-4 accent-[#3B82F6]"
                                                        />

                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-medium">
                                                                {member.name ||
                                                                    "Unnamed User"}
                                                            </p>

                                                            <p className="truncate text-xs text-[#AAB2BD]">
                                                                {
                                                                    member.email
                                                                }
                                                            </p>
                                                        </div>

                                                        {splitType ===
                                                            "CUSTOM" &&
                                                            selected && (
                                                                <div className="flex items-center rounded-lg border border-[#343A40] bg-[#181C21]">
                                                                    <span className="px-2 text-sm text-[#AAB2BD]">
                                                                        ₹
                                                                    </span>

                                                                    <input
                                                                        type="number"
                                                                        min="0.01"
                                                                        step="0.01"
                                                                        value={
                                                                            customAmounts[
                                                                                member
                                                                                    .id
                                                                            ] ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            updateCustomAmount(
                                                                                member.id,
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="0"
                                                                        className="w-24 bg-transparent px-2 py-2 text-sm text-[#F4F7FA] outline-none"
                                                                    />
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 border-t border-[#343A40] pt-5">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={loading}
                                    className="rounded-xl border border-[#343A40] bg-[#101317] px-5 py-3 text-sm font-medium text-[#AAB2BD] transition hover:border-[#66707C] hover:text-white disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="rounded-xl bg-[#3B82F6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading
                                        ? "Adding..."
                                        : "Add Payment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}