import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user?.email) {
      return Response.json(
        {
          success: false,
          message: "You must be logged in to join a group.",
        },
        { status: 401 }
      );
    }

    // Read request body
    const body = await request.json();

    let code = body.code?.trim();

    if (!code) {
      return Response.json(
        {
          success: false,
          message: "Invite code is required.",
        },
        { status: 400 }
      );
    }

    /*
      Allow both:
      K7X9P2
      and
      http://localhost:3000/join/K7X9P2
    */

    if (code.includes("/join/")) {
      code = code.split("/join/")[1];
    }

    // Remove anything after the code
    code = code.split("?")[0].split("/")[0].trim().toUpperCase();

    // Validate 6-character code
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      return Response.json(
        {
          success: false,
          message: "Invalid invite code.",
        },
        { status: 400 }
      );
    }

    // Find group
    const group = await prisma.group.findUnique({
      where: {
        joinCode: code,
      },
    });

    if (!group) {
      return Response.json(
        {
          success: false,
          message: "Group not found. Please check the invite code.",
        },
        { status: 404 }
      );
    }

    // Find logged-in user
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: group.id,
        },
      },
    });

    if (existingMember) {
      return Response.json(
        {
          success: false,
          alreadyMember: true,
          message: "You are already a member of this group.",
          group: {
            id: group.id,
            name: group.name,
          },
        },
        { status: 409 }
      );
    }

    // Add user to group
    await prisma.groupMember.create({
      data: {
        userId: user.id,
        groupId: group.id,
        isAdmin: false,
      },
    });

    revalidatePath("/dashboard");

    return Response.json(
      {
        success: true,
        message: `You joined ${group.name} successfully.`,
        group: {
          id: group.id,
          name: group.name,
          joinCode: group.joinCode,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Join group error:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong while joining the group.",
      },
      { status: 500 }
    );
  }
}