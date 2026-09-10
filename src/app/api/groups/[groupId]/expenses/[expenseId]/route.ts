import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

export async function DELETE(
    request: Request,
    { params }: { params: Promise<Params> }
) {
    try {
        const { groupId, expenseId } = await params;

        const result = await getAuthorizedExpense(
            groupId,
            expenseId
        );

        if ("error" in result) {
            return result.error;
        }

        // Delete the expense.
        //
        // ExpenseSplit records are automatically deleted because
        // the Prisma relation uses onDelete: Cascade.
        await prisma.expense.delete({
            where: {
                id: expenseId,
            },
        });

        // Refresh all pages that depend on expense data.
        revalidatePath(`/groups/${groupId}`);
        revalidatePath(`/groups/${groupId}/payments`);
        revalidatePath(`/groups/${groupId}/balances`);
        revalidatePath(`/dashboard`);

        return Response.json({
            success: true,
            message: "Expense undone successfully.",
        });
    } catch (error) {
        console.error("DELETE EXPENSE ERROR:", error);

        return Response.json(
            {
                success: false,
                message: "Failed to undo expense.",
            },
            { status: 500 }
        );
    }
}