import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type SplitInput = {
    userId: string;
    amount?: number;
};

export async function POST(
    request: Request,
    { params }: { params: Promise<{ groupId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return Response.json(
                {
                    success: false,
                    message: "Unauthorized",
                },
                { status: 401 }
            );
        }

        const { groupId } = await params;

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

        const splitType =
            body.splitType === "CUSTOM"
                ? "CUSTOM"
                : "EQUAL";

        const splits: SplitInput[] = Array.isArray(body.splits)
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

        if (!Number.isInteger(Math.round(amount * 100))) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid amount.",
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
                    message: "At least one member must be selected.",
                },
                { status: 400 }
            );
        }

        // -----------------------------------------
        // FIND CURRENT USER
        // -----------------------------------------

        const currentUser = await prisma.user.findUnique({
            where: {
                email: session.user.email,
            },
        });

        if (!currentUser) {
            return Response.json(
                {
                    success: false,
                    message: "User not found.",
                },
                { status: 404 }
            );
        }

        // -----------------------------------------
        // FIND GROUP + MEMBERS
        // -----------------------------------------

        const group = await prisma.group.findUnique({
            where: {
                id: groupId,
            },
            include: {
                members: true,
            },
        });

        if (!group) {
            return Response.json(
                {
                    success: false,
                    message: "Group not found.",
                },
                { status: 404 }
            );
        }

        // -----------------------------------------
        // CURRENT USER MUST BE A MEMBER
        // -----------------------------------------

        const currentUserIsMember = group.members.some(
            (member) => member.userId === currentUser.id
        );

        if (!currentUserIsMember) {
            return Response.json(
                {
                    success: false,
                    message: "You are not a member of this group.",
                },
                { status: 403 }
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
                    message: "The selected payer is not a group member.",
                },
                { status: 400 }
            );
        }

        // -----------------------------------------
        // CHECK DUPLICATE MEMBERS
        // -----------------------------------------

        const splitUserIds = splits.map(
            (split) => split.userId
        );

        const uniqueUserIds = new Set(splitUserIds);

        if (uniqueUserIds.size !== splitUserIds.length) {
            return Response.json(
                {
                    success: false,
                    message: "A member cannot be selected more than once.",
                },
                { status: 400 }
            );
        }

        // -----------------------------------------
        // CHECK ALL MEMBERS BELONG TO GROUP
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
            calculatedSplits = splits.map((split) => {
                const splitAmount = Number(split.amount);

                return {
                    userId: split.userId,
                    amount: splitAmount,
                };
            });

            // -----------------------------------------
            // CUSTOM SPLIT VALIDATION
            // -----------------------------------------

            const customTotal = calculatedSplits.reduce(
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
        // CREATE EXPENSE + SPLITS
        // -----------------------------------------

        const expense = await prisma.$transaction(
            async (tx) => {
                return tx.expense.create({
                    data: {
                        groupId,
                        payerId,
                        title,
                        description: description || null,
                        amount: amount.toFixed(2),

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
            }
        );

        // -----------------------------------------
        // RESPONSE
        // -----------------------------------------

        return Response.json(
            {
                success: true,
                message: "Payment added successfully.",

                expense: {
                    id: expense.id,
                    title: expense.title,
                    description: expense.description,
                    amount: expense.amount.toString(),
                    payer: expense.payer,
                    splits: expense.splits.map(
                        (split) => ({
                            userId: split.userId,
                            user: split.user,
                            amount: split.amount.toString(),
                        })
                    ),
                    createdAt: expense.createdAt,
                    isEdited: expense.isEdited,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create expense error:", error);

        return Response.json(
            {
                success: false,
                message:
                    "Something went wrong while adding the payment.",
            },
            { status: 500 }
        );
    }
}