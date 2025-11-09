// components/payment/PaymentManager.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { pdf } from "@react-pdf/renderer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  FileText,
  Plus,
  Search,
  Calendar,
  User,
  CreditCard,
  Trash2,
  RefreshCw,
  ChevronDown,
  Mail,
  Phone,
  IndianRupee,
  CheckCircle,
  CalendarClock,
  AlertTriangle,
} from "lucide-react";
import PaymentReceiptPDF from "@/components/payment/PaymentReceiptPDF";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface Customer {
  id: number;
  name: string;
  number: string;
  address?: string;
  email?: string;
}

type PaymentStatus = "COMPLETED" | "DUE" | "OVERDUE";

interface Payment {
  id: string;
  customerName: string;
  customerNumber: string | null;
  customerEmail?: string;
  amount: number;
  paymentMethod: "UPI" | "CASH" | "BANK_TRANSFER" | "CARD";
  transactionId: string | null;
  createdAt: string;
  updatedAt: Date;
  receiptNumber: string;
  status: PaymentStatus;
  dueDate?: string;
  balanceDue?: number;
}

// Create a wrapper component that properly uses PaymentReceiptPDF
function PaymentReceiptButton({ payment }: { payment: Payment }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await pdf(
        <PaymentReceiptPDF
          payment={
            {
              ...payment,
              customerEmail: payment.customerEmail || null,
              dueDate: payment.dueDate ? new Date(payment.dueDate) : null,
              balanceDue:
                payment.balanceDue !== undefined ? payment.balanceDue : null,
              createdAt:
                typeof payment.createdAt === "string"
                  ? new Date(payment.createdAt)
                  : payment.createdAt,
            } as any
          }
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payment-receipt-${payment.receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to download receipt. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleDownload}
      disabled={loading}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );
}

export default function PaymentManager() {
  const [activeTab, setActiveTab] = useState("new-payment");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [nextReceiptNumber, setNextReceiptNumber] = useState<string>("");
  const [syncing, setSyncing] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerFromDropdown, setSelectedCustomerFromDropdown] =
    useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);

  // Complete form state with all fields
  const [formData, setFormData] = useState({
    customerName: "",
    customerNumber: "",
    customerEmail: "",
    amount: "",
    paymentMethod: "" as Payment["paymentMethod"] | "",
    transactionId: "",
    dueDate: "",
    status: "DUE" as Payment["status"],
    balanceDue: "",
  });

  // Calculate status counts
  const statusCounts = {
    COMPLETED: payments.filter((payment) => payment.status === "COMPLETED")
      .length,
    DUE: payments.filter((payment) => payment.status === "DUE").length,
    OVERDUE: payments.filter((payment) => payment.status === "OVERDUE").length,
  };

  // Load payments and customers from database on component mount
  useEffect(() => {
    fetchPayments();
    fetchNextReceiptNumber();
    fetchCustomers();
  }, []);

  // Fetch payments when search term changes
  useEffect(() => {
    if (activeTab === "payment-history") {
      fetchPayments();
    }
  }, [searchTerm, activeTab]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/payments/customers");
      if (response.ok) {
        const customersData = await response.json();
        setCustomers(customersData);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchPayments = async () => {
    setFetchLoading(true);
    try {
      const url = searchTerm
        ? `/api/payments?search=${encodeURIComponent(searchTerm)}`
        : "/api/payments";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }

      const paymentsData = await response.json();
      setPayments(paymentsData);
    } catch (error) {
      console.error("Error fetching payments:", error);
      alert("Failed to load payments");
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchNextReceiptNumber = async () => {
    try {
      const response = await fetch("/api/receipt-counter");
      if (response.ok) {
        const data = await response.json();
        setNextReceiptNumber(data.receiptNumber);
      }
    } catch (error) {
      console.error("Error fetching receipt number:", error);
    }
  };

  const syncReceiptCounter = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/receipt-counter/sync", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to sync receipt counter");
      }

      const result = await response.json();
      await fetchNextReceiptNumber();
      alert("Receipt counter synced successfully!");
    } catch (error) {
      console.error("Error syncing receipt counter:", error);
      alert("Failed to sync receipt counter");
    } finally {
      setSyncing(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // If user starts typing in customer name field manually, reset the selected customer flag
    if (field === "customerName" && !showCustomerDropdown) {
      setSelectedCustomerFromDropdown(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setFormData({
      customerName: customer.name,
      customerNumber: customer.number || "",
      customerEmail: customer.email || "",
      amount: formData.amount,
      paymentMethod: formData.paymentMethod,
      transactionId: formData.transactionId,
      dueDate: formData.dueDate,
      status: formData.status,
      balanceDue: formData.balanceDue,
    });
    setSelectedCustomerFromDropdown(true);
    setShowCustomerDropdown(false);

    // Focus on amount field after customer selection for better UX
    setTimeout(() => {
      const amountInput = document.getElementById("amount");
      if (amountInput) {
        (amountInput as HTMLInputElement).focus();
      }
    }, 100);
  };

  const handleCustomerInputFocus = () => {
    setShowCustomerDropdown(true);
  };

  const handleCustomerInputBlur = () => {
    // Delay hiding dropdown to allow for click selection
    setTimeout(() => {
      setShowCustomerDropdown(false);
    }, 200);
  };

  const handleManualInput = () => {
    // When user manually types in contact fields, mark as not selected from dropdown
    setSelectedCustomerFromDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.amount || !formData.paymentMethod) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.paymentMethod !== "CASH" && !formData.transactionId) {
      alert("Transaction ID is required for non-cash payments");
      return;
    }

    setLoading(true);

    try {
      // Get the next receipt number from the API (this will increment the counter)
      const receiptResponse = await fetch("/api/receipt-counter", {
        method: "POST",
      });

      if (!receiptResponse.ok) {
        const errorData = await receiptResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate receipt number");
      }

      const receiptData = await receiptResponse.json();
      const receiptNumber = receiptData.receiptNumber;

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: formData.customerName.trim(),
          customerNumber: formData.customerNumber.trim() || null,
          customerEmail: formData.customerEmail.trim() || null,
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          transactionId: formData.transactionId.trim() || null,
          receiptNumber,
          status: formData.status,
          dueDate: formData.dueDate || null,
          balanceDue: formData.balanceDue
            ? parseFloat(formData.balanceDue)
            : null,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create payment");
      }

      // Refresh the payments list and next receipt number
      await fetchPayments();
      await fetchNextReceiptNumber();
      await fetchCustomers(); // Refresh customers list to include the new one

      // Reset form
      setFormData({
        customerName: "",
        customerNumber: "",
        customerEmail: "",
        amount: "",
        paymentMethod: "",
        transactionId: "",
        dueDate: "",
        status: "DUE",
        balanceDue: "",
      });

      setSelectedCustomerFromDropdown(false);
      setShowCustomerDropdown(false);

      // Switch to payment history tab to see the new payment
      setActiveTab("payment-history");

      alert("Payment recorded successfully!");
    } catch (error) {
      console.error("Error creating payment:", error);
      alert(
        error instanceof Error ? error.message : "Failed to record payment"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) {
      return;
    }

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete payment");
      }

      // Refresh the payments list
      await fetchPayments();
      alert("Payment deleted successfully!");
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert("Failed to delete payment");
    }
  };

  const getPaymentMethodBadge = (method: Payment["paymentMethod"]) => {
    const config = {
      UPI: { label: "UPI", color: "bg-blue-100 text-blue-800" },
      CASH: { label: "Cash", color: "bg-green-100 text-green-800" },
      BANK_TRANSFER: {
        label: "Bank Transfer",
        color: "bg-purple-100 text-purple-800",
      },
      CARD: { label: "Card", color: "bg-orange-100 text-orange-800" },
    };

    const { label, color } = config[method];
    return (
      <Badge variant="secondary" className={color}>
        {label}
      </Badge>
    );
  };

  const getStatusBadge = (status: Payment["status"]) => {
    const config = {
      COMPLETED: {
        label: "Completed",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
      },
      DUE: {
        label: "Due",
        color: "bg-yellow-100 text-yellow-800",
        icon: <CalendarClock className="h-3 w-3 mr-1" />,
      },
      OVERDUE: {
        label: "Overdue",
        color: "bg-red-100 text-red-800",
        icon: <AlertTriangle className="h-3 w-3 mr-1" />,
      },
    };

    const statusConfig = config[status];
    const { label, color, icon } = statusConfig;
    return (
      <Badge variant="secondary" className={`flex items-center ${color}`}>
        {icon}
        {label}
      </Badge>
    );
  };

  // Helper function to get current financial year for display
  const getCurrentFinancialYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    if (month >= 4) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name
        .toLowerCase()
        .includes(formData.customerName.toLowerCase()) ||
      customer.number.includes(formData.customerName) ||
      customer.email
        ?.toLowerCase()
        .includes(formData.customerName.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Payment Management</h2>
            <p className="text-gray-600">
              Record payments and generate receipts
            </p>
          </div>
          <div className="flex gap-2">
            {nextReceiptNumber && (
              <Badge variant="outline" className="text-sm">
                Next Receipt: {nextReceiptNumber}
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={syncReceiptCounter}
              disabled={syncing}
            >
              {syncing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Sync Counter
            </Button>
          </div>
        </div>

        {/* Status Count Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-200 py-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600">
                    Completed
                  </p>
                  <p className="text-xl font-bold text-green-900">
                    {statusCounts.COMPLETED}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-4=2 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200 py-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-yellow-600">Due</p>
                  <p className="text-xl font-bold text-yellow-900">
                    {statusCounts.DUE}
                  </p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <CalendarClock className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200 py-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-600">Overdue</p>
                  <p className="text-xl font-bold text-red-900">
                    {statusCounts.OVERDUE}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full p-2 bg-gray-50">
              <TabsTrigger
                value="new-payment"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Payment
              </TabsTrigger>
              <TabsTrigger
                value="payment-history"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
              >
                <FileText className="h-4 w-4 mr-2" />
                Payment History ({payments.length})
              </TabsTrigger>
            </TabsList>

            {/* New Payment Tab - COMPLETE FORM */}
            <TabsContent value="new-payment" className="p-6">
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900">
                      Financial Year: {getCurrentFinancialYear()}
                    </h3>
                    <p className="text-blue-700 text-sm">
                      Next Receipt Number:{" "}
                      <span className="font-mono font-bold">
                        {nextReceiptNumber || "Loading..."}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      Auto-incrementing
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={syncReceiptCounter}
                      disabled={syncing}
                      className="text-xs"
                    >
                      {syncing ? (
                        <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      Sync
                    </Button>
                  </div>
                </div>
                <p className="text-blue-600 text-xs mt-2">
                  The receipt counter only increments when you create a payment.
                  Use "Sync" if you need to recalculate from existing payments.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Name with Enhanced Dropdown */}
                  <div className="space-y-2 md:col-span-2">
                    <Label
                      htmlFor="customerName"
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Customer Name *
                    </Label>
                    <div className="relative">
                      <Input
                        ref={customerInputRef}
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) =>
                          handleInputChange("customerName", e.target.value)
                        }
                        onFocus={handleCustomerInputFocus}
                        onBlur={handleCustomerInputBlur}
                        placeholder="Start typing customer name or click to see all customers"
                        required
                        className="pr-10"
                      />
                      <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />

                      {/* Enhanced Customer Dropdown */}
                      {showCustomerDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                              <div
                                key={customer.id}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                onClick={() => handleCustomerSelect(customer)}
                              >
                                <div className="font-medium text-gray-900">
                                  {customer.name}
                                </div>
                                {/* <div className="text-sm text-gray-600 mt-1">
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3" />
                                    {customer.number || "No phone"}
                                  </div>
                                  {customer.email && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <Mail className="h-3 w-3" />
                                      {customer.email}
                                    </div>
                                  )}
                                </div> */}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-gray-500 text-sm">
                              {formData.customerName
                                ? "No customers found"
                                : "Start typing to search customers"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {selectedCustomerFromDropdown
                        ? "✓ Customer selected from list"
                        : "Select a customer from dropdown or enter new customer details"}
                    </p>
                  </div>

                  {/* Customer Number */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="customerNumber"
                      className="flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      Customer Phone Number
                    </Label>
                    <Input
                      id="customerNumber"
                      type="tel"
                      value={formData.customerNumber}
                      onChange={(e) => {
                        handleInputChange("customerNumber", e.target.value);
                        handleManualInput();
                      }}
                      placeholder={
                        selectedCustomerFromDropdown
                          ? "Auto-filled from selected customer"
                          : "Enter phone number for new customer"
                      }
                      className={
                        selectedCustomerFromDropdown && formData.customerNumber
                          ? "bg-green-50 border-green-200"
                          : ""
                      }
                    />
                  </div>

                  {/* Customer Email */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="customerEmail"
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Customer Email
                    </Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => {
                        handleInputChange("customerEmail", e.target.value);
                        handleManualInput();
                      }}
                      placeholder={
                        selectedCustomerFromDropdown
                          ? "Auto-filled from selected customer"
                          : "Enter email for new customer"
                      }
                      className={
                        selectedCustomerFromDropdown && formData.customerEmail
                          ? "bg-green-50 border-green-200"
                          : ""
                      }
                    />
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4" />
                      Amount *
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) =>
                        handleInputChange("amount", e.target.value)
                      }
                      placeholder="Enter amount"
                      required
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="paymentMethod"
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      Payment Method *
                    </Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value: Payment["paymentMethod"]) =>
                        handleInputChange("paymentMethod", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="BANK_TRANSFER">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="CARD">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: Payment["status"]) =>
                        handleInputChange("status", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="DUE">Due</SelectItem>
                        <SelectItem value="OVERDUE">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="dueDate"
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Due Date
                    </Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        handleInputChange("dueDate", e.target.value)
                      }
                    />
                  </div>

                  {/* Balance Due */}
                  <div className="space-y-2">
                    <Label htmlFor="balanceDue">Balance Due</Label>
                    <Input
                      id="balanceDue"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.balanceDue}
                      onChange={(e) =>
                        handleInputChange("balanceDue", e.target.value)
                      }
                      placeholder="Enter balance due amount"
                    />
                  </div>

                  {/* Transaction ID */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="transactionId">
                      Transaction ID {formData.paymentMethod !== "CASH" && "*"}
                    </Label>
                    <Input
                      id="transactionId"
                      value={formData.transactionId}
                      onChange={(e) =>
                        handleInputChange("transactionId", e.target.value)
                      }
                      placeholder={
                        formData.paymentMethod === "CASH"
                          ? "Optional for cash payments"
                          : "Enter transaction ID"
                      }
                      required={formData.paymentMethod !== "CASH"}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={loading || !nextReceiptNumber}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        {selectedCustomerFromDropdown
                          ? "Create Payment"
                          : "Create New Customer & Payment"}
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        customerName: "",
                        customerNumber: "",
                        customerEmail: "",
                        amount: "",
                        paymentMethod: "",
                        transactionId: "",
                        dueDate: "",
                        status: "DUE",
                        balanceDue: "",
                      });
                      setSelectedCustomerFromDropdown(false);
                      setShowCustomerDropdown(false);
                    }}
                  >
                    Clear Form
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Payment History Tab */}
            <TabsContent value="payment-history" className="p-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by customer name, phone, email, or receipt number..."
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

                {/* Enhanced Payments Table */}
                {fetchLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading payments...</p>
                  </div>
                ) : payments.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Receipt No.
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment Info
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status & Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Transaction
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className="font-mono text-sm"
                              >
                                {payment.receiptNumber}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="font-medium text-gray-900">
                                  {payment.customerName}
                                </div>
                                <div className="text-sm text-gray-600 flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {payment.customerNumber || "No phone"}
                                </div>
                                <div className="text-sm text-gray-600 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {payment.customerEmail || "No email"}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                <div className="text-lg font-bold text-green-600">
                                  ₹{payment.amount.toFixed(2)}
                                </div>
                                <div className="flex items-center gap-2">
                                  {getPaymentMethodBadge(payment.paymentMethod)}
                                  {payment.balanceDue &&
                                  payment.balanceDue > 0 ? (
                                    <Badge
                                      variant="outline"
                                      className="text-orange-600 border-orange-200"
                                    >
                                      Balance: ₹{payment.balanceDue.toFixed(2)}
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-green-600 border-green-200"
                                    >
                                      Fully Paid
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                <div>{getStatusBadge(payment.status)}</div>
                                {payment.dueDate ? (
                                  <div className="text-sm text-gray-600 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Due:{" "}
                                    {new Date(
                                      payment.dueDate
                                    ).toLocaleDateString()}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500">
                                    No due date
                                  </div>
                                )}
                                <div className="text-xs text-gray-500">
                                  Created:{" "}
                                  {new Date(
                                    payment.createdAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                {payment.transactionId ? (
                                  <div className="space-y-1">
                                    <div className="font-medium">
                                      Transaction ID:
                                    </div>
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                      {payment.transactionId}
                                    </code>
                                  </div>
                                ) : (
                                  <span className="text-gray-500">
                                    No transaction ID
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <PaymentReceiptButton payment={payment} />

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDeletePayment(payment.id)
                                  }
                                  className="text-red-600 border-red-200 hover:bg-red-50"
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
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {searchTerm
                        ? "No Payments Found"
                        : "No Payments Recorded"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm
                        ? "Try adjusting your search terms."
                        : "Get started by recording your first payment."}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setActiveTab("new-payment")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Record First Payment
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
}
