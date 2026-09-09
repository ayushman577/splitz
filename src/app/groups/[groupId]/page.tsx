import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { calculateGroupSettlements } from "@/lib/balances";

import MarkAsReceivedButton from "./balances/MarkAsReceivedButton";

import InviteActions from "./InviteActions";
import BackToDashboard from "./BackToDashboard";
import AddPaymentModal from "./AddPaymentModal";
import BalanceActions from "./balances/BalanceActions";

import Link from "next/link";

type GroupPageProps = {
    params: Promise<{
        groupId: string;
    }>;
};

export default async function GroupPage({
    params,
}: GroupPageProps) {
    const session = await auth();

    if (!session?.user?.email) {
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

    // Make sure the logged-in user is a member
    const isMember = group.members.some(
        (member) => member.user.email === session.user.email
    );

    if (!isMember) {
        return (
            <main className="min-h-screen bg-[#101317] px-6 py-10 text-[#F4F7FA]">
                <div className="mx-auto max-w-3xl">
                    <div className="rounded-2xl border border-[#343A40] bg-[#181C21] p-8 text-center">
                        <h1 className="text-2xl font-bold">
                            Access Denied
                        </h1>

                        <p className="mt-2 text-sm text-[#AAB2BD]">
                            You are not a member of this group.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    const currentUser = group.members.find(
        (member) => member.user.email === session.user.email
    );

    const settlements = await calculateGroupSettlements(group.id);

    const userSettlements = settlements.filter(
        (settlement) =>
            settlement.fromUserId === currentUser?.user.id ||
            settlement.toUserId === currentUser?.user.id
    );

    const youOwe = userSettlements
        .filter(
            (settlement) =>
                settlement.fromUserId === currentUser?.user.id
        )
        .reduce(
            (total, settlement) => total + settlement.amount,
            0
        );

    const owedToYou = userSettlements
        .filter(
            (settlement) =>
                settlement.toUserId === currentUser?.user.id
        )
        .reduce(
            (total, settlement) => total + settlement.amount,
            0
        );

    const memberBalances = new Map<
        string,
        {
            type: "owe" | "owed" | "settled";
            amount: number;
        }
    >();

    for (const member of group.members) {
        if (member.user.id === currentUser?.user.id) {
            continue;
        }

        const settlement = settlements.find(
            (settlement) =>
                (settlement.fromUserId === currentUser?.user.id &&
                    settlement.toUserId === member.user.id) ||
                (settlement.toUserId === currentUser?.user.id &&
                    settlement.fromUserId === member.user.id)
        );

        if (!settlement) {
            memberBalances.set(member.user.id, {
                type: "settled",
                amount: 0,
            });

            continue;
        }

        if (
            settlement.fromUserId === currentUser?.user.id
        ) {
            memberBalances.set(member.user.id, {
                type: "owe",
                amount: settlement.amount,
            });
        } else {
            memberBalances.set(member.user.id, {
                type: "owed",
                amount: settlement.amount,
            });
        }
    }

    const pendingPayments = group.payments;

    const pendingPaymentMap = new Map<
        string,
        {
            paymentId: string;
            amount: number;
        }
    >();

    for (const payment of pendingPayments) {
        if (
            payment.payerId === currentUser?.user.id
        ) {
            pendingPaymentMap.set(payment.receiverId, {
                paymentId: payment.id,
                amount: Number(payment.amount),
            });
        }
    }

    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const inviteLink = `${appUrl}/join/${group.joinCode}`;

    return (
        <main className="min-h-screen bg-[#101317] text-[#F4F7FA]">
            {/* Header */}
            <header className="border-b border-[#343A40] bg-[#101317]/90">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <a
                        href="/dashboard"
                        className="text-2xl font-bold tracking-tight"
                    >
                        Split<span className="text-[#3B82F6]">Z</span>
                    </a>

                    <BackToDashboard />
                </div>
            </header>

            <div className="mx-auto max-w-6xl px-6 py-8">

                {/* Group Header */}
                <div className="rounded-2xl border border-[#343A40] bg-[#181C21] p-6 sm:p-8">
                    <p className="text-sm text-[#AAB2BD]">
                        Group
                    </p>

                    <h1 className="mt-1 text-3xl font-bold">
                        {group.name}
                    </h1>

                    {group.description && (
                        <p className="mt-2 max-w-2xl text-sm text-[#AAB2BD]">
                            {group.description}
                        </p>
                    )}



                    <div className="mt-6 flex flex-wrap gap-3">
                        <div className="rounded-xl border border-[#343A40] bg-[#101317] px-4 py-3">
                            <p className="text-xs text-[#AAB2BD]">
                                Members
                            </p>

                            <p className="mt-1 text-lg font-semibold">
                                {group.members.length}
                            </p>
                        </div>

                        <div className="rounded-xl border border-[#343A40] bg-[#101317] px-4 py-3">
                            <p className="text-xs text-[#AAB2BD]">
                                Invite Code
                            </p>

                            <p className="mt-1 text-lg font-bold tracking-[0.2em] text-[#3B82F6]">
                                {group.joinCode}
                            </p>
                        </div>
                        <AddPaymentModal
                            groupId={group.id}
                            members={group.members.map((member) => ({
                                id: member.user.id,
                                name: member.user.name,
                                email: member.user.email,
                            }))}
                        />
                    </div>
                </div>

                {/* Invite */}
                <div className="mt-6 rounded-2xl border border-[#343A40] bg-[#181C21] p-6">
                    <h2 className="text-lg font-semibold">
                        Invite People
                    </h2>

                    <p className="mt-1 text-sm text-[#AAB2BD]">
                        Share this link or invite code with people you want
                        to add to the group.
                    </p>

                    <div className="mt-5 rounded-xl border border-[#343A40] bg-[#101317] p-4">
                        <p className="text-xs text-[#AAB2BD]">
                            Invite Link
                        </p>

                        <p className="mt-2 break-all text-sm text-[#F4F7FA]">
                            {inviteLink}
                        </p>
                    </div>

                    <InviteActions inviteLink={inviteLink} />
                </div>

                {/* Payments */}
                <div className="mt-6 rounded-2xl border border-[#343A40] bg-[#181C21] p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Payments
                            </h2>

                            <p className="mt-1 text-sm text-[#AAB2BD]">
                                View all expenses and payment activity in this group.
                            </p>
                        </div>

                        <Link
                            href={`/groups/${group.id}/payments`}
                            className="rounded-xl border border-[#343A40] bg-[#101317] px-4 py-2 text-sm font-medium text-[#AAB2BD] transition hover:border-[#3B82F6] hover:text-[#3B82F6]"
                        >
                            View All
                        </Link>
                    </div>

                    <div className="mt-5 rounded-xl border border-[#343A40] bg-[#101317] p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">
                                    Payment History
                                </p>

                                <p className="mt-1 text-xs text-[#66707C]">
                                    {group.expenses.length === 0
                                        ? "No payments recorded yet."
                                        : `${group.expenses.length} payment${group.expenses.length === 1
                                            ? ""
                                            : "s"
                                        } recorded`}
                                </p>
                            </div>

                            <Link
                                href={`/groups/${group.id}/payments`}
                                className="text-sm font-medium text-[#3B82F6] transition hover:text-[#60A5FA]"
                            >
                                Open →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Balances */}
                <div className="mt-6 rounded-2xl border border-[#343A40] bg-[#181C21] p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Balances
                            </h2>

                            <p className="mt-1 text-sm text-[#AAB2BD]">
                                See what you owe and what others owe you.
                            </p>
                        </div>

                        <Link
                            href={`/groups/${group.id}/balances`}
                            className="rounded-xl border border-[#343A40] bg-[#101317] px-4 py-2 text-sm font-medium text-[#AAB2BD] transition hover:border-[#3B82F6] hover:text-[#3B82F6]"
                        >
                            View Details
                        </Link>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        {/* You Owe */}
                        <div className="rounded-xl border border-[#343A40] bg-[#101317] p-5">
                            <p className="text-xs text-[#AAB2BD]">
                                You owe
                            </p>

                            <p className="mt-2 text-2xl font-bold text-[#F4F7FA]">
                                ₹{youOwe.toFixed(2)}
                            </p>

                            <p className="mt-1 text-xs text-[#66707C]">
                                {youOwe > 0
                                    ? "Amount you need to pay"
                                    : "You're all settled up"}
                            </p>
                        </div>

                        {/* Owed To You */}
                        <div className="rounded-xl border border-[#343A40] bg-[#101317] p-5">
                            <p className="text-xs text-[#AAB2BD]">
                                Owed to you
                            </p>

                            <p className="mt-2 text-2xl font-bold text-[#3B82F6]">
                                ₹{owedToYou.toFixed(2)}
                            </p>

                            <p className="mt-1 text-xs text-[#66707C]">
                                {owedToYou > 0
                                    ? "Others need to pay you"
                                    : "Nothing is owed to you"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Members */}
                <div className="mt-6 rounded-2xl border border-[#343A40] bg-[#181C21] p-6">
                    <div>
                        <h2 className="text-lg font-semibold">
                            Members
                        </h2>

                        <p className="mt-1 text-sm text-[#AAB2BD]">
                            See everyone's balance with you.
                        </p>
                    </div>

                    <div className="mt-5 space-y-3">
                        {group.members.map((member) => {
                            const isCurrentUser =
                                member.user.id === currentUser?.user.id;

                            const balance = memberBalances.get(
                                member.user.id
                            );

                            return (
                                <div
                                    key={member.id}
                                    className="rounded-xl border border-[#343A40] bg-[#101317] p-4"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        {/* Member information */}
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-medium">
                                                    {member.user.name ||
                                                        "Unnamed User"}
                                                </p>

                                                {isCurrentUser && (
                                                    <span className="rounded-lg bg-[#3B82F6]/10 px-2 py-1 text-[10px] font-medium text-[#3B82F6]">
                                                        You
                                                    </span>
                                                )}

                                                {member.isAdmin && (
                                                    <span className="rounded-lg bg-[#3B82F6]/10 px-2 py-1 text-[10px] font-medium text-[#3B82F6]">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-1 truncate text-xs text-[#AAB2BD]">
                                                {member.user.email}
                                            </p>
                                        </div>

                                        {/* Balance information */}
                                        {!isCurrentUser && balance && (
                                            <div className="flex shrink-0 items-center gap-4">
                                                {balance.type === "owe" && (
                                                    <>
                                                        {pendingPaymentMap.has(member.user.id) ? (
                                                            <div className="text-right">
                                                                <p className="text-sm font-semibold text-[#F4F7FA]">
                                                                    ₹{balance.amount.toFixed(2)}
                                                                </p>

                                                                <p className="mt-1 text-xs text-[#F59E0B]">
                                                                    🟡 Payment Pending
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="text-right">
                                                                    <p className="text-sm font-semibold text-[#F4F7FA]">
                                                                        ₹{balance.amount.toFixed(2)}
                                                                    </p>

                                                                    <p className="mt-1 text-xs text-[#F59E0B]">
                                                                        You owe
                                                                    </p>
                                                                </div>

                                                                <BalanceActions
                                                                    groupId={group.id}
                                                                    receiverId={member.user.id}
                                                                    amount={balance.amount}
                                                                />
                                                            </>
                                                        )}
                                                    </>
                                                )}

                                                {balance.type === "owed" && (
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="text-right">
                                                            <p className="text-sm font-semibold text-[#3B82F6]">
                                                                ₹{balance.amount.toFixed(2)}
                                                            </p>

                                                            <p className="mt-1 text-xs text-[#3B82F6]">
                                                                Owes you
                                                            </p>
                                                        </div>

                                                        <MarkAsReceivedButton
                                                            groupId={groupId}
                                                            payerId={member.user.id}
                                                            amount={balance.amount}
                                                        />
                                                    </div>
                                                )}

                                                {balance.type === "settled" && (
                                                    <span className="rounded-lg border border-[#343A40] px-3 py-2 text-xs text-[#66707C]">
                                                        Settled
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </main >
    );
}