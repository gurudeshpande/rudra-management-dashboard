// components/payment/PaymentManager.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  User,
  CreditCard,
  Trash2,
  RefreshCw,
  ChevronDown,
  Mail,
  Phone,
  IndianRupee,
  Calendar,
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

export default function PaymentManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextReceiptNumber, setNextReceiptNumber] = useState<string>("");
  const [syncing, setSyncing] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerFromDropdown, setSelectedCustomerFromDropdown] =
    useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);

  // Form state
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

  // Load customers and receipt number on component mount
  useEffect(() => {
    fetchCustomers();
    fetchNextReceiptNumber();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const customersData = await response.json();
        setCustomers(customersData);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
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

    if (field === "customerName" && !showCustomerDropdown) {
      setSelectedCustomerFromDropdown(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setFormData({
      ...formData,
      customerName: customer.name,
      customerNumber: customer.number || "",
      customerEmail: customer.email || "",
    });
    setSelectedCustomerFromDropdown(true);
    setShowCustomerDropdown(false);

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
    setTimeout(() => {
      setShowCustomerDropdown(false);
    }, 200);
  };

  const handleManualInput = () => {
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
          customerId:
            customers.find(
              (c) =>
                c.name === formData.customerName &&
                c.number === formData.customerNumber,
            )?.id || null,
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

      await fetchNextReceiptNumber();
      await fetchCustomers();

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

      alert("Payment recorded successfully!");
    } catch (error) {
      console.error("Error creating payment:", error);
      alert(
        error instanceof Error ? error.message : "Failed to record payment",
      );
    } finally {
      setLoading(false);
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
        .includes(formData.customerName.toLowerCase()),
  );

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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">New Payment</h1>
          <p className="text-sm text-gray-500 mt-1">
            Record a new payment and generate receipt
          </p>
        </div>

        {/* Receipt Info Card */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Financial Year: {getCurrentFinancialYear()}
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  Next Receipt:{" "}
                  <span className="font-mono">
                    {nextReceiptNumber || "---"}
                  </span>
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={syncReceiptCounter}
              disabled={syncing}
              className="text-xs"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 mr-1.5 ${
                  syncing ? "animate-spin" : ""
                }`}
              />
              {syncing ? "Syncing..." : "Sync Counter"}
            </Button>
          </div>
        </div>

        {/* Payment Form */}
        <Card>
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <CardTitle className="text-base font-medium">
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-sm font-medium">
                  Customer Name <span className="text-red-500">*</span>
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
                    placeholder="Search or enter customer name"
                    required
                    className="pr-10"
                  />
                  <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />

                  {/* Customer Dropdown */}
                  {showCustomerDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            <div className="font-medium text-gray-900">
                              {customer.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {customer.number && (
                                <span className="mr-3">{customer.number}</span>
                              )}
                              {customer.email && <span>{customer.email}</span>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          {formData.customerName
                            ? "No matching customers"
                            : "Type to search customers"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {selectedCustomerFromDropdown && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Customer selected from existing list
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Phone */}
                <div className="space-y-2">
                  <Label
                    htmlFor="customerNumber"
                    className="text-sm font-medium"
                  >
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="customerNumber"
                      type="tel"
                      value={formData.customerNumber}
                      onChange={(e) => {
                        handleInputChange("customerNumber", e.target.value);
                        handleManualInput();
                      }}
                      placeholder="Enter phone number"
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label
                    htmlFor="customerEmail"
                    className="text-sm font-medium"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => {
                        handleInputChange("customerEmail", e.target.value);
                        handleManualInput();
                      }}
                      placeholder="Enter email"
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">
                    Amount <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) =>
                        handleInputChange("amount", e.target.value)
                      }
                      placeholder="0.00"
                      required
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label
                    htmlFor="paymentMethod"
                    className="text-sm font-medium"
                  >
                    Payment Method <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value: Payment["paymentMethod"]) =>
                      handleInputChange("paymentMethod", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="BANK_TRANSFER">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Transaction ID - Show for non-cash payments */}
                {formData.paymentMethod &&
                  formData.paymentMethod !== "CASH" && (
                    <div className="space-y-2 md:col-span-2">
                      <Label
                        htmlFor="transactionId"
                        className="text-sm font-medium"
                      >
                        Transaction ID <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="transactionId"
                        value={formData.transactionId}
                        onChange={(e) =>
                          handleInputChange("transactionId", e.target.value)
                        }
                        placeholder="Enter transaction ID / UTR number"
                        required
                      />
                    </div>
                  )}

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
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
                  <Label htmlFor="dueDate" className="text-sm font-medium">
                    Due Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        handleInputChange("dueDate", e.target.value)
                      }
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Balance Due */}
                <div className="space-y-2">
                  <Label htmlFor="balanceDue" className="text-sm font-medium">
                    Balance Due
                  </Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="balanceDue"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.balanceDue}
                      onChange={(e) =>
                        handleInputChange("balanceDue", e.target.value)
                      }
                      placeholder="0.00"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center gap-3 pt-5 border-t border-gray-100 mt-6">
                <Button
                  type="submit"
                  disabled={loading || !nextReceiptNumber}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Record Payment
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
          </CardContent>
        </Card>

        {/* Note */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Fields marked with <span className="text-red-500">*</span> are
          required
        </p>
      </div>
    </DashboardLayout>
  );
}
