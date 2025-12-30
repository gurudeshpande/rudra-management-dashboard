import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all vendors
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const vendors = await prisma.vendor.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { companyName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { gstin: { contains: search, mode: "insensitive" } },
        ],
      },
      include: {
        creditNotes: true,
        payments: true,
        bills: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

// POST create new vendor
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      companyName,
      gstin,
      address,
      openingBalance,
      creditLimit,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Vendor name is required" },
        { status: 400 }
      );
    }

    // Check if vendor with same GSTIN already exists
    if (gstin) {
      const existingVendor = await prisma.vendor.findFirst({
        where: { gstin },
      });

      if (existingVendor) {
        return NextResponse.json(
          { error: "Vendor with this GSTIN already exists" },
          { status: 400 }
        );
      }
    }

    // Check if vendor with same email already exists
    if (email) {
      const existingVendor = await prisma.vendor.findFirst({
        where: { email },
      });

      if (existingVendor) {
        return NextResponse.json(
          { error: "Vendor with this email already exists" },
          { status: 400 }
        );
      }
    }

    const vendor = await prisma.vendor.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        companyName: companyName || null,
        gstin: gstin || null,
        address: address || null,
        openingBalance: openingBalance || 0,
        creditLimit: creditLimit || null,
      },
      include: {
        creditNotes: true,
        payments: true,
        bills: true,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error: any) {
    console.error("Error creating vendor:", error);
    return NextResponse.json(
      { error: "Failed to create vendor", details: error.message },
      { status: 500 }
    );
  }
}

// PUT update vendor
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const body = await request.json();
    const {
      name,
      phone,
      email,
      companyName,
      gstin,
      address,
      openingBalance,
      creditLimit,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    // Check if vendor exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingVendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Check if GSTIN is being updated and already exists for another vendor
    if (gstin && gstin !== existingVendor.gstin) {
      const vendorWithGstin = await prisma.vendor.findFirst({
        where: { gstin },
      });

      if (vendorWithGstin) {
        return NextResponse.json(
          { error: "Another vendor with this GSTIN already exists" },
          { status: 400 }
        );
      }
    }

    // Check if email is being updated and already exists for another vendor
    if (email && email !== existingVendor.email) {
      const vendorWithEmail = await prisma.vendor.findFirst({
        where: { email },
      });

      if (vendorWithEmail) {
        return NextResponse.json(
          { error: "Another vendor with this email already exists" },
          { status: 400 }
        );
      }
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: parseInt(id) },
      data: {
        name: name || existingVendor.name,
        phone: phone !== undefined ? phone : existingVendor.phone,
        email: email !== undefined ? email : existingVendor.email,
        companyName:
          companyName !== undefined ? companyName : existingVendor.companyName,
        gstin: gstin !== undefined ? gstin : existingVendor.gstin,
        address: address !== undefined ? address : existingVendor.address,
        openingBalance:
          openingBalance !== undefined
            ? openingBalance
            : existingVendor.openingBalance,
        creditLimit:
          creditLimit !== undefined ? creditLimit : existingVendor.creditLimit,
      },
      include: {
        creditNotes: true,
        payments: true,
        bills: true,
      },
    });

    return NextResponse.json(updatedVendor);
  } catch (error: any) {
    console.error("Error updating vendor:", error);
    return NextResponse.json(
      { error: "Failed to update vendor", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE vendor
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    // Check if vendor exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { id: parseInt(id) },
      include: {
        creditNotes: true,
        payments: true,
        bills: true,
      },
    });

    if (!existingVendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Check if vendor has any related records
    if (
      existingVendor.creditNotes.length > 0 ||
      existingVendor.payments.length > 0 ||
      existingVendor.bills.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete vendor with existing credit notes, payments, or bills",
          creditNoteCount: existingVendor.creditNotes.length,
          paymentCount: existingVendor.payments.length,
          billCount: existingVendor.bills.length,
        },
        { status: 400 }
      );
    }

    await prisma.vendor.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      { message: "Vendor deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting vendor:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor", details: error.message },
      { status: 500 }
    );
  }
}
