import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { calculateGroupSettlements } from "@/lib/balances";
import Link from "next/link";

import InviteActions from "./InviteActions";
import BackToDashboard from "./BackToDashboard";
import AddPaymentModal from "./AddPaymentModal";
import GroupSettings from "./GroupSettings";

type GroupPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function GroupPage({
  params,
}: GroupPageProps) {
  const session = await auth();

  const userEmail = session?.user?.email;

  if (!userEmail) {
    redirect("/login");
  }

  const { groupId } = await params;

  const group = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },

      payments: {
        where: {
          status: "PENDING",
        },
        select: {
          id: true,
          payerId: true,
          receiverId: true,
          amount: true,
        },
      },

      expenses: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          payer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          splits: {
            orderBy: {
              amount: "desc",
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!group) {
    notFound();
  }

  const isMember = group.members.some(
    (member) => member.user.email === userEmail
  );

  if (!isMember) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#101317] p-6 font-['Inter'] text-[#F4F7FA]">
        <div className="pointer-events-none fixed left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/10 blur-[140px]" />

        <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#343A40] bg-[#181C21]/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="mt-4 text-xl font-bold tracking-tight text-[#F4F7FA]">
            Access Restricted
          </h1>

          <p className="mt-2 text-xs text-[#AAB2BD] sm:text-sm">
            You do not hold active membership in this group. Ask a member for an invite link.
          </p>

          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#3B82F6] px-5 text-xs font-semibold text-white shadow-lg shadow-[#3B82F6]/20 transition-all hover:bg-[#2563EB]"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const currentUser = group.members.find(
    (member) => member.user.email === userEmail
  );

  const settlements = await calculateGroupSettlements(group.id);

  const userSettlements = settlements.filter(
    (settlement) =>
      settlement.fromUserId === currentUser?.user.id ||
      settlement.toUserId === currentUser?.user.id
  );

  const totalYouOwe = userSettlements
    .filter(
      (settlement) =>
        settlement.fromUserId === currentUser?.user.id
    )
    .reduce(
      (total, settlement) => total + settlement.amount,
      0
    );

  const totalOwedToYou = userSettlements
    .filter(
      (settlement) =>
        settlement.toUserId === currentUser?.user.id
    )
    .reduce(
      (total, settlement) => total + settlement.amount,
      0
    );

  const netStanding = totalOwedToYou - totalYouOwe;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const inviteLink = `${appUrl}/join/${group.joinCode}`;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#101317] font-['Inter'] text-[#F4F7FA] selection:bg-[#3B82F6] selection:text-white">
      {/* Background lighting glows */}
      <div className="pointer-events-none fixed left-1/2 top-[-120px] h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[#3B82F6]/10 blur-[170px]" />

      <div className="pointer-events-none fixed bottom-0 right-0 h-[450px] w-[450px] rounded-full bg-[#343A40]/30 blur-[160px]" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#343A40]/80 bg-[#101317]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="group text-2xl font-black tracking-tight text-[#F4F7FA] transition-transform duration-200 active:scale-95"
          >
            <span className="bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#A78BFA] bg-clip-text text-transparent transition-all duration-200 group-hover:opacity-90">
              SplitZ.
            </span>
          </Link>

          <BackToDashboard />
        </div>
      </header>

      {/* Main Container with Entrance Animation */}
      <main className="relative z-10 mx-auto max-w-6xl space-y-6 px-4 py-6 transition-opacity duration-500 ease-out sm:space-y-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Group Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-[#343A40]/80 bg-gradient-to-b from-[#181C21]/90 to-[#101317] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight text-[#F4F7FA] sm:text-3xl lg:text-4xl">
                {group.name}
              </h1>

              {group.description && (
                <p className="max-w-2xl text-xs leading-relaxed text-[#AAB2BD] sm:text-sm">
                  {group.description}
                </p>
              )}
            </div>

            {/* Group Edit / Delete Action Hub */}
            <div className="shrink-0">
              <GroupSettings
                groupId={group.id}
                initialName={group.name}
                initialDescription={group.description}
              />
            </div>
          </div>

          {/* Members, Expenses & Add Payment Button */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#343A40]/60 pt-6">
            <div className="flex items-center gap-2.5">
              {/* Members badge */}
              <div className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#343A40] bg-[#101317] px-3 shadow-sm sm:h-10">
                <span className="text-xs font-medium leading-none text-[#AAB2BD]">
                  Members
                </span>

                <span className="h-3 w-px bg-[#343A40]" />

                <span className="font-mono text-xs font-bold leading-none text-[#F4F7FA] [font-feature-settings:'zero'] sm:text-sm">
                  {group.members.length}
                </span>
              </div>

              {/* Expenses badge */}
              <div className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#343A40] bg-[#101317] px-3 shadow-sm sm:h-10">
                <span className="text-xs font-medium leading-none text-[#AAB2BD]">
                  Expenses
                </span>

                <span className="h-3 w-px bg-[#343A40]" />

                <span className="font-mono text-xs font-bold leading-none text-[#F4F7FA] [font-feature-settings:'zero'] sm:text-sm">
                  {group.expenses.length}
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <AddPaymentModal
                groupId={group.id}
                members={group.members.map(
                  (member) => ({
                    id: member.user.id,
                    name: member.user.name,
                    email: member.user.email,
                  })
                )}
              />
            </div>
          </div>
        </div>

        {/* Summary Metrics Strip */}
        <div className="grid gap-3.5 sm:grid-cols-3 sm:gap-4">
          {/* You Owe */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#343A40]/70 bg-gradient-to-b from-[#181316]/80 to-[#101317] p-5 shadow-lg shadow-black/30">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider leading-none text-red-400/90">
                  You Owe
                </span>

                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                    />
                  </svg>
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-1 font-mono [font-feature-settings:'zero']">
                <span className="text-base leading-none text-red-400/70">
                  ₹
                </span>

                <p className="text-2xl font-bold leading-none tracking-tight text-red-400 tabular-nums sm:text-3xl">
                  {totalYouOwe.toFixed(2)}
                </p>
              </div>
            </div>

            <p className="mt-3 border-t border-[#343A40]/40 pt-2 text-[11px] leading-none text-[#AAB2BD]/70">
              {totalYouOwe > 0
                ? "Outgoing ledger balance"
                : "All clear"}
            </p>
          </div>

          {/* You Receive */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#343A40]/70 bg-gradient-to-b from-[#111816]/80 to-[#101317] p-5 shadow-lg shadow-black/30">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider leading-none text-emerald-400/90">
                  You Will Receive
                </span>

                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"
                    />
                  </svg>
                </div>
              </div>

              <div className="mt-3 flex items-baseline gap-1 font-mono [font-feature-settings:'zero']">
                <span className="text-base leading-none text-emerald-400/70">
                  ₹
                </span>

                <p className="text-2xl font-bold leading-none tracking-tight text-emerald-400 tabular-nums sm:text-3xl">
                  {totalOwedToYou.toFixed(2)}
                </p>
              </div>
            </div>

            <p className="mt-3 border-t border-[#343A40]/40 pt-2 text-[11px] leading-none text-[#AAB2BD]/70">
              {totalOwedToYou > 0
                ? "Incoming pending returns"
                : "No pending claims"}
            </p>
          </div>

          {/* Net Standing */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#343A40]/70 bg-gradient-to-b from-[#141A24]/80 to-[#101317] p-5 shadow-lg shadow-black/30">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider leading-none text-[#AAB2BD]">
                  Net Standing
                </span>

                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#343A40] bg-[#181C21] text-xs font-bold text-[#AAB2BD]">
                  ⚖
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-1 font-mono [font-feature-settings:'zero']">
                <span
                  className={`text-base leading-none ${
                    netStanding > 0
                      ? "text-emerald-400/70"
                      : netStanding < 0
                      ? "text-red-400/70"
                      : "text-[#F4F7FA]/70"
                  }`}
                >
                  {netStanding > 0
                    ? "+"
                    : netStanding < 0
                    ? "-"
                    : ""}
                  ₹
                </span>

                <p
                  className={`text-2xl font-bold leading-none tracking-tight tabular-nums sm:text-3xl ${
                    netStanding > 0
                      ? "text-emerald-400"
                      : netStanding < 0
                      ? "text-red-400"
                      : "text-[#F4F7FA]"
                  }`}
                >
                  {Math.abs(netStanding).toFixed(2)}
                </p>
              </div>
            </div>

            <p className="mt-3 border-t border-[#343A40]/40 pt-2 text-[11px] leading-none text-[#AAB2BD]/70">
              {netStanding > 0
                ? "Net credit balance"
                : netStanding < 0
                ? "Net payable balance"
                : "Fully balanced ledger"}
            </p>
          </div>
        </div>

        {/* Action Hub Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Member Balances */}
          <Link
            href={`/groups/${group.id}/balances`}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#343A40]/80 bg-gradient-to-b from-[#181C21]/90 to-[#101317] p-6 shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3B82F6]/60 hover:shadow-[0_4px_25px_rgba(59,130,246,0.15)]"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#60A5FA]">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>

                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#343A40] bg-[#181C21] text-xs text-[#AAB2BD] transition-all group-hover:border-[#3B82F6]/60 group-hover:bg-[#3B82F6] group-hover:text-white">
                  →
                </span>
              </div>

              <h2 className="mt-4 text-base font-bold text-[#F4F7FA] group-hover:text-white sm:text-lg">
                Member Balances
              </h2>

              <p className="mt-1 text-xs leading-relaxed text-[#AAB2BD]">
                See individual shares, settlement details, and pay back group members.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[#343A40]/60 pt-4 text-xs font-semibold text-[#60A5FA]">
              <span>View member breakdown</span>
              <span className="transition-transform group-hover:translate-x-1">
                Open →
              </span>
            </div>
          </Link>

          {/* Expense History */}
          <Link
            href={`/groups/${group.id}/payments`}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#343A40]/80 bg-gradient-to-b from-[#181C21]/90 to-[#101317] p-6 shadow-lg shadow-black/30 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/60 hover:shadow-[0_4px_25px_rgba(16,185,129,0.15)]"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>

                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#343A40] bg-[#181C21] text-xs text-[#AAB2BD] transition-all group-hover:border-emerald-500/60 group-hover:bg-emerald-500 group-hover:text-white">
                  →
                </span>
              </div>

              <h2 className="mt-4 text-base font-bold text-[#F4F7FA] group-hover:text-white sm:text-lg">
                Expense History
              </h2>

              <p className="mt-1 text-xs leading-relaxed text-[#AAB2BD]">
                Browse through all bills, payments, split records, and receipts.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[#343A40]/60 pt-4 text-xs font-semibold text-emerald-400">
              <span>View all expenses</span>
              <span className="transition-transform group-hover:translate-x-1">
                Open →
              </span>
            </div>
          </Link>
        </div>

        {/* Invite Members Card */}
        <div className="rounded-2xl border border-[#343A40]/80 bg-[#101317]/90 p-4 shadow-lg shadow-black/30 backdrop-blur-md sm:p-6">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 text-sm text-[#60A5FA]">
                🔑
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#F4F7FA] sm:text-base">
                  Invite Members
                </h3>
                
              </div>
            </div>

            {/* Code Badge */}
            <div className="flex shrink-0 items-center rounded-lg border border-[#343A40] bg-[#181C21] px-2.5 py-1">
              <span className="font-mono text-xs font-bold tracking-widest text-[#3B82F6] [font-feature-settings:'zero']">
                {group.joinCode}
              </span>
            </div>
          </div>

          {/* Unified Link & Action Pill Bar */}
          <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-[#343A40] bg-[#181C21]/60 p-1.5 pl-3.5">
            <span className="select-all truncate font-mono text-xs text-[#AAB2BD]/80">
              {inviteLink}
            </span>

            <InviteActions inviteLink={inviteLink} />
          </div>
        </div>
      </main>
    </div>
  );
}