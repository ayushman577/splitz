"use client";

import { useState } from "react";

type InviteActionsProps = {
    inviteLink: string;
};

export default function InviteActions({
    inviteLink,
}: InviteActionsProps) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(inviteLink);

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (error) {
            console.error("Copy failed:", error);
        }
    }

    async function handleShare() {
        const shareData = {
            title: "Join my SplitZ group",
            text: "Join my group on SplitZ:",
            url: inviteLink,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(inviteLink);
                setCopied(true);

                setTimeout(() => {
                    setCopied(false);
                }, 2000);
            }
        } catch (error) {
            // User cancelled the native share dialog
            console.log("Share cancelled or failed:", error);
        }
    }

    return (
        <div className="mt-4 flex flex-wrap gap-3">
            <button
                type="button"
                onClick={handleCopy}
                className="rounded-xl bg-[#3B82F6] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#2563EB]"
            >
                {copied ? "✓ Copied!" : "Copy Invite Link"}
            </button>

            <button
                type="button"
                onClick={handleShare}
                className="rounded-xl border border-[#343A40] px-4 py-2.5 text-sm font-medium transition hover:bg-[#343A40]/40"
            >
                Share Invite
            </button>
        </div>
    );
}