// app/api/payments/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, PaymentStatus, PaymentMethod } from "@prisma/client";

const prisma = new PrismaClient();

// GET all payments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          // Search through customer details
          { customer: { name: { contains: search, mode: "insensitive" } } },
          { customer: { number: { contains: search, mode: "insensitive" } } },
          { customer: { email: { contains: search, mode: "insensitive" } } },
          // Search through payment details
          { receiptNumber: { contains: search, mode: "insensitive" } },
          { transactionId: { contains: search, mode: "insensitive" } },
        ],
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            number: true,
            email: true,
            address: true,
          },
        },
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

    console.log("Payment creation request:", body);

    const {
      customerId, // Now we expect customerId instead of separate customer fields
      amount,
      paymentMethod,
      transactionId,
      receiptNumber,
      status = PaymentStatus.DUE, // Use enum directly
      dueDate,
      balanceDue,
    } = body;

    console.log(body, "bosy");

    // Validate required fields
    if (!amount || !paymentMethod || !receiptNumber) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: customerId, amount, paymentMethod, and receiptNumber are required",
        },
        { status: 400 }
      );
    }

    // Validate payment method
    const validPaymentMethods = Object.values(PaymentMethod);
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        {
          error: `Invalid payment method. Valid methods are: ${validPaymentMethods.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = Object.values(PaymentStatus);
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Valid statuses are: ${validStatuses.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Validate transaction ID for non-cash payments
    if (paymentMethod !== PaymentMethod.CASH && !transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required for non-cash payments" },
        { status: 400 }
      );
    }

    // Validate amount
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Validate balanceDue if provided
    let balanceDueValue = null;
    if (balanceDue !== undefined && balanceDue !== null) {
      balanceDueValue = parseFloat(balanceDue);
      if (isNaN(balanceDueValue) || balanceDueValue < 0) {
        return NextResponse.json(
          { error: "Invalid balance due amount" },
          { status: 400 }
        );
      }
    }

    // Parse dueDate if provided
    let dueDateValue = null;
    if (dueDate) {
      dueDateValue = new Date(dueDate);
      if (isNaN(dueDateValue.getTime())) {
        return NextResponse.json(
          { error: "Invalid due date" },
          { status: 400 }
        );
      }
    }

    // Check if receipt number already exists
    const existingReceipt = await prisma.payment.findUnique({
      where: { receiptNumber },
    });

    if (existingReceipt) {
      return NextResponse.json(
        { error: "Receipt number already exists" },
        { status: 400 }
      );
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        customerId,
        amount: amountValue,
        paymentMethod,
        transactionId: transactionId || null,
        receiptNumber,
        status,
        dueDate: dueDateValue,
        balanceDue: balanceDueValue,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            number: true,
            email: true,
            address: true,
          },
        },
      },
    });

    console.log("Payment created successfully:", payment);

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error("Error creating payment:", error);

    // Handle specific Prisma errors
    if (error.code === "P2002") {
      // Unique constraint violation
      if (error.meta?.target?.includes("receiptNumber")) {
        return NextResponse.json(
          { error: "Receipt number already exists" },
          { status: 400 }
        );
      }
    }

    if (error.code === "P2003") {
      // Foreign key constraint violation
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create payment", details: error.message },
      { status: 500 }
    );
  }
}

// Optional: Add PUT and DELETE methods

// PUT update payment
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, balanceDue, dueDate, transactionId } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (status && Object.values(PaymentStatus).includes(status)) {
      updateData.status = status;
    }

    if (balanceDue !== undefined) {
      const balanceDueValue = parseFloat(balanceDue);
      if (!isNaN(balanceDueValue) && balanceDueValue >= 0) {
        updateData.balanceDue = balanceDueValue;
      }
    }

    if (dueDate) {
      const dueDateValue = new Date(dueDate);
      if (!isNaN(dueDateValue.getTime())) {
        updateData.dueDate = dueDateValue;
      }
    }

    if (transactionId !== undefined) {
      updateData.transactionId = transactionId;
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            number: true,
            email: true,
            address: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPayment);
  } catch (error: any) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Failed to update payment", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE payment
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    await prisma.payment.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Payment deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: "Failed to delete payment", details: error.message },
      { status: 500 }
    );
  }
}
