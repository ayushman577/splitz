import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
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

    const body = await request.json();

    const name = body.name?.trim();

    if (!name || name.length < 2 || name.length > 50) {
      return Response.json(
        {
          success: false,
          message: "Name must be between 2 and 50 characters.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: {
        email: session.user.email,
      },
      data: {
        name,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return Response.json({
      success: true,
      message: "Name updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Profile update error:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong.",
      },
      { status: 500 }
    );
  }
}