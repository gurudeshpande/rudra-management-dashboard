// app/manufacturing/rawMaterialsTable/page.tsx
import { RawMaterialsTable } from "@/components/manufacturing/RawMaterialsTable";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getRawMaterials() {
  try {
    const materials = await prisma.rawMaterial.findMany({
      orderBy: {
        name: "asc",
      },
    });

    // Transform the data to match your interface
    return materials.map((material) => ({
      ...material,
      unit: material.unit || "pcs", // Provide default value if null
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching raw materials:", error);
    return [];
  }
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RawMaterialsTablePage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const materials = await getRawMaterials();

  // Mock handlers - you'll implement these based on your routing
  const handleAddMaterial = () => {
    console.log("Add material clicked");
    // Typically you would redirect to the form page
    // window.location.href = '/manufacturing/rawmaterialform';
  };

  const handleEditMaterial = (material: any) => {
    console.log("Edit material:", material);
    // Typically you would redirect to the form page with the material ID
    // window.location.href = `/manufacturing/rawmaterialform?id=${material.id}`;
  };

  const handleDeleteMaterial = async (id: number) => {
    console.log("Delete material:", id);
    // Implement your delete logic here
    if (confirm("Are you sure you want to delete this material?")) {
      try {
        const response = await fetch(`/api/raw-materials/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          console.log("Material deleted successfully");
          // Refresh the page or update the data
          window.location.reload();
        } else {
          alert("Failed to delete material");
        }
      } catch (error) {
        console.error("Error deleting material:", error);
        alert("Error deleting material");
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Raw Materials Management</h1>
        <p className="text-gray-600 mt-2">
          View and manage all raw materials in your inventory
        </p>
      </div>

      <RawMaterialsTable
        materials={materials}
        onAddMaterial={handleAddMaterial}
        onEditMaterial={handleEditMaterial}
        onDeleteMaterial={handleDeleteMaterial}
      />
    </div>
  );
}
