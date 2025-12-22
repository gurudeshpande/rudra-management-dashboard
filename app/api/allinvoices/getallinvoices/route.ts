import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const entity = searchParams.get("entity");

    let whereClause: any = {};

    // Add search filter if provided
    if (search) {
      whereClause.OR = [
        {
          invoiceNumber: { contains: search, mode: "insensitive" },
        },
        {
          customer: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Add status filter if provided
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (entity && entity !== "ALL") {
      whereClause.companyType = entity;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        shipping: true,
        items: true,
      },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
