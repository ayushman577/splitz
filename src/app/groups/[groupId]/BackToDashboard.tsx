"use client";

import Link from "next/link";

export default function BackToDashboard() {
  return (
    <Link
      href="/dashboard"
      className="group inline-flex items-center gap-2 rounded-xl border border-[#343A40] bg-[#181C21]/80 px-3.5 py-1.5 text-xs font-semibold text-[#F4F7FA] shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-[#3B82F6]/60 hover:bg-[#1C222B] hover:text-[#60A5FA] active:scale-95"
    >
      <span className="text-xs transition-transform duration-200 group-hover:-translate-x-0.5">
        ←
      </span>
      <span>Dashboard</span>
    </Link>
  );
}