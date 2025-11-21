// app/api/raw-material-transfers/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET single transfer
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transferId = parseInt(id);

    const transfer = await prisma.rawMaterialTransfer.findUnique({
      where: { id: transferId },
      include: {
        user: {
          select: { name: true, email: true },
        },
        rawMaterial: true,
      },
    });

    if (!transfer) {
      return NextResponse.json(
        { error: "Transfer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(transfer);
  } catch (error) {
    console.error("Error fetching transfer:", error);
    return NextResponse.json(
      { error: "Failed to fetch transfer" },
      { status: 500 }
    );
  }
}

// PUT update transfer status (approve/reject/repair/unused)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transferId = parseInt(id);
    const body = await request.json();
    const {
      status,
      notes,
      quantityReturned,
      rejectionType,
      rejectionImages,
      rejectionReason,
    } = body;

    // Update valid statuses to include UNUSED
    const validStatuses = [
      "USED",
      "RETURNED",
      "CANCELLED",
      "REPAIRING",
      "FINISHED",
      "UNUSED", // NEW: Added UNUSED status
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Valid status is required (${validStatuses.join(", ")})` },
        { status: 400 }
      );
    }

    // Check if transfer exists
    const existingTransfer = await prisma.rawMaterialTransfer.findUnique({
      where: { id: transferId },
      include: {
        rawMaterial: true,
        user: true,
      },
    });

    if (!existingTransfer) {
      return NextResponse.json(
        { error: "Transfer not found" },
        { status: 404 }
      );
    }

    let updatedTransfer;

    if (status === "USED") {
      // When approving, add to user inventory
      updatedTransfer = await prisma.$transaction(async (tx) => {
        // Update user inventory - add the approved materials
        await tx.userInventory.upsert({
          where: {
            userId_rawMaterialId: {
              userId: existingTransfer.userId,
              rawMaterialId: existingTransfer.rawMaterialId,
            },
          },
          update: {
            quantity: {
              increment: existingTransfer.quantityIssued,
            },
          },
          create: {
            userId: existingTransfer.userId,
            rawMaterialId: existingTransfer.rawMaterialId,
            quantity: existingTransfer.quantityIssued,
            unit: existingTransfer.rawMaterial.unit || "pcs",
          },
        });

        // Update transfer status
        const transfer = await tx.rawMaterialTransfer.update({
          where: { id: transferId },
          data: {
            status: "USED",
            notes: notes || "Material approved and marked as used",
            quantityApproved: existingTransfer.quantityIssued,
            quantityRejected: 0,
            rejectionImages: [],
          },
          include: {
            user: { select: { name: true, email: true } },
            rawMaterial: true,
          },
        });

        return transfer;
      });
    } else if (status === "RETURNED") {
      // When rejecting/returning, handle partial rejection
      const returnQuantity =
        quantityReturned || existingTransfer.quantityIssued;
      const approvedQuantity = existingTransfer.quantityIssued - returnQuantity;

      if (returnQuantity > existingTransfer.quantityIssued) {
        return NextResponse.json(
          {
            error: `Cannot return more than ${existingTransfer.quantityIssued} ${existingTransfer.rawMaterial.unit}`,
          },
          { status: 400 }
        );
      }

      updatedTransfer = await prisma.$transaction(async (tx) => {
        // Restore rejected quantity to main inventory
        if (returnQuantity > 0) {
          await tx.rawMaterial.update({
            where: { id: existingTransfer.rawMaterialId },
            data: {
              quantity: {
                increment: returnQuantity,
              },
            },
          });
        }

        // Add approved quantity to user inventory (if any)
        if (approvedQuantity > 0) {
          await tx.userInventory.upsert({
            where: {
              userId_rawMaterialId: {
                userId: existingTransfer.userId,
                rawMaterialId: existingTransfer.rawMaterialId,
              },
            },
            update: {
              quantity: {
                increment: approvedQuantity,
              },
            },
            create: {
              userId: existingTransfer.userId,
              rawMaterialId: existingTransfer.rawMaterialId,
              quantity: approvedQuantity,
              unit: existingTransfer.rawMaterial.unit || "pcs",
            },
          });
        }

        // Update transfer status with rejection details
        const transfer = await tx.rawMaterialTransfer.update({
          where: { id: transferId },
          data: {
            status: "RETURNED",
            notes: notes,
            quantityRejected: returnQuantity,
            quantityApproved: approvedQuantity,
            rejectionReason: rejectionType,
            rejectionImages: rejectionImages || [],
          },
          include: {
            user: { select: { name: true, email: true } },
            rawMaterial: true,
          },
        });

        return transfer;
      });
    } else if (status === "FINISHED") {
      // When finishing repair, add materials back to main inventory
      updatedTransfer = await prisma.$transaction(async (tx) => {
        // Add the repaired materials back to main inventory
        await tx.rawMaterial.update({
          where: { id: existingTransfer.rawMaterialId },
          data: {
            quantity: {
              increment: existingTransfer.quantityIssued,
            },
          },
        });

        // Update transfer status
        const transfer = await tx.rawMaterialTransfer.update({
          where: { id: transferId },
          data: {
            status: "FINISHED",
            notes:
              notes || "Repair completed - materials returned to inventory",
          },
          include: {
            user: { select: { name: true, email: true } },
            rawMaterial: true,
          },
        });

        return transfer;
      });
    } else if (status === "REPAIRING") {
      // For REPAIRING status - simple status update without inventory changes
      updatedTransfer = await prisma.rawMaterialTransfer.update({
        where: { id: transferId },
        data: {
          status,
          notes: notes || "Material under repair",
        },
        include: {
          user: { select: { name: true, email: true } },
          rawMaterial: true,
        },
      });
    } else if (status === "UNUSED") {
      // NEW: Handle UNUSED status - materials are too damaged and cannot be used
      updatedTransfer = await prisma.$transaction(async (tx) => {
        // For UNUSED items, we don't return them to inventory since they're too damaged
        // We simply mark them as unusable and record the reason

        // Update transfer status with UNUSED details
        const transfer = await tx.rawMaterialTransfer.update({
          where: { id: transferId },
          data: {
            status: "UNUSED",
            notes: notes || "Product is too damaged and cannot be repaired",
            rejectionReason: rejectionReason || "Product is too damaged",
            quantityRejected: existingTransfer.quantityIssued, // All quantity is rejected
            quantityApproved: 0, // No quantity is approved
            rejectionImages:
              rejectionImages || existingTransfer.rejectionImages || [],
          },
          include: {
            user: { select: { name: true, email: true } },
            rawMaterial: true,
          },
        });

        return transfer;
      });
    } else {
      // For CANCELLED status
      updatedTransfer = await prisma.rawMaterialTransfer.update({
        where: { id: transferId },
        data: {
          status,
          notes,
          quantityRejected: 0,
          quantityApproved: 0,
          rejectionImages: [],
        },
        include: {
          user: { select: { name: true, email: true } },
          rawMaterial: true,
        },
      });
    }

    return NextResponse.json(updatedTransfer);
  } catch (error) {
    console.error("Error updating transfer:", error);
    return NextResponse.json(
      { error: "Failed to update transfer" },
      { status: 500 }
    );
  }
}

// DELETE transfer
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transferId = parseInt(id);

    // Check if transfer exists
    const existingTransfer = await prisma.rawMaterialTransfer.findUnique({
      where: { id: transferId },
    });

    if (!existingTransfer) {
      return NextResponse.json(
        { error: "Transfer not found" },
        { status: 404 }
      );
    }

    // If transfer was USED, we need to remove from user inventory
    if (existingTransfer.status === "USED") {
      await prisma.$transaction(async (tx) => {
        // Remove from user inventory
        const userInventory = await tx.userInventory.findUnique({
          where: {
            userId_rawMaterialId: {
              userId: existingTransfer.userId,
              rawMaterialId: existingTransfer.rawMaterialId,
            },
          },
        });

        if (userInventory) {
          if (userInventory.quantity <= existingTransfer.quantityIssued) {
            // Delete the inventory item if quantity becomes zero or negative
            await tx.userInventory.delete({
              where: {
                userId_rawMaterialId: {
                  userId: existingTransfer.userId,
                  rawMaterialId: existingTransfer.rawMaterialId,
                },
              },
            });
          } else {
            // Decrement the quantity
            await tx.userInventory.update({
              where: {
                userId_rawMaterialId: {
                  userId: existingTransfer.userId,
                  rawMaterialId: existingTransfer.rawMaterialId,
                },
              },
              data: {
                quantity: {
                  decrement: existingTransfer.quantityIssued,
                },
              },
            });
          }
        }

        // Restore to main inventory
        await tx.rawMaterial.update({
          where: { id: existingTransfer.rawMaterialId },
          data: {
            quantity: {
              increment: existingTransfer.quantityIssued,
            },
          },
        });

        // Delete the transfer
        await tx.rawMaterialTransfer.delete({
          where: { id: transferId },
        });
      });
    } else if (existingTransfer.status === "FINISHED") {
      // If it was FINISHED, the materials were already returned to main inventory
      // Just delete the transfer record
      await prisma.rawMaterialTransfer.delete({
        where: { id: transferId },
      });
    } else if (existingTransfer.status === "UNUSED") {
      // NEW: For UNUSED status, materials were not returned to inventory (too damaged)
      // Just delete the transfer record
      await prisma.rawMaterialTransfer.delete({
        where: { id: transferId },
      });
    } else {
      // For other statuses, just delete the transfer
      // If it was RETURNED, the quantity was already restored
      await prisma.rawMaterialTransfer.delete({
        where: { id: transferId },
      });
    }

    return NextResponse.json(
      { message: "Transfer deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting transfer:", error);
    return NextResponse.json(
      { error: "Failed to delete transfer" },
      { status: 500 }
    );
  }
}
