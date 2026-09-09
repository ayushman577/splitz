import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const registerSchema = z.object({
    name: z.string().trim().min(2).max(50),
    email: z.string().trim().email(),
    password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const result = registerSchema.safeParse(body);

        if (!result.success) {
            return Response.json(
                {
                    success: false,
                    message: "Invalid registration details",
                },
                { status: 400 }
            );
        }

        const { name, password } = result.data;
        const email = result.data.email.toLowerCase();

        const existingUser = await prisma.user.findUnique({
            where: { email },
            include: {
                accounts: {
                    select: {
                        provider: true,
                    },
                },
            },
        });

        if (existingUser) {
            const hasGoogleAccount = existingUser.accounts.some(
                (account) => account.provider === "google"
            );

            return Response.json(
                {
                    success: false,
                    message: hasGoogleAccount
                        ? "This email is already registered with Google. Please continue with Google."
                        : "An account with this email already exists. Please log in instead.",
                },
                { status: 409 }
            );
        }

        const passwordHash = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });

        return Response.json(
            {
                success: true,
                message: "Account created successfully",
                user,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);

        return Response.json(
            {
                success: false,
                message: "Something went wrong",
            },
            { status: 500 }
        );
    }
}