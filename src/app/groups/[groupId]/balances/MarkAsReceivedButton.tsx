"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleMarkReceived() {
    setLoading(true);
    try {
      const response = await fetch("/api/payments/settle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId,
          payerId,
          amount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to record settlement");
      }

      router.refresh();
    } catch (err) {
      console.error("Settlement error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleMarkReceived}
      disabled={loading}
      className="group relative flex h-9 items-center justify-center overflow-hidden rounded-xl bg-[#3B82F6] px-3.5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-150 hover:bg-[#2563EB] hover:shadow-[0_0_22px_rgba(59,130,246,0.5)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative flex items-center gap-1.5">
        {loading ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
            <span>Confirming...</span>
          </>
        ) : (
          <>
            <span>Mark Received</span>
            <span className="text-[11px] text-white/80">✓</span>
          </>
        )}
      </span>
    </button>
  );
}