import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ GET all customers with search
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [customers, totalCount] = await Promise.all([
      prisma.userCustomer.findMany({
        // ✅ Correct: userCustomer (lowercase in Prisma)
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { gst: { contains: search, mode: "insensitive" } },
            { pan: { contains: search, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.userCustomer.count({
        // ✅ Correct: userCustomer (lowercase in Prisma)
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { gst: { contains: search, mode: "insensitive" } },
            { pan: { contains: search, mode: "insensitive" } },
          ],
        },
      }),
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers: " + error.message },
      { status: 500 },
    );
  }
}

// ✅ POST create new customer
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, billingAddress, gst, pan } = body;

    console.log("Creating customer with data:", body);

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and Phone are required" },
        { status: 400 },
      );
    }

    // Check if customer with same phone exists
    const existingCustomer = await prisma.userCustomer.findUnique({
      where: { phone }, // ✅ Correct: matches your model field name
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "Customer with this phone number already exists" },
        { status: 400 },
      );
    }

    const existingCustomerByName = await prisma.userCustomer.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingCustomerByName) {
      return NextResponse.json(
        { error: "Customer with this name already exists" },
        { status: 400 },
      );
    }
    // Validate GST format (if provided)
    if (
      gst &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst)
    ) {
      return NextResponse.json(
        { error: "Invalid GST format. Expected format: 27ABCDE1234F1Z5" },
        { status: 400 },
      );
    }

    // Validate PAN format (if provided)
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      return NextResponse.json(
        { error: "Invalid PAN format. Expected format: ABCDE1234F" },
        { status: 400 },
      );
    }

    const customer = await prisma.userCustomer.create({
      data: {
        name,
        email: email || null,
        phone, // ✅ Correct: matches your model field name
        billingAddress: billingAddress || null, // ✅ Correct: matches your model field name
        gst: gst || null,
        pan: pan || null,
      },
    });

    console.log("Customer created successfully:", customer);

    return NextResponse.json({
      success: true,
      customer,
      message: "Customer created successfully",
    });
  } catch (error: any) {
    console.error("❌ Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer: " + error.message },
      { status: 500 },
    );
  }
}

// ✅ PUT update customer
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { name, email, phone, billingAddress, gst, pan } = body;

    console.log("Updating customer ID:", id, "with data:", body);

    // Check if phone is being changed and if it conflicts
    const currentCustomer = await prisma.userCustomer.findUnique({
      where: { id: parseInt(id) },
    });

    if (!currentCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    if (currentCustomer && phone !== currentCustomer.phone) {
      const existingWithPhone = await prisma.userCustomer.findUnique({
        where: { phone },
      });

      if (existingWithPhone) {
        return NextResponse.json(
          { error: "Another customer already has this phone number" },
          { status: 400 },
        );
      }
    }

    if (name && name !== currentCustomer.name) {
      const existingWithName = await prisma.userCustomer.findFirst({
        where: {
          AND: [
            {
              name: {
                equals: name,
                mode: "insensitive",
              },
            },
            {
              NOT: {
                id: parseInt(id),
              },
            },
          ],
        },
      });

      if (existingWithName) {
        return NextResponse.json(
          { error: "Another customer already has this name" },
          { status: 400 },
        );
      }
    }

    // Validate GST format (if provided and changed)
    if (gst && gst !== currentCustomer?.gst) {
      if (
        !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst)
      ) {
        return NextResponse.json(
          { error: "Invalid GST format. Expected format: 27ABCDE1234F1Z5" },
          { status: 400 },
        );
      }
    }

    // Validate PAN format (if provided and changed)
    if (pan && pan !== currentCustomer?.pan) {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
        return NextResponse.json(
          { error: "Invalid PAN format. Expected format: ABCDE1234F" },
          { status: 400 },
        );
      }
    }

    const updatedCustomer = await prisma.userCustomer.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email: email || null,
        phone,
        billingAddress: billingAddress || null,
        gst: gst || null,
        pan: pan || null,
      },
    });

    console.log("Customer updated successfully:", updatedCustomer);

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      message: "Customer updated successfully",
    });
  } catch (error: any) {
    console.error("❌ Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer: " + error.message },
      { status: 500 },
    );
  }
}

// ✅ DELETE customer
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 },
      );
    }

    console.log("Deleting customer ID:", id);

    await prisma.userCustomer.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer: " + error.message },
      { status: 500 },
    );
  }
}
