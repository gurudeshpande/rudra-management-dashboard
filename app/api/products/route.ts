import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/products → fetch all products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// Function to find the next available ID
async function findNextAvailableId(): Promise<number> {
  try {
    // Get all IDs sorted
    const allProducts = await prisma.product.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
    });

    // If no products exist, start from 1
    if (allProducts.length === 0) {
      return 1;
    }

    // Create an array of existing IDs
    const existingIds = allProducts.map((product) => product.id);

    // Find the first gap in the sequence
    for (let i = 1; i <= existingIds.length; i++) {
      if (existingIds[i - 1] !== i) {
        return i; // Found a gap
      }
    }

    // If no gaps found, use next sequential number
    return existingIds[existingIds.length - 1] + 1;
  } catch (error) {
    console.error("Error finding next available ID:", error);
    // Fallback: get max ID and add 1
    const maxProduct = await prisma.product.findFirst({
      orderBy: { id: "desc" },
      select: { id: true },
    });
    return maxProduct ? maxProduct.id + 1 : 1;
  }
}

// POST /api/products → add a new product
export async function POST(req: Request) {
  try {
    // Clone the request to read body multiple times if needed
    const body = await req.json();
    const { name, price, costPrice, description, size, category, quantity } =
      body;

    console.log("Creating product with data:", body);

    if (!name || !price || !costPrice || !category) {
      return NextResponse.json(
        { error: "Name, price, costPrice, and category are required" },
        { status: 400 }
      );
    }

    // Find the next available ID
    const nextId = await findNextAvailableId();
    console.log("Next available ID found:", nextId);

    // Try to create product with the found ID
    let newProduct;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      try {
        newProduct = await prisma.product.create({
          data: {
            id: nextId + attempts, // Try ID, then ID+1, ID+2, etc.
            name,
            price: Number(price),
            costPrice: Number(costPrice),
            size: size || null,
            category,
            quantity: quantity ? Number(quantity) : 0,
          },
        });
        break; // Success, exit loop
      } catch (error: any) {
        if (error.code === "P2002" && attempts < maxAttempts - 1) {
          // Duplicate ID, try next number
          attempts++;
          console.log(
            `ID ${nextId + attempts - 1} already exists, trying ID ${
              nextId + attempts
            }...`
          );
          continue;
        } else {
          throw error; // Re-throw other errors or if max attempts reached
        }
      }
    }

    if (!newProduct) {
      throw new Error("Failed to create product after multiple attempts");
    }

    console.log("Product created successfully:", newProduct);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);

    if (error.code === "P2002") {
      // Last resort: find max ID and use that + 1
      try {
        const body = await req.clone().json();
        const maxProduct = await prisma.product.findFirst({
          orderBy: { id: "desc" },
          select: { id: true },
        });

        const lastResortId = maxProduct ? maxProduct.id + 1 : 1;
        console.log("Last resort: using ID", lastResortId);

        const fallbackProduct = await prisma.product.create({
          data: {
            id: lastResortId,
            name: body.name,
            price: Number(body.price),
            costPrice: Number(body.costPrice),
            size: body.size || null,
            category: body.category,
            quantity: body.quantity ? Number(body.quantity) : 0,
          },
        });

        return NextResponse.json(fallbackProduct, { status: 201 });
      } catch (fallbackError: any) {
        return NextResponse.json(
          {
            error: "Critical database issue",
            details: "Multiple ID conflicts detected",
            solution: "Please check your database sequence",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to create product",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
