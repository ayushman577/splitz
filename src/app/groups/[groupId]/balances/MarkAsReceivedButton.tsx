"use client";

import { useState } from "react";

type MarkAsReceivedButtonProps = {
    groupId: string;
    payerId: string;
    amount: number;
};

export default function MarkAsReceivedButton({
    groupId,
    payerId,
    amount,
}: MarkAsReceivedButtonProps) {
    const [loading, setLoading] = useState(false);

    async function handleMarkAsReceived() {
        try {
            setLoading(true);

            const response = await fetch(
                `/api/groups/${groupId}/payments/received`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        payerId,
                        amount,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                        "Failed to mark payment as received"
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
            onClick={handleMarkAsReceived}
            disabled={loading}
            className="rounded-xl bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
        >
            {loading
                ? "Processing..."
                : "Mark as Received"}
        </button>
    );
}