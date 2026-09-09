import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { calculateGroupSettlements } from "@/lib/balances";

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
        (member) =>
            member.user.email === session.user.email
    );

    if (!currentUser) {
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

    /*
     * IMPORTANT:
     *
     * We use the group's simplified settlements here.
     *
     * Example:
     *
     * A pays O ₹20
     * O pays S ₹20
     *
     * Instead of showing:
     *
     * O owes A ₹20
     *
     * and
     *
     * S owes O ₹20
     *
     * the settlement engine gives:
     *
     * S → A ₹20
     */
    const settlements =
        await calculateGroupSettlements(groupId);

    const pendingPayments = group.payments.filter(
        (payment) =>
            payment.payerId === currentUser.user.id ||
            payment.receiverId === currentUser.user.id
    );

    const pendingPaymentsYouMade =
        pendingPayments.filter(
            (payment) =>
                payment.payerId ===
                currentUser.user.id
        );

    const pendingPaymentsYouReceive =
        pendingPayments.filter(
            (payment) =>
                payment.receiverId ===
                currentUser.user.id
        );

    const memberMap = new Map(
        group.members.map((member) => [
            member.user.id,
            member.user.name || member.user.email,
        ])
    );

    const getMemberName = (userId: string) =>
        memberMap.get(userId) || "Unknown User";

    /*
     * Settlements involving the logged-in user only.
     */
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
        (total, settlement) =>
            total + settlement.amount,
        0
    );

    const totalOwedToYou = owedToYou.reduce(
        (total, settlement) =>
            total + settlement.amount,
        0
    );

    return (
        <main className="min-h-screen bg-[#101317] text-[#F4F7FA]">
            <header className="border-b border-[#343A40] bg-[#101317]/90">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Link
                        href="/dashboard"
                        className="text-2xl font-bold tracking-tight"
                    >
                        Split<span className="text-[#3B82F6]">Z</span>
                    </Link>

                    <Link
                        href={`/groups/${group.id}`}
                        className="rounded-xl border border-[#343A40] bg-[#181C21] px-4 py-2 text-sm font-medium text-[#AAB2BD] transition hover:border-[#66707C] hover:text-white"
                    >
                        Back to Group
                    </Link>
                </div>
            </header>

            <div className="mx-auto max-w-5xl px-6 py-8">
                <div className="mb-8">
                    <p className="text-sm text-[#AAB2BD]">
                        {group.name}
                    </p>

                    <h1 className="mt-1 text-3xl font-bold">
                        Your Balances
                    </h1>

                    <p className="mt-2 text-sm text-[#AAB2BD]">
                        Only settlements involving you are shown.
                    </p>
                </div>

                {/* Summary */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[#343A40] bg-[#181C21] p-6">
                        <p className="text-sm text-[#AAB2BD]">
                            You owe
                        </p>

                        <p className="mt-2 text-3xl font-bold">
                            ₹{totalYouOwe.toFixed(2)}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-[#343A40] bg-[#181C21] p-6">
                        <p className="text-sm text-[#AAB2BD]">
                            You will receive
                        </p>

                        <p className="mt-2 text-3xl font-bold text-[#3B82F6]">
                            ₹{totalOwedToYou.toFixed(2)}
                        </p>
                    </div>
                </div>

                {pendingPaymentsYouMade.length > 0 && (
                    <section className="mt-6 rounded-2xl border border-[#343A40] bg-[#181C21] p-6">
                        <h2 className="text-xl font-semibold">
                            Payments Awaiting Confirmation
                        </h2>

                        <p className="mt-1 text-sm text-[#AAB2BD]">
                            You marked these payments as paid.
                            They will be settled once the receiver
                            confirms them.
                        </p>

                        <div className="mt-4 space-y-3">
                            {pendingPaymentsYouMade.map(
                                (payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between rounded-xl border border-[#343A40] bg-[#101317] p-4"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                ₹
                                                {Number(
                                                    payment.amount
                                                ).toFixed(2)}{" "}
                                                paid to{" "}
                                                {payment.receiver.name ||
                                                    payment.receiver.email}
                                            </p>

                                            <p className="mt-1 text-xs text-[#F59E0B]">
                                                🟡 Pending confirmation
                                            </p>
                                        </div>

                                        <span className="rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-1 text-xs font-medium text-[#F59E0B]">
                                            Pending
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    </section>
                )}

                {pendingPaymentsYouReceive.length > 0 && (
                    <section className="mt-6 rounded-2xl border border-[#343A40] bg-[#181C21] p-6">
                        <h2 className="text-xl font-semibold">
                            Payment Confirmations
                        </h2>

                        <p className="mt-1 text-sm text-[#AAB2BD]">
                            These members have marked payments
                            to you as paid.
                        </p>

                        <div className="mt-4 space-y-3">
                            {pendingPaymentsYouReceive.map(
                                (payment) => (
                                    <div
                                        key={payment.id}
                                        className="rounded-xl border border-[#343A40] bg-[#101317] p-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {payment.payer.name ||
                                                        payment.payer.email}
                                                </p>

                                                <p className="mt-1 text-sm text-[#AAB2BD]">
                                                    marked ₹
                                                    {Number(
                                                        payment.amount
                                                    ).toFixed(2)}{" "}
                                                    as paid to you
                                                </p>
                                            </div>

                                            <span className="rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-1 text-xs font-medium text-[#F59E0B]">
                                                Pending
                                            </span>
                                        </div>

                                        <PaymentConfirmationActions
                                            groupId={group.id}
                                            paymentId={payment.id}
                                        />
                                    </div>
                                )
                            )}
                        </div>
                    </section>
                )}



                {/* You owe */}
                <section className="mt-6 rounded-2xl border border-[#343A40] bg-[#181C21] p-6">
                    <h2 className="text-xl font-semibold">
                        You owe
                    </h2>

                    {youOwe.length === 0 ? (
                        <p className="mt-4 text-sm text-[#AAB2BD]">
                            You don't owe anyone.
                        </p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {youOwe.map((settlement) => (
                                <div
                                    key={`${settlement.fromUserId}-${settlement.toUserId}`}
                                    className="flex items-center justify-between rounded-xl border border-[#343A40] bg-[#101317] p-4"
                                >
                                    <div>
                                        <p className="text-sm font-medium">
                                            {getMemberName(
                                                settlement.toUserId
                                            )}
                                        </p>

                                        <p className="mt-1 text-xs text-[#AAB2BD]">
                                            You owe this member
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <p className="text-lg font-bold">
                                            ₹
                                            {settlement.amount.toFixed(2)}
                                        </p>

                                        {pendingPaymentsYouMade.some(
                                            (payment) =>
                                                payment.receiverId === settlement.toUserId
                                        ) ? (
                                            <span className="rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-3 py-2 text-xs font-medium text-[#F59E0B]">
                                                🟡 Payment Pending
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
                            ))}
                        </div>
                    )}
                </section>

                {/* You will receive */}
                <section className="mt-6 rounded-2xl border border-[#343A40] bg-[#181C21] p-6">
                    <h2 className="text-xl font-semibold">
                        You will receive
                    </h2>

                    {owedToYou.length === 0 ? (
                        <p className="mt-4 text-sm text-[#AAB2BD]">
                            Nobody owes you anything.
                        </p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {owedToYou.map((settlement) => (
                                <div
                                    key={`${settlement.fromUserId}-${settlement.toUserId}`}
                                    className="flex items-center justify-between rounded-xl border border-[#343A40] bg-[#101317] p-4"
                                >
                                    <div>
                                        <p className="text-sm font-medium">
                                            {getMemberName(settlement.fromUserId)}
                                        </p>

                                        <p className="mt-1 text-xs text-[#AAB2BD]">
                                            Owes you
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <p className="text-lg font-bold text-[#3B82F6]">
                                            ₹{settlement.amount.toFixed(2)}
                                        </p>

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

                {/* Completely settled */}
                {userSettlements.length === 0 && (
                    <div className="mt-6 rounded-2xl border border-dashed border-[#343A40] bg-[#181C21] p-8 text-center">
                        <h2 className="text-lg font-semibold">
                            You're all settled
                        </h2>

                        <p className="mt-2 text-sm text-[#AAB2BD]">
                            You don't currently owe anyone,
                            and nobody owes you.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}