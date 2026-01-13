// app/api/invoices/[id]/send-whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { WhatsAppService } from "@/lib/whatsapp-service";

const prisma = new PrismaClient();
const whatsappService = new WhatsAppService();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params promise
    const { id } = await params;
    const invoiceId = parseInt(id);

    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: "Invalid invoice ID" },
        { status: 400 }
      );
    }

    // Fetch invoice with related data
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Check if customer has phone number
    if (!invoice.customer.number) {
      return NextResponse.json(
        { error: "Customer phone number not found" },
        { status: 400 }
      );
    }

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
      }).format(amount);
    };

    // Format date
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    // Generate invoice URL
    const invoiceUrl = whatsappService.generateInvoiceUrl(
      invoice.id,
      invoice.customer.number,
      invoice.customer.name
    );

    // Create WhatsApp message
    const whatsappMessage = whatsappService.generateWhatsAppMessage({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.name,
      totalAmount: formatCurrency(invoice.total || invoice.subtotal),
      dueDate: formatDate(invoice.dueDate),
      invoiceUrl: invoiceUrl,
    });

    // Generate WhatsApp share URL
    const whatsappShareUrl = whatsappService.generateWhatsAppShareUrl(
      invoice.customer.number,
      whatsappMessage
    );

    return NextResponse.json({
      success: true,
      message: "WhatsApp link generated successfully",
      data: {
        whatsappUrl: whatsappShareUrl,
        invoiceUrl: invoiceUrl,
        sentTo: invoice.customer.number,
        customerName: invoice.customer.name,
        invoiceNumber: invoice.invoiceNumber,
        message: decodeURIComponent(whatsappMessage), // For preview
      },
      instructions:
        "Click the WhatsApp link to open WhatsApp and send the message. Copy the invoice URL to share via other methods.",
    });
  } catch (error: any) {
    console.error("Error generating WhatsApp link:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate WhatsApp link",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
