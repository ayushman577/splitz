import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type PaymentAction = {
    action: "approve" | "reject";
};

export async function PATCH(
    request: Request,
    {
        params,
    }: {
        params: Promise<{
            groupId: string;
            paymentId: string;
        }>;
    }
) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { groupId, paymentId } =
            await params;

        const body =
            (await request.json()) as PaymentAction;

        if (
            body.action !== "approve" &&
            body.action !== "reject"
        ) {
            return NextResponse.json(
                {
                    error:
                        "Action must be approve or reject",
                },
                { status: 400 }
            );
        }

        const currentUser =
            await prisma.user.findUnique({
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

        const payment =
            await prisma.payment.findUnique({
                where: {
                    id: paymentId,
                },
            });

        if (!payment) {
            return NextResponse.json(
                { error: "Payment not found" },
                { status: 404 }
            );
        }

        if (payment.groupId !== groupId) {
            return NextResponse.json(
                {
                    error:
                        "Payment does not belong to this group",
                },
                { status: 400 }
            );
        }

        if (
            payment.receiverId !==
            currentUser.id
        ) {
            return NextResponse.json(
                {
                    error:
                        "Only the receiver can confirm or reject this payment",
                },
                { status: 403 }
            );
        }

        if (payment.status !== "PENDING") {
            return NextResponse.json(
                {
                    error:
                        "This payment has already been processed",
                },
                { status: 400 }
            );
        }

        const updatedPayment =
            await prisma.payment.update({
                where: {
                    id: paymentId,
                },
                data: {
                    status:
                        body.action === "approve"
                            ? "APPROVED"
                            : "REJECTED",
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

        return NextResponse.json({
            message:
                body.action === "approve"
                    ? "Payment confirmed"
                    : "Payment rejected",
            payment: updatedPayment,
        });
    } catch (error) {
        console.error(
            "Update payment error:",
            error
        );

        return NextResponse.json(
            { error: "Failed to update payment" },
            { status: 500 }
        );
    }
}