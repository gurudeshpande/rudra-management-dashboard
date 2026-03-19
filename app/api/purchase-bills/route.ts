import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all purchase bills
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const status = searchParams.get("status");

    const where: any = {};

    if (vendorId) {
      where.vendorId = parseInt(vendorId);
    }

    if (status) {
      where.status = status;
    }

    const bills = await prisma.purchaseBill.findMany({
      where,
      include: {
        vendor: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bills);
  } catch (error) {
    console.error("Error fetching purchase bills:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase bills" },
      { status: 500 },
    );
  }
}

// POST create new purchase bill
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      vendorId,
      billNumber,
      orderNumber,
      billDate,
      dueDate,
      paymentTerms,
      customPaymentTerms,
      subject,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxAmount,
      adjustment,
      total,
      notes,
      items,
      status = "DRAFT",
    } = body;

    // Validate required fields
    if (!vendorId || !billNumber || !billDate) {
      return NextResponse.json(
        { error: "Vendor, bill number, and bill date are required" },
        { status: 400 },
      );
    }

    // Check if bill number already exists
    const existingBill = await prisma.purchaseBill.findUnique({
      where: { billNumber },
    });

    if (existingBill) {
      return NextResponse.json(
        { error: "Bill number already exists" },
        { status: 400 },
      );
    }

    // Create bill with items
    const bill = await prisma.purchaseBill.create({
      data: {
        vendorId,
        billNumber,
        orderNumber,
        billDate: new Date(billDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        paymentTerms,
        customPaymentTerms,
        subject,
        subtotal: subtotal || 0,
        discountType,
        discountValue: discountValue || 0,
        discountAmount: discountAmount || 0,
        taxAmount: taxAmount || 0,
        adjustment: adjustment || 0,
        total: total || 0,
        amountPaid: 0,
        balanceDue: total || 0,
        notes,
        status,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || null,
            itemName: item.itemName,
            description: item.description,
            account: item.account,
            quantity: item.quantity || 1,
            rate: item.rate || 0,
            amount: item.amount || 0,
            taxRate: item.taxRate || 0,
            taxAmount: item.taxAmount || 0,
          })),
        },
      },
      include: {
        vendor: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (error: any) {
    console.error("Error creating purchase bill:", error);
    return NextResponse.json(
      { error: "Failed to create purchase bill", details: error.message },
      { status: 500 },
    );
  }
}

// PUT update purchase bill
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Bill ID is required" },
        { status: 400 },
      );
    }

    const {
      orderNumber,
      billDate,
      dueDate,
      paymentTerms,
      customPaymentTerms,
      subject,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      taxAmount,
      adjustment,
      total,
      amountPaid,
      balanceDue,
      notes,
      status,
      items,
    } = body;

    // Update bill
    const bill = await prisma.purchaseBill.update({
      where: { id },
      data: {
        orderNumber,
        billDate: billDate ? new Date(billDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : null,
        paymentTerms,
        customPaymentTerms,
        subject,
        subtotal,
        discountType,
        discountValue,
        discountAmount,
        taxAmount,
        adjustment,
        total,
        amountPaid,
        balanceDue,
        notes,
        status,
      },
    });

    // Update items if provided
    if (items) {
      // Delete existing items
      await prisma.purchaseBillItem.deleteMany({
        where: { billId: id },
      });

      // Create new items
      await prisma.purchaseBillItem.createMany({
        data: items.map((item: any) => ({
          billId: id,
          productId: item.productId || null,
          itemName: item.itemName,
          description: item.description,
          account: item.account,
          quantity: item.quantity || 1,
          rate: item.rate || 0,
          amount: item.amount || 0,
          taxRate: item.taxRate || 0,
          taxAmount: item.taxAmount || 0,
        })),
      });
    }

    const updatedBill = await prisma.purchaseBill.findUnique({
      where: { id },
      include: {
        vendor: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(updatedBill);
  } catch (error: any) {
    console.error("Error updating purchase bill:", error);
    return NextResponse.json(
      { error: "Failed to update purchase bill", details: error.message },
      { status: 500 },
    );
  }
}

// DELETE purchase bill
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Bill ID is required" },
        { status: 400 },
      );
    }

    await prisma.purchaseBill.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Bill deleted successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error deleting purchase bill:", error);
    return NextResponse.json(
      { error: "Failed to delete purchase bill", details: error.message },
      { status: 500 },
    );
  }
}
