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

    let counter = await prisma.billCounter.findUnique({
      where: { financialYear },
    });

    if (!counter) {
      // Create counter if it doesn't exist
      counter = await prisma.billCounter.create({
        data: {
          financialYear,
          lastNumber: 0,
        },
      });
    }

    // Format bill number: BILL-2024-25-0001
    const nextNumber = counter.lastNumber + 1;
    const formattedNumber = `BILL-${financialYear.replace(
      "-",
      "-"
    )}-${nextNumber.toString().padStart(4, "0")}`;

    return NextResponse.json({
      currentNumber: counter.lastNumber,
      nextNumber: nextNumber,
      billNumber: formattedNumber,
      financialYear,
    });
  } catch (error) {
    console.error("Error fetching bill counter:", error);
    return NextResponse.json(
      { error: "Failed to fetch bill counter" },
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
      let counter = await tx.billCounter.findUnique({
        where: { financialYear },
      });

      if (!counter) {
        counter = await tx.billCounter.create({
          data: {
            financialYear,
            lastNumber: 0,
          },
        });
      }

      // Increment counter
      const updatedCounter = await tx.billCounter.update({
        where: { financialYear },
        data: {
          lastNumber: counter.lastNumber + 1,
        },
      });

      // Format bill number
      const billNumber = `BILL-${financialYear.replace(
        "-",
        "-"
      )}-${updatedCounter.lastNumber.toString().padStart(4, "0")}`;

      return {
        counter: updatedCounter,
        billNumber,
      };
    });

    return NextResponse.json({
      receiptNumber: result.billNumber,
      nextNumber: result.counter.lastNumber + 1,
      financialYear,
    });
  } catch (error) {
    console.error("Error incrementing bill counter:", error);
    return NextResponse.json(
      { error: "Failed to generate bill number" },
      { status: 500 }
    );
  }
}

// PATCH sync counter (for admin use)
export async function PATCH() {
  try {
    const financialYear = getCurrentFinancialYear();

    // Get the highest existing bill number for this financial year
    const highestBill = await prisma.bill.findFirst({
      where: {
        billNumber: {
          startsWith: `BILL-${financialYear.replace("-", "-")}`,
        },
      },
      orderBy: { billNumber: "desc" },
    });

    let lastNumber = 0;

    if (highestBill) {
      // Extract number from bill number
      const matches = highestBill.billNumber.match(/-(\d+)$/);
      if (matches && matches[1]) {
        lastNumber = parseInt(matches[1]);
      }
    }

    // Update or create counter
    const counter = await prisma.billCounter.upsert({
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
    console.error("Error syncing bill counter:", error);
    return NextResponse.json(
      { error: "Failed to sync bill counter" },
      { status: 500 }
    );
  }
}
