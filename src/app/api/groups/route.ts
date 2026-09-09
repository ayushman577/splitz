import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function generateJoinCode(length = 6) {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < length; i++) {
    code += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return code;
}

async function generateUniqueJoinCode() {
  let joinCode = generateJoinCode();

  while (await prisma.group.findUnique({ where: { joinCode } })) {
    joinCode = generateJoinCode();
  }

  return joinCode;
}

export async function POST(request: Request) {
  try {
    // Check login
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

    // Get request data
    const body = await request.json();

    const name = body.name?.trim();
    const description = body.description?.trim() || null;

    // Validate group name
    if (!name) {
      return Response.json(
        {
          success: false,
          message: "Group name is required.",
        },
        { status: 400 }
      );
    }

    if (name.length < 2 || name.length > 100) {
      return Response.json(
        {
          success: false,
          message: "Group name must be between 2 and 100 characters.",
        },
        { status: 400 }
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

    // Generate permanent unique invite code
    const joinCode = await generateUniqueJoinCode();

    // Create group + add creator as admin
    const group = await prisma.group.create({
      data: {
        name,
        description,
        joinCode,
        createdById: user.id,

        members: {
          create: {
            userId: user.id,
            isAdmin: true,
          },
        },
      },

      include: {
        members: true,
      },
    });

    revalidatePath("/dashboard");

    return Response.json(
      {
        success: true,
        message: "Group created successfully.",
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          joinCode: group.joinCode,
          createdAt: group.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create group error:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong while creating the group.",
      },
      { status: 500 }
    );
  }
}