// app/api/product-structures/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET product structures with enhanced data
export async function GET() {
  try {
    const productStructures = await prisma.productStructure.findMany({
      select: {
        id: true,
        productId: true,
        productName: true,
        rawMaterialId: true,
        materialName: true,
        quantityRequired: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: {
            name: true,
            size: true,
            category: true,
          },
        },
        rawMaterial: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { productId: "asc" },
    });

    // Transform data to group by product
    const groupedByProduct = productStructures.reduce((acc, structure) => {
      const productId = structure.productId;

      if (!acc[productId]) {
        acc[productId] = {
          productId: structure.productId,
          productName: structure.productName,
          productDetails: {
            name: structure.product.name,
            size: structure.product.size,
            category: structure.product.category,
          },
          rawMaterials: [],
        };
      }

      acc[productId].rawMaterials.push({
        rawMaterialId: structure.rawMaterialId,
        materialName: structure.materialName,
        quantityRequired: structure.quantityRequired,

        materialDetails: {
          name: structure.rawMaterial.name,
        },
      });

      return acc;
    }, {} as any);

    const result = Object.values(groupedByProduct);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching product structures:", error);
    return NextResponse.json(
      { error: "Failed to fetch product structures" },
      { status: 500 }
    );
  }
}

// POST create multiple product structure items
export async function POST(req: Request) {
  try {
    console.log("🔍 API Route called");

    const body = await req.json();
    console.log("📨 Received request body:", JSON.stringify(body, null, 2));

    const { productId, items } = body;

    console.log("🔍 Validating request data...");
    console.log("📝 productId:", productId, "type:", typeof productId);
    console.log(
      "📝 items:",
      items,
      "type:",
      typeof items,
      "isArray:",
      Array.isArray(items)
    );

    // Enhanced validation with detailed errors
    if (!productId) {
      console.log("❌ Missing productId");
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!items) {
      console.log("❌ Missing items");
      return NextResponse.json(
        { error: "Items array is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(items)) {
      console.log("❌ Items is not an array");
      return NextResponse.json(
        { error: "Items must be an array" },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      console.log("❌ Items array is empty");
      return NextResponse.json(
        { error: "Items array cannot be empty" },
        { status: 400 }
      );
    }

    // Validate and parse data types
    console.log("🔍 Parsing data types...");
    const parsedProductId = parseInt(productId.toString());
    if (isNaN(parsedProductId) || parsedProductId <= 0) {
      console.log("❌ Invalid productId:", productId);
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Validate each item
    console.log("🔍 Validating items...");
    const validatedItems: {
      rawMaterialId: number;
      quantityRequired: number;
    }[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`📦 Item ${i}:`, item);

      if (!item.rawMaterialId) {
        console.log(`❌ Item ${i} missing rawMaterialId`);
        return NextResponse.json(
          { error: `Item ${i} missing rawMaterialId` },
          { status: 400 }
        );
      }

      if (!item.quantityRequired && item.quantityRequired !== 0) {
        console.log(`❌ Item ${i} missing quantityRequired`);
        return NextResponse.json(
          { error: `Item ${i} missing quantityRequired` },
          { status: 400 }
        );
      }

      const rawMaterialId = parseInt(item.rawMaterialId.toString());
      const quantityRequired = parseFloat(item.quantityRequired.toString());

      if (isNaN(rawMaterialId) || rawMaterialId <= 0) {
        console.log(`❌ Item ${i} invalid rawMaterialId:`, item.rawMaterialId);
        return NextResponse.json(
          { error: `Item ${i} has invalid rawMaterialId` },
          { status: 400 }
        );
      }

      if (isNaN(quantityRequired) || quantityRequired <= 0) {
        console.log(
          `❌ Item ${i} invalid quantityRequired:`,
          item.quantityRequired
        );
        return NextResponse.json(
          { error: `Item ${i} has invalid quantityRequired` },
          { status: 400 }
        );
      }

      validatedItems.push({
        rawMaterialId,
        quantityRequired,
      });
    }

    console.log("✅ Data validation passed");
    console.log("🔍 Fetching product details for ID:", parsedProductId);

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: parsedProductId },
      select: {
        id: true,
        name: true,
        size: true,
        category: true,
      },
    });

    if (!product) {
      console.log("❌ Product not found with ID:", parsedProductId);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.log("✅ Product found:", product.name);

    // Continue with the rest of your existing logic...
    // Get raw material details for all items
    const materialIds = validatedItems.map((item) => item.rawMaterialId);
    console.log("🔍 Fetching materials with IDs:", materialIds);

    const rawMaterials = await prisma.rawMaterial.findMany({
      where: {
        id: { in: materialIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log("✅ Materials found:", rawMaterials.length);

    const materialMap = new Map(
      rawMaterials.map((material) => [material.id, material])
    );

    // Check for existing structures
    const existingStructures = await prisma.productStructure.findMany({
      where: { productId: parsedProductId },
      select: { rawMaterialId: true },
    });

    const existingMaterialIds = new Set(
      existingStructures.map((s) => s.rawMaterialId)
    );

    // Check for conflicts
    const conflictingMaterials = validatedItems.filter((item) =>
      existingMaterialIds.has(item.rawMaterialId)
    );

    if (conflictingMaterials.length > 0) {
      console.log("❌ Conflicting materials found:", conflictingMaterials);
      const conflictingMaterialNames = conflictingMaterials.map((item) => {
        const material = materialMap.get(item.rawMaterialId);
        return material ? material.name : `Material ID: ${item.rawMaterialId}`;
      });

      return NextResponse.json(
        {
          error: "Some materials already exist in product structure",
          conflictingMaterials: conflictingMaterialNames,
        },
        { status: 400 }
      );
    }

    // Validate all materials exist
    const missingMaterials = validatedItems.filter(
      (item) => !materialMap.has(item.rawMaterialId)
    );
    if (missingMaterials.length > 0) {
      console.log("❌ Missing materials:", missingMaterials);
      return NextResponse.json(
        {
          error: "Some raw materials not found",
          missingMaterialIds: missingMaterials.map((m) => m.rawMaterialId),
        },
        { status: 404 }
      );
    }

    console.log("✅ All validations passed, creating structures...");

    // Create all product structures in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdStructures = await Promise.all(
        validatedItems.map((item) => {
          const material = materialMap.get(item.rawMaterialId);
          return tx.productStructure.create({
            data: {
              productId: parsedProductId,
              productName: product.name,
              rawMaterialId: item.rawMaterialId,
              materialName: material!.name,
              quantityRequired: item.quantityRequired,
            },
          });
        })
      );

      return createdStructures;
    });

    console.log("✅ Structures created successfully");

    // Format the response
    const formattedResponse = {
      productId: product.id,
      productName: product.name,
      productSize: product.size,
      productCategory: product.category,
      rawMaterials: result.map((structure) => ({
        rawMaterialId: structure.rawMaterialId,
        materialName: structure.materialName,
        quantityRequired: structure.quantityRequired,
      })),
    };

    console.log("📤 Sending response:", formattedResponse);
    return NextResponse.json(formattedResponse, { status: 201 });
  } catch (error) {
    console.error("💥 Unexpected error in POST:", error);
    return NextResponse.json(
      { error: "Failed to create product structure" },
      { status: 500 }
    );
  }
}
