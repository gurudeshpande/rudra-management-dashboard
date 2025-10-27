// app/manufacturing/page.tsx
import { RawMaterialTransfer } from "@/components/manufacturing/RawMaterialTransfer";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getData() {
  try {
    const [users, rawMaterials] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true, // ← MAKE SURE THIS IS INCLUDED
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.rawMaterial.findMany({
        select: {
          id: true,
          name: true,
          quantity: true,
          unit: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    return {
      users, // This should now include role
      rawMaterials: rawMaterials.map((material) => ({
        ...material,
        unit: material.unit || "pcs",
      })),
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      users: [],
      rawMaterials: [],
    };
  }
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ManufacturingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getData();

  const safeUsers = (data.users || []).map((u: any) => ({
    id: u.id,
    name: u.name ?? "",
    email: u.email,
    role: u.role ?? "USER", // adjust default to match your User.role union if needed
  }));

  const handleSubmit = async (userId: string, items: any[], notes: string) => {
    "use server";
    // ... your submit logic
  };

  return (
    <div className="p-6">
      {/* ... your header ... */}
      <RawMaterialTransfer
        users={safeUsers}
        rawMaterials={data.rawMaterials}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
