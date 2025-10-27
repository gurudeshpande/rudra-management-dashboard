// app/api/payments/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all payments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { customerName: { contains: search, mode: "insensitive" } },
          { customerNumber: { contains: search, mode: "insensitive" } },
          { receiptNumber: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST create new payment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerNumber,
      amount,
      paymentMethod,
      transactionId,
      receiptNumber,
    } = body;

    // Validate required fields
    if (!customerName || !amount || !paymentMethod || !receiptNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!["UPI", "CASH", "BANK_TRANSFER", "CARD"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Validate transaction ID for non-cash payments
    if (paymentMethod !== "CASH" && !transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required for non-cash payments" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        customerName,
        customerNumber: customerNumber || null,
        amount: parseFloat(amount),
        paymentMethod,
        transactionId: transactionId || null,
        receiptNumber,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);

    // Handle duplicate receipt number
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Receipt number already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
