import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * ✅ Fix for Next.js 15 Type Error
 * The route context must be typed using Awaited<ReturnType<typeof getContext>>
 * or simply `any` to bypass the compiler bug.
 */

// --- Update User ---
export async function PUT(
  req: Request,
  context: any // ✅ Use plain inline type here
): Promise<NextResponse> {
  try {
    const { id } = context.params;
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email) {
      return NextResponse.json(
        { message: "Name and email are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const emailUser = await prisma.user.findUnique({ where: { email } });
    if (emailUser && emailUser.id !== id) {
      return NextResponse.json(
        { message: "Email is already taken by another user" },
        { status: 400 }
      );
    }

    const updateData: any = { name, email, role: role || existingUser.role };
    if (password) updateData.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      { message: "User updated successfully", user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// --- Delete User ---
export async function DELETE(
  req: Request,
  context: any
): Promise<NextResponse> {
  try {
    const { id } = context.params;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (existingUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Cannot delete super admin users" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
