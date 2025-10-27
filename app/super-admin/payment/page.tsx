// components/payment/PaymentManager.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import PaymentReceiptPDF from "@/components/payment/PaymentReceiptPDF";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface Payment {
  id: string;
  customerName: string;
  customerNumber: string | null;
  amount: number;
  paymentMethod: "UPI" | "CASH" | "BANK_TRANSFER" | "CARD";
  transactionId: string | null;
  createdAt: string;
  receiptNumber: string;
}

export default function PaymentManager() {
  const [activeTab, setActiveTab] = useState("new-payment");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [nextReceiptNumber, setNextReceiptNumber] = useState<string>("");
  const [syncing, setSyncing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customerName: "",
    customerNumber: "",
    amount: "",
    paymentMethod: "" as Payment["paymentMethod"] | "",
    transactionId: "",
  });

  // Load payments from database on component mount and when search changes
  useEffect(() => {
    fetchPayments();
    fetchNextReceiptNumber();
  }, [searchTerm]);

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
        throw new Error("Failed to generate receipt number");
      }

      const receiptData = await receiptResponse.json();
      const receiptNumber = receiptData.receiptNumber;

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerNumber: formData.customerNumber || null,
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          transactionId: formData.transactionId || null,
          receiptNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment");
      }

      const newPayment = await response.json();

      // Refresh the payments list and next receipt number
      await fetchPayments();
      await fetchNextReceiptNumber();

      // Reset form
      setFormData({
        customerName: "",
        customerNumber: "",
        amount: "",
        paymentMethod: "",
        transactionId: "",
      });

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
      UPI: {
        label: "UPI",
        variant: "default" as const,
        color: "bg-blue-100 text-blue-800",
      },
      CASH: {
        label: "Cash",
        variant: "secondary" as const,
        color: "bg-green-100 text-green-800",
      },
      BANK_TRANSFER: {
        label: "Bank Transfer",
        variant: "outline" as const,
        color: "bg-purple-100 text-purple-800",
      },
      CARD: {
        label: "Card",
        variant: "destructive" as const,
        color: "bg-orange-100 text-orange-800",
      },
    };

    const { label, color } = config[method];
    return (
      <Badge variant="secondary" className={color}>
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

            {/* New Payment Tab */}
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
                {/* ... rest of the form remains the same ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="customerName"
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Customer Name *
                    </Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) =>
                        handleInputChange("customerName", e.target.value)
                      }
                      placeholder="Enter customer name"
                      required
                    />
                  </div>

                  {/* Customer Number */}
                  <div className="space-y-2">
                    <Label htmlFor="customerNumber">
                      Customer Phone Number
                    </Label>
                    <Input
                      id="customerNumber"
                      type="tel"
                      value={formData.customerNumber}
                      onChange={(e) =>
                        handleInputChange("customerNumber", e.target.value)
                      }
                      placeholder="Enter phone number"
                    />
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Amount *
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
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
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
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

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={loading || !nextReceiptNumber}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading
                      ? "Processing..."
                      : `Generate Receipt ${nextReceiptNumber}`}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        customerName: "",
                        customerNumber: "",
                        amount: "",
                        paymentMethod: "",
                        transactionId: "",
                      });
                    }}
                  >
                    Clear Form
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Payment History Tab - remains the same */}
            <TabsContent value="payment-history" className="p-6">
              {/* ... payment history tab remains unchanged ... */}
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by customer name, phone, or receipt number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Payments List */}
                {fetchLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading payments...</p>
                  </div>
                ) : payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <Card
                        key={payment.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-4">
                                <h3 className="font-semibold text-lg">
                                  {payment.customerName}
                                </h3>
                                {getPaymentMethodBadge(payment.paymentMethod)}
                                <Badge variant="outline" className="font-mono">
                                  {payment.receiptNumber}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Phone:</span>
                                  <span>{payment.customerNumber || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Amount:</span>
                                  <span className="font-bold text-green-600">
                                    ₹{payment.amount.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {new Date(
                                      payment.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              {payment.transactionId && (
                                <div className="text-sm">
                                  <span className="font-medium">
                                    Transaction ID:
                                  </span>
                                  <span className="ml-2 font-mono text-gray-700">
                                    {payment.transactionId}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 ml-4">
                              <PaymentReceiptPDF payment={payment}>
                                {({ loading, generatePDF }) => (
                                  <Button
                                    size="sm"
                                    onClick={generatePDF}
                                    disabled={loading}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {loading ? (
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4 mr-2" />
                                    )}
                                    Download
                                  </Button>
                                )}
                              </PaymentReceiptPDF>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletePayment(payment.id)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
