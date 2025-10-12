// app/super-admin/manufacturing/page.tsx
"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ManufacturingOverview } from "@/app/manufacturing/page";
import { RawMaterialsTable } from "@/app/manufacturing/rawMaterialsTable/page";
import { RawMaterialForm } from "@/app/manufacturing/rawMaterialForm/page";
import { ProductStructureBuilder } from "@/app/manufacturing/productStructureBuilder/page";
import { RawMaterialTransfer } from "@/app/manufacturing/RawMaterialTransfer/page";
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
} from "lucide-react";

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

export default function ManufacturingPage() {
  const themeColor = "#954C2E";
  const themeLight = "#F5E9E4";

  const [activeTab, setActiveTab] = useState("overview");
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showTransferHistory, setShowTransferHistory] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch all data in parallel
      const [materialsRes, productsRes, usersRes, transfersRes] =
        await Promise.all([
          fetch("/api/raw-materials"),
          fetch("/api/products"),
          fetch("/api/auth/users"),
          fetch("/api/raw-material-transfers"),
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

  const handleCreateProductStructure = async (
    productId: number,
    items: any[]
  ) => {
    try {
      for (const item of items) {
        const response = await fetch("/api/product-structures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            rawMaterialId: item.rawMaterialId,
            quantityRequired: item.quantityRequired,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create product structure");
        }
      }

      alert("Product structure created successfully!");
      setActiveTab("materials");
      fetchData();
    } catch (error) {
      console.error("Error creating product structure:", error);
      alert("Error creating product structure. Please try again.");
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

  // Calculate stats for overview
  const lowStockMaterials = rawMaterials.filter(
    (material) => material.quantity < 20
  );
  const outOfStockMaterials = rawMaterials.filter(
    (material) => material.quantity === 0
  );
  const totalStockValue = rawMaterials.reduce(
    (sum, material) => sum + material.quantity * 1,
    0
  );

  // Recent transfers for overview
  const recentTransfers = transfers.slice(0, 5);

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border">
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

              <div className="bg-white rounded-xl p-4 shadow-sm border">
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

              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Recent Transfers
                    </p>
                    <p
                      className="text-2xl font-bold mt-1"
                      style={{ color: themeColor }}
                    >
                      {recentTransfers.length}
                    </p>
                  </div>
                  <Truck className="h-8 w-8" style={{ color: themeLight }} />
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Out of Stock
                    </p>
                    <p className="text-2xl font-bold mt-1 text-red-600">
                      {outOfStockMaterials.length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-200" />
                </div>
              </div>
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
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        {lowStockMaterials.length > 5 && (
                          <Button variant="ghost" className="w-full text-sm">
                            View all {lowStockMaterials.length} alerts
                          </Button>
                        )}
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

                {/* Recent Transfers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck
                        className="h-5 w-5"
                        style={{ color: themeColor }}
                      />
                      Recent Transfers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentTransfers.length > 0 ? (
                      <div className="space-y-3">
                        {recentTransfers.map((transfer) => (
                          <div
                            key={transfer.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
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
                                  {transfer.rawMaterial.name}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-sm">
                                {transfer.quantityIssued}{" "}
                                {transfer.rawMaterial.unit}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(
                                  transfer.createdAt
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          className="w-full text-sm"
                          onClick={() => setActiveTab("transfers")}
                        >
                          View all transfers
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">No recent transfers</p>
                        <Button
                          className="mt-2"
                          style={{ backgroundColor: themeColor }}
                          onClick={() => setActiveTab("transfers")}
                        >
                          Create First Transfer
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
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
                onSubmit={handleCreateProductStructure}
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
                                        <th className="text-right p-3 text-sm font-medium">
                                          Time
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
                                            <Badge
                                              variant={
                                                transfer.status === "SENT"
                                                  ? "default"
                                                  : transfer.status === "USED"
                                                  ? "secondary"
                                                  : "outline"
                                              }
                                              style={
                                                transfer.status === "SENT"
                                                  ? {
                                                      backgroundColor:
                                                        themeColor,
                                                    }
                                                  : {}
                                              }
                                              className="capitalize text-white"
                                            >
                                              {transfer.status.toLowerCase()}
                                            </Badge>
                                          </td>
                                          <td className="p-3 text-right text-sm text-gray-500">
                                            {new Date(
                                              transfer.createdAt
                                            ).toLocaleTimeString()}
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
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
