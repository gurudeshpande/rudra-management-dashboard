// app/super-admin/manufacturing/page.tsx
"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { RawMaterialsTable } from "@/components/manufacturing/RawMaterialsTable";
import { RawMaterialForm } from "@/components/manufacturing/RawMaterialForm";
import { ProductStructureBuilder } from "@/components/manufacturing/ProductStructureBuilder";
import { RawMaterialTransfer } from "@/components/manufacturing/RawMaterialTransfer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Settings,
  FileStack,
  Truck,
  Factory,
  ArrowRight,
  Plus,
  TrendingUp,
  AlertTriangle,
  Users,
  CheckCircle2,
  History,
  CheckCircle,
  XCircle,
  Clock,
  Warehouse,
  Calendar,
  Wrench,
  Hammer,
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

interface Product {
  id: number;
  name: string;
  quantity: number;
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

interface ProductTransfer {
  id: number;
  userId: string;
  productId: number;
  quantitySent: number;
  status: "SENT" | "RECEIVED" | "REJECTED" | "CANCELLED";
  notes?: string;
  receivedBy?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
  };
  product: Product;
}

export default function ManufacturingPage() {
  const themeColor = "#954C2E";
  const themeLight = "#F5E9E4";

  const [activeTab, setActiveTab] = useState("overview");
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [productTransfers, setProductTransfers] = useState<ProductTransfer[]>(
    []
  );
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showTransferHistory, setShowTransferHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [repairLoading, setRepairLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch all data in parallel
      const [
        materialsRes,
        productsRes,
        usersRes,
        transfersRes,
        productTransfersRes,
      ] = await Promise.all([
        fetch("/api/raw-materials"),
        fetch("/api/products"),
        fetch("/api/auth/users"),
        fetch("/api/raw-material-transfers"),
        fetch("/api/product-transfers"),
      ]);

      if (materialsRes.ok) {
        const materialsData = await materialsRes.json();
        setRawMaterials(materialsData);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }

      if (transfersRes.ok) {
        const transfersData = await transfersRes.json();
        setTransfers(transfersData);
      }

      if (productTransfersRes.ok) {
        const productTransfersData = await productTransfersRes.json();
        setProductTransfers(productTransfersData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async (materialData: any) => {
    try {
      const response = await fetch("/api/raw-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(materialData),
      });

      if (response.ok) {
        setShowMaterialForm(false);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error("Error adding material:", error);
    }
  };

  const handleEditMaterial = async (materialData: any) => {
    if (!editingMaterial) return;

    try {
      const response = await fetch(`/api/raw-materials/${editingMaterial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(materialData),
      });

      if (response.ok) {
        setEditingMaterial(null);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error("Error updating material:", error);
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const response = await fetch(`/api/raw-materials/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error("Error deleting material:", error);
    }
  };

  const handleSubmitTransfer = async (
    userId: string,
    items: any[],
    notes: string
  ) => {
    try {
      const response = await fetch("/api/raw-material-transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          items,
          notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create transfer");
      }

      const result = await response.json();
      alert("Materials issued successfully!");
      // Refresh data to update stock levels and transfers list
      fetchData();
      return result;
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to create transfer"
      );
      throw error;
    }
  };

  // Repair Functions
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

      await fetchData();
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
    const repairNotes = "Material Repaire Successfully";
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

      await fetchData();
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

  // Product Transfer Functions
  const handleApproveProductTransfer = async (transferId: number) => {
    if (!confirm("Are you sure you want to approve and receive this product?"))
      return;

    setActionLoading(transferId);
    try {
      // First, get the transfer details to know which product and quantity to add
      const transferResponse = await fetch(
        `/api/product-transfers/${transferId}`
      );

      if (!transferResponse.ok) {
        throw new Error("Failed to fetch transfer details");
      }

      const transfer = await transferResponse.json();

      // Now update the product quantity using your API
      const quantityResponse = await fetch(
        `/api/products/${transfer.productId}/quantity`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantityToAdd: transfer.quantitySent,
          }),
        }
      );

      if (!quantityResponse.ok) {
        const errorData = await quantityResponse.json();
        throw new Error(errorData.error || "Failed to update product quantity");
      }

      // Then update the transfer status
      const statusResponse = await fetch(
        `/api/product-transfers/${transferId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "RECEIVED",
            notes: "Product received successfully and added to inventory",
            receivedBy: "Super Admin",
          }),
        }
      );

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        throw new Error(
          errorData.error || "Failed to approve product transfer"
        );
      }

      await fetchData();
      alert(
        `Product received successfully! ${transfer.quantitySent} units added to inventory.`
      );
    } catch (error) {
      console.error("Error approving product transfer:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Error approving product transfer. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectProductTransfer = async (transferId: number) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) {
      alert("Rejection reason is required.");
      return;
    }

    if (!confirm("Are you sure you want to reject this product transfer?"))
      return;

    setActionLoading(transferId);
    try {
      const response = await fetch(`/api/product-transfers/${transferId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "REJECTED",
          notes: reason,
          receivedBy: "Super Admin",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject product transfer");
      }

      await fetchData();
      alert(
        "Product transfer rejected successfully! Materials have been returned to the user."
      );
    } catch (error) {
      console.error("Error rejecting product transfer:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Error rejecting product transfer. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate stats for overview
  const lowStockMaterials = rawMaterials.filter(
    (material) => material.quantity < 20
  );
  const outOfStockMaterials = rawMaterials.filter(
    (material) => material.quantity === 0
  );

  // Product transfer stats
  const pendingProductTransfers = productTransfers.filter(
    (t) => t.status === "SENT"
  );
  const receivedProductTransfers = productTransfers.filter(
    (t) => t.status === "RECEIVED"
  );
  const rejectedProductTransfers = productTransfers.filter(
    (t) => t.status === "REJECTED"
  );

  // Repair stats
  const returnedTransfers = transfers.filter((t) => t.status === "RETURNED");
  const repairingTransfers = transfers.filter((t) => t.status === "REPAIRING");
  const finishedRepairs = transfers.filter((t) => t.status === "FINISHED");

  // Recent transfers for overview
  const recentTransfers = transfers.slice(0, 5);

  const getStatusBadge = (
    status: string,
    type: "rawMaterial" | "product" = "rawMaterial"
  ) => {
    const statusConfig = {
      // Raw Material Statuses
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
      CANCELLED: {
        variant: "outline" as const,
        label: "Cancelled",
        icon: XCircle,
        color: "text-gray-600",
        bgColor: "bg-gray-100 text-gray-800",
      },
      // Product Transfer Statuses
      RECEIVED: {
        variant: "default" as const,
        label: "Received",
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100 text-green-800",
      },
      REJECTED: {
        variant: "destructive" as const,
        label: "Rejected",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-100 text-red-800",
      },
      UNUSED: {
        // NEW: Add UNUSED status
        variant: "destructive" as const,
        label: "Unused - Too Damaged",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-100 text-red-800",
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

      await fetchData();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#954C2E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading manufacturing data...</p>
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
            <div className="flex items-center gap-4 mb-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: themeColor }}
              >
                <Factory className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2
                  className="text-3xl font-bold"
                  style={{ color: themeColor }}
                >
                  Manufacturing Dashboard
                </h2>
                <p className="text-gray-600 mt-1">
                  Manage raw materials, production workflows, and manufacturing
                  operations
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Materials
                    </p>
                    <p
                      className="text-2xl font-bold mt-1"
                      style={{ color: themeColor }}
                    >
                      {rawMaterials.length}
                    </p>
                  </div>
                  <Package className="h-8 w-8" style={{ color: themeLight }} />
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Low Stock
                    </p>
                    <p className="text-2xl font-bold mt-1 text-amber-600">
                      {lowStockMaterials.length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-amber-200" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Pending Products
                    </p>
                    <p className="text-2xl font-bold mt-1 text-blue-600">
                      {pendingProductTransfers.length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Received Products
                    </p>
                    <p className="text-2xl font-bold mt-1 text-green-600">
                      {receivedProductTransfers.length}
                    </p>
                  </div>
                  <Warehouse className="h-8 w-8 text-green-200" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Returned Items
                    </p>
                    <p className="text-2xl font-bold mt-1 text-red-600">
                      {returnedTransfers.length}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-200" />
                </div>
              </div>

              <Link
                href="/super-admin/manufacturing/transfer-history"
                className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="bg-white rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Under Repair
                      </p>
                      <p className="text-2xl font-bold mt-1 text-blue-600">
                        {repairingTransfers.length}
                      </p>
                    </div>
                    <Wrench className="h-8 w-8 text-blue-200" />
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
            <div className="w-full h-full" style={{ color: themeColor }}>
              <Factory className="w-full h-full" />
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start p-2 bg-gray-50 rounded-t-2xl">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
                style={{
                  color: activeTab === "overview" ? themeColor : "inherit",
                }}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="materials"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
                style={{
                  color: activeTab === "materials" ? themeColor : "inherit",
                }}
              >
                <Package className="h-4 w-4 mr-2" />
                Raw Materials
              </TabsTrigger>
              <TabsTrigger
                value="structures"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
                style={{
                  color: activeTab === "structures" ? themeColor : "inherit",
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Product Structures
              </TabsTrigger>
              <TabsTrigger
                value="transfers"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
                style={{
                  color: activeTab === "transfers" ? themeColor : "inherit",
                }}
              >
                <Truck className="h-4 w-4 mr-2" />
                Material Transfers
              </TabsTrigger>
              <TabsTrigger
                value="product-receive"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
                style={{
                  color:
                    activeTab === "product-receive" ? themeColor : "inherit",
                }}
              >
                <Warehouse className="h-4 w-4 mr-2" />
                Product Receive
                {pendingProductTransfers.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-amber-100 text-amber-800"
                  >
                    {pendingProductTransfers.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                  className="border-2 hover:border-[#954C2E] transition-colors cursor-pointer"
                  onClick={() => setActiveTab("materials")}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: themeLight }}
                      >
                        <Package
                          className="h-5 w-5"
                          style={{ color: themeColor }}
                        />
                      </div>
                      Raw Materials
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Manage your raw material inventory, track stock levels,
                      and add new materials
                    </p>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto text-sm group"
                      style={{ color: themeColor }}
                    >
                      Manage inventory
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card
                  className="border-2 hover:border-[#954C2E] transition-colors cursor-pointer"
                  onClick={() => setActiveTab("structures")}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: themeLight }}
                      >
                        <Settings
                          className="h-5 w-5"
                          style={{ color: themeColor }}
                        />
                      </div>
                      Product Structures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Define how products are manufactured from raw materials
                      and create production recipes
                    </p>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto text-sm group"
                      style={{ color: themeColor }}
                    >
                      Build structures
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card
                  className="border-2 hover:border-[#954C2E] transition-colors cursor-pointer"
                  onClick={() => setActiveTab("transfers")}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: themeLight }}
                      >
                        <Truck
                          className="h-5 w-5"
                          style={{ color: themeColor }}
                        />
                      </div>
                      Material Transfers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Issue raw materials to production teams and track material
                      consumption
                    </p>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto text-sm group"
                      style={{ color: themeColor }}
                    >
                      Manage transfers
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>

                <Card
                  className="border-2 hover:border-[#954C2E] transition-colors cursor-pointer"
                  onClick={() => setActiveTab("product-receive")}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: themeLight }}
                      >
                        <Warehouse
                          className="h-5 w-5"
                          style={{ color: themeColor }}
                        />
                      </div>
                      Product Receive
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Receive finished products from manufacturing teams and
                      update inventory
                    </p>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto text-sm group"
                      style={{ color: themeColor }}
                    >
                      Receive products
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity & Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stock Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      Stock Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lowStockMaterials.length > 0 ? (
                      <div className="space-y-3">
                        {lowStockMaterials.slice(0, 5).map((material) => (
                          <div
                            key={material.id}
                            className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                          >
                            <div className="flex items-center gap-3">
                              <Package className="h-4 w-4 text-amber-600" />
                              <span className="font-medium">
                                {material.name}
                              </span>
                            </div>
                            <Badge
                              variant={
                                material.quantity === 0
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {material.quantity === 0
                                ? "Out of Stock"
                                : `${material.quantity} ${material.unit}`}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-gray-600">
                          All materials are well stocked
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pending Product Transfers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Pending Product Receipts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pendingProductTransfers.length > 0 ? (
                      <div className="space-y-3">
                        {pendingProductTransfers.slice(0, 5).map((transfer) => (
                          <div
                            key={transfer.id}
                            className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Users className="h-3 w-3 text-gray-500" />
                                <span className="font-medium text-sm">
                                  {transfer.user.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Package className="h-3 w-3 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                  {transfer.product.name} (
                                  {transfer.quantitySent})
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">
                                {new Date(
                                  transfer.createdAt
                                ).toLocaleDateString()}
                              </div>
                              <Button
                                size="sm"
                                className="mt-1"
                                onClick={() => setActiveTab("product-receive")}
                              >
                                Review
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          className="w-full text-sm"
                          onClick={() => setActiveTab("product-receive")}
                        >
                          View all {pendingProductTransfers.length} pending
                          transfers
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <p className="text-gray-600">
                          No pending product transfers
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Repair Status Section */}
              {/* {(returnedTransfers.length > 0 ||
                repairingTransfers.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-blue-600" />
                      Repair Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {returnedTransfers.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-amber-700 mb-3">
                            Returned Items ({returnedTransfers.length})
                          </h4>
                          <div className="space-y-3">
                            {returnedTransfers.slice(0, 3).map((transfer) => (
                              <div
                                key={transfer.id}
                                className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                              >
                                <div>
                                  <p className="font-medium">
                                    {transfer.rawMaterial.name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    From: {transfer.user.name}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleStartRepair(transfer.id)}
                                  disabled={repairLoading === transfer.id}
                                >
                                  {repairLoading === transfer.id ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Wrench className="h-4 w-4 mr-1" />
                                  )}
                                  Repair
                                </Button>
                              </div>
                            ))}
                            {returnedTransfers.length > 3 && (
                              <Button
                                variant="ghost"
                                className="w-full text-sm"
                                onClick={() => setActiveTab("transfers")}
                              >
                                View all {returnedTransfers.length} returned
                                items
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                     
                      {repairingTransfers.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-blue-700 mb-3">
                            Under Repair ({repairingTransfers.length})
                          </h4>
                          <div className="space-y-3">
                            {repairingTransfers.slice(0, 3).map((transfer) => (
                              <div
                                key={transfer.id}
                                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                              >
                                <div>
                                  <p className="font-medium">
                                    {transfer.rawMaterial.name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    From: {transfer.user.name}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleFinishRepair(transfer.id)
                                  }
                                  disabled={repairLoading === transfer.id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {repairLoading === transfer.id ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                  )}
                                  Finish
                                </Button>
                              </div>
                            ))}
                            {repairingTransfers.length > 3 && (
                              <Button
                                variant="ghost"
                                className="w-full text-sm"
                                onClick={() => setActiveTab("transfers")}
                              >
                                View all {repairingTransfers.length} repairs
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )} */}
            </TabsContent>

            {/* Raw Materials Tab */}
            <TabsContent value="materials" className="p-6 space-y-6">
              {showMaterialForm ? (
                <RawMaterialForm
                  onSubmit={handleAddMaterial}
                  onCancel={() => setShowMaterialForm(false)}
                />
              ) : editingMaterial ? (
                <RawMaterialForm
                  material={editingMaterial}
                  onSubmit={handleEditMaterial}
                  onCancel={() => setEditingMaterial(null)}
                  isEditing
                />
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold">
                        Raw Materials Inventory
                      </h3>
                      <p className="text-gray-600">
                        Manage your manufacturing raw materials
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowMaterialForm(true)}
                      style={{ backgroundColor: themeColor }}
                      className="text-white cursor-pointer"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Material
                    </Button>
                  </div>
                  <RawMaterialsTable
                    materials={rawMaterials}
                    onAddMaterial={() => setShowMaterialForm(true)}
                    onEditMaterial={setEditingMaterial}
                    onDeleteMaterial={handleDeleteMaterial}
                  />
                </>
              )}
            </TabsContent>

            {/* Product Structures Tab */}
            <TabsContent value="structures" className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Product Structures</h3>
                  <p className="text-gray-600">
                    Define how products are made from raw materials
                  </p>
                </div>
              </div>
              <ProductStructureBuilder
                products={products}
                rawMaterials={rawMaterials}
                // onSubmit={handleCreateProductStructure}
              />
            </TabsContent>

            {/* Material Transfers Tab */}
            <TabsContent value="transfers" className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Material Transfers</h3>
                  <p className="text-gray-600">
                    Issue raw materials to production teams and track transfers
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={showTransferHistory ? "outline" : "default"}
                    onClick={() => setShowTransferHistory(false)}
                    style={{
                      backgroundColor: showTransferHistory
                        ? "transparent"
                        : themeColor,
                      color: showTransferHistory ? themeColor : "white",
                    }}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    New Transfer
                  </Button>
                  <Button
                    variant={showTransferHistory ? "default" : "outline"}
                    onClick={() => setShowTransferHistory(true)}
                    style={{
                      backgroundColor: showTransferHistory
                        ? themeColor
                        : "transparent",
                      color: showTransferHistory ? "white" : themeColor,
                    }}
                  >
                    <History className="h-4 w-4 mr-2" />
                    View History
                  </Button>
                </div>
              </div>

              {showTransferHistory ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Transfer History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transfers.length > 0 ? (
                      <div className="space-y-6">
                        {Object.entries(
                          transfers.reduce((acc, transfer) => {
                            const userKey = `${transfer.userId}-${
                              transfer.createdAt.split("T")[0]
                            }`;
                            if (!acc[userKey]) {
                              acc[userKey] = {
                                user: transfer.user,
                                date: transfer.createdAt,
                                transfers: [],
                              };
                            }
                            acc[userKey].transfers.push(transfer);
                            return acc;
                          }, {} as Record<string, { user: any; date: string; transfers: Transfer[] }>)
                        )
                          .sort(
                            ([, a], [, b]) =>
                              new Date(b.date).getTime() -
                              new Date(a.date).getTime()
                          )
                          .map(
                            ([
                              userKey,
                              { user, date, transfers: userTransfers },
                            ]) => (
                              <div key={userKey} className="border rounded-lg">
                                {/* User Header */}
                                <div className="p-4 border-b bg-gray-50">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <Users className="h-5 w-5 text-gray-600" />
                                      <div>
                                        <p className="font-semibold">
                                          {user.name}
                                        </p>
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
                                          <td className="p-3 text-right">
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
                                              <div className="flex flex-col gap-2">
                                                <Button
                                                  size="sm"
                                                  onClick={() =>
                                                    handleStartRepair(
                                                      transfer.id
                                                    )
                                                  }
                                                  disabled={
                                                    repairLoading ===
                                                    transfer.id
                                                  }
                                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                  {repairLoading ===
                                                  transfer.id ? (
                                                    <div className="w-2 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                                                    handleMarkAsUnused(
                                                      transfer.id
                                                    )
                                                  }
                                                  disabled={
                                                    repairLoading ===
                                                    transfer.id
                                                  }
                                                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                                >
                                                  {repairLoading ===
                                                  transfer.id ? (
                                                    <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                                  ) : (
                                                    <XCircle className="h-3 w-3 mr-1" />
                                                  )}
                                                  Unused
                                                </Button>
                                              </div>
                                            )}
                                            {transfer.status ===
                                              "REPAIRING" && (
                                              <Button
                                                size="sm"
                                                onClick={() =>
                                                  handleFinishRepair(
                                                    transfer.id
                                                  )
                                                }
                                                disabled={
                                                  repairLoading === transfer.id
                                                }
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                              >
                                                {repairLoading ===
                                                transfer.id ? (
                                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                  <CheckCircle className="h-3 w-3 mr-1" />
                                                )}
                                                Finish
                                              </Button>
                                            )}
                                            {(transfer.status === "SENT" ||
                                              transfer.status === "USED" ||
                                              transfer.status === "FINISHED" ||
                                              transfer.status === "UNUSED") && ( // UPDATED: Include UNUSED status
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
                      <div className="text-center py-8">
                        <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">
                          No transfer history found
                        </p>
                        <Button
                          className="mt-4"
                          onClick={() => setShowTransferHistory(false)}
                          style={{ backgroundColor: themeColor }}
                        >
                          Create First Transfer
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <RawMaterialTransfer
                  users={users}
                  rawMaterials={rawMaterials}
                  onSubmit={handleSubmitTransfer}
                />
              )}
            </TabsContent>

            {/* Product Receive Tab */}
            <TabsContent value="product-receive" className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Product Receive</h3>
                  <p className="text-gray-600">
                    Review and manage incoming product transfers from
                    manufacturing teams
                  </p>
                </div>
                <Badge variant="outline" className="text-sm">
                  {pendingProductTransfers.length} Pending
                </Badge>
              </div>

              {productTransfers.length > 0 ? (
                <div className="space-y-6">
                  {/* Pending Product Transfers */}
                  {pendingProductTransfers.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-amber-700 mb-4">
                        Pending Receipt ({pendingProductTransfers.length})
                      </h4>
                      <div className="space-y-4">
                        {pendingProductTransfers.map((transfer) => (
                          <Card
                            key={transfer.id}
                            className="border-2 border-amber-200"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-4">
                                    <Package className="h-6 w-6 text-amber-600" />
                                    <div>
                                      <h3 className="font-semibold text-lg">
                                        {transfer.product.name}
                                      </h3>
                                      <p className="text-sm text-gray-600">
                                        From: {transfer.user.name} (
                                        {transfer.user.email})
                                      </p>
                                    </div>
                                    {getStatusBadge(transfer.status, "product")}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        Quantity Sent:{" "}
                                      </span>
                                      <Badge variant="outline">
                                        {transfer.quantitySent}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-gray-400" />
                                      <span className="text-gray-600">
                                        {formatDate(transfer.createdAt)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        Current Stock:{" "}
                                      </span>
                                      <Badge variant="secondary">
                                        {transfer.product.quantity}
                                      </Badge>
                                    </div>
                                  </div>

                                  {transfer.notes && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                      <span className="font-medium">
                                        Transfer Notes:{" "}
                                      </span>
                                      <span className="text-gray-600">
                                        {transfer.notes}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col gap-2 ml-6 min-w-[140px]">
                                  <Button
                                    onClick={() =>
                                      handleApproveProductTransfer(transfer.id)
                                    }
                                    disabled={actionLoading === transfer.id}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {actionLoading === transfer.id ? (
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                    )}
                                    {actionLoading === transfer.id
                                      ? "Processing..."
                                      : "Approve"}
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleRejectProductTransfer(transfer.id)
                                    }
                                    disabled={actionLoading === transfer.id}
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Received Product Transfers */}
                  {receivedProductTransfers.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-green-700 mb-4">
                        Received Products ({receivedProductTransfers.length})
                      </h4>
                      <div className="space-y-4">
                        {receivedProductTransfers.map((transfer) => (
                          <Card
                            key={transfer.id}
                            className="border-2 border-green-200"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-4">
                                    <Package className="h-6 w-6 text-green-600" />
                                    <div>
                                      <h3 className="font-semibold text-lg">
                                        {transfer.product.name}
                                      </h3>
                                      <p className="text-sm text-gray-600">
                                        From: {transfer.user.name}
                                      </p>
                                    </div>
                                    {getStatusBadge(transfer.status, "product")}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">
                                        Quantity:{" "}
                                      </span>
                                      <span className="text-gray-600">
                                        {transfer.quantitySent}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Received On:{" "}
                                      </span>
                                      <span className="text-gray-600">
                                        {transfer.receivedAt
                                          ? formatDate(transfer.receivedAt)
                                          : "N/A"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Received By:{" "}
                                      </span>
                                      <span className="text-gray-600">
                                        {transfer.receivedBy || "Super Admin"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Sent On:{" "}
                                      </span>
                                      <span className="text-gray-600">
                                        {formatDate(transfer.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rejected Product Transfers */}
                  {rejectedProductTransfers.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-red-700 mb-4">
                        Rejected Products ({rejectedProductTransfers.length})
                      </h4>
                      <div className="space-y-4">
                        {rejectedProductTransfers.map((transfer) => (
                          <Card
                            key={transfer.id}
                            className="border-2 border-red-200"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-4">
                                    <Package className="h-6 w-6 text-red-600" />
                                    <div>
                                      <h3 className="font-semibold text-lg">
                                        {transfer.product.name}
                                      </h3>
                                      <p className="text-sm text-gray-600">
                                        From: {transfer.user.name}
                                      </p>
                                    </div>
                                    {getStatusBadge(transfer.status, "product")}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                                    <div>
                                      <span className="font-medium">
                                        Quantity:{" "}
                                      </span>
                                      <span className="text-gray-600">
                                        {transfer.quantitySent}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Rejected On:{" "}
                                      </span>
                                      <span className="text-gray-600">
                                        {transfer.receivedAt
                                          ? formatDate(transfer.receivedAt)
                                          : "N/A"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Rejected By:{" "}
                                      </span>
                                      <span className="text-gray-600">
                                        {transfer.receivedBy || "Super Admin"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Sent On:{" "}
                                      </span>
                                      <span className="text-gray-600">
                                        {formatDate(transfer.createdAt)}
                                      </span>
                                    </div>
                                  </div>

                                  {transfer.notes && (
                                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                      <span className="font-medium text-red-800">
                                        Rejection Reason:{" "}
                                      </span>
                                      <span className="text-red-700">
                                        {transfer.notes}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Warehouse className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Product Transfers
                  </h3>
                  <p className="text-gray-600">
                    No product transfers have been sent to you yet.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
