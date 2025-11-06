// app/api/transfers/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, TransferStatus } from "@prisma/client";

const prisma = new PrismaClient();

// GET all transfers
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as TransferStatus | null;

    const whereClause = status ? { status } : {};

    const transfers = await prisma.rawMaterialTransfer.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, email: true },
        },
        rawMaterial: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(transfers);
  } catch (error) {
    console.error("Error fetching transfers:", error);
    return NextResponse.json(
      { error: "Failed to fetch transfers" },
      { status: 500 }
    );
  }
}

// POST issue raw materials to user (multiple items)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, items, notes } = body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "User ID and at least one transfer item are required" },
        { status: 400 }
      );
    }

    // Validate all items
    for (const item of items) {
      if (
        !item.rawMaterialId ||
        !item.quantityIssued ||
        item.quantityIssued <= 0
      ) {
        return NextResponse.json(
          { error: "Each item must have a valid raw material ID and quantity" },
          { status: 400 }
        );
      }
    }

    // Check raw material availability for all items first
    const materialChecks = await Promise.all(
      items.map(async (item) => {
        const rawMaterial = await prisma.rawMaterial.findUnique({
          where: { id: item.rawMaterialId },
        });

        if (!rawMaterial) {
          throw new Error(
            `Raw material with ID ${item.rawMaterialId} not found`
          );
        }

        if (rawMaterial.quantity < item.quantityIssued) {
          throw new Error(
            `Insufficient stock for ${rawMaterial.name}. Available: ${rawMaterial.quantity}, Requested: ${item.quantityIssued}`
          );
        }

        return rawMaterial;
      })
    );

    // Start transaction for all transfers
    const result = await prisma.$transaction(async (tx) => {
      const transfers = [];

      for (const item of items) {
        // Create transfer record
        const transfer = await tx.rawMaterialTransfer.create({
          data: {
            userId,
            rawMaterialId: item.rawMaterialId,
            quantityIssued: parseFloat(item.quantityIssued),
            notes,
            status: "SENT",
          },
        });

        // Update raw material stock
        await tx.rawMaterial.update({
          where: { id: item.rawMaterialId },
          data: {
            quantity: {
              decrement: parseFloat(item.quantityIssued),
            },
          },
        });

        transfers.push(transfer);
      }

      return transfers;
    });

    // Fetch complete transfer details with relations
    const transfersWithDetails = await prisma.rawMaterialTransfer.findMany({
      where: {
        id: {
          in: result.map((t) => t.id),
        },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        rawMaterial: true,
      },
    });

    return NextResponse.json(transfersWithDetails, { status: 201 });
  } catch (error) {
    console.error("Error creating transfers:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create transfers" },
      { status: 500 }
    );
  }
}
