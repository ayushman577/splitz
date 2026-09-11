import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type RouteContext = {
  params: Promise<{
    groupId: string;
  }>;
};

async function getAuthorizedAdmin(groupId: string) {
  const session = await auth();

  if (!session?.user?.email) {
    return {
      error: "Unauthorized",
      status: 401,
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    return {
      error: "User not found.",
      status: 404,
    };
  }

  const group = await prisma.group.findUnique({
    where: {
      id: groupId,
    },
    select: {
      id: true,
      createdById: true,
      members: {
        where: {
          userId: user.id,
        },
        select: {
          isAdmin: true,
        },
      },
    },
  });

  if (!group) {
    return {
      error: "Group not found.",
      status: 404,
    };
  }

  const isOwner = group.createdById === user.id;
  const isAdmin = group.members[0]?.isAdmin === true;

  if (!isOwner && !isAdmin) {
    return {
      error: "You do not have permission to manage this group.",
      status: 403,
    };
  }

  return {
    user,
    group,
    isOwner,
    isAdmin,
  };
}

/* ================================
   UPDATE GROUP
================================ */

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { groupId } = await params;

    const authorization = await getAuthorizedAdmin(groupId);

    if ("error" in authorization) {
      return Response.json(
        {
          success: false,
          message: authorization.error,
        },
        { status: authorization.status }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : null;

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
          message:
            "Group name must be between 2 and 100 characters.",
        },
        { status: 400 }
      );
    }

    const updatedGroup = await prisma.group.update({
      where: {
        id: groupId,
      },
      data: {
        name,
        description: description || null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        joinCode: true,
        updatedAt: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/groups/${groupId}`);

    return Response.json({
      success: true,
      message: "Group updated successfully.",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Update group error:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong while updating the group.",
      },
      { status: 500 }
    );
  }
}

/* ================================
   DELETE GROUP
================================ */

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { groupId } = await params;

    const authorization = await getAuthorizedAdmin(groupId);

    if ("error" in authorization) {
      return Response.json(
        {
          success: false,
          message: authorization.error,
        },
        { status: authorization.status }
      );
    }

    /*
     * Delete dependent records first.
     *
     * Your schema does not currently have Cascade
     * configured for every Group relation, so we
     * explicitly delete dependent records.
     */

    await prisma.$transaction(async (tx) => {
      // Delete expense splits belonging to group expenses
      await tx.expenseSplit.deleteMany({
        where: {
          expense: {
            groupId,
          },
        },
      });

      // Delete payments belonging to the group
      await tx.payment.deleteMany({
        where: {
          groupId,
        },
      });

      // Delete expenses belonging to the group
      await tx.expense.deleteMany({
        where: {
          groupId,
        },
      });

      // Delete group memberships
      await tx.groupMember.deleteMany({
        where: {
          groupId,
        },
      });

      // Finally delete the group
      await tx.group.delete({
        where: {
          id: groupId,
        },
      });
    });

    revalidatePath("/dashboard");

    return Response.json({
      success: true,
      message: "Group deleted successfully.",
    });
  } catch (error) {
    console.error("Delete group error:", error);

    return Response.json(
      {
        success: false,
        message: "Something went wrong while deleting the group.",
      },
      { status: 500 }
    );
  }
}