import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET user inventory
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    console.log(userId, "USERID");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const inventory = await prisma.userInventory.findMany({
      where: { userId },
      include: {
        rawMaterial: true,
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { rawMaterial: { name: "asc" } },
    });

    console.log(inventory, "Inventory");

    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Error fetching user inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch user inventory" },
      { status: 500 }
    );
  }
}

// POST update user inventory (used when approving transfers)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, rawMaterialId, quantity, action = "ADD" } = body;

    if (!userId || !rawMaterialId || quantity === undefined) {
      return NextResponse.json(
        { error: "userId, rawMaterialId, and quantity are required" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Check if inventory item exists
      const existingInventory = await tx.userInventory.findUnique({
        where: {
          userId_rawMaterialId: {
            userId,
            rawMaterialId,
          },
        },
      });

      if (existingInventory) {
        // Update existing inventory
        const updatedInventory = await tx.userInventory.update({
          where: {
            userId_rawMaterialId: {
              userId,
              rawMaterialId,
            },
          },
          data: {
            quantity:
              action === "ADD"
                ? { increment: quantity }
                : { decrement: quantity },
          },
          include: {
            rawMaterial: true,
            user: {
              select: { name: true, email: true },
            },
          },
        });
        return updatedInventory;
      } else {
        // Create new inventory item
        if (action !== "ADD") {
          throw new Error("Cannot subtract from non-existent inventory item");
        }

        const rawMaterial = await tx.rawMaterial.findUnique({
          where: { id: rawMaterialId },
        });

        if (!rawMaterial) {
          throw new Error("Raw material not found");
        }

        const newInventory = await tx.userInventory.create({
          data: {
            userId,
            rawMaterialId,
            quantity,
            unit: rawMaterial.unit || "pcs",
          },
          include: {
            rawMaterial: true,
            user: {
              select: { name: true, email: true },
            },
          },
        });
        return newInventory;
      }
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error updating user inventory:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update user inventory",
      },
      { status: 500 }
    );
  }
}
