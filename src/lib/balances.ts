import { prisma } from "@/lib/prisma";

type Balance = {
    userId: string;
    amount: number;
};

type PairBalance = {
    fromUserId: string;
    toUserId: string;
    amount: number;
};

function roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates the current pairwise balances of a group.
 *
 * Positive balance:
 *   fromUserId owes toUserId
 *
 * Approved payments reduce the outstanding balance.
 *
 * Pending/rejected payments do NOT reduce the actual balance.
 */
export async function calculateGroupBalances(groupId: string) {
    const group = await prisma.group.findUnique({
        where: {
            id: groupId,
        },
        include: {
            members: {
                select: {
                    userId: true,
                },
            },

            expenses: {
                include: {
                    splits: {
                        select: {
                            userId: true,
                            amount: true,
                        },
                    },
                },
            },

            payments: {
                where: {
                    status: "APPROVED",
                },
                select: {
                    payerId: true,
                    receiverId: true,
                    amount: true,
                },
            },
        },
    });

    if (!group) {
        throw new Error("Group not found");
    }

    /*
     * obligations[A][B] = amount A owes B
     */
    const obligations = new Map<string, number>();

    function addObligation(
        fromUserId: string,
        toUserId: string,
        amount: number
    ) {
        if (fromUserId === toUserId || amount <= 0) {
            return;
        }

        const key = `${fromUserId}:${toUserId}`;

        obligations.set(
            key,
            roundMoney(
                (obligations.get(key) || 0) + amount
            )
        );
    }

    /*
     * 1. Build obligations from expenses.
     *
     * Example:
     *
     * A pays ₹400
     *
     * A = ₹100
     * B = ₹100
     * C = ₹100
     * D = ₹100
     *
     * Result:
     * B → A ₹100
     * C → A ₹100
     * D → A ₹100
     */
    for (const expense of group.expenses) {
        const payerId = expense.payerId;

        for (const split of expense.splits) {
            const splitAmount = Number(
                split.amount.toString()
            );

            addObligation(
                split.userId,
                payerId,
                splitAmount
            );
        }
    }

    /*
     * 2. Approved settlements reduce the outstanding balance.
     *
     * Example:
     *
     * B owes A ₹100
     * B pays A ₹60
     *
     * Remaining:
     * B owes A ₹40
     */
    for (const payment of group.payments) {
        const paymentAmount = Number(
            payment.amount.toString()
        );

        addObligation(
            payment.payerId,
            payment.receiverId,
            -paymentAmount
        );
    }

    /*
     * The previous function intentionally ignores negative
     * values. Therefore we now calculate the pairwise net
     * balances directly from the expense/payment ledger.
     */

    const directedBalances = new Map<string, number>();

    function addDirectedBalance(
        fromUserId: string,
        toUserId: string,
        amount: number
    ) {
        if (fromUserId === toUserId || amount === 0) {
            return;
        }

        const key = `${fromUserId}:${toUserId}`;

        directedBalances.set(
            key,
            roundMoney(
                (directedBalances.get(key) || 0) +
                    amount
            )
        );
    }

    /*
     * Rebuild the ledger properly.
     */

    for (const expense of group.expenses) {
        for (const split of expense.splits) {
            const amount = Number(
                split.amount.toString()
            );

            if (split.userId !== expense.payerId) {
                addDirectedBalance(
                    split.userId,
                    expense.payerId,
                    amount
                );
            }
        }
    }

    /*
     * Approved payments are negative obligations.
     */
    for (const payment of group.payments) {
        const amount = Number(
            payment.amount.toString()
        );

        addDirectedBalance(
            payment.payerId,
            payment.receiverId,
            -amount
        );
    }

    /*
     * 3. Combine opposite directions.
     *
     * If:
     *
     * A owes B ₹100
     * B owes A ₹40
     *
     * Result:
     * A owes B ₹60
     */
    const processedPairs = new Set<string>();
    const pairBalances: PairBalance[] = [];

    for (const memberA of group.members) {
        for (const memberB of group.members) {
            const a = memberA.userId;
            const b = memberB.userId;

            if (a === b) continue;

            const pairKey =
                [a, b].sort().join(":");

            if (processedPairs.has(pairKey)) {
                continue;
            }

            processedPairs.add(pairKey);

            const aToB =
                directedBalances.get(`${a}:${b}`) || 0;

            const bToA =
                directedBalances.get(`${b}:${a}`) || 0;

            const net = roundMoney(aToB - bToA);

            if (net > 0) {
                pairBalances.push({
                    fromUserId: a,
                    toUserId: b,
                    amount: net,
                });
            } else if (net < 0) {
                pairBalances.push({
                    fromUserId: b,
                    toUserId: a,
                    amount: Math.abs(net),
                });
            }
        }
    }

    return pairBalances;
}

export type Settlement = {
    fromUserId: string;
    toUserId: string;
    amount: number;
};

/**
 * Calculates the minimum number of transactions needed
 * to settle the entire group.
 *
 * Example:
 *
 * A owes B ₹20
 * B owes C ₹20
 *
 * Result:
 * A pays C ₹20
 */
export async function calculateGroupSettlements(
    groupId: string
): Promise<Settlement[]> {
    const group = await prisma.group.findUnique({
        where: {
            id: groupId,
        },
        include: {
            members: {
                select: {
                    userId: true,
                },
            },

            expenses: {
                include: {
                    splits: {
                        select: {
                            userId: true,
                            amount: true,
                        },
                    },
                },
            },

            payments: {
                where: {
                    status: "APPROVED",
                },
                select: {
                    payerId: true,
                    receiverId: true,
                    amount: true,
                },
            },
        },
    });

    if (!group) {
        throw new Error("Group not found");
    }

    /*
     * netBalances:
     *
     * positive  = person should receive money
     * negative  = person owes money
     */
    const netBalances = new Map<string, number>();

    for (const member of group.members) {
        netBalances.set(member.userId, 0);
    }

    /*
     * Expenses
     *
     * If A pays ₹400 and B owes ₹100:
     *
     * B = -100
     * A = +100
     */
    for (const expense of group.expenses) {
        for (const split of expense.splits) {
            const amount = Number(
                split.amount.toString()
            );

            if (split.userId === expense.payerId) {
                continue;
            }

            netBalances.set(
                split.userId,
                (netBalances.get(split.userId) || 0) -
                    amount
            );

            netBalances.set(
                expense.payerId,
                (netBalances.get(expense.payerId) || 0) +
                    amount
            );
        }
    }

    /*
     * Approved payments
     *
     * B pays A ₹60:
     *
     * B becomes ₹60 less in debt
     * A becomes ₹60 less in credit
     */
    for (const payment of group.payments) {
        const amount = Number(
            payment.amount.toString()
        );

        netBalances.set(
            payment.payerId,
            (netBalances.get(payment.payerId) || 0) +
                amount
        );

        netBalances.set(
            payment.receiverId,
            (netBalances.get(payment.receiverId) || 0) -
                amount
        );
    }

    /*
     * Separate debtors and creditors.
     */
    const debtors: {
        userId: string;
        amount: number;
    }[] = [];

    const creditors: {
        userId: string;
        amount: number;
    }[] = [];

    for (const [userId, balance] of netBalances) {
        const rounded = Math.round(
            (balance + Number.EPSILON) * 100
        ) / 100;

        if (rounded < 0) {
            debtors.push({
                userId,
                amount: Math.abs(rounded),
            });
        } else if (rounded > 0) {
            creditors.push({
                userId,
                amount: rounded,
            });
        }
    }

    /*
     * Greedily match debtors with creditors.
     *
     * This minimizes the number of transactions
     * in the normal case.
     */
    const settlements: Settlement[] = [];

    let debtorIndex = 0;
    let creditorIndex = 0;

    while (
        debtorIndex < debtors.length &&
        creditorIndex < creditors.length
    ) {
        const debtor = debtors[debtorIndex];
        const creditor = creditors[creditorIndex];

        const amount = Math.min(
            debtor.amount,
            creditor.amount
        );

        if (amount > 0) {
            settlements.push({
                fromUserId: debtor.userId,
                toUserId: creditor.userId,
                amount: Math.round(
                    amount * 100
                ) / 100,
            });
        }

        debtor.amount = Math.round(
            (debtor.amount - amount) * 100
        ) / 100;

        creditor.amount = Math.round(
            (creditor.amount - amount) * 100
        ) / 100;

        if (debtor.amount <= 0) {
            debtorIndex++;
        }

        if (creditor.amount <= 0) {
            creditorIndex++;
        }
    }

    return settlements;
}