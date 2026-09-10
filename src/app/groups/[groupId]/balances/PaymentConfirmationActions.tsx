"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PaymentConfirmationActionsProps = {
  groupId: string;
  paymentId: string;
};

export default function PaymentConfirmationActions({
  groupId,
  paymentId,
}: PaymentConfirmationActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handleAction(action: "approve" | "reject") {
    try {
      setLoading(action);

      const response = await fetch(
        `/api/groups/${groupId}/payments/${paymentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update payment");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Confirm Button */}
      <button
        type="button"
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
        className="group relative flex h-8 items-center justify-center overflow-hidden rounded-lg bg-[#3B82F6] px-3 text-xs font-semibold text-white shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all duration-150 hover:bg-[#2563EB] hover:shadow-[0_0_18px_rgba(59,130,246,0.45)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        <span className="relative flex items-center gap-1.5">
          {loading === "approve" ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
              <span>Confirming...</span>
            </>
          ) : (
            <>
              <span>Confirm</span>
              <span className="text-[11px] text-white/80">✓</span>
            </>
          )}
        </span>
      </button>

      {/* Reject Button */}
      <button
        type="button"
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
        className="flex h-8 items-center justify-center gap-1 rounded-lg border border-[#343A40] bg-[#181C21] px-2.5 text-xs font-semibold text-[#AAB2BD] transition-all duration-150 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading === "reject" ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border border-red-400/30 border-t-red-400" />
            <span>Rejecting...</span>
          </>
        ) : (
          <>
            <span>Decline</span>
            <span className="text-[11px] text-[#AAB2BD]/60">✕</span>
          </>
        )}
      </button>
    </div>
  );
}