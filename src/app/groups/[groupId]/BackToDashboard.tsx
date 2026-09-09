"use client";

import { useRouter } from "next/navigation";

export default function BackToDashboard() {
    const router = useRouter();

    function handleDashboard() {
        router.push("/dashboard");
        router.refresh();
    }

    return (
        <button
            type="button"
            onClick={handleDashboard}
            className="text-sm text-[#AAB2BD] transition hover:text-[#F4F7FA]"
        >
            ← Dashboard
        </button>
    );
}