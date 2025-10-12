import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET product structures
export async function GET() {
  try {
    const productStructures = await prisma.productStructure.findMany({
      include: {
        product: true,
        rawMaterial: true,
      },
      orderBy: { productId: "asc" },
    });
    return NextResponse.json(productStructures);
  } catch (error) {
    console.error("Error fetching product structures:", error);
    return NextResponse.json(
      { error: "Failed to fetch product structures" },
      { status: 500 }
    );
  }
}

// POST create product structure
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, rawMaterialId, quantityRequired } = body;

    if (!productId || !rawMaterialId || !quantityRequired) {
      return NextResponse.json(
        {
          error:
            "Product ID, Raw Material ID, and quantity required are mandatory",
        },
        { status: 400 }
      );
    }

    // Check if structure already exists
    const existingStructure = await prisma.productStructure.findUnique({
      where: {
        productId_rawMaterialId: {
          productId,
          rawMaterialId,
        },
      },
    });

    if (existingStructure) {
      return NextResponse.json(
        { error: "Product structure already exists for this material" },
        { status: 400 }
      );
    }

    const productStructure = await prisma.productStructure.create({
      data: {
        productId,
        rawMaterialId,
        quantityRequired: parseFloat(quantityRequired),
      },
      include: {
        product: true,
        rawMaterial: true,
      },
    });

    return NextResponse.json(productStructure, { status: 201 });
  } catch (error) {
    console.error("Error creating product structure:", error);
    return NextResponse.json(
      { error: "Failed to create product structure" },
      { status: 500 }
    );
  }
}
