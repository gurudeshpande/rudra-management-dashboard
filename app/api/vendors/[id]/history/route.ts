import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = parseInt(params.id);

    // Fetch vendor details
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Fetch vendor bills
    const bills = await prisma.bill.findMany({
      where: { vendorId },
      orderBy: { billDate: "desc" },
    });

    // Fetch vendor payments
    const payments = await prisma.vendorPayment.findMany({
      where: { vendorId },
      orderBy: { paymentDate: "desc" },
    });

    // Fetch vendor credit notes
    const creditNotes = await prisma.vendorCreditNote.findMany({
      where: { vendorId },
      orderBy: { issueDate: "desc" },
    });

    // Calculate summary
    const totalBills = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
    const totalPayments = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const totalCreditNotes = creditNotes.reduce(
      (sum, note) => sum + note.amount,
      0
    );

    // Calculate current balance (bills - payments - credit notes + opening balance)
    const currentBalance =
      totalBills -
      totalPayments -
      totalCreditNotes +
      (vendor.openingBalance || 0);

    const summary = {
      totalBills,
      totalPayments,
      totalCreditNotes,
      outstandingBalance: bills.reduce((sum, bill) => sum + bill.balanceDue, 0),
      currentBalance,
      creditLimit: vendor.creditLimit || 0,
      creditUtilization: vendor.creditLimit
        ? ((currentBalance > 0 ? currentBalance : 0) / vendor.creditLimit) * 100
        : 0,
    };

    return NextResponse.json({
      vendor,
      bills,
      payments,
      creditNotes,
      summary,
    });
  } catch (error) {
    console.error("Error fetching vendor history:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor history" },
      { status: 500 }
    );
  }
}
