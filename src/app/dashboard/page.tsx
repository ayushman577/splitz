import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateGroupSettlements } from "@/lib/balances";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfileMenu from "./ProfileMenu";
import DashboardHistoryRefresh from "./DashboardHistoryRefresh";
import DashboardInteractiveSections from "./DashboardInteractiveSections";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      groupMemberships: {
        include: {
          group: true,
        },
        orderBy: {
          joinedAt: "desc",
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const groups = user.groupMemberships;

  /* =========================================
     CALCULATE DASHBOARD BALANCES
  ========================================= */
  let totalOwe = 0;
  let totalOwed = 0;

  for (const membership of groups) {
    const settlements = await calculateGroupSettlements(
      membership.group.id
    );

    for (const settlement of settlements) {
      /*
       * fromUserId -> person who has to pay
       * toUserId   -> person who receives
       */

      if (settlement.fromUserId === user.id) {
        totalOwe += settlement.amount;
      }

      if (settlement.toUserId === user.id) {
        totalOwed += settlement.amount;
      }
    }
  }

  totalOwe =
    Math.round((totalOwe + Number.EPSILON) * 100) / 100;

  totalOwed =
    Math.round((totalOwed + Number.EPSILON) * 100) / 100;

  const netBalance =
    Math.round(
      (totalOwed - totalOwe + Number.EPSILON) * 100
    ) / 100;

  /* =========================================
     GROUP IDS & ALL RECENT ACTIVITY
  ========================================= */
  const groupIds = groups.map(
    (membership) => membership.group.id
  );

  const allRecentExpenses =
    groupIds.length > 0
      ? await prisma.expense.findMany({
          where: {
            groupId: {
              in: groupIds,
            },
            splits: {
              some: {
                userId: user.id,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            group: {
              select: {
                id: true,
                name: true,
              },
            },
            payer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            splits: {
              where: {
                userId: user.id,
              },
              select: {
                amount: true,
              },
            },
          },
        })
      : [];

  /* =========================================
     SERIALIZABLE DATA
  ========================================= */
  const dashboardGroups = groups.map((membership) => ({
    id: membership.group.id,
    name: membership.group.name,
    description: membership.group.description,
    joinCode: membership.group.joinCode,
  }));

  const dashboardActivities = allRecentExpenses.map(
    (expense) => ({
      id: expense.id,
      title: expense.title,
      description: expense.description,
      amount: expense.amount.toString(),
      createdAt: expense.createdAt.toISOString(),
      group: {
        id: expense.group.id,
        name: expense.group.name,
      },
      payer: {
        id: expense.payer.id,
        name: expense.payer.name,
        email: expense.payer.email,
      },
      splitAmount:
        expense.splits[0]?.amount.toString() ?? "0.00",
    })
  );

  const firstName = (user.name || "there").split(" ")[0];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#101317] font-['Inter'] text-[#F4F7FA] selection:bg-[#3B82F6] selection:text-white">
      <DashboardHistoryRefresh />

      {/* Atmospheric lighting glows */}
      <div className="pointer-events-none fixed left-1/2 top-[-120px] h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[#3B82F6]/10 blur-[170px]" />

      <div className="pointer-events-none fixed bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-[#343A40]/30 blur-[160px]" />

      {/* =========================================
          CLEAN HEADER
      ========================================= */}
      <header className="sticky top-0 z-40 border-b border-[#343A40]/80 bg-[#101317]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* SplitZ Logo */}
          <Link
            href="/dashboard"
            className="group font-['Inter'] text-2xl font-black tracking-tight text-[#F4F7FA] transition-transform duration-200 active:scale-95"
          >
            <span className="bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#A78BFA] bg-clip-text text-transparent transition-all duration-200 group-hover:opacity-90">
              SplitZ.
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ProfileMenu
              name={user.name || "User"}
              email={user.email}
            />
          </div>
        </div>
      </header>

      {/* =========================================
          MAIN STAGE
      ========================================= */}
      <main className="relative z-10 mx-auto max-w-6xl space-y-6 px-4 py-7 transition-opacity duration-500 ease-out sm:space-y-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Header Greeting & Action Row */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#F4F7FA] sm:text-3xl lg:text-4xl">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#A78BFA] bg-clip-text text-transparent">
                {firstName}!
              </span>
            </h1>

            <p className="text-xs text-[#AAB2BD] sm:text-sm">
              Real-time summary of group obligations, credits,
              and settlements.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:shrink-0 sm:items-center">
            <Link
              href="/groups/join"
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#343A40] bg-[#181C21] px-4 text-xs font-semibold text-[#F4F7FA] shadow-md shadow-black/30 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#AAB2BD]/40 hover:bg-[#343A40]/60 active:translate-y-0 active:scale-95 sm:h-11 sm:text-sm"
            >
              <svg
                className="h-4 w-4 text-[#AAB2BD]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>

              <span>Join Group</span>
            </Link>

            <Link
              href="/groups/create"
              className="group relative flex h-10 items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#3B82F6] px-5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#2563EB] hover:shadow-[0_0_28px_rgba(59,130,246,0.5)] active:translate-y-0 active:scale-95 sm:h-11 sm:text-sm"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

              <span className="text-base font-bold leading-none">
                ＋
              </span>

              <span className="relative">
                Create Group
              </span>
            </Link>
          </div>
        </div>

        {/* =========================================
            SUMMARY METRICS CARDS
        ========================================= */}
        <div className="grid gap-3.5 sm:grid-cols-3 sm:gap-4">
          {/* You Owe */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#343A40]/70 bg-gradient-to-b from-[#181316]/80 to-[#101317] p-5 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/35 hover:shadow-[0_4px_25px_rgba(239,68,68,0.1)]">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-red-400" />

                  <span className="text-xs font-medium uppercase tracking-wider text-red-400/90">
                    You Owe
                  </span>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
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
                      d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                    />
                  </svg>
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5 font-mono [font-feature-settings:'zero']">
                <span className="text-lg font-normal text-red-400/70 sm:text-xl">
                  ₹
                </span>

                <p className="text-2xl font-medium tracking-tight text-red-400 tabular-nums sm:text-3xl">
                  {totalOwe.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-[#343A40]/40 pt-3">
              <p className="text-xs text-[#AAB2BD]/80">
                {totalOwe === 0
                  ? "No pending payments"
                  : "Pending payback to friends"}
              </p>
            </div>
          </div>

          {/* You Are Owed */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#343A40]/70 bg-gradient-to-b from-[#111816]/80 to-[#101317] p-5 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/35 hover:shadow-[0_4px_25px_rgba(16,185,129,0.1)]">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400" />

                  <span className="text-xs font-medium uppercase tracking-wider text-emerald-400/90">
                    You Are Owed
                  </span>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
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
                      d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"
                    />
                  </svg>
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5 font-mono [font-feature-settings:'zero']">
                <span className="text-lg font-normal text-emerald-400/70 sm:text-xl">
                  ₹
                </span>

                <p className="text-2xl font-medium tracking-tight text-emerald-400 tabular-nums sm:text-3xl">
                  {totalOwed.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-[#343A40]/40 pt-3">
              <p className="text-xs text-[#AAB2BD]/80">
                {totalOwed === 0
                  ? "All debts are settled"
                  : "Upcoming returns from friends"}
              </p>
            </div>
          </div>

          {/* Net Balance */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#343A40]/70 bg-gradient-to-b from-[#141A24]/80 to-[#101317] p-5 shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#3B82F6]/35 hover:shadow-[0_4px_25px_rgba(59,130,246,0.1)]">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-2 w-2 rounded-full ${
                      netBalance > 0
                        ? "bg-emerald-400"
                        : netBalance < 0
                        ? "bg-red-400"
                        : "bg-[#3B82F6]"
                    }`}
                  />

                  <span className="text-xs font-medium uppercase tracking-wider text-[#AAB2BD]">
                    Net Standing
                  </span>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#343A40] bg-[#343A40]/30 text-[#AAB2BD]">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-1.5 font-mono [font-feature-settings:'zero']">
                <span
                  className={`text-lg font-normal sm:text-xl ${
                    netBalance > 0
                      ? "text-emerald-400/70"
                      : netBalance < 0
                      ? "text-red-400/70"
                      : "text-[#F4F7FA]/70"
                  }`}
                >
                  {netBalance > 0
                    ? "+"
                    : netBalance < 0
                    ? "-"
                    : ""}
                  ₹
                </span>

                <p
                  className={`text-2xl font-medium tracking-tight tabular-nums sm:text-3xl ${
                    netBalance > 0
                      ? "text-emerald-400"
                      : netBalance < 0
                      ? "text-red-400"
                      : "text-[#F4F7FA]"
                  }`}
                >
                  {Math.abs(netBalance).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-[#343A40]/40 pt-3">
              <p className="text-xs text-[#AAB2BD]/80">
                {netBalance > 0
                  ? "You're in credit overall"
                  : netBalance < 0
                  ? "You have a negative ledger"
                  : "All balances are even"}
              </p>
            </div>
          </div>
        </div>

        {/* =========================================
            GROUPS & ACTIVITY INTERACTIVE CANVAS
        ========================================= */}
        <div>
          <DashboardInteractiveSections
            groups={dashboardGroups}
            activities={dashboardActivities}
            currentUserId={user.id}
          />
        </div>
      </main>
    </div>
  );
}