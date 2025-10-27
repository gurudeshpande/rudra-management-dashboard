// app/api/products/[id]/structure/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const quantity = parseInt(searchParams.get("quantity") || "1");

    const productStructure = await prisma.productStructure.findMany({
      where: { productId },
      include: {
        rawMaterial: true,
        product: {
          select: {
            id: true,
            name: true,
            size: true,
            category: true,
          },
        },
      },
    });

    if (productStructure.length === 0) {
      return NextResponse.json(
        { error: "Product structure not found" },
        { status: 404 }
      );
    }

    // Calculate required materials for the given quantity
    const requiredMaterials = productStructure.map((structure) => ({
      rawMaterialId: structure.rawMaterialId,
      materialName: structure.materialName,
      quantityRequired: structure.quantityRequired * quantity,
      unit: structure.unit,
      perUnit: structure.quantityRequired,
    }));

    const response = {
      productId,
      productName: productStructure[0].product.name,
      quantity,
      requiredMaterials,
      totalUniqueMaterials: productStructure.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching product structure:", error);
    return NextResponse.json(
      { error: "Failed to fetch product structure" },
      { status: 500 }
    );
  }
}
