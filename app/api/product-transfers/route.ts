// app/api/product-transfers/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST create product transfer and deduct ONLY raw materials
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, productId, quantitySent, notes } = body;

    // Validate input
    if (!userId || !productId || !quantitySent || quantitySent <= 0) {
      return NextResponse.json(
        { error: "userId, productId, and valid quantitySent are required" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if product exists
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      // 2. Get product structure to calculate required raw materials
      const productStructure = await tx.productStructure.findMany({
        where: { productId },
        include: {
          rawMaterial: true,
        },
      });

      if (productStructure.length === 0) {
        throw new Error(
          "Product structure not defined. Cannot produce product."
        );
      }

      // 3. Check if user has sufficient raw materials in inventory
      const userInventory = await tx.userInventory.findMany({
        where: { userId },
        include: {
          rawMaterial: true,
        },
      });

      const inventoryMap = new Map(
        userInventory.map((item) => [item.rawMaterialId, item])
      );

      // Validate raw material availability
      for (const structure of productStructure) {
        const requiredQuantity = structure.quantityRequired * quantitySent;
        const userInventoryItem = inventoryMap.get(structure.rawMaterialId);

        if (!userInventoryItem) {
          throw new Error(
            `Insufficient raw material: ${structure.rawMaterial.name}. You don't have this material in your inventory.`
          );
        }

        if (userInventoryItem.quantity < requiredQuantity) {
          throw new Error(
            `Insufficient ${structure.rawMaterial.name}. Required: ${requiredQuantity} ${structure.rawMaterial.unit}, Available: ${userInventoryItem.quantity} ${userInventoryItem.unit}`
          );
        }
      }

      // 4. Deduct raw materials from user inventory (ONLY THIS - NO PRODUCT DEDUCTION)
      for (const structure of productStructure) {
        const requiredQuantity = structure.quantityRequired * quantitySent;

        await tx.userInventory.update({
          where: {
            userId_rawMaterialId: {
              userId,
              rawMaterialId: structure.rawMaterialId,
            },
          },
          data: {
            quantity: {
              decrement: requiredQuantity,
            },
          },
        });

        // Optional: Log the raw material consumption
        await tx.rawMaterialConsumption.create({
          data: {
            userId,
            productId,
            rawMaterialId: structure.rawMaterialId,
            quantityUsed: requiredQuantity,
            unit: structure.rawMaterial.unit || "pcs",
            productTransferQuantity: quantitySent,
            notes: `Consumed for ${quantitySent} units of ${product.name} transfer to Super Admin`,
          },
        });
      }

      // 5. Create product transfer record (NO PRODUCT QUANTITY DEDUCTION)
      const productTransfer = await tx.productTransfer.create({
        data: {
          userId,
          productId,
          quantitySent,
          notes,
          status: "SENT",
        },
        include: {
          user: {
            select: { name: true, email: true },
          },
          product: true,
        },
      });

      return productTransfer;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating product transfer:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create product transfer",
      },
      { status: 500 }
    );
  }
}

// GET product transfers
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const transfers = await prisma.productTransfer.findMany({
      where: userId ? { userId } : {},
      include: {
        user: {
          select: { name: true, email: true },
        },
        product: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(transfers);
  } catch (error) {
    console.error("Error fetching product transfers:", error);
    return NextResponse.json(
      { error: "Failed to fetch product transfers" },
      { status: 500 }
    );
  }
}
