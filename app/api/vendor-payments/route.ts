import { NextResponse } from "next/server";
import {
  PrismaClient,
  VendorPaymentStatus,
  VendorPaymentMethod,
} from "@prisma/client";

const prisma = new PrismaClient();

// GET all vendor payments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const vendorId = searchParams.get("vendorId");

    const where: any = {};

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { transactionId: { contains: search, mode: "insensitive" } },
        { vendor: { name: { contains: search, mode: "insensitive" } } },
        { vendor: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendorId = parseInt(vendorId);
    }

    const payments = await prisma.vendorPayment.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            phone: true,
            gstin: true,
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching vendor payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor payments" },
      { status: 500 }
    );
  }
}

// POST create new vendor payment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      vendorId,
      amount,
      paymentMethod,
      transactionId,
      referenceNumber,
      paymentDate,
      productName,
      billNumbers,
      status = VendorPaymentStatus.PAID,
      dueDate,
      notes,
    } = body;

    console.log(body, "body");

    // Validate required fields
    if (!vendorId || !amount || !referenceNumber) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: vendorId, amount, and referenceNumber are required",
        },
        { status: 400 }
      );
    }

    // Validate payment method
    const validPaymentMethods = Object.values(VendorPaymentMethod);
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
    const validStatuses = Object.values(VendorPaymentStatus);
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

    // Validate vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Validate amount
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Parse payment date
    let paymentDateValue = new Date();
    if (paymentDate) {
      paymentDateValue = new Date(paymentDate);
      if (isNaN(paymentDateValue.getTime())) {
        return NextResponse.json(
          { error: "Invalid payment date" },
          { status: 400 }
        );
      }
    }

    // Parse due date if provided
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

    // Check if reference number already exists
    const existingPayment = await prisma.vendorPayment.findUnique({
      where: { referenceNumber },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: "Reference number already exists" },
        { status: 400 }
      );
    }

    // Create payment
    const payment = await prisma.vendorPayment.create({
      data: {
        vendorId,
        amount: amountValue,
        paymentMethod,
        transactionId: transactionId || null,
        referenceNumber,
        productName: productName || null,
        paymentDate: paymentDateValue,
        billNumbers: billNumbers || [],
        status,
        dueDate: dueDateValue,
        notes: notes || null,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            phone: true,
            gstin: true,
          },
        },
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error("Error creating vendor payment:", error);
    return NextResponse.json(
      { error: "Failed to create vendor payment", details: error.message },
      { status: 500 }
    );
  }
}

// PUT update vendor payment
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, dueDate, transactionId, notes, billNumbers } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Check if payment exists
    const existingPayment = await prisma.vendorPayment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (status && Object.values(VendorPaymentStatus).includes(status)) {
      updateData.status = status;
    }

    if (dueDate !== undefined) {
      if (dueDate) {
        const dueDateValue = new Date(dueDate);
        if (!isNaN(dueDateValue.getTime())) {
          updateData.dueDate = dueDateValue;
        }
      } else {
        updateData.dueDate = null;
      }
    }

    if (transactionId !== undefined) {
      updateData.transactionId = transactionId;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (billNumbers !== undefined) {
      updateData.billNumbers = billNumbers;
    }

    const updatedPayment = await prisma.vendorPayment.update({
      where: { id },
      data: updateData,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            phone: true,
            gstin: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPayment);
  } catch (error: any) {
    console.error("Error updating vendor payment:", error);
    return NextResponse.json(
      { error: "Failed to update vendor payment", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE vendor payment
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
    const existingPayment = await prisma.vendorPayment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    await prisma.vendorPayment.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Payment deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting vendor payment:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor payment", details: error.message },
      { status: 500 }
    );
  }
}
