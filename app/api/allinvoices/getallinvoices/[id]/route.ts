// app/api/allinvoices/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
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

    // Validate if it's a valid number
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { success: false, error: "Invalid invoice ID format" },
        { status: 400 },
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        shipping: true,
        items: {
          orderBy: {
            id: "asc", // Optional: order items by ID
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("Error fetching invoice by ID:", error);

    // Handle Prisma specific errors
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch invoice" },
      { status: 500 },
    );
  }
}

// You can also add a POST method if you want to search by ID via POST
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Invoice ID is required" },
        { status: 400 },
      );
    }

    const invoiceId = Number(id);

    // Validate if it's a valid number
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { success: false, error: "Invalid invoice ID format" },
        { status: 400 },
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        shipping: true,
        items: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error("Error fetching invoice by ID:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch invoice" },
      { status: 500 },
    );
  }
}
