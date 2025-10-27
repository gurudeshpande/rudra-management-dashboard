// app/api/product-transfers/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transferId = parseInt(id);
    const body = await request.json();
    const { status, notes, receivedBy } = body;

    if (!status || !["RECEIVED", "REJECTED", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        {
          error: "Valid status is required (RECEIVED, REJECTED, or CANCELLED)",
        },
        { status: 400 }
      );
    }

    const existingTransfer = await prisma.productTransfer.findUnique({
      where: { id: transferId },
      include: {
        product: true,
        user: true,
      },
    });

    if (!existingTransfer) {
      return NextResponse.json(
        { error: "Product transfer not found" },
        { status: 404 }
      );
    }

    let updatedTransfer;

    if (status === "REJECTED" || status === "CANCELLED") {
      // If rejecting/cancelling, restore ONLY raw materials (NO PRODUCT QUANTITY RESTORATION)
      updatedTransfer = await prisma.$transaction(async (tx) => {
        // 1. Get product structure to calculate raw materials to restore
        const productStructure = await tx.productStructure.findMany({
          where: { productId: existingTransfer.productId },
          include: {
            rawMaterial: true,
          },
        });

        // 2. Restore raw materials to user inventory
        for (const structure of productStructure) {
          const quantityToRestore =
            structure.quantityRequired * existingTransfer.quantitySent;

          await tx.userInventory.upsert({
            where: {
              userId_rawMaterialId: {
                userId: existingTransfer.userId,
                rawMaterialId: structure.rawMaterialId,
              },
            },
            create: {
              userId: existingTransfer.userId,
              rawMaterialId: structure.rawMaterialId,
              quantity: quantityToRestore,
              unit: structure.rawMaterial.unit || "pcs",
            },
            update: {
              quantity: {
                increment: quantityToRestore,
              },
            },
          });
        }

        // 3. Update transfer status (NO PRODUCT QUANTITY RESTORATION)
        const transfer = await tx.productTransfer.update({
          where: { id: transferId },
          data: {
            status,
            notes,
            receivedBy: status === "REJECTED" ? receivedBy : undefined,
            receivedAt: status === "REJECTED" ? new Date() : undefined,
          },
        });

        return transfer;
      });
    } else {
      // RECEIVED - just update status (raw materials already deducted, no product quantity change)
      updatedTransfer = await prisma.productTransfer.update({
        where: { id: transferId },
        data: {
          status,
          notes,
          receivedBy,
          receivedAt: new Date(),
        },
      });
    }

    // Fetch the updated transfer with relations
    const transferWithDetails = await prisma.productTransfer.findUnique({
      where: { id: transferId },
      include: {
        user: {
          select: { name: true, email: true },
        },
        product: true,
      },
    });

    return NextResponse.json(transferWithDetails);
  } catch (error) {
    console.error("Error updating product transfer:", error);
    return NextResponse.json(
      { error: "Failed to update product transfer" },
      { status: 500 }
    );
  }
}

// GET single product transfer
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transferId = parseInt(id);

    const transfer = await prisma.productTransfer.findUnique({
      where: { id: transferId },
      include: {
        user: {
          select: { name: true, email: true },
        },
        product: true,
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { error: "Product transfer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(transfer);
  } catch (error) {
    console.error("Error fetching product transfer:", error);
    return NextResponse.json(
      { error: "Failed to fetch product transfer" },
      { status: 500 }
    );
  }
}
