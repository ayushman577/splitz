import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 10;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = body.email?.trim().toLowerCase();
    const code = body.code?.trim();

    if (!email || !code) {
      return Response.json(
        {
          success: false,
          message: "Email and verification code are required.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return Response.json(
        {
          success: false,
          message: "Verification code must be 6 digits.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "Invalid or expired verification code.",
        },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!resetToken) {
      return Response.json(
        {
          success: false,
          message: "Invalid or expired verification code.",
        },
        { status: 400 }
      );
    }

    // Check expiry
    if (resetToken.expiresAt.getTime() < Date.now()) {
      await prisma.passwordResetToken.delete({
        where: {
          id: resetToken.id,
        },
      });

      return Response.json(
        {
          success: false,
          message:
            "This verification code has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // Check maximum attempts
    if (resetToken.attempts >= MAX_ATTEMPTS) {
      await prisma.passwordResetToken.delete({
        where: {
          id: resetToken.id,
        },
      });

      return Response.json(
        {
          success: false,
          message:
            "Too many incorrect attempts. Please request a new code.",
        },
        { status: 429 }
      );
    }

    // Hash submitted code
    const tokenHash = createHash("sha256")
      .update(code)
      .digest("hex");

    // Compare hashes
    if (tokenHash !== resetToken.tokenHash) {
      await prisma.passwordResetToken.update({
        where: {
          id: resetToken.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      return Response.json(
        {
          success: false,
          message: "Invalid verification code.",
        },
        { status: 400 }
      );
    }

    /*
     * OTP is correct.
     *
     * Create a cryptographically secure reset token.
     * We store only its hash in the database.
     */

    const resetSecret = randomBytes(32).toString("hex");

    const resetSecretHash = createHash("sha256")
      .update(resetSecret)
      .digest("hex");

    /*
     * Reuse the existing token record.
     *
     * The reset authorization will expire in 10 minutes.
     */
    const resetExpiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await prisma.passwordResetToken.update({
      where: {
        id: resetToken.id,
      },
      data: {
        tokenHash: resetSecretHash,
        expiresAt: resetExpiresAt,
        attempts: 0,
      },
    });

    // Store the raw secret in a secure HttpOnly cookie
    const cookieStore = await cookies();

    cookieStore.set(
      "splitz_password_reset",
      resetSecret,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 10 * 60,
      }
    );

    return Response.json({
      success: true,
      message: "Verification successful.",
    });
  } catch (error) {
    console.error(
      "Verify reset code error:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}