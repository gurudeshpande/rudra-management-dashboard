import { NextResponse } from "next/server";
import { PrismaClient, VendorCreditNoteStatus } from "@prisma/client";

const prisma = new PrismaClient();

// GET all vendor credit notes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const vendorId = searchParams.get("vendorId");

    const where: any = {};

    if (search) {
      where.OR = [
        { creditNoteNumber: { contains: search, mode: "insensitive" } },
        { billNumber: { contains: search, mode: "insensitive" } },
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

    const creditNotes = await prisma.vendorCreditNote.findMany({
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
      orderBy: { issueDate: "desc" },
    });

    return NextResponse.json(creditNotes);
  } catch (error) {
    console.error("Error fetching vendor credit notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor credit notes" },
      { status: 500 }
    );
  }
}

// POST create new vendor credit note
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      vendorId,
      billNumber,
      reason,
      amount,
      taxAmount = 0,
      notes,
      status = VendorCreditNoteStatus.DRAFT,
      creditNoteNumber,
    } = body;

    // Validate required fields
    if (!vendorId || !reason || !amount || !creditNoteNumber) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: vendorId, reason, amount, and creditNoteNumber are required",
        },
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

    // Validate vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Check if credit note number already exists
    const existingCreditNote = await prisma.vendorCreditNote.findUnique({
      where: { creditNoteNumber },
    });

    if (existingCreditNote) {
      return NextResponse.json(
        { error: "Credit note number already exists" },
        { status: 400 }
      );
    }

    // Create credit note
    const creditNote = await prisma.vendorCreditNote.create({
      data: {
        vendorId,
        billNumber: billNumber || null,
        creditNoteNumber,
        reason,
        amount: amountValue,
        taxAmount: taxAmountValue,
        totalAmount,
        notes: notes || null,
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

    return NextResponse.json(creditNote, { status: 201 });
  } catch (error: any) {
    console.error("Error creating vendor credit note:", error);
    return NextResponse.json(
      { error: "Failed to create vendor credit note", details: error.message },
      { status: 500 }
    );
  }
}

// PUT update vendor credit note
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, notes, appliedToBill, appliedBillId } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Credit note ID is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (status && Object.values(VendorCreditNoteStatus).includes(status)) {
      updateData.status = status;
    }

    if (notes !== undefined) updateData.notes = notes;

    if (appliedToBill !== undefined) {
      updateData.appliedToBill = appliedToBill;
      if (appliedToBill) {
        updateData.appliedDate = new Date();
        if (appliedBillId) {
          updateData.appliedBillId = appliedBillId;
        }
      } else {
        updateData.appliedDate = null;
        updateData.appliedBillId = null;
      }
    }

    const updatedCreditNote = await prisma.vendorCreditNote.update({
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

    return NextResponse.json(updatedCreditNote);
  } catch (error: any) {
    console.error("Error updating vendor credit note:", error);
    return NextResponse.json(
      { error: "Failed to update vendor credit note", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE vendor credit note
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
    const existingCreditNote = await prisma.vendorCreditNote.findUnique({
      where: { id },
    });

    if (!existingCreditNote) {
      return NextResponse.json(
        { error: "Credit note not found" },
        { status: 404 }
      );
    }

    // Only allow deletion of DRAFT credit notes
    if (existingCreditNote.status !== VendorCreditNoteStatus.DRAFT) {
      return NextResponse.json(
        { error: "Only DRAFT credit notes can be deleted" },
        { status: 400 }
      );
    }

    await prisma.vendorCreditNote.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Credit note deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting vendor credit note:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor credit note", details: error.message },
      { status: 500 }
    );
  }
}
