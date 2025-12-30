import { NextResponse } from "next/server";
import { PrismaClient, BillStatus } from "@prisma/client";

const prisma = new PrismaClient();

// GET all vendor bills
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const vendorId = searchParams.get("vendorId");

    const where: any = {};

    if (search) {
      where.OR = [
        { billNumber: { contains: search, mode: "insensitive" } },
        { paymentTerms: { contains: search, mode: "insensitive" } },
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

    const bills = await prisma.bill.findMany({
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
        appliedCreditNote: {
          select: {
            id: true,
            creditNoteNumber: true,
            amount: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { billDate: "desc" },
    });

    return NextResponse.json(bills);
  } catch (error) {
    console.error("Error fetching vendor bills:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor bills" },
      { status: 500 }
    );
  }
}

// POST create new vendor bill
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      vendorId,
      billNumber,
      billDate,
      dueDate,
      subtotal,
      taxAmount = 0,
      totalAmount,
      amountPaid = 0,
      balanceDue,
      paymentTerms,
      notes,
      itemsDescription,
      status = BillStatus.DRAFT,
    } = body;

    // Validate required fields
    if (!vendorId || !billNumber || !totalAmount) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: vendorId, billNumber, and totalAmount are required",
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

    // Check if bill number already exists
    const existingBill = await prisma.bill.findUnique({
      where: { billNumber },
    });

    if (existingBill) {
      return NextResponse.json(
        { error: "Bill number already exists" },
        { status: 400 }
      );
    }

    // Validate amounts
    const subtotalValue = parseFloat(subtotal || totalAmount);
    const taxAmountValue = parseFloat(taxAmount || "0");
    const totalAmountValue = parseFloat(totalAmount);
    const amountPaidValue = parseFloat(amountPaid || "0");
    const balanceDueValue = parseFloat(balanceDue || totalAmountValue);

    if (isNaN(totalAmountValue) || totalAmountValue <= 0) {
      return NextResponse.json(
        { error: "Invalid total amount" },
        { status: 400 }
      );
    }

    if (amountPaidValue > totalAmountValue) {
      return NextResponse.json(
        { error: "Amount paid cannot exceed total amount" },
        { status: 400 }
      );
    }

    // Parse dates
    let billDateValue = new Date();
    if (billDate) {
      billDateValue = new Date(billDate);
      if (isNaN(billDateValue.getTime())) {
        return NextResponse.json(
          { error: "Invalid bill date" },
          { status: 400 }
        );
      }
    }

    let dueDateValue = billDateValue;
    if (dueDate) {
      dueDateValue = new Date(dueDate);
      if (isNaN(dueDateValue.getTime())) {
        return NextResponse.json(
          { error: "Invalid due date" },
          { status: 400 }
        );
      }
    }

    // Create bill
    const bill = await prisma.bill.create({
      data: {
        vendorId,
        billNumber,
        billDate: billDateValue,
        dueDate: dueDateValue,
        subtotal: subtotalValue,
        taxAmount: taxAmountValue,
        totalAmount: totalAmountValue,
        amountPaid: amountPaidValue,
        balanceDue: balanceDueValue,
        paymentTerms: paymentTerms || null,
        notes: notes || null,
        itemsDescription: itemsDescription || null,
        status,
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

    return NextResponse.json(bill, { status: 201 });
  } catch (error: any) {
    console.error("Error creating vendor bill:", error);
    return NextResponse.json(
      { error: "Failed to create vendor bill", details: error.message },
      { status: 500 }
    );
  }
}

// PUT update vendor bill
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, amountPaid, balanceDue, paymentTerms, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Bill ID is required" },
        { status: 400 }
      );
    }

    // Check if bill exists
    const existingBill = await prisma.bill.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingBill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (status && Object.values(BillStatus).includes(status)) {
      updateData.status = status;
    }

    if (amountPaid !== undefined) {
      const amountPaidValue = parseFloat(amountPaid);
      if (!isNaN(amountPaidValue)) {
        if (amountPaidValue > existingBill.totalAmount) {
          return NextResponse.json(
            { error: "Amount paid cannot exceed total amount" },
            { status: 400 }
          );
        }
        updateData.amountPaid = amountPaidValue;
        updateData.balanceDue = existingBill.totalAmount - amountPaidValue;
      }
    }

    if (balanceDue !== undefined) {
      const balanceDueValue = parseFloat(balanceDue);
      if (!isNaN(balanceDueValue)) {
        updateData.balanceDue = balanceDueValue;
      }
    }

    if (paymentTerms !== undefined) {
      updateData.paymentTerms = paymentTerms;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updatedBill = await prisma.bill.update({
      where: { id: parseInt(id) },
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

    return NextResponse.json(updatedBill);
  } catch (error: any) {
    console.error("Error updating vendor bill:", error);
    return NextResponse.json(
      { error: "Failed to update vendor bill", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE vendor bill
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Bill ID is required" },
        { status: 400 }
      );
    }

    // Check if bill exists
    const existingBill = await prisma.bill.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingBill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    // Only allow deletion of DRAFT bills
    if (existingBill.status !== BillStatus.DRAFT) {
      return NextResponse.json(
        { error: "Only DRAFT bills can be deleted" },
        { status: 400 }
      );
    }

    await prisma.bill.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      { message: "Bill deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting vendor bill:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor bill", details: error.message },
      { status: 500 }
    );
  }
}
