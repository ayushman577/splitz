"use client";

import { useState } from "react";

type InviteActionsProps = {
  inviteLink: string;
};

export default function InviteActions({ inviteLink }: InviteActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my SplitZ group",
          text: "Join my group on SplitZ to split expenses easily!",
          url: inviteLink,
        });
      } catch {
        // Dismissed or unsupported
      }
    } else {
      handleCopy();
    }
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {/* Copy Button */}
      <button
        type="button"
        onClick={handleCopy}
        className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#3B82F6] px-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#2563EB] active:scale-95"
      >
        <span>{copied ? "Copied!" : "Copy"}</span>
        {copied && <span className="text-[11px]">✓</span>}
      </button>

      {/* Share Icon Button */}
      <button
        type="button"
        onClick={handleShare}
        title="Share link"
        aria-label="Share invite link"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#343A40] bg-[#181C21] text-[#AAB2BD] transition-all hover:border-[#3B82F6]/50 hover:text-white active:scale-95"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </button>
    </div>
  );
}