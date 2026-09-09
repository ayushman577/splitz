import { createHash } from "crypto";
import { cookies } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const resetPasswordSchema = z.object({
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          message: "Password must be between 8 and 72 characters.",
        },
        { status: 400 }
      );
    }

    const { password } = result.data;

    // Read secure reset cookie
    const cookieStore = await cookies();

    const resetSecret = cookieStore.get(
      "splitz_password_reset"
    )?.value;

    if (!resetSecret) {
      return Response.json(
        {
          success: false,
          message:
            "Your password reset session is invalid or has expired.",
        },
        { status: 401 }
      );
    }

    // Hash the secret from the cookie
    const resetSecretHash = createHash("sha256")
      .update(resetSecret)
      .digest("hex");

    // Find matching reset token
    const resetToken =
      await prisma.passwordResetToken.findUnique({
        where: {
          tokenHash: resetSecretHash,
        },
        include: {
          user: true,
        },
      });

    if (!resetToken) {
      return Response.json(
        {
          success: false,
          message:
            "Your password reset session is invalid or has expired.",
        },
        { status: 401 }
      );
    }

    // Check expiry
    if (
      resetToken.expiresAt.getTime() < Date.now()
    ) {
      await prisma.passwordResetToken.delete({
        where: {
          id: resetToken.id,
        },
      });

      cookieStore.delete("splitz_password_reset");

      return Response.json(
        {
          success: false,
          message:
            "Your password reset session has expired. Please start again.",
        },
        { status: 401 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password and invalidate reset token
    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          passwordHash,
        },
      }),

      prisma.passwordResetToken.delete({
        where: {
          id: resetToken.id,
        },
      }),
    ]);

    // Remove reset cookie
    cookieStore.delete("splitz_password_reset");

    return Response.json({
      success: true,
      message:
        "Your password has been reset successfully.",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
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