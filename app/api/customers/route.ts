import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        number: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, address, city, state, pincode, gstin } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { message: "Name and phone are required" },
        { status: 400 }
      );
    }

    // Check if customer with same phone already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: { number: phone },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { message: "Customer with this phone number already exists" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        number: phone,
        address: address || null,
      },
      select: {
        id: true,
        name: true,
        number: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      { message: "Customer created successfully", customer },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
