"use client";

import { useState } from "react";

type PaymentConfirmationActionsProps = {
    groupId: string;
    paymentId: string;
};

export default function PaymentConfirmationActions({
    groupId,
    paymentId,
}: PaymentConfirmationActionsProps) {
    const [loading, setLoading] = useState<
        "approve" | "reject" | null
    >(null);

    async function handleAction(
        action: "approve" | "reject"
    ) {
        try {
            setLoading(action);

            const response = await fetch(
                `/api/groups/${groupId}/payments/${paymentId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        action,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                        "Failed to update payment"
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
            setLoading(null);
        }
    }

    return (
        <div className="mt-4 flex gap-3">
            <button
                type="button"
                onClick={() =>
                    handleAction("approve")
                }
                disabled={loading !== null}
                className="rounded-xl bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading === "approve"
                    ? "Confirming..."
                    : "Confirm Payment"}
            </button>

            <button
                type="button"
                onClick={() =>
                    handleAction("reject")
                }
                disabled={loading !== null}
                className="rounded-xl border border-[#343A40] px-4 py-2 text-sm font-semibold text-[#AAB2BD] transition hover:border-[#66707C] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading === "reject"
                    ? "Rejecting..."
                    : "Reject"}
            </button>
        </div>
    );
}