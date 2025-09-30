import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    const data = await req.json();

    let updateData: any = {
      status: data.status,
      balanceDue: data.remaining,
      advancePaid: data.advancePaid,
      customer: {
        update: {
          name: data.customer?.name || "",
          number: data.customer?.number || "",
        },
      },
    };

    // 🔹 Force values if status = PAID
    if (data.status?.toUpperCase() === "PAID") {
      updateData.balanceDue = 0;
      updateData.advancePaid = data.advancePaid || 0;
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: Number(id) },
      data: updateData,
      include: { customer: true },
    });

    return NextResponse.json({ success: true, invoice: updatedInvoice });
  } catch (error: any) {
    console.error("❌ Error updating invoice:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    const invoiceId = Number(id);

    // Use a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // First, check if the invoice exists
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          items: true,
          shipping: true,
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Delete all related invoice items first
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: invoiceId },
      });

      // Note: ShippingInfo is not deleted because it's shared with Customer
      // We only remove the reference by setting shippingId to null
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { shippingId: null },
      });

      // Finally delete the invoice
      return await tx.invoice.delete({
        where: { id: invoiceId },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully",
      deletedInvoice: result,
    });
  } catch (error: any) {
    console.error("❌ Error deleting invoice:", error);

    if (error.message === "Invoice not found") {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
