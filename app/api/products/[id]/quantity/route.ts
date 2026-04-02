import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { quantityToAdd } = body;

    if (!quantityToAdd || quantityToAdd <= 0) {
      return NextResponse.json(
        { error: "Valid quantity to add is required" },
        { status: 400 }
      );
    }

    // Get current product
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Update quantity
    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        quantity: product.quantity + parseInt(quantityToAdd),
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product quantity:", error);
    return NextResponse.json(
      { error: "Failed to update product quantity" },
      { status: 500 }
    );
  }
}
