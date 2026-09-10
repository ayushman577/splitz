"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardHistoryRefresh() {
    const router = useRouter();

    useEffect(() => {
        // Refresh dashboard data when the dashboard is first loaded.
        router.refresh();

        const handlePageShow = (
            event: PageTransitionEvent
        ) => {
            // Browser restored this page from back/forward cache.
            if (event.persisted) {
                window.location.reload();
            }
        };

        window.addEventListener(
            "pageshow",
            handlePageShow
        );

        return () => {
            window.removeEventListener(
                "pageshow",
                handlePageShow
            );
        };
    }, [router]);

    return null;
}