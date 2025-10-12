// components/manufacturing/ManufacturingOverview.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Factory,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface StockAlert {
  materialId: number;
  materialName: string;
  currentStock: number;
  minThreshold: number;
  status: "LOW" | "CRITICAL" | "OK";
}

interface ManufacturingOverviewProps {
  totalRawMaterials: number;
  lowStockAlerts: StockAlert[];
  pendingTransfers: number;
  completedProductions: number;
}

export function ManufacturingOverview({
  totalRawMaterials,
  lowStockAlerts,
  pendingTransfers,
  completedProductions,
}: ManufacturingOverviewProps) {
  const criticalAlerts = lowStockAlerts.filter(
    (alert) => alert.status === "CRITICAL"
  );
  const lowAlerts = lowStockAlerts.filter((alert) => alert.status === "LOW");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Raw Materials</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRawMaterials}</div>
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
            {criticalAlerts.length}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={criticalAlerts.length > 0 ? "destructive" : "outline"}
            >
              Critical: {criticalAlerts.length}
            </Badge>
            <Badge variant={lowAlerts.length > 0 ? "secondary" : "outline"}>
              Low: {lowAlerts.length}
            </Badge>
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
            {pendingTransfers}
          </div>
          <p className="text-xs text-muted-foreground">
            Materials issued to users
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
          <div className="text-2xl font-bold text-green-600">
            {completedProductions}
          </div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>
    </div>
  );
}
