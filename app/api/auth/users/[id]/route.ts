// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Update user
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;
    const userId = params.id;

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { message: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if email is taken by another user
    const emailUser = await prisma.user.findUnique({
      where: { email },
    });

    if (emailUser && emailUser.id !== userId) {
      return NextResponse.json(
        { message: "Email is already taken by another user" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      role: role || existingUser.role,
    };

    // Update password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
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

// Delete user
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Prevent deleting super admins (optional safety measure)
    if (existingUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Cannot delete super admin users" },
        { status: 400 }
      );
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

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
