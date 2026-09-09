"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";


export default function JoinGroupPage() {
    const router = useRouter();

    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setError("");

        if (!code.trim()) {
            setError("Please enter an invite code or invite link.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/groups/join", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    code: code.trim(),
                }),
            });

            const data = await response.json();

            if (response.status === 409 && data.alreadyMember) {
                router.push(`/groups/${data.group.id}`);
                return;
            }

            if (!response.ok) {
                setError(data.message || "Unable to join group.");
                return;
            }

            router.push(`/groups/${data.group.id}`);
            router.refresh();
        } catch (error) {
            console.error("Join group error:", error);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#101317] px-6 py-10 text-[#F4F7FA]">
            <div className="mx-auto max-w-md">

                <button
                    type="button"
                    onClick={() => router.back()}
                    className="mb-6 text-sm text-[#AAB2BD] transition hover:text-[#F4F7FA]"
                >
                    ← Back
                </button>

                <div className="rounded-2xl border border-[#343A40] bg-[#181C21] p-6 sm:p-8">

                    <div className="text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3B82F6]/10 text-xl font-bold text-[#3B82F6]">
                            S<span className="text-[#F4F7FA]">Z</span>
                        </div>

                        <h1 className="mt-5 text-2xl font-bold">
                            Join a Group
                        </h1>

                        <p className="mt-2 text-sm text-[#AAB2BD]">
                            Enter the invite code or paste the invite link
                            shared with you.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="mt-8 space-y-5"
                    >
                        <div>
                            <label
                                htmlFor="code"
                                className="mb-2 block text-sm font-medium"
                            >
                                Invite Code or Link
                            </label>

                            <input
                                id="code"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="e.g. K7X9P2"
                                className="w-full rounded-xl border border-[#343A40] bg-[#101317] px-4 py-3 text-sm text-[#F4F7FA] outline-none transition placeholder:text-[#6B7280] focus:border-[#3B82F6]"
                            />
                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Joining Group..." : "Join Group"}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-xs text-[#6B7280]">
                        Example: K7X9P2
                    </p>
                </div>
            </div>
        </main>
    );
}