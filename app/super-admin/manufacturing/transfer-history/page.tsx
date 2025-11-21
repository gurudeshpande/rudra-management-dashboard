// app/super-admin/manufacturing/transfer-history/page.tsx
"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Users,
  Package,
  ArrowLeft,
  Download,
  Filter,
  Wrench,
  CheckCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface RawMaterial {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

interface Transfer {
  id: number;
  userId: string;
  rawMaterialId: number;
  quantityIssued: number;
  status: string;
  notes?: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  rawMaterial: RawMaterial;
}

export default function TransferHistoryPage() {
  const themeColor = "#954C2E";
  const themeLight = "#F5E9E4";

  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [repairLoading, setRepairLoading] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/raw-material-transfers");

      if (response.ok) {
        const transfersData = await response.json();
        setTransfers(transfersData);
      }
    } catch (error) {
      console.error("Error fetching transfers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRepair = async (transferId: number) => {
    if (!confirm("Are you sure you want to start repairing this material?"))
      return;

    setRepairLoading(transferId);
    try {
      const response = await fetch(
        `/api/raw-material-transfers/${transferId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "REPAIRING",
            notes: "Material under repair",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start repair");
      }

      await fetchTransfers();
      alert("Repair started successfully!");
    } catch (error) {
      console.error("Error starting repair:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Error starting repair. Please try again."
      );
    } finally {
      setRepairLoading(null);
    }
  };

  const handleFinishRepair = async (transferId: number) => {
    const repairNotes = "Material Repaired Successfully";
    if (!repairNotes) {
      alert("Repair completion notes are required.");
      return;
    }

    if (!confirm("Are you sure you want to mark this repair as finished?"))
      return;

    setRepairLoading(transferId);
    try {
      const response = await fetch(
        `/api/raw-material-transfers/${transferId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "FINISHED",
            notes: repairNotes,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to finish repair");
      }

      await fetchTransfers();
      alert("Repair marked as finished successfully!");
    } catch (error) {
      console.error("Error finishing repair:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Error finishing repair. Please try again."
      );
    } finally {
      setRepairLoading(null);
    }
  };

  const handleMarkAsUnused = async (transferId: number) => {
    if (
      !confirm(
        "Are you sure you want to mark this as unused? The product is too damaged and cannot be repaired."
      )
    )
      return;

    setRepairLoading(transferId);
    try {
      const response = await fetch(
        `/api/raw-material-transfers/${transferId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "UNUSED",
            notes: "Product is too damaged and cannot be repaired",
            rejectionReason: "Product is too damaged",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark as unused");
      }

      await fetchTransfers();
      alert("Item marked as unused successfully!");
    } catch (error) {
      console.error("Error marking item as unused:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Error marking as unused. Please try again."
      );
    } finally {
      setRepairLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SENT: {
        variant: "secondary" as const,
        label: "Pending Approval",
        icon: Clock,
        color: "text-amber-600",
        bgColor: "bg-amber-100 text-amber-800",
      },
      USED: {
        variant: "default" as const,
        label: "Approved & Used",
        icon: CheckCircle2,
        color: "text-green-600",
        bgColor: "bg-green-100 text-green-800",
      },
      RETURNED: {
        variant: "destructive" as const,
        label: "Returned",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-100 text-red-800",
      },
      REPAIRING: {
        variant: "secondary" as const,
        label: "Repairing",
        icon: Wrench,
        color: "text-blue-600",
        bgColor: "bg-blue-100 text-blue-800",
      },
      FINISHED: {
        variant: "default" as const,
        label: "Repair Finished",
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100 text-green-800",
      },
      UNUSED: {
        // NEW: Add UNUSED status
        variant: "destructive" as const,
        label: "Unused - Too Damaged",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-100 text-red-800",
      },
      CANCELLED: {
        variant: "outline" as const,
        label: "Cancelled",
        icon: XCircle,
        color: "text-gray-600",
        bgColor: "bg-gray-100 text-gray-800",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.SENT;
    const IconComponent = config.icon;

    return (
      <Badge
        variant={config.variant}
        className={`capitalize ${config.bgColor}`}
      >
        <IconComponent className={`h-3 w-3 mr-1 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter transfers to only show RETURNED and FINISHED status
  const filteredTransfers = transfers.filter((transfer) =>
    filterStatus === "all"
      ? transfer.status === "RETURNED" ||
        transfer.status === "REPAIRING" ||
        transfer.status === "FINISHED" ||
        transfer.status === "UNUSED" // ADD UNUSED to all filter
      : transfer.status === filterStatus
  );

  // Group transfers by user and date
  const groupedTransfers = filteredTransfers.reduce((acc, transfer) => {
    const userKey = `${transfer.userId}-${transfer.createdAt.split("T")[0]}`;
    if (!acc[userKey]) {
      acc[userKey] = {
        user: transfer.user,
        date: transfer.createdAt,
        transfers: [],
      };
    }
    acc[userKey].transfers.push(transfer);
    return acc;
  }, {} as Record<string, { user: any; date: string; transfers: Transfer[] }>);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#954C2E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transfer history...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div
          className="relative rounded-2xl p-6 overflow-hidden"
          style={{ backgroundColor: themeLight }}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Link href="/super-admin/manufacturing">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Manufacturing
                  </Button>
                </Link>
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: themeColor }}
                >
                  <Truck className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2
                    className="text-3xl font-bold"
                    style={{ color: themeColor }}
                  >
                    Material Transfer History
                  </h2>
                  <p className="text-gray-600 mt-1">
                    View and manage returned and repaired materials
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  // Export functionality can be added here
                  alert("Export functionality coming soon!");
                }}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>

            {/* Quick Stats - Only showing Returned, Under Repair, and Repaired */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Returned
                    </p>
                    <p className="text-2xl font-bold mt-1 text-red-600">
                      {transfers.filter((t) => t.status === "RETURNED").length}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-200" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Under Repair
                    </p>
                    <p className="text-2xl font-bold mt-1 text-blue-600">
                      {transfers.filter((t) => t.status === "REPAIRING").length}
                    </p>
                  </div>
                  <Wrench className="h-8 w-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Repaired
                    </p>
                    <p className="text-2xl font-bold mt-1 text-green-600">
                      {transfers.filter((t) => t.status === "FINISHED").length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-200" />
                </div>
              </div>

              {/* NEW: Unused Items Stat */}
              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Unused Items
                    </p>
                    <p className="text-2xl font-bold mt-1 text-purple-600">
                      {transfers.filter((t) => t.status === "UNUSED").length}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-purple-200" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Returned & Repaired Materials</CardTitle>

              {/* Filter Controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="RETURNED">Returned</option>
                    <option value="REPAIRING">Under Repair</option>
                    <option value="FINISHED">Repaired</option>
                    <option value="UNUSED">Unused</option>{" "}
                    {/* NEW: Add UNUSED option */}
                  </select>
                </div>

                <Link href="/super-admin/manufacturing?tab=transfers">
                  <Button style={{ backgroundColor: themeColor }}>
                    <Truck className="h-4 w-4 mr-2" />
                    New Transfer
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {Object.entries(groupedTransfers).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedTransfers)
                  .sort(
                    ([, a], [, b]) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  .map(
                    ([userKey, { user, date, transfers: userTransfers }]) => (
                      <div key={userKey} className="border rounded-lg">
                        {/* User Header */}
                        <div className="p-4 border-b bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Users className="h-5 w-5 text-gray-600" />
                              <div>
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-sm text-gray-600">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-600">
                                {new Date(date).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {userTransfers.length} items
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Materials Table */}
                        <div className="overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-gray-50">
                                <th className="text-left p-3 text-sm font-medium">
                                  Material
                                </th>
                                <th className="text-center p-3 text-sm font-medium">
                                  Quantity
                                </th>
                                <th className="text-center p-3 text-sm font-medium">
                                  Status
                                </th>
                                <th className="text-center p-3 text-sm font-medium">
                                  Comments
                                </th>
                                <th className="text-right p-3 text-sm font-medium">
                                  Date & Time
                                </th>
                                <th className="text-center p-3 text-sm font-medium">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {userTransfers.map((transfer) => (
                                <tr
                                  key={transfer.id}
                                  className="border-b last:border-b-0 hover:bg-gray-50"
                                >
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <Package className="h-4 w-4 text-gray-400" />
                                      <span className="font-medium">
                                        {transfer.rawMaterial.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    <Badge variant="outline">
                                      {transfer.quantityIssued}{" "}
                                      {transfer.rawMaterial.unit}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-center">
                                    {getStatusBadge(transfer.status)}
                                  </td>

                                  <td className="p-3 max-w-xs">
                                    {transfer.notes ? (
                                      <div className="text-sm text-gray-600">
                                        <div className="flex items-start gap-2">
                                          <span className="flex-shrink-0 mt-0.5">
                                            📝
                                          </span>
                                          <span className="break-words">
                                            {transfer.notes}
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-400 italic">
                                        No Comments
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="text-sm text-gray-500 space-y-1">
                                      <div>
                                        {new Date(
                                          transfer.createdAt
                                        ).toLocaleDateString()}
                                      </div>
                                      <div className="text-xs">
                                        {new Date(
                                          transfer.createdAt
                                        ).toLocaleTimeString()}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    {transfer.status === "RETURNED" && (
                                      <div className="flex flex-col gap-2 min-w-[120px]">
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            handleStartRepair(transfer.id)
                                          }
                                          disabled={
                                            repairLoading === transfer.id
                                          }
                                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                        >
                                          {repairLoading === transfer.id ? (
                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <Wrench className="h-3 w-3 mr-1" />
                                          )}
                                          Repair
                                        </Button>

                                        {/* NEW: Unused Button */}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleMarkAsUnused(transfer.id)
                                          }
                                          disabled={
                                            repairLoading === transfer.id
                                          }
                                          className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 text-xs"
                                        >
                                          {repairLoading === transfer.id ? (
                                            <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <XCircle className="h-3 w-3 mr-1" />
                                          )}
                                          Mark as Unused
                                        </Button>
                                      </div>
                                    )}
                                    {transfer.status === "REPAIRING" && (
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleFinishRepair(transfer.id)
                                        }
                                        disabled={repairLoading === transfer.id}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        {repairLoading === transfer.id ? (
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                        )}
                                        Finish
                                      </Button>
                                    )}
                                    {(transfer.status === "FINISHED" ||
                                      transfer.status === "UNUSED") && (
                                      <span className="text-sm text-gray-500">
                                        No actions
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Returned, Repaired, or Unused Materials
                </h3>
                <p className="text-gray-600 mb-6">
                  {filterStatus === "all"
                    ? "No returned, repaired, or unused materials found."
                    : `No materials found with status: ${filterStatus}`}
                </p>
                <Link href="/super-admin/manufacturing?tab=transfers">
                  <Button style={{ backgroundColor: themeColor }}>
                    <Truck className="h-4 w-4 mr-2" />
                    Create New Transfer
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
