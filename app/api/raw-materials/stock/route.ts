import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET raw material stock summary with transfers
export async function GET() {
  try {
    const rawMaterials = await prisma.rawMaterial.findMany({
      include: {
        transfers: {
          where: {
            status: { in: ["SENT", "USED"] },
          },
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
        productStructures: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    // Calculate summary
    const stockSummary = rawMaterials.map((material) => {
      const sentTransfers = material.transfers.filter(
        (t) => t.status === "SENT"
      );
      const usedTransfers = material.transfers.filter(
        (t) => t.status === "USED"
      );

      const totalSent = sentTransfers.reduce(
        (sum, t) => sum + t.quantityIssued,
        0
      );
      const totalUsed = usedTransfers.reduce(
        (sum, t) => sum + t.quantityIssued,
        0
      );
      const remainingWithUsers = totalSent - totalUsed;

      return {
        ...material,
        stockSummary: {
          available: material.quantity,
          sentToUsers: totalSent,
          used: totalUsed,
          remainingWithUsers,
          totalConsumption: totalUsed,
        },
      };
    });

    return NextResponse.json(stockSummary);
  } catch (error) {
    console.error("Error fetching stock summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock summary" },
      { status: 500 }
    );
  }
}
