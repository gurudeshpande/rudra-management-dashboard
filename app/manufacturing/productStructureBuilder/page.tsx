// app/manufacturing/productStructureBuilder/page.tsx
import { ProductStructureBuilder } from "@/components/manufacturing/ProductStructureBuilder";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getData() {
  try {
    const [products, rawMaterials] = await Promise.all([
      prisma.product.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.rawMaterial.findMany({
        select: {
          id: true,
          name: true,
          unit: true,
          quantity: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    // Transform rawMaterials to ensure unit is never null
    const transformedRawMaterials = rawMaterials.map((material) => ({
      ...material,
      unit: material.unit || "pcs", // Provide default value if null
    }));

    return {
      products,
      rawMaterials: transformedRawMaterials,
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      products: [],
      rawMaterials: [],
    };
  }
}

export default async function ProductStructureBuilderPage() {
  const data = await getData();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Product Structure Builder</h1>
        <p className="text-gray-600 mt-2">
          Define how products are made from raw materials
        </p>
      </div>

      <ProductStructureBuilder
        products={data.products}
        rawMaterials={data.rawMaterials}
      />
    </div>
  );
}
