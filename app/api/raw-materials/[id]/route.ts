// app/api/raw-materials/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PUT /api/raw-materials/[id] → update raw material
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, quantity, unit } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updatedMaterial = await prisma.rawMaterial.update({
      where: { id: parseInt(id) },
      data: { name, quantity, unit },
    });

    return NextResponse.json(updatedMaterial);
  } catch (error) {
    console.error("Error updating raw material:", error);
    return NextResponse.json(
      { error: "Failed to update raw material" },
      { status: 500 }
    );
  }
}

// DELETE /api/raw-materials/[id] → delete raw material
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.rawMaterial.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Raw material deleted successfully" });
  } catch (error) {
    console.error("Error deleting raw material:", error);
    return NextResponse.json(
      { error: "Failed to delete raw material" },
      { status: 500 }
    );
  }
}
