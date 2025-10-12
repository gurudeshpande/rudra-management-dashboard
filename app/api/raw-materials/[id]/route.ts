import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PUT /api/raw-materials/[id] → update raw material
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, quantity, unit } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updatedMaterial = await prisma.rawMaterial.update({
      where: { id: parseInt(params.id) },
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
  { params }: { params: { id: string } }
) {
  try {
    await prisma.rawMaterial.delete({
      where: { id: parseInt(params.id) },
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
