// app/api/allinvoices/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Invoice ID is required" },
        { status: 400 },
      );
    }

    const data = await req.json();
    console.log("Update data received:", data);

    // Get the current invoice to access its customer and items
    const currentInvoice = await prisma.invoice.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!currentInvoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    // Prepare update data
    const updateData: any = {
      status: data.status,
      balanceDue: data.balanceDue || data.remaining,
      advancePaid: data.advancePaid,
      subtotal: data.subtotal,
      extraCharges: data.extraCharges || 0,
      cgst: data.cgst,
      sgst: data.sgst,
      total: data.total,
      description: data.description || "",
      companyType: data.companyType,
      invoiceDate: data.invoiceDate
        ? new Date(data.invoiceDate)
        : currentInvoice.invoiceDate,
      dueDate: data.dueDate ? new Date(data.dueDate) : currentInvoice.dueDate,
      deliveryDate: data.deliveryDate
        ? new Date(data.deliveryDate)
        : currentInvoice.deliveryDate,
      totalInWords: data.totalInWords,
    };

    // Force values if status = PAID
    if (data.status?.toUpperCase() === "PAID") {
      updateData.balanceDue = 0;
      updateData.advancePaid = data.advancePaid || data.total;
    }

    // Handle items update if provided
    if (data.items && data.items.length > 0) {
      // First, restore old product quantities
      for (const item of currentInvoice.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
      }

      // Then deduct new quantities
      for (const item of data.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Delete old items
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: Number(id) },
      });

      // Add updateData.items for creation
      updateData.items = {
        create: data.items.map((item: any) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          notes: item.notes || "",
        })),
      };
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        customer: true,
        items: true,
      },
    });

    return NextResponse.json({ success: true, invoice: updatedInvoice });
  } catch (error: any) {
    console.error("❌ Error updating invoice:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Invoice ID is required" },
        { status: 400 },
      );
    }

    const invoiceId = Number(id);

    const result = await prisma.$transaction(async (tx) => {
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

      await tx.invoiceItem.deleteMany({
        where: { invoiceId: invoiceId },
      });

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { shippingId: null },
      });

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

    if (error.message === "Invoice not found" || error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
