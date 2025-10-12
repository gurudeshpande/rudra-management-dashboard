import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST complete manufacturing and update stocks
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, quantityProduced, userId, transferIds } = body;

    if (!productId || !quantityProduced || !userId) {
      return NextResponse.json(
        { error: "Product ID, quantity produced, and user ID are required" },
        { status: 400 }
      );
    }

    // Get product structure
    const productStructures = await prisma.productStructure.findMany({
      where: { productId },
      include: { rawMaterial: true },
    });

    if (productStructures.length === 0) {
      return NextResponse.json(
        { error: "No product structure defined for this product" },
        { status: 400 }
      );
    }

    // Calculate required raw materials
    const requiredMaterials = productStructures.map((ps) => ({
      rawMaterialId: ps.rawMaterialId,
      quantityRequired: ps.quantityRequired * quantityProduced,
    }));

    // Start transaction for manufacturing completion
    const result = await prisma.$transaction(async (tx) => {
      // Update transfer status to USED
      if (transferIds && transferIds.length > 0) {
        await tx.rawMaterialTransfer.updateMany({
          where: {
            id: { in: transferIds },
            userId: userId,
          },
          data: {
            status: "USED",
          },
        });
      }

      // Update product inventory
      await tx.product.update({
        where: { id: productId },
        data: {
          quantity: {
            increment: quantityProduced,
          },
        },
      });

      return { message: "Manufacturing completed successfully" };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error completing manufacturing:", error);
    return NextResponse.json(
      { error: "Failed to complete manufacturing process" },
      { status: 500 }
    );
  }
}
