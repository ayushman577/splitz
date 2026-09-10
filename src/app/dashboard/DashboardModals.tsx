"use client";

import { useState } from "react";
import Link from "next/link";

type Group = {
  id: string;
  name: string;
  description: string | null;
  joinedAt: Date | string;
  isAdmin: boolean;
};

type Activity = {
  id: string;
  title: string;
  amount: number;
  groupId: string;
  groupName: string;
  payerName: string;
  createdAt: Date | string;
  yourShare: number;
};

type DashboardModalsProps = {
  groups: Group[];
  activities: Activity[];
};

export default function DashboardModals({
  groups,
  activities,
}: DashboardModalsProps) {
  const [showGroups, setShowGroups] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  return (
    <>
      {/* ======================================================
          VIEW ALL BUTTONS
      ====================================================== */}

      <div className="hidden">
        {showGroups}
        {showActivity}
      </div>

      {/* ======================================================
          GROUP MODAL TRIGGER
      ====================================================== */}

      <button
        type="button"
        onClick={() => setShowGroups(true)}
        className="text-xs font-medium text-[#3B82F6] transition hover:text-[#60A5FA]"
      >
        View all →
      </button>

      {/* ======================================================
          ACTIVITY MODAL TRIGGER
      ====================================================== */}

      <button
        type="button"
        onClick={() => setShowActivity(true)}
        className="text-xs font-medium text-[#3B82F6] transition hover:text-[#60A5FA]"
      >
        View all →
      </button>

      {/* ======================================================
          GROUP MODAL
      ====================================================== */}

      {showGroups && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowGroups(false);
            }
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#343A40] bg-[#12161B] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#343A40] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-[#F4F7FA]">
                  Your Groups
                </h2>

                <p className="mt-0.5 text-xs text-[#8B949E]">
                  All groups you are currently part of
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowGroups(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#343A40] text-[#AAB2BD] transition hover:bg-[#343A40]/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Groups */}
            <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5">
              {groups.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-[#AAB2BD]">
                    You are not part of any groups yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/groups/${group.id}`}
                      onClick={() => setShowGroups(false)}
                      className="group flex items-center justify-between rounded-xl border border-[#343A40] bg-[#181C21]/60 p-4 transition hover:border-[#3B82F6]/50 hover:bg-[#181C21]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-[#F4F7FA] group-hover:text-[#3B82F6]">
                            {group.name}
                          </h3>

                          {group.isAdmin && (
                            <span className="shrink-0 rounded-md border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-2 py-0.5 text-[10px] font-medium text-[#3B82F6]">
                              Admin
                            </span>
                          )}
                        </div>

                        {group.description ? (
                          <p className="mt-1 line-clamp-1 text-xs text-[#8B949E]">
                            {group.description}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs italic text-[#6F7780]">
                            No description
                          </p>
                        )}

                        <p className="mt-2 text-[11px] text-[#6F7780]">
                          Joined{" "}
                          {new Date(
                            group.joinedAt
                          ).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      <span className="ml-4 shrink-0 text-[#3B82F6] transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          ACTIVITY MODAL
      ====================================================== */}

      {showActivity && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowActivity(false);
            }
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#343A40] bg-[#12161B] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#343A40] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-[#F4F7FA]">
                  Recent Activity
                </h2>

                <p className="mt-0.5 text-xs text-[#8B949E]">
                  Your latest expenses across all groups
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowActivity(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#343A40] text-[#AAB2BD] transition hover:bg-[#343A40]/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Activity */}
            <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5">
              {activities.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="text-2xl">⚡</span>

                  <p className="mt-3 text-sm font-medium text-[#AAB2BD]">
                    No activity yet
                  </p>

                  <p className="mt-1 text-xs text-[#6F7780]">
                    Your expenses will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => {
                    const date = new Date(
                      activity.createdAt
                    ).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });

                    const time = new Date(
                      activity.createdAt
                    ).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <Link
                        key={activity.id}
                        href={`/groups/${activity.groupId}`}
                        onClick={() => setShowActivity(false)}
                        className="group flex items-center gap-4 rounded-xl border border-[#343A40] bg-[#181C21]/60 p-4 transition hover:border-[#3B82F6]/50 hover:bg-[#181C21]"
                      >
                        {/* Icon */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/10 text-lg">
                          ₹
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-semibold text-[#F4F7FA] transition-colors group-hover:text-[#3B82F6]">
                            {activity.title}
                          </h3>

                          <p className="mt-1 truncate text-xs text-[#AAB2BD]">
                            {activity.groupName} · Paid by{" "}
                            {activity.payerName}
                          </p>

                          <p className="mt-1 text-[11px] text-[#6F7780]">
                            {date} · {time}
                          </p>
                        </div>

                        {/* Amount */}
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-[#F4F7FA]">
                            ₹{activity.yourShare.toFixed(2)}
                          </p>

                          <p className="mt-1 text-[10px] text-[#6F7780]">
                            Your share
                          </p>
                        </div>

                        <span className="hidden text-[#3B82F6] transition-transform group-hover:translate-x-1 sm:block">
                          →
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
