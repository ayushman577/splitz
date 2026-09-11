import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { calculateGroupSettlements } from "@/lib/balances";

import MarkAsReceivedButton from "./MarkAsReceivedButton";
import BalanceActions from "./BalanceActions";
import PaymentConfirmationActions from "./PaymentConfirmationActions";

type PaymentsPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function PaymentsPage({
  params,
}: PaymentsPageProps) {
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
        orderBy: {
          joinedAt: "asc",
        },
      },
      expenses: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          payer: true,
          splits: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!group) {
    notFound();
  }

  const currentUser = await prisma.user.findUnique({
    where: {
      email: userEmail,
    },
  });

  if (!currentUser) {
    redirect("/login");
  }

  const isMember = group.members.some(
    (member) => member.userId === currentUser.id
  );

  if (!isMember) {
    redirect("/dashboard");
  }

  const totalExpenses = group.expenses.length;

  const totalGroupSpend = group.expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const yourTotalPaid = group.expenses
    .filter((expense) => expense.payerId === currentUser.id)
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  const yourTotalShare = group.expenses.reduce((sum, expense) => {
    const userSplit = expense.splits.find(
      (split) => split.userId === currentUser.id
    );
    return sum + (userSplit ? Number(userSplit.amount) : 0);
  }, 0);

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
            href={`/groups/${groupId}`}
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
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-[#F4F7FA] sm:text-3xl lg:text-4xl">
            Expense{" "}
            <span className="bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#A78BFA] bg-clip-text text-transparent">
              History
            </span>
          </h1>
          <p className="text-xs text-[#AAB2BD] sm:text-sm">
            Complete transaction feed and split breakdown for {group.name}.
          </p>
        </div>

        {/* Summary Metrics Strip */}
        <div className="grid gap-3.5 sm:grid-cols-3 sm:gap-4">
          {/* Total Group Spend */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#343A40]/70 bg-gradient-to-b from-[#141A24]/80 to-[#101317] p-5 shadow-lg shadow-black/30">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#AAB2BD]">
                  Total Group Spend
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/10 text-xs font-bold text-[#60A5FA]">
                  ₹
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1 font-mono [font-feature-settings:'zero']">
                <span className="text-base text-[#60A5FA]/70">₹</span>
                <p className="text-2xl font-bold tracking-tight text-[#F4F7FA] tabular-nums sm:text-3xl">
                  {totalGroupSpend.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
            <p className="mt-3 border-t border-[#343A40]/40 pt-2 text-[11px] text-[#AAB2BD]/70">
              {totalExpenses} recorded {totalExpenses === 1 ? "bill" : "bills"}
            </p>
          </div>

          {/* You Paid */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#343A40]/70 bg-gradient-to-b from-[#111816]/80 to-[#101317] p-5 shadow-lg shadow-black/30">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">
                  Total You Paid
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
                  </svg>
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1 font-mono [font-feature-settings:'zero']">
                <span className="text-base text-emerald-400/70">₹</span>
                <p className="text-2xl font-bold tracking-tight text-emerald-400 tabular-nums sm:text-3xl">
                  {yourTotalPaid.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
            <p className="mt-3 border-t border-[#343A40]/40 pt-2 text-[11px] text-[#AAB2BD]/70">
              Upfront expenses paid by you
            </p>
          </div>

          {/* Your Share */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#343A40]/70 bg-gradient-to-b from-[#181316]/80 to-[#101317] p-5 shadow-lg shadow-black/30">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-400/90">
                  Your Total Share
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1 font-mono [font-feature-settings:'zero']">
                <span className="text-base text-red-400/70">₹</span>
                <p className="text-2xl font-bold tracking-tight text-red-400 tabular-nums sm:text-3xl">
                  {yourTotalShare.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
            <p className="mt-3 border-t border-[#343A40]/40 pt-2 text-[11px] text-[#AAB2BD]/70">
              Your portion across all group splits
            </p>
          </div>
        </div>

        {/* Expense Feed List */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
              <h2 className="text-lg font-bold tracking-tight text-[#F4F7FA]">
                All Expenses
              </h2>
            </div>
            <span className="font-mono text-xs text-[#AAB2BD]/60">
              {totalExpenses} RECORD{totalExpenses === 1 ? "" : "S"}
            </span>
          </div>

          {group.expenses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#343A40]/70 bg-[#101317]/40 px-6 py-12 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[#343A40] bg-[#181C21] font-mono text-sm text-[#AAB2BD]">
                ₹
              </div>
              <p className="mt-3 text-sm font-semibold text-[#F4F7FA]">
                No expenses logged yet
              </p>
              <p className="mt-1 text-xs text-[#AAB2BD]/60">
                Expenses added to this group will appear here.
              </p>
              <Link
                href={`/groups/${groupId}`}
                className="mt-5 inline-flex rounded-xl bg-[#3B82F6] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition hover:bg-[#2563EB]"
              >
                Add first expense
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#343A40]/40 overflow-hidden rounded-2xl border border-[#343A40]/70 bg-[#101317]/85 backdrop-blur-md">
              {group.expenses.map((expense) => {
                const isPayer = expense.payerId === currentUser.id;
                const payerName = isPayer
                  ? "You"
                  : expense.payer.name || expense.payer.email;

                const mySplit = expense.splits.find(
                  (split) => split.userId === currentUser.id
                );

                const formattedTotal = Number(expense.amount).toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                );

                const createdDate = new Date(expense.createdAt).toLocaleDateString(
                  "en-IN",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }
                );

                return (
                  <div
                    key={expense.id}
                    className="p-4 sm:p-5 transition hover:bg-[#181C21]/60"
                  >
                    {/* Top Row: Icon, Title & Amounts */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3 sm:gap-3.5">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
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
                          <h3 className="truncate text-sm font-semibold text-[#F4F7FA] sm:text-base">
                            {expense.title}
                          </h3>

                          <p className="mt-0.5 text-[11px] text-[#AAB2BD]/70">
                            Paid by <span className={isPayer ? "text-emerald-400 font-medium" : "text-[#F4F7FA]"}>{payerName}</span> • {createdDate}
                          </p>

                          {expense.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-[#8B949E]">
                              {expense.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Total & User Impact */}
                      <div className="shrink-0 text-right">
                        <p className="font-mono [font-feature-settings:'zero'] text-sm font-bold text-[#F4F7FA] tabular-nums sm:text-base">
                          ₹{formattedTotal}
                        </p>
                        {mySplit && (
                          <p
                            className={`mt-0.5 font-mono text-[11px] font-medium tabular-nums ${
                              isPayer ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {isPayer ? "lent" : "your share"} ₹
                            {Number(mySplit.amount).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Member Splits Pill Tray */}
                    <div className="mt-3.5 border-t border-[#343A40]/40 pt-3">
                      <div className="flex flex-wrap gap-1.5">
                        {expense.splits.map((split) => {
                          const isSelf = split.userId === currentUser.id;
                          const name = isSelf
                            ? "You"
                            : split.user.name?.split(" ")[0] || split.user.email.split("@")[0];

                          return (
                            <span
                              key={split.id}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-mono ${
                                isSelf
                                  ? "border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#60A5FA]"
                                  : "border-[#343A40]/70 bg-[#181C21]/80 text-[#AAB2BD]"
                              }`}
                            >
                              <span>{name}</span>
                              <span className="font-bold text-[#F4F7FA]">
                                ₹{Number(split.amount).toFixed(2)}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}