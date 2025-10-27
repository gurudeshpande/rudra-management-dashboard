// app/api/product-structures/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const structureId = parseInt(id);

    if (isNaN(structureId)) {
      return NextResponse.json(
        { error: "Invalid structure ID" },
        { status: 400 }
      );
    }

    // Check if structure exists
    const existingStructure = await prisma.productStructure.findUnique({
      where: { id: structureId },
    });

    if (!existingStructure) {
      return NextResponse.json(
        { error: "Product structure not found" },
        { status: 404 }
      );
    }

    // Delete the specific structure item
    await prisma.productStructure.delete({
      where: { id: structureId },
    });

    return NextResponse.json(
      { message: "Product structure item deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting product structure:", error);
    return NextResponse.json(
      { error: "Failed to delete product structure" },
      { status: 500 }
    );
  }
}
