import { randomInt, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetCode } from "@/lib/brevo";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const email = body.email?.trim().toLowerCase();

        if (!email) {
            return Response.json(
                {
                    success: false,
                    message: "Email is required",
                },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        /*
         * Always return the same response whether the email
         * exists or not. This prevents revealing registered emails.
         */
        if (!user) {
            return Response.json({
                success: true,
                message:
                    "If an account exists with this email, a verification code has been sent.",
            });
        }

        // Delete any previous reset tokens for this user
        await prisma.passwordResetToken.deleteMany({
            where: {
                userId: user.id,
            },
        });

        // Generate a 6-digit OTP
        const code = randomInt(100000, 1000000).toString();

        // Hash the OTP before storing it
        const tokenHash = createHash("sha256")
            .update(code)
            .digest("hex");

        // OTP expires in 10 minutes
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.passwordResetToken.create({
            data: {
                tokenHash,
                userId: user.id,
                expiresAt,
            },
        });

        // Send OTP through Brevo
        await sendPasswordResetCode(email, code);

        return Response.json({
            success: true,
            message:
                "If an account exists with this email, a verification code has been sent.",
        });
    } catch (error) {
        console.error("Forgot password error:", error);

        return Response.json(
            {
                success: false,
                message: "Something went wrong. Please try again.",
            },
            { status: 500 }
        );
    }
}