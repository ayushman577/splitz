"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Group = {
  id: string;
  name: string;
  description: string | null;
  joinCode: string;
};

type Activity = {
  id: string;
  title: string;
  description: string | null;
  amount: string;
  createdAt: string;
  group: {
    id: string;
    name: string;
  };
  payer: {
    id: string;
    name: string | null;
    email: string;
  };
  splitAmount: string;
};

type Props = {
  groups: Group[];
  activities: Activity[];
  currentUserId: string;
};

export default function DashboardInteractiveSections({
  groups,
  activities,
  currentUserId,
}: Props) {
  const [activeModal, setActiveModal] = useState<"groups" | "activity" | null>(
    null
  );

  useEffect(() => {
    if (!activeModal) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveModal(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeModal]);

  const previewGroups = groups.slice(0, 3);
  const previewActivities = activities.slice(0, 5);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getActivityText(activity: Activity) {
    const amount = Number(activity.amount).toFixed(2);

    if (activity.payer.id === currentUserId) {
      return `You paid ₹${amount}`;
    }

    return `${
      activity.payer.name || activity.payer.email
    } paid ₹${amount}`;
  }

  return (
    <>
      {/* =========================================
          YOUR GROUPS
      ========================================= */}
      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#F4F7FA]">Your Groups</h2>
            <p className="mt-1 text-sm text-[#AAB2BD]">
              Your groups on SplitZ
            </p>
          </div>

          {groups.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveModal("groups")}
              className="shrink-0 text-sm font-semibold text-[#3B82F6] transition hover:text-[#60A5FA]"
            >
              View all →
            </button>
          )}
        </div>

        {groups.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[#343A40] px-6 py-12 text-center">
            <p className="text-sm font-medium text-[#AAB2BD]">
              You haven&apos;t joined any groups yet.
            </p>
            <p className="mt-1 text-xs text-[#AAB2BD]/60">
              Create or join a group to get started.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {previewGroups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="group rounded-2xl border border-[#343A40] bg-[#181C21] p-5 transition hover:border-[#3B82F6]/60 hover:bg-[#1B2026]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-[#F4F7FA] transition group-hover:text-[#3B82F6]">
                      {group.name}
                    </h3>

                    {group.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-[#AAB2BD]">
                        {group.description}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 text-lg text-[#AAB2BD] transition group-hover:translate-x-1 group-hover:text-[#3B82F6]">
                    →
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#343A40]/70 pt-4">
                  <span className="text-xs text-[#AAB2BD]">Join code</span>
                  <span className="font-mono text-xs font-semibold tracking-wider text-[#F4F7FA]">
                    {group.joinCode}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* =========================================
          RECENT ACTIVITY
      ========================================= */}
      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#F4F7FA]">
              Recent Activity
            </h2>
            <p className="mt-1 text-sm text-[#AAB2BD]">
              Latest expenses across your groups
            </p>
          </div>

          {activities.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveModal("activity")}
              className="shrink-0 text-sm font-semibold text-[#3B82F6] transition hover:text-[#60A5FA]"
            >
              View all →
            </button>
          )}
        </div>

        {activities.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[#343A40] px-6 py-12 text-center">
            <span className="text-2xl">⚡</span>
            <p className="mt-2 text-sm font-medium text-[#AAB2BD]">
              No recent activity to show
            </p>
            <p className="mt-1 text-xs text-[#AAB2BD]/60">
              New expenses will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#343A40] bg-[#181C21]">
            {previewActivities.map((activity, index) => {
              const isPayer = activity.payer.id === currentUserId;

              return (
                <Link
                  key={activity.id}
                  href={`/groups/${activity.group.id}`}
                  className={`group flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#1B2026] ${
                    index !== previewActivities.length - 1
                      ? "border-b border-[#343A40]/70"
                      : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    {/* Directional Come/Go Indicator Icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                        isPayer
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border-red-500/20 bg-red-500/10 text-red-400"
                      }`}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        {isPayer ? (
                          /* Incoming arrow (You lent/paid, returning to you) */
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"
                          />
                        ) : (
                          /* Outgoing arrow (Someone else paid, you owe) */
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                          />
                        )}
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#F4F7FA] transition group-hover:text-[#3B82F6]">
                        {activity.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-[#AAB2BD]">
                        {activity.group.name}
                        {" · "}
                        {getActivityText(activity)}
                      </p>
                    </div>
                  </div>

                  {/* + or - Monetary Value */}
                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-semibold font-mono [font-feature-settings:'zero'] tabular-nums ${
                        isPayer ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {isPayer ? "+" : "-"}₹
                      {Number(activity.splitAmount).toFixed(2)}
                    </p>
                    <p className="mt-1 text-xs text-[#AAB2BD]">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================
          MODAL
      ========================================= */}
      {activeModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setActiveModal(null);
            }
          }}
        >
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#343A40] bg-[#11151A] shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#343A40] px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-lg font-bold text-[#F4F7FA]">
                  {activeModal === "groups" ? "All Groups" : "All Activity"}
                </h3>
                <p className="mt-1 text-xs text-[#AAB2BD]">
                  {activeModal === "groups"
                    ? `${groups.length} group${groups.length === 1 ? "" : "s"}`
                    : `${activities.length} activit${
                        activities.length === 1 ? "y" : "ies"
                      }`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#343A40] text-xl leading-none text-[#AAB2BD] transition hover:border-[#3B82F6]/50 hover:text-[#F4F7FA]"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-4 sm:p-6">
              {/* ALL GROUPS */}
              {activeModal === "groups" && (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/groups/${group.id}`}
                      onClick={() => setActiveModal(null)}
                      className="group flex items-center justify-between gap-4 rounded-xl border border-[#343A40] bg-[#181C21] px-4 py-4 transition hover:border-[#3B82F6]/60 hover:bg-[#1B2026]"
                    >
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-[#F4F7FA] transition group-hover:text-[#3B82F6]">
                          {group.name}
                        </h4>

                        {group.description && (
                          <p className="mt-1 line-clamp-1 text-xs text-[#AAB2BD]">
                            {group.description}
                          </p>
                        )}

                        <p className="mt-2 font-mono text-[11px] tracking-wider text-[#AAB2BD]/70">
                          {group.joinCode}
                        </p>
                      </div>

                      <span className="shrink-0 text-lg text-[#AAB2BD] transition group-hover:translate-x-1 group-hover:text-[#3B82F6]">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* ALL ACTIVITY */}
              {activeModal === "activity" && (
                <div className="space-y-3">
                  {activities.map((activity) => {
                    const isPayer = activity.payer.id === currentUserId;

                    return (
                      <Link
                        key={activity.id}
                        href={`/groups/${activity.group.id}`}
                        onClick={() => setActiveModal(null)}
                        className="group block rounded-xl border border-[#343A40] bg-[#181C21] p-4 transition hover:border-[#3B82F6]/60 hover:bg-[#1B2026]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 gap-3">
                            {/* Directional Come/Go Indicator Icon */}
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                                isPayer
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                  : "border-red-500/20 bg-red-500/10 text-red-400"
                              }`}
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                {isPayer ? (
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"
                                  />
                                ) : (
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                                  />
                                )}
                              </svg>
                            </div>

                            <div className="min-w-0">
                              <h4 className="truncate text-sm font-semibold text-[#F4F7FA] transition group-hover:text-[#3B82F6]">
                                {activity.title}
                              </h4>

                              <p className="mt-1 text-xs text-[#AAB2BD]">
                                {activity.group.name}
                              </p>

                              <p className="mt-1 text-xs text-[#AAB2BD]/70">
                                {getActivityText(activity)}
                              </p>

                              {activity.description && (
                                <p className="mt-2 line-clamp-2 text-xs text-[#AAB2BD]/60">
                                  {activity.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* + or - Monetary Value */}
                          <div className="shrink-0 text-right">
                            <p
                              className={`text-sm font-semibold font-mono [font-feature-settings:'zero'] tabular-nums ${
                                isPayer ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {isPayer ? "+" : "-"}₹
                              {Number(activity.splitAmount).toFixed(2)}
                            </p>

                            <p className="mt-1 text-[11px] text-[#AAB2BD]">
                              {formatDate(activity.createdAt)}
                            </p>
                          </div>
                        </div>
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