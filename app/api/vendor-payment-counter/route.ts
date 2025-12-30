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

    let counter = await prisma.vendorPaymentCounter.findUnique({
      where: { financialYear },
    });

    if (!counter) {
      // Create counter if it doesn't exist
      counter = await prisma.vendorPaymentCounter.create({
        data: {
          financialYear,
          lastNumber: 0,
        },
      });
    }

    // Format payment reference number: VPMT-2024-25-0001
    const nextNumber = counter.lastNumber + 1;
    const formattedNumber = `VPMT-${financialYear.replace(
      "-",
      "-"
    )}-${nextNumber.toString().padStart(4, "0")}`;

    return NextResponse.json({
      currentNumber: counter.lastNumber,
      nextNumber: nextNumber,
      paymentReference: formattedNumber,
      financialYear,
    });
  } catch (error) {
    console.error("Error fetching vendor payment counter:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor payment counter" },
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
      let counter = await tx.vendorPaymentCounter.findUnique({
        where: { financialYear },
      });

      if (!counter) {
        counter = await tx.vendorPaymentCounter.create({
          data: {
            financialYear,
            lastNumber: 0,
          },
        });
      }

      // Increment counter
      const updatedCounter = await tx.vendorPaymentCounter.update({
        where: { financialYear },
        data: {
          lastNumber: counter.lastNumber + 1,
        },
      });

      // Format payment reference number
      const paymentReference = `VPMT-${financialYear.replace(
        "-",
        "-"
      )}-${updatedCounter.lastNumber.toString().padStart(4, "0")}`;

      return {
        counter: updatedCounter,
        paymentReference,
      };
    });

    return NextResponse.json({
      receiptNumber: result.paymentReference,
      nextNumber: result.counter.lastNumber + 1,
      financialYear,
    });
  } catch (error) {
    console.error("Error incrementing vendor payment counter:", error);
    return NextResponse.json(
      { error: "Failed to generate vendor payment reference" },
      { status: 500 }
    );
  }
}

// PATCH sync counter (for admin use)
export async function PATCH() {
  try {
    const financialYear = getCurrentFinancialYear();

    // Get the highest existing vendor payment reference for this financial year
    const highestPayment = await prisma.vendorPayment.findFirst({
      where: {
        referenceNumber: {
          startsWith: `VPMT-${financialYear.replace("-", "-")}`,
        },
      },
      orderBy: { referenceNumber: "desc" },
    });

    let lastNumber = 0;

    if (highestPayment) {
      // Extract number from payment reference
      const matches = highestPayment.referenceNumber.match(/-(\d+)$/);
      if (matches && matches[1]) {
        lastNumber = parseInt(matches[1]);
      }
    }

    // Update or create counter
    const counter = await prisma.vendorPaymentCounter.upsert({
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
    console.error("Error syncing vendor payment counter:", error);
    return NextResponse.json(
      { error: "Failed to sync vendor payment counter" },
      { status: 500 }
    );
  }
}
