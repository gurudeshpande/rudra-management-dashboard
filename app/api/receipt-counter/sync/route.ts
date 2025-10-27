// app/api/receipt-counter/sync/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to get current financial year
function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

// POST to sync receipt counter with existing payments
export async function POST() {
  try {
    const financialYear = getCurrentFinancialYear();

    // Find all payments for current financial year
    const payments = await prisma.payment.findMany({
      where: {
        receiptNumber: {
          startsWith: financialYear,
        },
      },
      select: {
        receiptNumber: true,
      },
    });

    // Extract numbers from receipt numbers and find the highest
    let highestNumber = 0;
    payments.forEach((payment) => {
      const match = payment.receiptNumber.match(/-RCP-(\d+)$/);
      if (match) {
        const number = parseInt(match[1], 10);
        if (number > highestNumber) {
          highestNumber = number;
        }
      }
    });

    // Update or create receipt counter
    const receiptCounter = await prisma.receiptCounter.upsert({
      where: { financialYear },
      update: {
        lastNumber: highestNumber,
      },
      create: {
        financialYear,
        lastNumber: highestNumber,
      },
    });

    return NextResponse.json({
      message: "Receipt counter synced successfully",
      highestNumber,
      receiptCounter,
    });
  } catch (error) {
    console.error("Error syncing receipt counter:", error);
    return NextResponse.json(
      { error: "Failed to sync receipt counter" },
      { status: 500 }
    );
  }
}
