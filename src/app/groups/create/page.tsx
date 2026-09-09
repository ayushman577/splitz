"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateGroupPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setError("");

        if (!name.trim()) {
            setError("Group name is required.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/groups", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Failed to create group.");
                return;
            }


            router.replace(`/groups/${data.group.id}`);
        } catch (error) {
            console.error("Create group error:", error);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#101317] px-6 py-10 text-[#F4F7FA]">
            <div className="mx-auto max-w-2xl">

                <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="mb-6 text-sm text-[#AAB2BD] transition hover:text-[#F4F7FA]"
                >
                    ← Dashboard
                </button>

                <div className="rounded-2xl border border-[#343A40] bg-[#181C21] p-6 sm:p-8">

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Create a Group
                        </h1>

                        <p className="mt-2 text-sm text-[#AAB2BD]">
                            Create a group to start splitting expenses with others.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Group Name */}
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-2 block text-sm font-medium"
                            >
                                Group Name
                            </label>

                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Goa Trip"
                                maxLength={100}
                                className="w-full rounded-xl border border-[#343A40] bg-[#101317] px-4 py-3 text-sm text-[#F4F7FA] outline-none transition placeholder:text-[#6B7280] focus:border-[#3B82F6]"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label
                                htmlFor="description"
                                className="mb-2 block text-sm font-medium"
                            >
                                Description
                                <span className="ml-2 text-xs text-[#6B7280]">
                                    Optional
                                </span>
                            </label>

                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g. Expenses for our college trip"
                                rows={4}
                                maxLength={500}
                                className="w-full resize-none rounded-xl border border-[#343A40] bg-[#101317] px-4 py-3 text-sm text-[#F4F7FA] outline-none transition placeholder:text-[#6B7280] focus:border-[#3B82F6]"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-[#3B82F6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Creating Group..." : "Create Group"}
                        </button>

                    </form>
                </div>
            </div>
        </main>
    );
}