// app/manufacturing/rawmaterialform/page.tsx
import { RawMaterialForm } from "@/components/manufacturing/RawMaterialForm";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getMaterialData(id: string) {
  try {
    const material = await prisma.rawMaterial.findUnique({
      where: { id: parseInt(id) },
    });
    return material;
  } catch (error) {
    console.error("Error fetching material:", error);
    return undefined;
  }
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RawMaterialFormPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const materialId = params.id as string;
  const isEditing = !!materialId;

  const material = isEditing ? await getMaterialData(materialId) : undefined;

  // Placeholder server action
  const handleSubmit = async (data: any) => {
    "use server";
    console.log("Form submitted:", data);
    return { success: true };
  };

  const handleCancel = () => {
    console.log("Form cancelled");
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {isEditing ? "Edit Raw Material" : "Add Raw Material"}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditing
            ? "Update the raw material details and inventory"
            : "Add a new raw material to your inventory"}
        </p>
      </div>

      <div className="max-w-2xl">
        <RawMaterialForm
          material={material || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEditing={isEditing}
        />
      </div>
    </div>
  );
}
