import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileMenu from "./ProfileMenu";


import DashboardHistoryRefresh from "./DashboardHistoryRefresh";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/login");
    }

    const userName = session.user.name || "there";

    // Get the logged-in user and all groups they belong to
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

    return (
        <main className="min-h-screen bg-[#101317] text-[#F4F7FA]">
            <DashboardHistoryRefresh />
            {/* Header */}
            <header className="border-b border-[#343A40] bg-[#101317]/90 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="font-['Inter'] text-2xl font-bold tracking-tight">
                        Split
                        <span className="text-[#3B82F6]">Z</span>
                    </div>

                    <ProfileMenu
                        name={userName}
                        email={session.user.email}
                    />
                </div>
            </header>

            <div className="mx-auto flex max-w-7xl">
                {/* Sidebar */}
                <aside className="hidden min-h-[calc(100vh-73px)] w-56 border-r border-[#343A40] px-4 py-6 md:block">
                    <nav className="space-y-1">
                        <a
                            href="/dashboard"
                            className="block rounded-xl bg-[#3B82F6]/10 px-4 py-3 text-sm font-medium text-[#3B82F6]"
                        >
                            Dashboard
                        </a>

                        <a
                            href="/groups"
                            className="block rounded-xl px-4 py-3 text-sm text-[#AAB2BD] transition hover:bg-[#343A40]/40 hover:text-[#F4F7FA]"
                        >
                            Groups
                        </a>

                        <a
                            href="/expenses"
                            className="block rounded-xl px-4 py-3 text-sm text-[#AAB2BD] transition hover:bg-[#343A40]/40 hover:text-[#F4F7FA]"
                        >
                            Expenses
                        </a>

                        <a
                            href="/balances"
                            className="block rounded-xl px-4 py-3 text-sm text-[#AAB2BD] transition hover:bg-[#343A40]/40 hover:text-[#F4F7FA]"
                        >
                            Balances
                        </a>

                        <a
                            href="/payments"
                            className="block rounded-xl px-4 py-3 text-sm text-[#AAB2BD] transition hover:bg-[#343A40]/40 hover:text-[#F4F7FA]"
                        >
                            Payments
                        </a>
                    </nav>
                </aside>

                {/* Main content */}
                <section className="w-full px-6 py-8 lg:px-10">
                    {/* Welcome */}
                    <div className="mb-8">
                        <p className="text-sm text-[#AAB2BD]">
                            Your personal expense dashboard
                        </p>

                        <h1 className="mt-1 text-3xl font-bold tracking-tight">
                            Good to see you, {userName.split(" ")[0]} 👋
                        </h1>
                    </div>

                    {/* Balance cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-2xl border border-[#343A40] bg-[#181C21] p-5">
                            <p className="text-sm text-[#AAB2BD]">
                                Total Balance
                            </p>

                            <p className="mt-3 text-3xl font-bold">
                                ₹0.00
                            </p>

                            <p className="mt-2 text-xs text-[#AAB2BD]">
                                Your overall balance
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#343A40] bg-[#181C21] p-5">
                            <p className="text-sm text-[#AAB2BD]">
                                You Owe
                            </p>

                            <p className="mt-3 text-3xl font-bold text-red-400">
                                ₹0.00
                            </p>

                            <p className="mt-2 text-xs text-[#AAB2BD]">
                                Amount you need to pay
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#343A40] bg-[#181C21] p-5">
                            <p className="text-sm text-[#AAB2BD]">
                                You Are Owed
                            </p>

                            <p className="mt-3 text-3xl font-bold text-green-400">
                                ₹0.00
                            </p>

                            <p className="mt-2 text-xs text-[#AAB2BD]">
                                Amount others owe you
                            </p>
                        </div>
                    </div>

                    {/* Groups */}
                    <div className="mt-8 rounded-2xl border border-[#343A40] bg-[#181C21] p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Your Groups
                                </h2>

                                <p className="mt-1 text-xs text-[#AAB2BD]">
                                    Manage your shared expenses
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <a
                                    href="/groups/join"
                                    className="rounded-xl border border-[#343A40] px-4 py-2 text-sm font-medium text-[#F4F7FA] transition hover:bg-[#343A40]/40"
                                >
                                    + Join Group
                                </a>

                                <a
                                    href="/groups/create"
                                    className="rounded-xl bg-[#3B82F6] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2563EB]"
                                >
                                    + Create Group
                                </a>
                            </div>
                        </div>

                        {/* Group list */}
                        {groups.length === 0 ? (
                            <div className="mt-6 rounded-xl border border-dashed border-[#343A40] px-6 py-10 text-center">
                                <p className="text-sm font-medium text-[#F4F7FA]">
                                    No groups yet
                                </p>

                                <p className="mt-1 text-xs text-[#AAB2BD]">
                                    Create your first group or join one using an invite.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {groups.map((membership) => (
                                    <a
                                        key={membership.group.id}
                                        href={`/groups/${membership.group.id}`}
                                        className="group rounded-xl border border-[#343A40] bg-[#101317] p-5 transition hover:border-[#3B82F6]/50 hover:bg-[#343A40]/20"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="truncate text-base font-semibold">
                                                    {membership.group.name}
                                                </h3>

                                                {membership.group.description && (
                                                    <p className="mt-2 line-clamp-2 text-xs text-[#AAB2BD]">
                                                        {membership.group.description}
                                                    </p>
                                                )}
                                            </div>

                                            {membership.isAdmin && (
                                                <span className="shrink-0 rounded-lg bg-[#3B82F6]/10 px-2 py-1 text-[11px] font-medium text-[#3B82F6]">
                                                    Admin
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-5 flex items-center justify-between">
                                            <span className="text-xs text-[#6B7280]">
                                                Joined{" "}
                                                {new Date(
                                                    membership.joinedAt
                                                ).toLocaleDateString()}
                                            </span>

                                            <span className="text-sm text-[#3B82F6] transition group-hover:translate-x-1">
                                                →
                                            </span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent activity */}
                    <div className="mt-6 rounded-2xl border border-[#343A40] bg-[#181C21] p-6">
                        <h2 className="text-lg font-semibold">
                            Recent Activity
                        </h2>

                        <p className="mt-1 text-xs text-[#AAB2BD]">
                            Your latest expenses and payments
                        </p>

                        <div className="mt-6 py-8 text-center">
                            <p className="text-sm text-[#AAB2BD]">
                                No activity yet.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}