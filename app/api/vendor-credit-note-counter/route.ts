import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to get current financial year
function getCurrentFinancialYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

// GET current counter
export async function GET() {
  try {
    const financialYear = getCurrentFinancialYear();

    let counter = await prisma.vendorCreditNoteCounter.findUnique({
      where: { financialYear },
    });

    if (!counter) {
      // Create counter if it doesn't exist
      counter = await prisma.vendorCreditNoteCounter.create({
        data: {
          financialYear,
          lastNumber: 0,
        },
      });
    }

    // Format credit note number: VCN-2024-25-0001
    const nextNumber = counter.lastNumber + 1;
    const formattedNumber = `VCN-${financialYear.replace("-", "-")}-${nextNumber
      .toString()
      .padStart(4, "0")}`;

    return NextResponse.json({
      currentNumber: counter.lastNumber,
      nextNumber: nextNumber,
      creditNoteNumber: formattedNumber,
      financialYear,
    });
  } catch (error) {
    console.error("Error fetching vendor credit note counter:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor credit note counter" },
      { status: 500 }
    );
  }
}

// POST increment counter and get next number
export async function POST() {
  try {
    const financialYear = getCurrentFinancialYear();

    // Use transaction to ensure atomic increment
    const result = await prisma.$transaction(async (tx) => {
      // Find or create counter
      let counter = await tx.vendorCreditNoteCounter.findUnique({
        where: { financialYear },
      });

      if (!counter) {
        counter = await tx.vendorCreditNoteCounter.create({
          data: {
            financialYear,
            lastNumber: 0,
          },
        });
      }

      // Increment counter
      const updatedCounter = await tx.vendorCreditNoteCounter.update({
        where: { financialYear },
        data: {
          lastNumber: counter.lastNumber + 1,
        },
      });

      // Format credit note number
      const creditNoteNumber = `VCN-${financialYear.replace(
        "-",
        "-"
      )}-${updatedCounter.lastNumber.toString().padStart(4, "0")}`;

      return {
        counter: updatedCounter,
        creditNoteNumber,
      };
    });

    return NextResponse.json({
      receiptNumber: result.creditNoteNumber,
      nextNumber: result.counter.lastNumber + 1,
      financialYear,
    });
  } catch (error) {
    console.error("Error incrementing vendor credit note counter:", error);
    return NextResponse.json(
      { error: "Failed to generate vendor credit note number" },
      { status: 500 }
    );
  }
}

// PATCH sync counter (for admin use)
export async function PATCH() {
  try {
    const financialYear = getCurrentFinancialYear();

    // Get the highest existing vendor credit note number for this financial year
    const highestCreditNote = await prisma.vendorCreditNote.findFirst({
      where: {
        creditNoteNumber: {
          startsWith: `VCN-${financialYear.replace("-", "-")}`,
        },
      },
      orderBy: { creditNoteNumber: "desc" },
    });

    let lastNumber = 0;

    if (highestCreditNote) {
      // Extract number from credit note number
      const matches = highestCreditNote.creditNoteNumber.match(/-(\d+)$/);
      if (matches && matches[1]) {
        lastNumber = parseInt(matches[1]);
      }
    }

    // Update or create counter
    const counter = await prisma.vendorCreditNoteCounter.upsert({
      where: { financialYear },
      update: { lastNumber },
      create: {
        financialYear,
        lastNumber,
      },
    });

    return NextResponse.json({
      message: "Counter synced successfully",
      lastNumber: counter.lastNumber,
      financialYear,
    });
  } catch (error) {
    console.error("Error syncing vendor credit note counter:", error);
    return NextResponse.json(
      { error: "Failed to sync vendor credit note counter" },
      { status: 500 }
    );
  }
}
