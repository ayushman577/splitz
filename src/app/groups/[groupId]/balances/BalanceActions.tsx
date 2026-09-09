"use client";

import { useState } from "react";

type BalanceActionsProps = {
    groupId: string;
    receiverId: string;
    amount: number;
};

export default function BalanceActions({
    groupId,
    receiverId,
    amount,
}: BalanceActionsProps) {
    const [loading, setLoading] =
        useState(false);

    async function handleMarkPaid() {
        try {
            setLoading(true);

            const response = await fetch(
                `/api/groups/${groupId}/payments`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        receiverId,
                        amount,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                        "Failed to mark payment"
                );
            }

            window.location.reload();
        } catch (error) {
            console.error(error);

            alert(
                error instanceof Error
                    ? error.message
                    : "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleMarkPaid}
            disabled={loading}
            className="rounded-xl bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
        >
            {loading
                ? "Processing..."
                : "Mark as Paid"}
        </button>
    );
}