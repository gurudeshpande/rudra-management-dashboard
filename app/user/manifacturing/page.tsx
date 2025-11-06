"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Factory,
  History,
  User,
  Calendar,
  Send,
  Plus,
  Warehouse,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RawMaterial {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

interface Product {
  id: number;
  name: string;
  size: string;
  price: number;
  category: string;
  quantity: number;
}

interface Transfer {
  id: number;
  userId: string;
  rawMaterialId: number;
  quantityIssued: number;
  status: "SENT" | "USED" | "RETURNED" | "CANCELLED";
  notes?: string;
  // New fields
  quantityRejected?: number;
  quantityApproved?: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function UserManufacturingPage() {
  const themeColor = "#954C2E";
  const themeLight = "#F5E9E4";
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("pending");
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [productTransfers, setProductTransfers] = useState<ProductTransfer[]>(
    []
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(
    null
  );
  const [rejectQuantity, setRejectQuantity] = useState<number>(0);
  const [rejectionType, setRejectionType] = useState<string>("damaged");
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // New state for product transfer
  const [showSendProductDialog, setShowSendProductDialog] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [sendQuantity, setSendQuantity] = useState<number>(1);
  const [sendNotes, setSendNotes] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [requiredMaterials, setRequiredMaterials] = useState<any[]>([]);

  // Get JWT token from localStorage
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  // Get user data from localStorage
  const getUserFromStorage = () => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      const storedUser = getUserFromStorage();

      if (storedUser) {
        setCurrentUser(storedUser);
      }

      if (!token) {
        setError("Please log in to access this page");
        setLoading(false);
        router.push("/login");
        return;
      }

      // Get current user with JWT token from API
      const userRes = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = await userRes.json();

      if (!userRes.ok) {
        if (userRes.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setError("Session expired. Please log in again.");
          router.push("/login");
          return;
        }
        throw new Error(userData.message || "Failed to fetch user data");
      }

      if (!userData.user) {
        throw new Error("No user data received from server");
      }

      setCurrentUser(userData.user);

      // Fetch all transfers
      const [transfersRes, productTransfersRes, productsRes] =
        await Promise.all([
          fetch("/api/raw-material-transfers", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/product-transfers?userId=${userData.user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/products", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      if (!transfersRes.ok)
        throw new Error("Failed to fetch raw material transfers");
      if (!productTransfersRes.ok)
        throw new Error("Failed to fetch product transfers");
      if (!productsRes.ok) throw new Error("Failed to fetch products");

      const allTransfers = await transfersRes.json();
      const allProductTransfers = await productTransfersRes.json();
      const allProducts = await productsRes.json();

      // Filter transfers for current user
      const userTransfers = allTransfers.filter(
        (transfer: Transfer) => transfer.userId === userData.user.id
      );

      setTransfers(userTransfers);
      setProductTransfers(allProductTransfers);
      setProducts(allProducts);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Raw Material Transfer Functions (existing)
  const handleApproveTransfer = async (transferId: number) => {
    if (
      !confirm(
        "Are you sure you want to approve and mark this material as used?"
      )
    )
      return;

    setActionLoading(transferId);
    try {
      const token = getToken();
      if (!token) {
        alert("Please log in again");
        router.push("/login");
        return;
      }

      const response = await fetch(
        `/api/raw-material-transfers/${transferId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "USED",
            notes: "Material approved and marked as used",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Failed to approve transfer"
        );
      }

      await fetchData();
      alert(
        "Transfer approved successfully! Material added to your inventory."
      );
    } catch (error) {
      console.error("Error approving transfer:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Error approving transfer. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectTransfer = async (transferId: number) => {
    if (rejectQuantity < 0) {
      alert("Reject quantity cannot be negative");
      return;
    }

    if (rejectQuantity > selectedTransfer!.quantityIssued) {
      alert(
        `Cannot reject more than ${selectedTransfer!.quantityIssued} ${
          selectedTransfer!.rawMaterial.unit
        }`
      );
      return;
    }

    if (!rejectNotes.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    setActionLoading(transferId);
    try {
      const token = getToken();
      if (!token) {
        alert("Please log in again");
        router.push("/login");
        return;
      }

      const response = await fetch(
        `/api/raw-material-transfers/${transferId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "RETURNED",
            quantityReturned: rejectQuantity,
            rejectionType: rejectionType,
            notes: rejectNotes,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Failed to reject transfer"
        );
      }

      setShowRejectDialog(false);
      setRejectNotes("");
      setRejectQuantity(0);
      setRejectionType("damaged");
      setSelectedTransfer(null);
      await fetchData();

      // Show appropriate success message
      if (rejectQuantity === 0) {
        alert("Materials have been added to your inventory!");
      } else if (rejectQuantity === selectedTransfer!.quantityIssued) {
        alert("Materials have been returned to main inventory!");
      } else {
        alert(
          "Product transfer rejected successfully! Raw materials have been returned to your inventory."
        );
      }
    } catch (error) {
      console.error("Error rejecting transfer:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Error rejecting transfer. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // New Product Transfer Functions
  const handleSendProduct = async () => {
    if (!selectedProductId || !sendQuantity || sendQuantity <= 0) {
      alert("Please select a product and enter a valid quantity");
      return;
    }

    const selectedProduct = products.find((p) => p.id === selectedProductId);
    if (!selectedProduct) {
      alert("Selected product not found");
      return;
    }

    if (
      !confirm(`Send ${sendQuantity} ${selectedProduct.name} to Super Admin?`)
    ) {
      return;
    }

    setActionLoading(-1); // Use -1 for product transfer action
    try {
      const token = getToken();
      if (!token) {
        alert("Please log in again");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/product-transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          productId: selectedProductId,
          quantitySent: sendQuantity,
          notes: sendNotes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Failed to send product"
        );
      }

      setShowSendProductDialog(false);
      setSelectedProductId("");
      setSendQuantity(1);
      setSendNotes("");
      await fetchData();
      alert(
        "Product sent successfully to Super Admin! Raw materials have been deducted from your inventory."
      );
    } catch (error) {
      console.error("Error sending product:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Error sending product. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const fetchProductRequirements = async (
    productId: number,
    quantity: number
  ) => {
    try {
      const response = await fetch(
        `/api/products/${productId}/structure?quantity=${quantity}`
      );
      if (response.ok) {
        const data = await response.json();
        setRequiredMaterials(data.requiredMaterials || []);
      } else {
        setRequiredMaterials([]);
      }
    } catch (error) {
      console.error("Error fetching product requirements:", error);
      setRequiredMaterials([]);
    }
  };

  // Update when product or quantity changes
  useEffect(() => {
    if (selectedProductId && sendQuantity > 0) {
      fetchProductRequirements(selectedProductId, sendQuantity);
    } else {
      setRequiredMaterials([]);
    }
  }, [selectedProductId, sendQuantity]);

  const openRejectDialog = (transfer: Transfer) => {
    setSelectedTransfer(transfer);
    setRejectQuantity(transfer.quantityIssued);
    setRejectionType("damaged");
    setRejectNotes("");
    setShowRejectDialog(true);
  };

  const cancelReject = () => {
    setShowRejectDialog(false);
    setRejectNotes("");
    setRejectQuantity(0);
    setRejectionType("damaged");
    setSelectedTransfer(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Filter transfers based on status
  const pendingTransfers = transfers.filter((t) => t.status === "SENT");
  const approvedTransfers = transfers.filter((t) => t.status === "USED");
  const rejectedTransfers = transfers.filter((t) => t.status === "RETURNED");

  const pendingProductTransfers = productTransfers.filter(
    (t) => t.status === "SENT"
  );
  const receivedProductTransfers = productTransfers.filter(
    (t) => t.status === "RECEIVED"
  );
  const rejectedProductTransfers = productTransfers.filter(
    (t) => t.status === "REJECTED"
  );

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
        label: "Rejected & Returned",
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
      // Product Transfer Statuses
      RECEIVED: {
        variant: "default" as const,
        label: "Received by Super Admin",
        icon: CheckCircle2,
        color: "text-green-600",
        bgColor: "bg-green-100 text-green-800",
      },
      REJECTED: {
        variant: "destructive" as const,
        label: "Rejected by Super Admin",
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
            <p className="text-gray-600">
              Loading your manufacturing dashboard...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && transfers.length === 0 && productTransfers.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Data
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={fetchData}
              style={{ backgroundColor: themeColor }}
              className="mr-2"
            >
              Try Again
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Go to Login
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {requiredMaterials.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-sm mb-2 text-blue-800">
            Raw Materials That Will Be Deducted:
          </h4>
          <div className="text-sm space-y-1">
            {requiredMaterials.map((material, index) => (
              <div key={index} className="flex justify-between">
                <span>{material.materialName}:</span>
                <span className="font-medium">
                  {material.quantityRequired} {material.unit}
                  <span className="text-blue-600 ml-1">
                    ({material.perUnit} per unit)
                  </span>
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Note: Only raw materials will be deducted from your inventory.
            Product quantity remains unchanged.
          </p>
        </div>
      )}
      <div className="space-y-6">
        {/* Header Section */}
        <div
          className="relative rounded-2xl p-6 overflow-hidden"
          style={{ backgroundColor: themeLight }}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
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
                    Manage incoming raw materials and send finished products to
                    Super Admin
                  </p>
                </div>
              </div>
            </div>

            {/* User Info */}
            {currentUser && (
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border mb-6">
                <User className="h-5 w-5" style={{ color: themeColor }} />
                <div>
                  <p className="font-semibold">{currentUser.name}</p>
                  <p className="text-sm text-gray-600">{currentUser.email}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {currentUser.role.toLowerCase()}
                  </p>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <p className="text-amber-800">{error}</p>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Pending Materials
                    </p>
                    <p className="text-2xl font-bold mt-1 text-amber-600">
                      {pendingTransfers.length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-200" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Approved Materials
                    </p>
                    <p className="text-2xl font-bold mt-1 text-green-600">
                      {approvedTransfers.length}
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-200" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Rejected Materials
                    </p>
                    <p className="text-2xl font-bold mt-1 text-red-600">
                      {rejectedTransfers.length}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-200" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Sent Products
                    </p>
                    <p className="text-2xl font-bold mt-1 text-blue-600">
                      {pendingProductTransfers.length}
                    </p>
                  </div>
                  <Send className="h-8 w-8 text-blue-200" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border">
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

              <div className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Products
                    </p>
                    <p
                      className="text-2xl font-bold mt-1"
                      style={{ color: themeColor }}
                    >
                      {products.reduce(
                        (sum, product) => sum + product.quantity,
                        0
                      )}
                    </p>
                  </div>
                  <Package className="h-8 w-8" style={{ color: themeLight }} />
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
                value="pending"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
                style={{
                  color: activeTab === "pending" ? themeColor : "inherit",
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Pending Materials
                {pendingTransfers.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-amber-100 text-amber-800"
                  >
                    {pendingTransfers.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
                style={{
                  color: activeTab === "history" ? themeColor : "inherit",
                }}
              >
                <History className="h-4 w-4 mr-2" />
                Approval History
                {approvedTransfers.length + rejectedTransfers.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-blue-100 text-blue-800"
                  >
                    {approvedTransfers.length + rejectedTransfers.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="products"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
                style={{
                  color: activeTab === "products" ? themeColor : "inherit",
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Product Transfers
                {pendingProductTransfers.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-blue-100 text-blue-800"
                  >
                    {pendingProductTransfers.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Pending Materials Tab */}
            <TabsContent value="pending" className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Pending Raw Materials
                </h3>
                <p className="text-gray-600">
                  Review and take action on raw materials transferred to you for
                  production
                </p>
              </div>

              {pendingTransfers.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-amber-700">
                    Materials Awaiting Your Action ({pendingTransfers.length})
                  </h4>
                  {pendingTransfers.map((transfer) => (
                    <Card
                      key={transfer.id}
                      className="border-2 border-amber-200"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <Package className="h-6 w-6 text-amber-600" />
                              <h3 className="font-semibold text-lg">
                                {transfer.rawMaterial.name}
                              </h3>
                              {getStatusBadge(transfer.status)}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Quantity: </span>
                                <Badge variant="outline">
                                  {transfer.quantityIssued}{" "}
                                  {transfer.rawMaterial.unit}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  {formatDate(transfer.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  Issued by: {transfer.user.name}
                                </span>
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
                              onClick={() => handleApproveTransfer(transfer.id)}
                              disabled={actionLoading === transfer.id}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {actionLoading === transfer.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                              )}
                              {actionLoading === transfer.id
                                ? "Processing..."
                                : "Approve"}
                            </Button>
                            <Button
                              onClick={() => openRejectDialog(transfer)}
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
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Pending Material Transfers
                  </h3>
                  <p className="text-gray-600">
                    You don't have any pending material transfers awaiting your
                    action.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Approval History Tab */}
            <TabsContent value="history" className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Approval History
                </h3>
                <p className="text-gray-600">
                  View your approved and rejected material transfers
                </p>
              </div>

              {approvedTransfers.length > 0 || rejectedTransfers.length > 0 ? (
                <div className="space-y-6">
                  {/* Approved Materials */}
                  {approvedTransfers.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-green-700 mb-4">
                        Approved Materials ({approvedTransfers.length})
                      </h4>
                      <div className="space-y-4">
                        {approvedTransfers.map((transfer) => (
                          <Card
                            key={transfer.id}
                            className="border-2 border-green-200"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-4">
                                    <Package className="h-6 w-6 text-green-600" />
                                    <h3 className="font-semibold text-lg">
                                      {transfer.rawMaterial.name}
                                    </h3>
                                    {getStatusBadge(transfer.status)}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">
                                        Quantity Approved:{" "}
                                      </span>
                                      <span className="text-gray-600">
                                        {transfer.quantityApproved ||
                                          transfer.quantityIssued}{" "}
                                        {transfer.rawMaterial.unit}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Approved On:{" "}
                                      </span>
                                      <span className="text-gray-600">
                                        {formatDate(transfer.updatedAt)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Issued By:{" "}
                                      </span>
                                      <span className="text-gray-600">
                                        {transfer.user.name}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Status:{" "}
                                      </span>
                                      <Badge
                                        variant="default"
                                        className="bg-green-100 text-green-800"
                                      >
                                        Fully Approved
                                      </Badge>
                                    </div>
                                  </div>

                                  {transfer.notes && (
                                    <div className="mt-4 bg-gray-50 rounded-lg p-3">
                                      <span className="font-medium">
                                        Approval Notes:{" "}
                                      </span>
                                      <span className="text-gray-600">
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

                  {/* Rejected Materials */}
                  {rejectedTransfers.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-red-700 mb-4">
                        Rejected Materials ({rejectedTransfers.length})
                      </h4>
                      <div className="space-y-4">
                        {rejectedTransfers.map((transfer) => (
                          <Card
                            key={transfer.id}
                            className="border-2 border-red-200"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-4">
                                    <Package className="h-6 w-6 text-red-600" />
                                    <h3 className="font-semibold text-lg">
                                      {transfer.rawMaterial.name}
                                    </h3>
                                    {getStatusBadge(transfer.status)}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                                    <div>
                                      <span className="font-medium">
                                        Total Quantity:{" "}
                                      </span>
                                      <span className="text-gray-600">
                                        {transfer.quantityIssued}{" "}
                                        {transfer.rawMaterial.unit}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-red-600">
                                        Quantity Rejected:{" "}
                                      </span>
                                      <span className="text-red-600 font-semibold">
                                        {transfer.quantityRejected || 0}{" "}
                                        {transfer.rawMaterial.unit}
                                      </span>
                                    </div>
                                    {(transfer.quantityApproved || 0) > 0 && (
                                      <div>
                                        <span className="font-medium text-green-600">
                                          Added to Inventory:{" "}
                                        </span>
                                        <span className="text-green-600 font-semibold">
                                          {transfer.quantityApproved}{" "}
                                          {transfer.rawMaterial.unit}
                                        </span>
                                      </div>
                                    )}
                                    <div>
                                      <span className="font-medium">
                                        Rejected On:{" "}
                                      </span>
                                      <span className="text-gray-600">
                                        {formatDate(transfer.updatedAt)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium">
                                        Issued By:{" "}
                                      </span>
                                      <span className="text-gray-600">
                                        {transfer.user.name}
                                      </span>
                                    </div>
                                    {transfer.rejectionReason && (
                                      <div>
                                        <span className="font-medium">
                                          Rejection Type:{" "}
                                        </span>
                                        <span className="text-gray-600 capitalize">
                                          {transfer.rejectionReason.replace(
                                            "_",
                                            " "
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {transfer.notes && (
                                    <div className="space-y-3">
                                      {/* Rejection Summary */}
                                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                        <div className="flex items-center gap-2 mb-2">
                                          <AlertTriangle className="h-4 w-4 text-red-600" />
                                          <span className="font-medium text-red-800 text-sm">
                                            Rejection Summary
                                          </span>
                                        </div>
                                        <div className="text-sm text-red-700 space-y-1">
                                          <div className="flex justify-between">
                                            <span>Total Issued:</span>
                                            <span className="font-medium">
                                              {transfer.quantityIssued}{" "}
                                              {transfer.rawMaterial.unit}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Quantity Rejected:</span>
                                            <span className="font-medium">
                                              {transfer.quantityRejected || 0}{" "}
                                              {transfer.rawMaterial.unit}
                                            </span>
                                          </div>
                                          {(transfer.quantityApproved || 0) >
                                            0 && (
                                            <div className="flex justify-between text-green-700">
                                              <span>Added to Inventory:</span>
                                              <span className="font-medium">
                                                {transfer.quantityApproved}{" "}
                                                {transfer.rawMaterial.unit}
                                              </span>
                                            </div>
                                          )}
                                          {transfer.rejectionReason && (
                                            <div className="flex justify-between">
                                              <span>Rejection Type:</span>
                                              <span className="font-medium capitalize">
                                                {transfer.rejectionReason.replace(
                                                  "_",
                                                  " "
                                                )}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Detailed Notes */}
                                      <div className="bg-gray-50 rounded-lg p-3 border">
                                        <span className="font-medium text-gray-800">
                                          Rejection Notes:{" "}
                                        </span>
                                        <span className="text-gray-600">
                                          {transfer.notes}
                                        </span>
                                      </div>
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
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Approval History
                  </h3>
                  <p className="text-gray-600">
                    You haven't approved or rejected any material transfers yet.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Product Transfers Tab */}
            <TabsContent value="products" className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Product Transfers to Super Admin
                    </h3>
                    <p className="text-gray-600">
                      Send finished products to Super Admin and track transfer
                      status
                    </p>
                  </div>
                  <Dialog
                    open={showSendProductDialog}
                    onOpenChange={setShowSendProductDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        style={{ backgroundColor: themeColor }}
                        className="text-white"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send New Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white max-w-md">
                      <DialogHeader>
                        <DialogTitle>Send Product to Super Admin</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Combined Search and Dropdown */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Product <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search products..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10 border-gray-300 focus:border-blue-400"
                              onFocus={() => setSearchQuery("")}
                            />
                          </div>

                          {/* Product Dropdown */}
                          <div className="mt-2 max-h-60 overflow-auto border border-gray-300 rounded-md">
                            {products
                              .filter(
                                (product) =>
                                  product.name
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase()) ||
                                  product.category
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase()) ||
                                  (product.size &&
                                    product.size
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase()))
                              )
                              .map((product) => (
                                <div
                                  key={product.id}
                                  onClick={() => {
                                    setSelectedProductId(product.id);
                                    setSearchQuery(
                                      `${product.name} ${
                                        product.size ? `(${product.size})` : ""
                                      }`
                                    );
                                  }}
                                  className={`p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 ${
                                    selectedProductId === product.id
                                      ? "bg-blue-100 border-blue-200"
                                      : ""
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {product.name}{" "}
                                        {product.size && `(${product.size})`}
                                      </div>
                                      <div className="text-sm text-gray-500 capitalize">
                                        {product.category}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}

                            {products.filter(
                              (product) =>
                                product.name
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase()) ||
                                product.category
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase())
                            ).length === 0 && (
                              <div className="p-3 text-center text-gray-500">
                                No products found
                              </div>
                            )}
                          </div>

                          {/* Selected Product Display */}
                          {selectedProductId && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-green-800">
                                  Selected:{" "}
                                  {
                                    products.find(
                                      (p) => p.id === selectedProductId
                                    )?.name
                                  }
                                  {products.find(
                                    (p) => p.id === selectedProductId
                                  )?.size &&
                                    ` (${
                                      products.find(
                                        (p) => p.id === selectedProductId
                                      )?.size
                                    })`}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProductId("");
                                    setSearchQuery("");
                                  }}
                                  className="text-red-600 hover:text-red-800 h-6 w-6 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Quantity to Send{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Input
                            type="number"
                            min="1"
                            max={
                              selectedProductId
                                ? products.find(
                                    (p) => p.id === selectedProductId
                                  )?.quantity
                                : undefined
                            }
                            value={sendQuantity}
                            onChange={(e) =>
                              setSendQuantity(Number(e.target.value))
                            }
                            placeholder="Enter quantity"
                          />
                          {/* {selectedProductId && (
                            <p className="text-xs text-gray-500 mt-1">
                              Maximum available:{" "}
                              {
                                products.find((p) => p.id === selectedProductId)
                                  ?.quantity
                              }
                            </p>
                          )} */}
                        </div>

                        {/* REQUIRED MATERIALS DISPLAY - ADDED HERE */}
                        {requiredMaterials.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <h4 className="font-medium text-sm mb-2 text-blue-800">
                              Raw Materials Required:
                            </h4>
                            <div className="text-sm space-y-1">
                              {requiredMaterials.map((material, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between"
                                >
                                  <span>{material.materialName}:</span>
                                  <span className="font-medium">
                                    {material.quantityRequired} {material.unit}
                                    <span className="text-blue-600 ml-1">
                                      ({material.perUnit} per unit)
                                    </span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Notes (Optional)
                          </label>
                          <Textarea
                            placeholder="Add any notes about this transfer..."
                            value={sendNotes}
                            onChange={(e) => setSendNotes(e.target.value)}
                          />
                        </div>

                        {selectedProductId && (
                          <div className="bg-gray-50 rounded-lg p-3 border">
                            <h4 className="font-medium text-sm mb-2">
                              Transfer Summary:
                            </h4>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>Product:</span>
                                <span className="font-medium">
                                  {
                                    products.find(
                                      (p) => p.id === selectedProductId
                                    )?.name
                                  }
                                  {products.find(
                                    (p) => p.id === selectedProductId
                                  )?.size &&
                                    ` (${
                                      products.find(
                                        (p) => p.id === selectedProductId
                                      )?.size
                                    })`}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Quantity to Send:</span>
                                <span className="font-medium">
                                  {sendQuantity}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowSendProductDialog(false);
                              setSelectedProductId("");
                              setSearchQuery("");
                              setSendQuantity(1);
                              setSendNotes("");
                            }}
                            disabled={actionLoading === -1}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSendProduct}
                            disabled={
                              !selectedProductId ||
                              !sendQuantity ||
                              sendQuantity <= 0 ||
                              actionLoading === -1
                            }
                            style={{ backgroundColor: themeColor }}
                            className="text-white"
                          >
                            {actionLoading === -1 ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Send to Super Admin
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Rest of the product transfers content remains the same */}
              {productTransfers.length > 0 ? (
                <div className="space-y-6">
                  {/* Pending Product Transfers */}
                  {pendingProductTransfers.length > 0 && (
                    <div>
                      <h4 className="text-md font-semibold text-blue-700 mb-4">
                        Pending Receipt ({pendingProductTransfers.length})
                      </h4>
                      <div className="space-y-4">
                        {pendingProductTransfers.map((transfer) => (
                          <Card
                            key={transfer.id}
                            className="border-2 border-blue-200"
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-4">
                                    <Package className="h-6 w-6 text-blue-600" />
                                    <h3 className="font-semibold text-lg">
                                      {transfer.product.name}{" "}
                                      {transfer.product.size &&
                                        `(${transfer.product.size})`}
                                    </h3>
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
                                        Category:{" "}
                                      </span>
                                      <span className="text-gray-600 capitalize">
                                        {transfer.product.category}
                                      </span>
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
                      <h4 className="text-md font-semibold text-green-700 mb-4">
                        Received by Super Admin (
                        {receivedProductTransfers.length})
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
                                    <h3 className="font-semibold text-lg">
                                      {transfer.product.name}{" "}
                                      {transfer.product.size &&
                                        `(${transfer.product.size})`}
                                    </h3>
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
                                        {transfer.receivedBy || "N/A"}
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
                      <h4 className="text-md font-semibold text-red-700 mb-4">
                        Rejected by Super Admin (
                        {rejectedProductTransfers.length})
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
                                    <h3 className="font-semibold text-lg">
                                      {transfer.product.name}{" "}
                                      {transfer.product.size &&
                                        `(${transfer.product.size})`}
                                    </h3>
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
                                        {transfer.receivedBy || "N/A"}
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
                  <Send className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Product Transfers
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You haven't sent any products to the Super Admin yet.
                  </p>
                  <Button
                    onClick={() => setShowSendProductDialog(true)}
                    style={{ backgroundColor: themeColor }}
                    className="text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Your First Product
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* Reject Confirmation Dialog - Improved UI with Input Box */}
      {showRejectDialog && selectedTransfer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-5 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Review Material Transfer
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage incoming {selectedTransfer.rawMaterial.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Material Summary */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedTransfer.rawMaterial.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedTransfer.quantityIssued}{" "}
                        {selectedTransfer.rawMaterial.unit} received
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    Pending
                  </Badge>
                </div>
              </div>

              {/* Quantity Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-900">
                    Quantity Management
                  </label>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Total: {selectedTransfer.quantityIssued}{" "}
                    {selectedTransfer.rawMaterial.unit}
                  </span>
                </div>

                {/* Quantity Input Box */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Damaged/Rejected Quantity */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Rejected Quantity
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max={selectedTransfer.quantityIssued}
                          value={rejectQuantity}
                          onChange={(e) =>
                            setRejectQuantity(Number(e.target.value))
                          }
                          className={`pr-12 text-center border-2 ${
                            rejectQuantity > 0
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-300 focus:border-gray-500"
                          }`}
                          placeholder="0"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-sm text-gray-500 font-medium">
                            {selectedTransfer.rawMaterial.unit}
                          </span>
                        </div>
                      </div>
                      {rejectQuantity > selectedTransfer.quantityIssued && (
                        <p className="text-red-500 text-xs flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Cannot exceed {selectedTransfer.quantityIssued}{" "}
                          {selectedTransfer.rawMaterial.unit}
                        </p>
                      )}
                    </div>

                    {/* Approved Quantity (Auto-calculated) */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Approved Quantity
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={
                            selectedTransfer.quantityIssued - rejectQuantity
                          }
                          disabled
                          className="pr-12 text-center border-2 border-green-300 bg-green-50 text-green-800 font-semibold"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-sm text-green-600 font-medium">
                            {selectedTransfer.rawMaterial.unit}
                          </span>
                        </div>
                      </div>
                      {/* <p className="text-green-600 text-xs flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Will be added to inventory
                      </p> */}
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  {/* <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={rejectQuantity === 0 ? "default" : "outline"}
                      size="sm"
                      className={`text-xs h-9 ${
                        rejectQuantity === 0
                          ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                          : "border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-200"
                      }`}
                      onClick={() => setRejectQuantity(0)}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Keep All
                    </Button>
                    <Button
                      type="button"
                      variant={
                        rejectQuantity === selectedTransfer.quantityIssued
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className={`text-xs h-9 ${
                        rejectQuantity === selectedTransfer.quantityIssued
                          ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                          : "border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-200"
                      }`}
                      onClick={() =>
                        setRejectQuantity(selectedTransfer.quantityIssued)
                      }
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-9 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-200"
                      onClick={() =>
                        setRejectQuantity(
                          Math.floor(selectedTransfer.quantityIssued / 2)
                        )
                      }
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Half
                    </Button>
                  </div> */}
                </div>
              </div>

              {/* Visual Status Card */}
              <div
                className={`rounded-xl p-4 border-2 transition-all duration-200 ${
                  rejectQuantity === 0
                    ? "bg-green-50 border-green-200"
                    : rejectQuantity === selectedTransfer.quantityIssued
                    ? "bg-red-50 border-red-200"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {rejectQuantity === 0 ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">
                        All Materials Accepted
                      </span>
                    </>
                  ) : rejectQuantity === selectedTransfer.quantityIssued ? (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="font-semibold text-red-800">
                        All Materials Rejected
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <span className="font-semibold text-amber-800">
                        Partial Transfer
                      </span>
                    </>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-600">
                      Adding to your inventory:
                    </span>
                    <span className="font-semibold text-green-700">
                      {selectedTransfer.quantityIssued - rejectQuantity}{" "}
                      {selectedTransfer.rawMaterial.unit}
                    </span>
                  </div>

                  {rejectQuantity > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">
                        Returning to main inventory:
                      </span>
                      <span className="font-semibold text-red-700">
                        {rejectQuantity} {selectedTransfer.rawMaterial.unit}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejection Reason */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">
                  Rejection Reason
                  <span className="text-red-500 ml-1">*</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: "damaged",
                      label: "Damaged",
                      icon: "🚫",
                      description: "Physical damage or defects",
                    },
                    {
                      value: "wrong_item",
                      label: "Wrong Item",
                      icon: "❓",
                      description: "Incorrect item received",
                    },
                    {
                      value: "quality_issue",
                      label: "Quality",
                      icon: "🔍",
                      description: "Doesn't meet standards",
                    },
                    {
                      value: "other",
                      label: "Other",
                      icon: "📝",
                      description: "Other reasons",
                    },
                  ].map((reason) => (
                    <button
                      key={reason.value}
                      type="button"
                      className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                        rejectionType === reason.value
                          ? "border-red-300 bg-red-50 shadow-sm ring-2 ring-red-100"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setRejectionType(reason.value)}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{reason.icon}</span>
                        <div>
                          <div
                            className={`font-medium text-sm ${
                              rejectionType === reason.value
                                ? "text-red-700"
                                : "text-gray-900"
                            }`}
                          >
                            {reason.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {reason.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">
                  Additional Notes
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <Textarea
                  placeholder={
                    rejectQuantity === 0
                      ? "Add notes about accepting all materials..."
                      : rejectQuantity === selectedTransfer.quantityIssued
                      ? `Explain why all ${selectedTransfer.quantityIssued} ${selectedTransfer.rawMaterial.unit} are being rejected...`
                      : `Explain why ${rejectQuantity} ${
                          selectedTransfer.rawMaterial.unit
                        } are being rejected and ${
                          selectedTransfer.quantityIssued - rejectQuantity
                        } ${
                          selectedTransfer.rawMaterial.unit
                        } are being accepted...`
                  }
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="min-h-[100px] resize-none border-gray-300 focus:border-red-300 focus:ring focus:ring-red-100"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Required for audit trail</span>
                  <span>{rejectNotes.length}/500</span>
                </div>
              </div>

              {/* Final Summary */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                  <History className="h-4 w-4 text-gray-500" />
                  Action Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Material</span>
                    <span className="font-medium">
                      {selectedTransfer.rawMaterial.name}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Total Received</span>
                    <span className="font-medium">
                      {selectedTransfer.quantityIssued}{" "}
                      {selectedTransfer.rawMaterial.unit}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Adding to Inventory</span>
                    <span className="font-medium text-green-700">
                      {selectedTransfer.quantityIssued - rejectQuantity}{" "}
                      {selectedTransfer.rawMaterial.unit}
                    </span>
                  </div>
                  {rejectQuantity > 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Returning to Main</span>
                      <span className="font-medium text-red-700">
                        {rejectQuantity} {selectedTransfer.rawMaterial.unit}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reason</span>
                      <span className="font-medium capitalize">
                        {rejectionType.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <Button
                variant="outline"
                onClick={cancelReject}
                disabled={actionLoading === selectedTransfer.id}
                className="flex-1 border-gray-300 hover:bg-gray-100 text-gray-700"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Review
              </Button>
              <Button
                onClick={() => handleRejectTransfer(selectedTransfer.id)}
                disabled={
                  !rejectNotes.trim() ||
                  !rejectionType ||
                  rejectQuantity > selectedTransfer.quantityIssued ||
                  rejectQuantity < 0 ||
                  actionLoading === selectedTransfer.id
                }
                className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === selectedTransfer.id ? (
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : rejectQuantity === 0 ? (
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle2 className="h-4 w-4" />
                    Accept Materials
                  </div>
                ) : rejectQuantity === selectedTransfer.quantityIssued ? (
                  <div className="flex items-center gap-2 justify-center">
                    <XCircle className="h-4 w-4" />
                    Return Materials
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-center">
                    <Package className="h-4 w-4" />
                    Confirm Transfer
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
