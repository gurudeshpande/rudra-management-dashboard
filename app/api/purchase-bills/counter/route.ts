import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET next bill number
export async function GET() {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Calculate financial year (April to March)
    let financialYear;
    if (month >= 4) {
      financialYear = `${year}-${year + 1}`;
    } else {
      financialYear = `${year - 1}-${year}`;
    }

    // Get or create counter for this financial year
    const counter = await prisma.purchaseBillCounter.upsert({
      where: { financialYear },
      update: {}, // No updates needed for GET
      create: {
        financialYear,
        lastNumber: 0,
        // Remove createdAt and updatedAt - they'll be set by database defaults
      },
    });

    // Generate next bill number (e.g., BILL-2024-0001)
    const nextNumber = counter.lastNumber + 1;
    const paddedNumber = nextNumber.toString().padStart(4, "0");
    const billNumber = `BILL-${financialYear}-${paddedNumber}`;

    return NextResponse.json({
      billNumber,
      financialYear,
      lastNumber: counter.lastNumber,
      nextNumber,
    });
  } catch (error) {
    console.error("Error generating bill number:", error);
    return NextResponse.json(
      { error: "Failed to generate bill number" },
      { status: 500 },
    );
  }
}

// POST increment counter and get new bill number
export async function POST() {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    let financialYear;
    if (month >= 4) {
      financialYear = `${year}-${year + 1}`;
    } else {
      financialYear = `${year - 1}-${year}`;
    }

    // First, try to find existing counter
    let existingCounter = await prisma.purchaseBillCounter.findUnique({
      where: { financialYear },
    });

    let counter;

    if (existingCounter) {
      // Update existing counter
      counter = await prisma.purchaseBillCounter.update({
        where: { financialYear },
        data: {
          lastNumber: {
            increment: 1,
          },
          // Remove updatedAt - it will be auto-updated by @updatedAt
        },
      });
    } else {
      // Create new counter
      counter = await prisma.purchaseBillCounter.create({
        data: {
          financialYear,
          lastNumber: 1,
          // Remove createdAt - it will be set by @default(now())
        },
      });
    }

    const paddedNumber = counter.lastNumber.toString().padStart(4, "0");
    const billNumber = `BILL-${financialYear}-${paddedNumber}`;

    return NextResponse.json({
      billNumber,
      financialYear,
      lastNumber: counter.lastNumber,
    });
  } catch (error) {
    console.error("Error incrementing bill counter:", error);
    return NextResponse.json(
      { error: "Failed to increment bill counter" },
      { status: 500 },
    );
  }
}
