// app/api/receipt-counter/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to get current financial year
function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // January is 0

  // Financial year runs from April (4) to March (3) next year
  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

// GET current receipt number (without incrementing)
export async function GET() {
  try {
    const financialYear = getCurrentFinancialYear();

    // Find receipt counter for current financial year
    const receiptCounter = await prisma.receiptCounter.findUnique({
      where: { financialYear },
    });

    let lastNumber = 0;

    if (receiptCounter) {
      lastNumber = receiptCounter.lastNumber;
    } else {
      // Create initial counter if it doesn't exist
      const newCounter = await prisma.receiptCounter.create({
        data: {
          financialYear,
          lastNumber: 0,
        },
      });
      lastNumber = newCounter.lastNumber;
    }

    // Format receipt number: 2024-2025-RCP-0001 (next number will be lastNumber + 1)
    const nextReceiptNumber = `${financialYear}-RCP-${(lastNumber + 1)
      .toString()
      .padStart(4, "0")}`;

    return NextResponse.json({
      receiptNumber: nextReceiptNumber,
      lastNumber,
    });
  } catch (error) {
    console.error("Error fetching receipt number:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipt number" },
      { status: 500 }
    );
  }
}

// POST to increment and get next receipt number (use this when creating payment)
export async function POST() {
  try {
    const financialYear = getCurrentFinancialYear();

    // Find or create receipt counter for current financial year and increment
    const receiptCounter = await prisma.receiptCounter.upsert({
      where: { financialYear },
      update: {
        lastNumber: {
          increment: 1,
        },
      },
      create: {
        financialYear,
        lastNumber: 1,
      },
    });

    // Format receipt number: 2024-2025-RCP-0001
    const receiptNumber = `${financialYear}-RCP-${receiptCounter.lastNumber
      .toString()
      .padStart(4, "0")}`;

    return NextResponse.json({ receiptNumber });
  } catch (error) {
    console.error("Error generating receipt number:", error);
    return NextResponse.json(
      { error: "Failed to generate receipt number" },
      { status: 500 }
    );
  }
}
