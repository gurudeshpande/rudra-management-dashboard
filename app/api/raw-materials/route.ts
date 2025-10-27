import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all raw materials
export async function GET() {
  try {
    const rawMaterials = await prisma.rawMaterial.findMany({
      orderBy: { id: "asc" },
      include: {
        productStructures: {
          include: {
            product: true,
          },
        },
        transfers: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });
    return NextResponse.json(rawMaterials);
  } catch (error) {
    console.error("Error fetching raw materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch raw materials" },
      { status: 500 }
    );
  }
}

// POST new raw material
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, quantity, unit } = body;

    console.log(name, quantity, unit, "Raw MAterials");

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newRawMaterial = await prisma.rawMaterial.create({
      data: {
        name,
        quantity: quantity || 0,
        unit: unit || "pcs",
      },
    });

    return NextResponse.json(newRawMaterial, { status: 201 });
  } catch (error) {
    console.error("Error creating raw material:", error);
    return NextResponse.json(
      { error: "Failed to create raw material" },
      { status: 500 }
    );
  }
}
