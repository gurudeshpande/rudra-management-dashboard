import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    const excludeId = searchParams.get("excludeId");

    if (!name) {
      return NextResponse.json(
        { error: "Name parameter is required" },
        { status: 400 },
      );
    }

    // Decode the name
    const decodedName = decodeURIComponent(name);

    // Find customers with similar names (case insensitive)
    const existingCustomers = await prisma.userCustomer.findMany({
      where: {
        AND: [
          {
            name: {
              equals: decodedName,
              mode: "insensitive",
            },
          },
          excludeId
            ? {
                NOT: {
                  id: parseInt(excludeId),
                },
              }
            : {},
        ],
      },
      take: 1, // We only need to know if exists
    });

    const exists = existingCustomers.length > 0;

    return NextResponse.json({
      exists,
      customer: exists ? existingCustomers[0] : null,
      message: exists
        ? "Customer with this name already exists"
        : "Name is available",
    });
  } catch (error: any) {
    console.error("❌ Error checking customer name:", error);
    return NextResponse.json(
      { error: "Failed to check customer name" },
      { status: 500 },
    );
  }
}
