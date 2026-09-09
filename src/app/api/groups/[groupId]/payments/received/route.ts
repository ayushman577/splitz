import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateGroupSettlements } from "@/lib/balances";

type RouteContext = {
    params: Promise<{
        groupId: string;
    }>;
};

export async function POST(
    request: Request,
    context: RouteContext
) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { groupId } = await context.params;

        const body = await request.json();

        const payerId = body.payerId;
        const amount = Number(body.amount);

        if (!payerId || !amount || amount <= 0) {
            return NextResponse.json(
                {
                    error: "Invalid payer or amount",
                },
                { status: 400 }
            );
        }

        const currentUser = await prisma.user.findUnique({
            where: {
                email: session.user.email,
            },
        });

        if (!currentUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (payerId === currentUser.id) {
            return NextResponse.json(
                {
                    error: "You cannot mark your own payment as received.",
                },
                { status: 400 }
            );
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
            return NextResponse.json(
                { error: "Group not found" },
                { status: 404 }
            );
        }

        const receiverIsMember = group.members.some(
            (member) => member.userId === currentUser.id
        );

        const payerIsMember = group.members.some(
            (member) => member.userId === payerId
        );

        if (!receiverIsMember || !payerIsMember) {
            return NextResponse.json(
                {
                    error: "Both users must be members of this group.",
                },
                { status: 403 }
            );
        }

        /*
         * Check the current outstanding settlement.
         *
         * payerId -> currentUser.id
         */
        const settlements =
            await calculateGroupSettlements(groupId);

        const settlement = settlements.find(
            (item) =>
                item.fromUserId === payerId &&
                item.toUserId === currentUser.id
        );

        if (!settlement) {
            return NextResponse.json(
                {
                    error: "This member does not currently owe you money.",
                },
                { status: 400 }
            );
        }

        if (amount > settlement.amount + 0.01) {
            return NextResponse.json(
                {
                    error: `Amount cannot exceed the outstanding balance of ₹${settlement.amount.toFixed(
                        2
                    )}.`,
                },
                { status: 400 }
            );
        }

        /*
         * If the payer already marked a payment as pending,
         * the receiver should confirm that payment instead of
         * creating another payment record.
         */
        const pendingPayment =
            await prisma.payment.findFirst({
                where: {
                    groupId,
                    payerId,
                    receiverId: currentUser.id,
                    status: "PENDING",
                },
            });

        if (pendingPayment) {
            return NextResponse.json(
                {
                    error:
                        "A payment from this member is already awaiting confirmation. Please confirm or reject it instead.",
                },
                { status: 409 }
            );
        }

        const payment = await prisma.payment.create({
            data: {
                groupId,
                payerId,
                receiverId: currentUser.id,
                amount,
                status: "APPROVED",
            },
        });

        return NextResponse.json(
            {
                message: "Payment marked as received.",
                payment,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error(
            "Mark payment as received error:",
            error
        );

        return NextResponse.json(
            {
                error: "Failed to mark payment as received.",
            },
            { status: 500 }
        );
    }
}