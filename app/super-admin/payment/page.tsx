"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  FileText,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Save,
  Ban,
  Calendar,
  Hash,
  IndianRupee,
  Percent,
  Download,
  Upload,
  Trash,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface Vendor {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  companyName?: string | null;
  gstin?: string | null;
  address?: string | null;
}

interface Product {
  id: number;
  name: string;
  size?: string | null;
  price: number;
  category?: string | null;
  quantity: number;
}

interface BillItem {
  id?: string;
  productId?: number | null;
  itemName: string;
  description?: string;
  account?: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
}

interface PurchaseBill {
  id: string;
  billNumber: string;
  orderNumber?: string;
  vendorId: number;
  vendor: Vendor;
  billDate: string;
  dueDate?: string;
  paymentTerms: string;
  customPaymentTerms?: string;
  subject?: string;
  subtotal: number;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  discountAmount?: number;
  taxAmount?: number;
  adjustment?: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: string;
  notes?: string;
  items: BillItem[];
  createdAt: string;
}

export default function PurchaseBillManager() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState<PurchaseBill | null>(null);
  const [nextBillNumber, setNextBillNumber] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sorting
  const [sortField, setSortField] = useState<keyof PurchaseBill>("billNumber");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Form state
  const [formData, setFormData] = useState({
    vendorId: "",
    vendorName: "",
    vendorAddress: "",
    orderNumber: "",
    billDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    paymentTerms: "DUE_ON_RECEIPT",
    customPaymentTerms: "",
    subject: "",
    discountType: "percentage",
    discountValue: "",
    adjustment: "",
    notes: "",
    items: [] as BillItem[],
  });

  // Load data on mount
  useEffect(() => {
    fetchVendors();
    fetchProducts();
    fetchBills();
    fetchNextBillNumber();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/vendors");
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchBills = async () => {
    try {
      const response = await fetch("/api/purchase-bills");
      if (response.ok) {
        const data = await response.json();
        setBills(data);
      }
    } catch (error) {
      console.error("Error fetching bills:", error);
    }
  };

  const fetchNextBillNumber = async () => {
    try {
      const response = await fetch("/api/purchase-bills/counter");
      if (response.ok) {
        const data = await response.json();
        setNextBillNumber(data.billNumber);
      }
    } catch (error) {
      console.error("Error fetching bill number:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVendorSelect = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === parseInt(vendorId));
    if (vendor) {
      setFormData((prev) => ({
        ...prev,
        vendorId,
        vendorName: vendor.name,
        vendorAddress: vendor.address || "",
      }));
    }
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemName: "",
          quantity: 1,
          rate: 0,
          amount: 0,
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: keyof BillItem, value: any) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };

      // Calculate amount
      if (field === "quantity" || field === "rate") {
        const quantity =
          field === "quantity" ? value : newItems[index].quantity;
        const rate = field === "rate" ? value : newItems[index].rate;
        newItems[index].amount = quantity * rate;
      }

      return { ...prev, items: newItems };
    });
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === parseInt(productId));
    if (product) {
      setFormData((prev) => {
        const newItems = [...prev.items];
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          itemName: `${product.name} ${product.size || ""}`.trim(),
          rate: product.price,
          amount: product.price * newItems[index].quantity,
        };
        return { ...prev, items: newItems };
      });
    }
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateDiscount = (subtotal: number) => {
    const discountValue = parseFloat(formData.discountValue) || 0;
    if (formData.discountType === "percentage") {
      return (subtotal * discountValue) / 100;
    }
    return discountValue;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount(subtotal);
    const adjustment = parseFloat(formData.adjustment) || 0;
    return subtotal - discount + adjustment;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vendorId) {
      alert("Please select a vendor");
      return;
    }

    if (formData.items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    setLoading(true);

    try {
      // Get new bill number
      const counterResponse = await fetch("/api/purchase-bills/counter", {
        method: "POST",
      });

      if (!counterResponse.ok) {
        throw new Error("Failed to generate bill number");
      }

      const counterData = await counterResponse.json();
      const billNumber = counterData.billNumber;

      const subtotal = calculateSubtotal();
      const discount = calculateDiscount(subtotal);
      const total = calculateTotal();

      const billData = {
        vendorId: parseInt(formData.vendorId),
        billNumber,
        orderNumber: formData.orderNumber || null,
        billDate: formData.billDate,
        dueDate: formData.dueDate || null,
        paymentTerms: formData.paymentTerms,
        customPaymentTerms: formData.customPaymentTerms || null,
        subject: formData.subject || null,
        subtotal,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue) || 0,
        discountAmount: discount,
        adjustment: parseFloat(formData.adjustment) || 0,
        total,
        notes: formData.notes || null,
        items: formData.items.map((item) => ({
          productId: item.productId,
          itemName: item.itemName,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
        })),
        status: "DRAFT",
      };

      const response = await fetch("/api/purchase-bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create bill");
      }

      await fetchBills();
      await fetchNextBillNumber();
      resetForm();
      alert("Bill created successfully!");
    } catch (error) {
      console.error("Error creating bill:", error);
      alert(error instanceof Error ? error.message : "Failed to create bill");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vendorId: "",
      vendorName: "",
      vendorAddress: "",
      orderNumber: "",
      billDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      paymentTerms: "DUE_ON_RECEIPT",
      customPaymentTerms: "",
      subject: "",
      discountType: "percentage",
      discountValue: "",
      adjustment: "",
      notes: "",
      items: [],
    });
    setEditingBill(null);
    setShowForm(false);
  };

  const handleEdit = (bill: PurchaseBill) => {
    setEditingBill(bill);
    setFormData({
      vendorId: bill.vendorId.toString(),
      vendorName: bill.vendor.name,
      vendorAddress: bill.vendor.address || "",
      orderNumber: bill.orderNumber || "",
      billDate: new Date(bill.billDate).toISOString().split("T")[0],
      dueDate: bill.dueDate
        ? new Date(bill.dueDate).toISOString().split("T")[0]
        : "",
      paymentTerms: bill.paymentTerms,
      customPaymentTerms: bill.customPaymentTerms || "",
      subject: bill.subject || "",
      discountType: bill.discountType || "percentage",
      discountValue: bill.discountValue?.toString() || "",
      adjustment: bill.adjustment?.toString() || "",
      notes: bill.notes || "",
      items: bill.items,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bill?")) {
      return;
    }

    try {
      const response = await fetch(`/api/purchase-bills?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete bill");
      }

      await fetchBills();
      alert("Bill deleted successfully!");
    } catch (error) {
      console.error("Error deleting bill:", error);
      alert("Failed to delete bill");
    }
  };

  // Filter and sort bills
  const filteredBills = bills
    .filter(
      (bill) =>
        bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      const aValue = a[sortField] ?? "";
      const bValue = b[sortField] ?? "";

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBills = filteredBills.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);

  const getSortIcon = (field: keyof PurchaseBill) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-800" },
      OPEN: { label: "Open", color: "bg-blue-100 text-blue-800" },
      PAID: { label: "Paid", color: "bg-green-100 text-green-800" },
      PARTIAL: { label: "Partial", color: "bg-yellow-100 text-yellow-800" },
      OVERDUE: { label: "Overdue", color: "bg-red-100 text-red-800" },
      CANCELLED: { label: "Cancelled", color: "bg-gray-100 text-gray-800" },
    };

    const { label, color } = config[status] || config.DRAFT;
    return (
      <Badge variant="secondary" className={color}>
        {label}
      </Badge>
    );
  };

  const subtotal = calculateSubtotal();
  const discount = calculateDiscount(subtotal);
  const total = calculateTotal();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Purchase Bills</h2>
            <p className="text-gray-600">Create and manage vendor bills</p>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Bill
            </Button>
          )}
        </div>

        {/* Bill Form */}
        {showForm && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <CardTitle>{editingBill ? "Edit Bill" : "New Bill"}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Bill Header Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Vendor Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Vendor Name <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.vendorId}
                      onValueChange={handleVendorSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {vendors.map((vendor) => (
                          <SelectItem
                            key={vendor.id}
                            value={vendor.id.toString()}
                          >
                            {vendor.name}{" "}
                            {vendor.companyName && `(${vendor.companyName})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Billing Address */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium">
                      Billing Address
                    </Label>
                    <Input
                      value={formData.vendorAddress}
                      onChange={(e) =>
                        handleInputChange("vendorAddress", e.target.value)
                      }
                      placeholder="Billing address"
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>

                  {/* Bill Number */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Bill #</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        value={nextBillNumber}
                        readOnly
                        className="pl-9 bg-gray-50 font-mono"
                      />
                    </div>
                  </div>

                  {/* Order Number */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Order Number</Label>
                    <Input
                      value={formData.orderNumber}
                      onChange={(e) =>
                        handleInputChange("orderNumber", e.target.value)
                      }
                      placeholder="Order number (optional)"
                    />
                  </div>

                  {/* Bill Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Bill Date <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        type="date"
                        value={formData.billDate}
                        onChange={(e) =>
                          handleInputChange("billDate", e.target.value)
                        }
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Due Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) =>
                          handleInputChange("dueDate", e.target.value)
                        }
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Payment Terms */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Payment Terms</Label>
                    <Select
                      value={formData.paymentTerms}
                      onValueChange={(value) =>
                        handleInputChange("paymentTerms", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="DUE_ON_RECEIPT">
                          Due on Receipt
                        </SelectItem>
                        <SelectItem value="NET_15">Net 15</SelectItem>
                        <SelectItem value="NET_30">Net 30</SelectItem>
                        <SelectItem value="NET_45">Net 45</SelectItem>
                        <SelectItem value="NET_60">Net 60</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Payment Terms */}
                  {formData.paymentTerms === "CUSTOM" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Custom Terms
                      </Label>
                      <Input
                        value={formData.customPaymentTerms}
                        onChange={(e) =>
                          handleInputChange(
                            "customPaymentTerms",
                            e.target.value,
                          )
                        }
                        placeholder="Enter custom terms"
                      />
                    </div>
                  )}

                  {/* Subject */}
                  <div className="space-y-2 md:col-span-3">
                    <Label className="text-sm font-medium">Subject</Label>
                    <Input
                      value={formData.subject}
                      onChange={(e) =>
                        handleInputChange("subject", e.target.value)
                      }
                      placeholder="Enter a subject within 250 characters"
                      maxLength={250}
                    />
                  </div>
                </div>

                {/* Items Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-1/3">
                          Item Details
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Account
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Rate
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <div className="space-y-2">
                              <Select
                                value={item.productId?.toString() || ""}
                                onValueChange={(value) =>
                                  handleProductSelect(index, value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Type or click to select an item" />
                                </SelectTrigger>
                                <SelectContent className="bg-white max-h-60">
                                  {products.map((product) => (
                                    <SelectItem
                                      key={product.id}
                                      value={product.id.toString()}
                                    >
                                      <div>
                                        <span className="font-medium">
                                          {product.name}
                                        </span>
                                        {product.size && (
                                          <span> {product.size}</span>
                                        )}
                                        <span className="text-xs text-gray-500 ml-2">
                                          ₹{product.price}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                value={item.itemName}
                                onChange={(e) =>
                                  updateItem(index, "itemName", e.target.value)
                                }
                                placeholder="Item name"
                                className="text-sm"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={item.account || ""}
                              onValueChange={(value) =>
                                updateItem(index, "account", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select account" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="purchases">
                                  Purchases
                                </SelectItem>
                                <SelectItem value="expenses">
                                  Expenses
                                </SelectItem>
                                <SelectItem value="assets">Assets</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-24"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "rate",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-24"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium">
                              ₹{item.amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={6} className="px-4 py-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addItem}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Row
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bill Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) =>
                          handleInputChange("notes", e.target.value)
                        }
                        placeholder="It will not be shown in PDF"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Sub Total
                          </span>
                          <span className="font-medium">
                            ₹{subtotal.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              Discount
                            </span>
                            <Select
                              value={formData.discountType}
                              onValueChange={(value) =>
                                handleInputChange("discountType", value)
                              }
                            >
                              <SelectTrigger className="w-24 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="percentage">%</SelectItem>
                                <SelectItem value="fixed">₹</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.discountValue}
                              onChange={(e) =>
                                handleInputChange(
                                  "discountValue",
                                  e.target.value,
                                )
                              }
                              className="w-24 h-8 text-right"
                              placeholder="0"
                            />
                            <span className="text-sm text-gray-600 w-16">
                              {formData.discountType === "percentage"
                                ? "%"
                                : "₹"}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Adjustment
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">₹</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.adjustment}
                              onChange={(e) =>
                                handleInputChange("adjustment", e.target.value)
                              }
                              className="w-24 h-8 text-right"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="border-t pt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-base font-semibold">
                              Total (₹)
                            </span>
                            <span className="text-lg font-bold">
                              ₹{total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Attach File(s) to Bill</span>
                      <Button type="button" variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-between items-center pt-6 border-t">
                  <div className="text-sm text-gray-500">
                    PDF Template:{" "}
                    <span className="font-medium">Standard Template</span>
                    <Button
                      type="button"
                      variant="link"
                      className="text-blue-600"
                    >
                      Change
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="outline"
                      className="border-blue-600 text-blue-600"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save as Draft
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Save as Open
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Bills List */}
        {!showForm && (
          <>
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search bills by number, vendor, or order number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setSearchTerm("")}
                disabled={!searchTerm}
              >
                Clear
              </Button>
            </div>

            {/* Bills Table */}
            {filteredBills.length > 0 ? (
              <div className="border rounded-lg overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            setSortField("billNumber");
                            setSortDirection(
                              sortDirection === "asc" ? "desc" : "asc",
                            );
                          }}
                        >
                          <div className="flex items-center">
                            Bill #{getSortIcon("billNumber")}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vendor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bill Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentBills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline" className="font-mono">
                              {bill.billNumber}
                            </Badge>
                            {bill.orderNumber && (
                              <div className="text-xs text-gray-500 mt-1">
                                Order: {bill.orderNumber}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {bill.vendor.name}
                            </div>
                            {bill.vendor.companyName && (
                              <div className="text-sm text-gray-600">
                                {bill.vendor.companyName}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(bill.billDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {bill.dueDate
                              ? new Date(bill.dueDate).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium">
                              ₹{bill.total.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Paid: ₹{bill.amountPaid.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(bill.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(bill)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(bill.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                    <div className="text-sm text-gray-600">
                      Showing {indexOfFirstItem + 1} to{" "}
                      {Math.min(indexOfLastItem, filteredBills.length)} of{" "}
                      {filteredBills.length} bills
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="flex items-center px-4 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-white">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? "No Bills Found" : "No Bills Created"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm
                    ? "Try adjusting your search terms."
                    : "Create your first purchase bill."}
                </p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Bill
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
