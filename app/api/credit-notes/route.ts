import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all credit notes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");

    const where: any = {};

    if (search) {
      where.OR = [
        { creditNoteNumber: { contains: search, mode: "insensitive" } },
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { number: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = parseInt(customerId);
    }

    const creditNotes = await prisma.creditNote.findMany({
      where,
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
      orderBy: { issueDate: "desc" },
    });

    return NextResponse.json(creditNotes);
  } catch (error) {
    console.error("Error fetching credit notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch credit notes" },
      { status: 500 }
    );
  }
}

// POST create new credit note
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      invoiceNumber,
      reason,
      amount,
      taxAmount = 0,
      notes,
      status = "DRAFT",
      creditNoteNumber,
    } = body;

    // Validate required fields
    if (!customerId || !reason || !amount || !creditNoteNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate amount
    const amountValue = parseFloat(amount);
    const taxAmountValue = parseFloat(taxAmount || "0");
    const totalAmount = amountValue + taxAmountValue;

    if (isNaN(amountValue) || amountValue <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
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

    // Check if credit note number already exists
    const existingCreditNote = await prisma.creditNote.findUnique({
      where: { creditNoteNumber },
    });

    if (existingCreditNote) {
      return NextResponse.json(
        { error: "Credit note number already exists" },
        { status: 400 }
      );
    }

    // Create credit note
    const creditNote = await prisma.creditNote.create({
      data: {
        customerId,
        invoiceNumber: invoiceNumber || null,
        creditNoteNumber,
        reason,
        amount: amountValue,
        taxAmount: taxAmountValue,
        totalAmount,
        notes: notes || null,
        status,
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

    return NextResponse.json(creditNote, { status: 201 });
  } catch (error: any) {
    console.error("Error creating credit note:", error);
    return NextResponse.json(
      { error: "Failed to create credit note", details: error.message },
      { status: 500 }
    );
  }
}

// PUT update credit note
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, notes, appliedToInvoice, appliedInvoiceId } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Credit note ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    if (appliedToInvoice !== undefined) {
      updateData.appliedToInvoice = appliedToInvoice;
      if (appliedToInvoice) {
        updateData.appliedDate = new Date();
        if (appliedInvoiceId) {
          updateData.appliedInvoiceId = appliedInvoiceId;
        }
      } else {
        updateData.appliedDate = null;
        updateData.appliedInvoiceId = null;
      }
    }

    const updatedCreditNote = await prisma.creditNote.update({
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

    return NextResponse.json(updatedCreditNote);
  } catch (error: any) {
    console.error("Error updating credit note:", error);
    return NextResponse.json(
      { error: "Failed to update credit note", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE credit note
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Credit note ID is required" },
        { status: 400 }
      );
    }

    // Check if credit note exists
    const existingCreditNote = await prisma.creditNote.findUnique({
      where: { id },
    });

    if (!existingCreditNote) {
      return NextResponse.json(
        { error: "Credit note not found" },
        { status: 404 }
      );
    }

    // Only allow deletion of DRAFT credit notes
    if (existingCreditNote.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only DRAFT credit notes can be deleted" },
        { status: 400 }
      );
    }

    await prisma.creditNote.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Credit note deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting credit note:", error);
    return NextResponse.json(
      { error: "Failed to delete credit note", details: error.message },
      { status: 500 }
    );
  }
}
