import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateInvoiceNumber } from "@/utils/invoiceNumberGenerator";

const prisma = new PrismaClient();

// Function to update product quantities
const updateProductQuantities = async (items: any[]) => {
  const updates = items.map(async (item) => {
    try {
      // Get current product
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      // Check if enough quantity is available
      if (product.quantity < item.quantity) {
        throw new Error(
          `Insufficient quantity for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`,
        );
      }

      // Update quantity
      const updatedProduct = await prisma.product.update({
        where: { id: item.productId },
        data: {
          quantity: product.quantity - item.quantity,
        },
      });

      return updatedProduct;
    } catch (error) {
      console.error(
        `Error updating quantity for product ${item.productId}:`,
        error,
      );
      throw error;
    }
  });

  return Promise.all(updates);
};

// ✅ Create or update invoice (DRAFT or FINAL)
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const {
      invoiceDate,
      dueDate,
      customerInfo,
      shippingInfo,
      items,
      subtotal,
      extraCharges = 0,
      cgst,
      sgst,
      total,
      advancePaid,
      balanceDue,
      totalInWords,
      deliveryDate,
      status,
      companyType = "RUDRA", // <-- Add companyType here with default value
    } = data;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // ✅ Upsert Customer
    const customer = await prisma.customer.upsert({
      where: { number: customerInfo.number },
      update: {
        name: customerInfo.name,
        address: customerInfo.address,
      },
      create: {
        name: customerInfo.name,
        number: customerInfo.number,
        address: customerInfo.address,
      },
    });

    // Create Shipping Info (if provided)
    let shipping = null;
    if (shippingInfo?.address) {
      shipping = await prisma.shippingInfo.create({
        data: {
          name: shippingInfo.name,
          address: shippingInfo.address,
          customerId: customer.id,
        },
      });
    }

    // Update product quantities (only for FINAL or PAID invoices)
    // if (status === "FINAL" || status === "PAID") {
    //   await updateProductQuantities(items);
    // }

    await updateProductQuantities(items);

    // Create Invoice with companyType
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        customerId: customer.id,
        shippingId: shipping?.id,
        subtotal,
        extraCharges,
        cgst,
        sgst,
        total,
        advancePaid,
        balanceDue,
        totalInWords,
        deliveryDate: new Date(deliveryDate),
        status,
        companyType, // <-- Add companyType here
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            description: item.description || "",
            notes: item.notes || "",
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error("❌ Error saving invoice:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// ✅ Fetch all invoices
export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        shipping: true,
        items: true,
      },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("❌ Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}

// ✅ Delete Invoice
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Invoice ID is required" },
        { status: 400 },
      );
    }

    // First, get the invoice with items to restore quantities
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    // Restore product quantities if invoice was FINAL or PAID
    if (invoice.status === "FINAL" || invoice.status === "PAID") {
      for (const item of invoice.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    // First delete items related to the invoice
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: Number(id) },
    });

    // Then delete the invoice itself
    await prisma.invoice.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, message: "Invoice deleted" });
  } catch (error: any) {
    console.error("❌ Error deleting invoice:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// ✅ Update Invoice (customer, number, remaining, status)
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { customer, remaining, status, companyType, extraCharges } = body; // <-- Add companyType here

    // Get the current invoice to check status changes
    const currentInvoice = await prisma.invoice.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!currentInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Handle status changes that affect inventory
    if (currentInvoice.status !== status) {
      // If changing from DRAFT to ANY status (PAID, UNPAID, ADVANCE), deduct quantities
      if (currentInvoice.status === "DRAFT") {
        for (const item of currentInvoice.items) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
          });

          if (product && product.quantity < item.quantity) {
            throw new Error(
              `Insufficient quantity for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`,
            );
          }

          await prisma.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      }
      // If changing from ANY status to DRAFT, restore quantities
      else if (status === "DRAFT") {
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
      }
    }

    // Prepare update data
    const updateData: any = {
      balanceDue: remaining,
      status,
      extraCharges,
    };

    // Add companyType if provided
    if (companyType) {
      updateData.companyType = companyType;
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: Number(id) },
      data: updateData,
      include: { customer: true, items: true },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error: any) {
    console.error("❌ Error updating invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
