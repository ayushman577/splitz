import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = {
    groupId: string;
    expenseId: string;
};

async function getAuthorizedExpense(
    groupId: string,
    expenseId: string
) {
    const session = await auth();

    if (!session?.user?.email) {
        return {
            error: Response.json(
                {
                    success: false,
                    message: "Unauthorized",
                },
                { status: 401 }
            ),
        };
    }

    const currentUser = await prisma.user.findUnique({
        where: {
            email: session.user.email,
        },
    });

    if (!currentUser) {
        return {
            error: Response.json(
                {
                    success: false,
                    message: "User not found.",
                },
                { status: 404 }
            ),
        };
    }

    const group = await prisma.group.findUnique({
        where: {
            id: groupId,
        },
        include: {
            members: true,
        },
    });

    if (!group) {
        return {
            error: Response.json(
                {
                    success: false,
                    message: "Group not found.",
                },
                { status: 404 }
            ),
        };
    }

    const membership = group.members.find(
        (member) => member.userId === currentUser.id
    );

    if (!membership) {
        return {
            error: Response.json(
                {
                    success: false,
                    message: "You are not a member of this group.",
                },
                { status: 403 }
            ),
        };
    }

    const expense = await prisma.expense.findFirst({
        where: {
            id: expenseId,
            groupId,
        },
        include: {
            splits: true,
        },
    });

    if (!expense) {
        return {
            error: Response.json(
                {
                    success: false,
                    message: "Expense not found.",
                },
                { status: 404 }
            ),
        };
    }


    const canManage =
        group.createdById === currentUser.id ||
        expense.payerId === currentUser.id;

    if (!canManage) {
        return {
            error: Response.json(
                {
                    success: false,
                    message:
                        "You do not have permission to manage this expense.",
                },
                { status: 403 }
            ),
        };
    }

    return {
        currentUser,
        group,
        expense,
    };
}

// =====================================================
// PATCH — EDIT EXPENSE
// =====================================================

export async function PATCH(
    request: Request,
    {
        params,
    }: {
        params: Promise<Params>;
    }
) {
    try {
        const { groupId, expenseId } = await params;

        const authorized = await getAuthorizedExpense(
            groupId,
            expenseId
        );

        if ("error" in authorized) {
            return authorized.error;
        }

        const { currentUser, group, expense } = authorized;

        const body = await request.json();

        const title =
            typeof body.title === "string"
                ? body.title.trim()
                : "";

        const description =
            typeof body.description === "string"
                ? body.description.trim()
                : null;

        const amount = Number(body.amount);

        const payerId =
            typeof body.payerId === "string"
                ? body.payerId
                : "";

        const isOwner = group.createdById === authorized.currentUser.id;

        if (!isOwner && payerId !== expense.payerId) {
            return Response.json(
                {
                    success: false,
                    message:
                        "Only the group owner can change who paid.",
                },
                { status: 403 }
            );
        }

        const splitType =
            body.splitType === "CUSTOM"
                ? "CUSTOM"
                : "EQUAL";

        const splits = Array.isArray(body.splits)
            ? body.splits
            : [];

        // -----------------------------------------
        // BASIC VALIDATION
        // -----------------------------------------

        if (!title) {
            return Response.json(
                {
                    success: false,
                    message: "Payment title is required.",
                },
                { status: 400 }
            );
        }

        if (title.length > 100) {
            return Response.json(
                {
                    success: false,
                    message: "Payment title is too long.",
                },
                { status: 400 }
            );
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            return Response.json(
                {
                    success: false,
                    message: "Amount must be greater than zero.",
                },
                { status: 400 }
            );
        }

        if (!payerId) {
            return Response.json(
                {
                    success: false,
                    message: "Payer is required.",
                },
                { status: 400 }
            );
        }

        if (!splits.length) {
            return Response.json(
                {
                    success: false,
                    message:
                        "At least one member must be selected.",
                },
                { status: 400 }
            );
        }

        // -----------------------------------------
        // PAYER MUST BE A GROUP MEMBER
        // -----------------------------------------

        const payerIsMember = group.members.some(
            (member) => member.userId === payerId
        );

        if (!payerIsMember) {
            return Response.json(
                {
                    success: false,
                    message:
                        "The selected payer is not a group member.",
                },
                { status: 400 }
            );
        }

        // -----------------------------------------
        // CHECK DUPLICATE MEMBERS
        // -----------------------------------------

        const splitUserIds = splits.map(
            (split: { userId: string }) => split.userId
        );

        const uniqueUserIds = new Set(splitUserIds);

        if (uniqueUserIds.size !== splitUserIds.length) {
            return Response.json(
                {
                    success: false,
                    message:
                        "A member cannot be selected more than once.",
                },
                { status: 400 }
            );
        }

        // -----------------------------------------
        // CHECK MEMBERS BELONG TO GROUP
        // -----------------------------------------

        const groupMemberIds = new Set(
            group.members.map((member) => member.userId)
        );

        const invalidMember = splitUserIds.some(
            (userId) => !groupMemberIds.has(userId)
        );

        if (invalidMember) {
            return Response.json(
                {
                    success: false,
                    message:
                        "One or more selected members do not belong to this group.",
                },
                { status: 400 }
            );
        }

        // -----------------------------------------
        // CALCULATE SPLITS
        // -----------------------------------------

        const amountInPaise = Math.round(amount * 100);

        let calculatedSplits: {
            userId: string;
            amount: number;
        }[];

        if (splitType === "EQUAL") {
            const memberCount = splitUserIds.length;

            const baseAmount = Math.floor(
                amountInPaise / memberCount
            );

            const remainder =
                amountInPaise % memberCount;

            calculatedSplits = splitUserIds.map(
                (userId, index) => {
                    const splitAmount =
                        baseAmount +
                        (index < remainder ? 1 : 0);

                    return {
                        userId,
                        amount: splitAmount / 100,
                    };
                }
            );
        } else {
            calculatedSplits = splits.map(
                (split: {
                    userId: string;
                    amount?: number;
                }) => ({
                    userId: split.userId,
                    amount: Number(split.amount),
                })
            );

            const customTotal =
                calculatedSplits.reduce(
                    (total, split) =>
                        total +
                        Math.round(split.amount * 100),
                    0
                );

            if (customTotal !== amountInPaise) {
                return Response.json(
                    {
                        success: false,
                        message: `Custom split must equal ₹${amount.toFixed(
                            2
                        )}. Current split total is ₹${(
                            customTotal / 100
                        ).toFixed(2)}.`,
                    },
                    { status: 400 }
                );
            }

            const hasInvalidAmount =
                calculatedSplits.some(
                    (split) =>
                        !Number.isFinite(split.amount) ||
                        split.amount <= 0
                );

            if (hasInvalidAmount) {
                return Response.json(
                    {
                        success: false,
                        message:
                            "Each split amount must be greater than zero.",
                    },
                    { status: 400 }
                );
            }
        }

        // -----------------------------------------
        // UPDATE EXPENSE
        // -----------------------------------------

        const updatedExpense =
            await prisma.$transaction(async (tx) => {
                await tx.expenseSplit.deleteMany({
                    where: {
                        expenseId,
                    },
                });

                return tx.expense.update({
                    where: {
                        id: expense.id,
                    },

                    data: {
                        title,
                        description: description || null,
                        amount: amount.toFixed(2),
                        payerId,

                        isEdited: true,

                        splits: {
                            create: calculatedSplits.map(
                                (split) => ({
                                    userId: split.userId,
                                    amount: split.amount.toFixed(2),
                                })
                            ),
                        },
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
                });
            });

        return Response.json({
            success: true,
            message: "Payment updated successfully.",

            expense: {
                id: updatedExpense.id,
                title: updatedExpense.title,
                description: updatedExpense.description,
                amount: updatedExpense.amount.toString(),
                payer: updatedExpense.payer,

                splits: updatedExpense.splits.map(
                    (split) => ({
                        userId: split.userId,
                        user: split.user,
                        amount: split.amount.toString(),
                    })
                ),

                createdAt: updatedExpense.createdAt,
                updatedAt: updatedExpense.updatedAt,
                isEdited: updatedExpense.isEdited,
            },
        });
    } catch (error) {
        console.error("Edit expense error:", error);

        return Response.json(
            {
                success: false,
                message:
                    "Something went wrong while editing the payment.",
            },
            { status: 500 }
        );
    }
}

// =====================================================
// DELETE — DELETE EXPENSE
// =====================================================
