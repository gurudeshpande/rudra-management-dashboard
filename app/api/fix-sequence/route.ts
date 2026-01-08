import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Get the current max ID
    const maxProduct = await prisma.product.findFirst({
      orderBy: { id: "desc" },
      select: { id: true },
    });

    const maxId = maxProduct?.id || 0;
    const nextId = maxId + 1;

    // Update all products to have sequential IDs if needed
    const allProducts = await prisma.product.findMany({
      orderBy: { id: "asc" },
      select: { id: true },
    });

    let hasGaps = false;
    for (let i = 0; i < allProducts.length; i++) {
      if (allProducts[i].id !== i + 1) {
        hasGaps = true;
        break;
      }
    }

    // If there are gaps, we need to re-sequence
    if (hasGaps) {
      console.log("Found gaps in ID sequence, fixing...");

      // Create a temporary table approach
      // This is a workaround since Prisma doesn't support sequence management directly
      const tempProducts = await prisma.product.findMany({
        orderBy: { createdAt: "asc" },
      });

      // Delete all (if you can, otherwise you need a different approach)
      console.warn(
        "Database needs manual sequence fix. Please run SQL directly."
      );

      return NextResponse.json({
        success: false,
        message: "Database sequence has gaps",
        solution: "Run this SQL in your database:",
        sql: `
          -- Create sequence
          CREATE SEQUENCE IF NOT EXISTS product_id_seq;
          
          -- Reset it to max(id) + 1
          SELECT setval('product_id_seq', COALESCE((SELECT MAX(id) FROM "Product"), 0) + 1);
          
          -- Link to table
          ALTER TABLE "Product" ALTER COLUMN id SET DEFAULT nextval('product_id_seq');
        `,
        currentMaxId: maxId,
        nextExpectedId: nextId,
      });
    }

    return NextResponse.json({
      success: true,
      message: "ID sequence appears to be sequential",
      currentMaxId: maxId,
      nextExpectedId: nextId,
      productCount: allProducts.length,
    });
  } catch (error: any) {
    console.error("Error fixing sequence:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to analyze sequence",
        details: error.message,
        manualFix:
          "Run this SQL: CREATE SEQUENCE IF NOT EXISTS product_id_seq; SELECT setval('product_id_seq', COALESCE((SELECT MAX(id) FROM 'Product'), 0) + 1);",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Diagnostic endpoint
    const maxProduct = await prisma.product.findFirst({
      orderBy: { id: "desc" },
      select: { id: true },
    });

    const minProduct = await prisma.product.findFirst({
      orderBy: { id: "asc" },
      select: { id: true },
    });

    const count = await prisma.product.count();

    const allIds = await prisma.product.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
    });

    const idList = allIds.map((p) => p.id);
    const hasGaps = idList.some((id, index) => id !== index + 1);

    return NextResponse.json({
      diagnostic: "Product ID Sequence",
      count,
      minId: minProduct?.id,
      maxId: maxProduct?.id,
      nextExpectedId: maxProduct ? maxProduct.id + 1 : 1,
      idSequence: idList,
      hasGaps,
      status: hasGaps ? "NEEDS_FIX" : "OK",
      fixRequired: hasGaps ? "Run POST /api/fix-sequence" : "No action needed",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Diagnostic failed", details: error.message },
      { status: 500 }
    );
  }
}
