import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { calculateGroupSettlements } from "@/lib/balances";
import Link from "next/link";

import MarkAsReceivedButton from "./MarkAsReceivedButton";
import BalanceActions from "./BalanceActions";
import PaymentConfirmationActions from "./PaymentConfirmationActions";

type BalancesPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function BalancesPage({
  params,
}: BalancesPageProps) {
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
        include: {
          payer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!group) {
    notFound();
  }

  const currentUser = group.members.find(
    (member) => member.user.email === userEmail
  );

  if (!currentUser) {
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
            You do not hold active membership in this group.
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

  const settlements = await calculateGroupSettlements(groupId);

  const pendingPayments = group.payments.filter(
    (payment) =>
      payment.payerId === currentUser.user.id ||
      payment.receiverId === currentUser.user.id
  );

  const pendingPaymentsYouMade = pendingPayments.filter(
    (payment) => payment.payerId === currentUser.user.id
  );

  const pendingPaymentsYouReceive = pendingPayments.filter(
    (payment) => payment.receiverId === currentUser.user.id
  );

  const memberMap = new Map(
    group.members.map((member) => [
      member.user.id,
      member.user.name || member.user.email,
    ])
  );

  const getMemberName = (userId: string) =>
    memberMap.get(userId) || "Unknown User";

  const userSettlements = settlements.filter(
    (settlement) =>
      settlement.fromUserId === currentUser.user.id ||
      settlement.toUserId === currentUser.user.id
  );

  const youOwe = userSettlements.filter(
    (settlement) =>
      settlement.fromUserId === currentUser.user.id
  );

  const owedToYou = userSettlements.filter(
    (settlement) =>
      settlement.toUserId === currentUser.user.id
  );

  const totalYouOwe = youOwe.reduce(
    (total, settlement) => total + settlement.amount,
    0
  );

  const totalOwedToYou = owedToYou.reduce(
    (total, settlement) => total + settlement.amount,
    0
  );

  const netStanding = totalOwedToYou - totalYouOwe;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#101317] font-['Inter'] text-[#F4F7FA] selection:bg-[#3B82F6] selection:text-white">
      {/* Background illumination glows */}
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

          <Link
            href={`/groups/${group.id}`}
            className="group inline-flex items-center gap-2 rounded-xl border border-[#343A40] bg-[#181C21]/80 px-3.5 py-1.5 text-xs font-semibold text-[#F4F7FA] shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-[#3B82F6]/60 hover:bg-[#1C222B] hover:text-[#60A5FA] active:scale-95"
          >
            <span className="text-xs transition-transform duration-200 group-hover:-translate-x-0.5">
              ←
            </span>
            <span>Back to Group</span>
          </Link>
        </div>
      </header>

      {/* Main Container with Entrance Animation */}
      <main className="relative z-10 mx-auto max-w-5xl space-y-6 px-4 py-6 transition-opacity duration-500 ease-out sm:space-y-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Title Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#F4F7FA] sm:text-3xl lg:text-4xl">
            Your{" "}
            <span className="bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#A78BFA] bg-clip-text text-transparent">
              Balances
            </span>
          </h1>
        </div>

        {/* Summary Metrics Strip */}
        <div className="grid gap-3.5 sm:grid-cols-3 sm:gap-4">
          {/* You Owe */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#343A40]/70 bg-gradient-to-b from-[#181316]/80 to-[#101317] p-5 shadow-lg shadow-black/30">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-400/90">
                  Total You Owe
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
                <span className="text-base text-red-400/70">₹</span>
                <p className="text-2xl font-bold tracking-tight text-red-400 tabular-nums sm:text-3xl">
                  {totalYouOwe.toFixed(2)}
                </p>
              </div>
            </div>

            <p className="mt-3 border-t border-[#343A40]/40 pt-2 text-[11px] text-[#AAB2BD]/70">
              {youOwe.length} outgoing settlement
              {youOwe.length === 1 ? "" : "s"}
            </p>
          </div>

          {/* You Receive */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#343A40]/70 bg-gradient-to-b from-[#111816]/80 to-[#101317] p-5 shadow-lg shadow-black/30">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">
                  You Receive
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
                <span className="text-base text-emerald-400/70">₹</span>
                <p className="text-2xl font-bold tracking-tight text-emerald-400 tabular-nums sm:text-3xl">
                  {totalOwedToYou.toFixed(2)}
                </p>
              </div>
            </div>

            <p className="mt-3 border-t border-[#343A40]/40 pt-2 text-[11px] text-[#AAB2BD]/70">
              {owedToYou.length} incoming settlement
              {owedToYou.length === 1 ? "" : "s"}
            </p>
          </div>

          {/* Net Standing */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#343A40]/70 bg-gradient-to-b from-[#141A24]/80 to-[#101317] p-5 shadow-lg shadow-black/30">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#AAB2BD]">
                  Net Standing
                </span>

                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#343A40] bg-[#181C21] text-xs font-bold text-[#AAB2BD]">
                  ⚖
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-1 font-mono [font-feature-settings:'zero']">
                <span
                  className={`text-base ${
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
                  className={`text-2xl font-bold tracking-tight tabular-nums sm:text-3xl ${
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

            <p className="mt-3 border-t border-[#343A40]/40 pt-2 text-[11px] text-[#AAB2BD]/70">
              {netStanding > 0
                ? "Net positive ledger"
                : netStanding < 0
                ? "Net payable ledger"
                : "All balances even"}
            </p>
          </div>
        </div>

        {/* Pending Confirmations */}
        {(pendingPaymentsYouReceive.length > 0 ||
          pendingPaymentsYouMade.length > 0) && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.6)]" />

              <h2 className="text-lg font-bold tracking-tight text-[#F4F7FA]">
                Pending Confirmations
              </h2>
            </div>

            <div className="divide-y divide-[#343A40]/40 overflow-hidden rounded-2xl border border-[#343A40]/70 bg-[#101317]/85 backdrop-blur-md">
              {/* Receiver Action Items */}
              {pendingPaymentsYouReceive.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-[#181C21]/60 sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
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

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#F4F7FA] sm:text-sm">
                        {payment.payer.name ||
                          payment.payer.email}
                      </p>

                      <p className="truncate text-[11px] text-[#AAB2BD]/70">
                        Marked as paid to you
                      </p>
                    </div>
                  </div>

                  <div className="ml-2 flex shrink-0 items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-emerald-400 tabular-nums [font-feature-settings:'zero'] sm:text-sm">
                      +₹{Number(payment.amount).toFixed(2)}
                    </span>

                    <PaymentConfirmationActions
                      groupId={group.id}
                      paymentId={payment.id}
                    />
                  </div>
                </div>
              ))}

              {/* Payer Awaiting Items */}
              {pendingPaymentsYouMade.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-[#181C21]/60 sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-xs text-[#F59E0B]">
                      ⏳
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#F4F7FA] sm:text-sm">
                        Paid to{" "}
                        {payment.receiver.name ||
                          payment.receiver.email}
                      </p>

                      <p className="truncate text-[11px] text-[#F59E0B]">
                        Pending recipient confirmation
                      </p>
                    </div>
                  </div>

                  <div className="ml-2 flex shrink-0 items-center gap-2.5">
                    <span className="font-mono text-xs font-semibold text-[#F4F7FA] tabular-nums [font-feature-settings:'zero'] sm:text-sm">
                      ₹{Number(payment.amount).toFixed(2)}
                    </span>

                    <span className="rounded-md border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-2 py-0.5 text-[10px] font-medium text-[#F59E0B]">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* You Owe */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-400" />

              <h2 className="text-lg font-bold tracking-tight text-[#F4F7FA]">
                You Owe
              </h2>
            </div>

            {youOwe.length > 0 && (
              <span className="font-mono text-xs text-[#AAB2BD]/60">
                {youOwe.length} SETTLEMENT
                {youOwe.length === 1 ? "" : "S"}
              </span>
            )}
          </div>

          {youOwe.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#343A40]/70 bg-[#101317]/40 px-6 py-8 text-center text-xs text-[#AAB2BD]/70 sm:text-sm">
              ✨ You do not owe anyone in this group.
            </div>
          ) : (
            <div className="divide-y divide-[#343A40]/40 overflow-hidden rounded-2xl border border-[#343A40]/70 bg-[#101317]/85 backdrop-blur-md">
              {youOwe.map((settlement) => {
                const isPending =
                  pendingPaymentsYouMade.some(
                    (p) =>
                      p.receiverId ===
                      settlement.toUserId
                  );

                return (
                  <div
                    key={`${settlement.fromUserId}-${settlement.toUserId}`}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-[#181C21]/60 sm:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
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

                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#F4F7FA] sm:text-sm">
                          {getMemberName(
                            settlement.toUserId
                          )}
                        </p>

                        <p className="truncate text-[11px] text-[#AAB2BD]/70">
                          Direct debt transfer
                        </p>
                      </div>
                    </div>

                    <div className="ml-2 flex shrink-0 items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-red-400 tabular-nums [font-feature-settings:'zero'] sm:text-sm">
                        -₹{settlement.amount.toFixed(2)}
                      </span>

                      {isPending ? (
                        <span className="rounded-md border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-2.5 py-1 text-[11px] font-medium text-[#F59E0B]">
                          Pending
                        </span>
                      ) : (
                        <BalanceActions
                          groupId={group.id}
                          receiverId={settlement.toUserId}
                          amount={settlement.amount}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* You Will Receive */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />

              <h2 className="text-lg font-bold tracking-tight text-[#F4F7FA]">
                You Will Receive
              </h2>
            </div>

            {owedToYou.length > 0 && (
              <span className="font-mono text-xs text-[#AAB2BD]/60">
                {owedToYou.length} SETTLEMENT
                {owedToYou.length === 1 ? "" : "S"}
              </span>
            )}
          </div>

          {owedToYou.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#343A40]/70 bg-[#101317]/40 px-6 py-8 text-center text-xs text-[#AAB2BD]/70 sm:text-sm">
              ✨ Nobody owes you money in this group.
            </div>
          ) : (
            <div className="divide-y divide-[#343A40]/40 overflow-hidden rounded-2xl border border-[#343A40]/70 bg-[#101317]/85 backdrop-blur-md">
              {owedToYou.map((settlement) => (
                <div
                  key={`${settlement.fromUserId}-${settlement.toUserId}`}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-[#181C21]/60 sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
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

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#F4F7FA] sm:text-sm">
                        {getMemberName(
                          settlement.fromUserId
                        )}
                      </p>

                      <p className="truncate text-[11px] text-[#AAB2BD]/70">
                        Owed to you
                      </p>
                    </div>
                  </div>

                  <div className="ml-2 flex shrink-0 items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-emerald-400 tabular-nums [font-feature-settings:'zero'] sm:text-sm">
                      +₹{settlement.amount.toFixed(2)}
                    </span>

                    <MarkAsReceivedButton
                      groupId={groupId}
                      payerId={settlement.fromUserId}
                      amount={settlement.amount}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Zero State */}
        {userSettlements.length === 0 &&
          pendingPayments.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#343A40] bg-[#101317]/60 p-8 text-center sm:p-12">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-lg text-emerald-400">
                ✓
              </div>

              <h2 className="mt-4 text-base font-bold text-[#F4F7FA] sm:text-lg">
                You&apos;re completely settled up
              </h2>

              <p className="mt-1 text-xs text-[#AAB2BD] sm:text-sm">
                You don&apos;t owe any money, and nobody owes you across this group ledger.
              </p>
            </div>
          )}
      </main>
    </div>
  );
}