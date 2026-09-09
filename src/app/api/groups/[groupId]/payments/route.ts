import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type PaymentRequest = {
    receiverId: string;
    amount: number;
    note?: string;
};

export async function POST(
    request: Request,
    { params }: { params: Promise<{ groupId: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { groupId } = await params;

        const body =
            (await request.json()) as PaymentRequest;

        const receiverId = body.receiverId?.trim();
        const amount = Number(body.amount);
        const note = body.note?.trim() || null;

        if (!receiverId) {
            return NextResponse.json(
                { error: "Receiver is required" },
                { status: 400 }
            );
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json(
                { error: "Amount must be greater than 0" },
                { status: 400 }
            );
        }

        const currentUser = await prisma.user.findUnique({
            where: {
                email: session.user.email,
            },
            select: {
                id: true,
            },
        });

        if (!currentUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        if (currentUser.id === receiverId) {
            return NextResponse.json(
                {
                    error: "You cannot make a payment to yourself",
                },
                { status: 400 }
            );
        }

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
            },
        });

        if (!group) {
            return NextResponse.json(
                { error: "Group not found" },
                { status: 404 }
            );
        }

        const isCurrentUserMember =
            group.members.some(
                (member) =>
                    member.userId === currentUser.id
            );

        if (!isCurrentUserMember) {
            return NextResponse.json(
                { error: "You are not a member of this group" },
                { status: 403 }
            );
        }

        const isReceiverMember =
            group.members.some(
                (member) =>
                    member.userId === receiverId
            );

        if (!isReceiverMember) {
            return NextResponse.json(
                {
                    error: "Receiver is not a member of this group",
                },
                { status: 400 }
            );
        }

        const existingPendingPayment =
            await prisma.payment.findFirst({
                where: {
                    groupId,
                    payerId: currentUser.id,
                    receiverId,
                    status: "PENDING",
                },
            });

        if (existingPendingPayment) {
            return NextResponse.json(
                {
                    error:
                        "A payment is already awaiting confirmation for this member.",
                },
                { status: 409 }
            );
        }

        const payment = await prisma.payment.create({
            data: {
                groupId,
                payerId: currentUser.id,
                receiverId,
                amount,
                note,
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
        });

        return NextResponse.json(
            {
                message:
                    "Payment marked as paid and sent for confirmation",
                payment,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error(
            "Create payment error:",
            error
        );

        return NextResponse.json(
            { error: "Failed to create payment" },
            { status: 500 }
        );
    }
}