import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ExpenseActions from "./ExpenseActions";

type PaymentsPageProps = {
    params: Promise<{
        groupId: string;
    }>;
};

export default async function PaymentsPage({
    params,
}: PaymentsPageProps) {
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
        (member) => member.user.email === session.user.email
    );

    const currentMember = group.members.find(
        (member) => member.user.email === session.user.email
    );

    const currentUserId = currentMember?.user.id;

    const isOwner = group.createdById === currentUserId;

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

    return (
        <main className="min-h-screen bg-[#101317] text-[#F4F7FA]">
            {/* Header */}
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

                {/* Page Header */}
                <div className="mb-8">
                    <p className="text-sm text-[#AAB2BD]">
                        {group.name}
                    </p>

                    <div className="mt-1 flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">
                                Payments
                            </h1>

                            <p className="mt-2 text-sm text-[#AAB2BD]">
                                All expenses and payments recorded in this group.
                            </p>
                        </div>

                        <div className="rounded-xl border border-[#343A40] bg-[#181C21] px-4 py-3 text-center">
                            <p className="text-xs text-[#AAB2BD]">
                                Total
                            </p>

                            <p className="mt-1 text-lg font-semibold">
                                {group.expenses.length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payments */}
                {group.expenses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#343A40] bg-[#181C21] p-10 text-center">
                        <h2 className="text-lg font-semibold">
                            No payments yet
                        </h2>

                        <p className="mt-2 text-sm text-[#AAB2BD]">
                            Add a payment from the group dashboard
                            to start tracking expenses.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {group.expenses.map((expense) => (
                            <div
                                key={expense.id}
                                className="rounded-2xl border border-[#343A40] bg-[#181C21] p-6"
                            >
                                {/* Payment Header */}
                                <div className="flex items-start justify-between gap-5">
                                    <div className="min-w-0">
                                        <h2 className="text-lg font-semibold">
                                            {expense.title}
                                        </h2>

                                        {expense.description && (
                                            <p className="mt-1 text-sm text-[#AAB2BD]">
                                                {expense.description}
                                            </p>
                                        )}

                                        <p className="mt-3 text-xs text-[#66707C]">
                                            Paid by{" "}
                                            <span className="text-[#AAB2BD]">
                                                {expense.payer.name ||
                                                    expense.payer.email}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="shrink-0 text-right">
                                        <p className="text-xl font-bold text-[#3B82F6]">
                                            ₹
                                            {expense.amount.toFixed(2)}
                                        </p>

                                        <div className="mt-2 flex items-center justify-end gap-3">
                                            {expense.isEdited && (
                                                <span className="text-xs text-[#66707C]">
                                                    Edited
                                                </span>
                                            )}

                                            {(isOwner || expense.payerId === currentUserId) && (
                                                <ExpenseActions
                                                    groupId={group.id}
                                                    expenseId={expense.id}
                                                    title={expense.title}
                                                    description={expense.description}
                                                    amount={Number(expense.amount)}
                                                    payerId={expense.payerId}
                                                    splits={expense.splits.map((split) => ({
                                                        userId: split.userId,
                                                        amount: Number(split.amount),
                                                    }))}
                                                    members={group.members.map((member) => ({
                                                        id: member.user.id,
                                                        name: member.user.name,
                                                        email: member.user.email,
                                                    }))}
                                                    isOwner={isOwner}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Split */}
                                <div className="mt-5 border-t border-[#343A40] pt-5">
                                    <p className="mb-3 text-xs font-medium text-[#AAB2BD]">
                                        Split between
                                    </p>

                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {expense.splits.map(
                                            (split) => (
                                                <div
                                                    key={split.id}
                                                    className="flex items-center justify-between rounded-xl bg-[#101317] px-4 py-3"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium">
                                                            {split.user.name ||
                                                                split.user.email}
                                                        </p>
                                                    </div>

                                                    <span className="ml-4 shrink-0 text-sm font-semibold text-[#AAB2BD]">
                                                        ₹
                                                        {split.amount.toFixed(
                                                            2
                                                        )}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}