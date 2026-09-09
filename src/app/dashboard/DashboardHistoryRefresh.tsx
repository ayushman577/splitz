"use client";

import { useEffect } from "react";

export default function DashboardHistoryRefresh() {
    useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            // Browser restored this page from its back/forward cache
            if (event.persisted) {
                window.location.reload();
            }
        };

        window.addEventListener("pageshow", handlePageShow);

        return () => {
            window.removeEventListener("pageshow", handlePageShow);
        };
    }, []);

    return null;
}