import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

interface StockAlert {
  materialId: number;
  materialName: string;
  currentStock: number;
  minThreshold: number;
  status: "LOW" | "CRITICAL" | "OK";
}

// Remove the ManufacturingPageProps interface and use the correct one
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Mock data - replace with your actual data fetching
const getManufacturingData = async () => {
  return {
    totalRawMaterials: 42,
    lowStockAlerts: [
      {
        materialId: 1,
        materialName: "Steel",
        currentStock: 5,
        minThreshold: 10,
        status: "LOW" as const,
      },
      {
        materialId: 2,
        materialName: "Copper",
        currentStock: 2,
        minThreshold: 8,
        status: "CRITICAL" as const,
      },
    ],
    pendingTransfers: 3,
    completedProductions: 15,
  };
};

export default async function ManufacturingPage({ searchParams }: PageProps) {
  // Await the searchParams Promise (this is correct for Next.js 15)
  const params = await searchParams;
  const data = await getManufacturingData();

  const criticalAlerts = data.lowStockAlerts.filter(
    (alert) => alert.status === "CRITICAL"
  );
  const lowAlerts = data.lowStockAlerts.filter(
    (alert) => alert.status === "LOW"
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Manufacturing Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Raw Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalRawMaterials}</div>
            <p className="text-xs text-muted-foreground">
              Total materials in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {criticalAlerts.length + lowAlerts.length}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {criticalAlerts.length} critical, {lowAlerts.length} low
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Transfers
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.pendingTransfers}
            </div>
            <p className="text-xs text-muted-foreground">
              Transfers awaiting action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Productions
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.completedProductions}
            </div>
            <p className="text-xs text-muted-foreground">
              Productions completed
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
