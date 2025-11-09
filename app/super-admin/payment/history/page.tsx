// app/super-admin/payment/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Download,
  Calendar,
  IndianRupee,
  User,
  Phone,
  Mail,
  FileText,
  Users,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import PaymentReceiptPDF from "@/components/payment/PaymentReceiptPDF";
import AllPaymentsPDF from "@/components/AllPaymentPDF/AllPaymentPDF";

interface Customer {
  id: number;
  name: string;
  number: string;
  email?: string;
  totalPayments: number;
  totalAmount: number;
  lastPaymentDate: string;
  uniqueContactVariations?: number;
}

interface Payment {
  id: string;
  customerName: string;
  customerNumber: string | null;
  customerEmail?: string;
  amount: number;
  paymentMethod: "UPI" | "CASH" | "BANK_TRANSFER" | "CARD";
  transactionId: string | null;
  createdAt: string;
  receiptNumber: string;
  status: "COMPLETED" | "DUE" | "OVERDUE";
  dueDate?: string;
  balanceDue?: number;
}

// Create a wrapper component for individual payment receipt download
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

// Component for bulk PDF export of filtered payments
// Updated BulkExportPDF component in your page.tsx
function BulkExportPDF({
  payments,
  searchTerm,
  customerName,
}: {
  payments: Payment[];
  searchTerm: string;
  customerName?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleBulkDownload = async () => {
    if (payments.length === 0) {
      alert("No payments to export");
      return;
    }

    setLoading(true);
    try {
      // Create a single PDF with all payments
      const blob = await pdf(
        <AllPaymentsPDF
          payments={payments}
          searchTerm={searchTerm}
          customerName={customerName}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      // Generate filename based on search and customer
      let filename = "all-payments";
      if (customerName) {
        filename = `${customerName
          .toLowerCase()
          .replace(/\s+/g, "-")}-payments`;
      }
      if (searchTerm) {
        filename += `-filtered-${searchTerm
          .toLowerCase()
          .replace(/\s+/g, "-")}`;
      }
      filename += `-${new Date().toISOString().split("T")[0]}.pdf`;

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`Successfully exported ${payments.length} payments to PDF`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to export payments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleBulkDownload}
      disabled={loading || payments.length === 0}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Export All PDF ({payments.length})
        </>
      )}
    </Button>
  );
}

export default function PaymentHistoryPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [customerPayments, setCustomerPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch customers when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [customerSearch]);

  // Fetch payments when customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerPayments(selectedCustomer.name);
    }
  }, [selectedCustomer]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const url = customerSearch
        ? `/api/payments/customers?search=${encodeURIComponent(customerSearch)}`
        : "/api/payments/customers";

      const response = await fetch(url);
      if (response.ok) {
        const customersData = await response.json();
        console.log("Grouped customers data:", customersData);
        setCustomers(customersData);

        // Auto-select first customer if available and no customer is selected
        if (customersData.length > 0 && !selectedCustomer) {
          setSelectedCustomer(customersData[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerPayments = async (customerName: string) => {
    try {
      setPaymentsLoading(true);
      const response = await fetch(
        `/api/payments?search=${encodeURIComponent(customerName)}`
      );
      if (response.ok) {
        const paymentsData = await response.json();
        console.log(
          "All payments for customer",
          customerName,
          ":",
          paymentsData
        );
        // Filter payments for this specific customer name
        const customerSpecificPayments = paymentsData.filter(
          (payment: Payment) =>
            payment.customerName.toLowerCase() === customerName.toLowerCase()
        );
        setCustomerPayments(customerSpecificPayments);
      }
    } catch (error) {
      console.error("Error fetching customer payments:", error);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const filteredCustomers = customers;

  const filteredPayments = customerPayments.filter(
    (payment) =>
      payment.receiptNumber
        .toLowerCase()
        .includes(paymentSearch.toLowerCase()) ||
      payment.transactionId
        ?.toLowerCase()
        .includes(paymentSearch.toLowerCase()) ||
      payment.paymentMethod
        .toLowerCase()
        .includes(paymentSearch.toLowerCase()) ||
      payment.amount.toString().includes(paymentSearch)
  );

  const getPaymentMethodBadge = (method: Payment["paymentMethod"]) => {
    const config = {
      UPI: { label: "UPI", color: "bg-blue-100 text-blue-800 border-blue-200" },
      CASH: {
        label: "Cash",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      BANK_TRANSFER: {
        label: "Bank Transfer",
        color: "bg-purple-100 text-purple-800 border-purple-200",
      },
      CARD: {
        label: "Card",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      },
    };
    return config[method];
  };

  const getStatusBadge = (status: Payment["status"]) => {
    const config = {
      COMPLETED: {
        label: "Completed",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      DUE: {
        label: "Due",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      OVERDUE: {
        label: "Overdue",
        color: "bg-red-100 text-red-800 border-red-200",
      },
    };
    return config[status];
  };

  // Calculate statistics for the selected customer
  const totalAmount = filteredPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const completedPayments = filteredPayments.filter(
    (p) => p.status === "COMPLETED"
  ).length;
  const duePayments = filteredPayments.filter((p) => p.status === "DUE").length;
  const overduePayments = filteredPayments.filter(
    (p) => p.status === "OVERDUE"
  ).length;

  // Get unique contact variations from the payments
  const getUniqueContactVariations = () => {
    const variations = new Set();
    customerPayments.forEach((payment) => {
      const key = `${payment.customerNumber || "No Phone"}|${
        payment.customerEmail || "No Email"
      }`;
      variations.add(key);
    });
    return variations.size;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Payment History</h2>
            <p className="text-gray-600">
              View and manage customer payment records - Grouped by customer
              name
            </p>
          </div>
        </div>

        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Left Side - Customers List (40%) */}
          <div className="w-2/5 flex flex-col">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customers ({customers.length})
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search customers by name..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-y-auto max-h-[500px]">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filteredCustomers.length > 0 ? (
                    <div className="space-y-1 p-2">
                      {filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          className={`p-4 rounded-lg cursor-pointer transition-all border ${
                            selectedCustomer?.id === customer.id
                              ? "bg-blue-50 border-blue-200 shadow-sm"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {customer.name}
                            </h3>
                            <div className="flex flex-col items-end gap-1">
                              <Badge
                                variant="outline"
                                className="bg-gray-100 whitespace-nowrap text-xs"
                              >
                                {customer.totalPayments} payments
                              </Badge>
                              <div className="text-xs text-green-600 font-semibold">
                                ₹{customer.totalAmount.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                <span>{customer.number || "No phone"}</span>
                              </div>
                              {customer.uniqueContactVariations &&
                                customer.uniqueContactVariations > 1 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                                  >
                                    <Users className="h-3 w-3 mr-1" />
                                    {customer.uniqueContactVariations} contacts
                                  </Badge>
                                )}
                            </div>

                            {customer.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">
                                  {customer.email}
                                </span>
                              </div>
                            )}

                            {customer.lastPaymentDate && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  Last:{" "}
                                  {new Date(
                                    customer.lastPaymentDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No customers found</p>
                      {customerSearch && (
                        <p className="text-sm mt-1">
                          Try adjusting your search
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Payment History (60%) */}
          <div className="w-3/5 flex flex-col">
            <Card className="flex-1">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Payment History
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    {selectedCustomer && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-gray-600">
                          Total:{" "}
                          <span className="font-semibold text-green-600">
                            ₹{totalAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                            {completedPayments} Completed
                          </Badge>
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                            {duePayments} Due
                          </Badge>
                          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                            {overduePayments} Overdue
                          </Badge>
                        </div>
                      </div>
                    )}
                    {/* Bulk PDF Export Button */}
                    {selectedCustomer && filteredPayments.length > 0 && (
                      <BulkExportPDF
                        payments={filteredPayments}
                        searchTerm={paymentSearch}
                        customerName={selectedCustomer.name}
                      />
                    )}
                  </div>
                </div>

                {selectedCustomer && (
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">Total Payments:</span>{" "}
                      {customerPayments.length}
                    </div>
                    {getUniqueContactVariations() > 1 && (
                      <div>
                        <span className="font-medium">Contact Variations:</span>{" "}
                        {getUniqueContactVariations()}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search payments by receipt number, transaction ID, amount, or payment method..."
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      className="pl-10"
                      disabled={!selectedCustomer}
                    />
                  </div>
                  {paymentSearch && (
                    <Button
                      variant="outline"
                      onClick={() => setPaymentSearch("")}
                      className="whitespace-nowrap"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {!selectedCustomer ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <User className="h-16 w-16 mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">
                      Select a Customer
                    </h3>
                    <p>
                      Choose a customer from the list to view their payment
                      history
                    </p>
                  </div>
                ) : paymentsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredPayments.length > 0 ? (
                  <div className="overflow-y-auto max-h-[500px]">
                    <div className="space-y-4 p-4">
                      {filteredPayments.map((payment) => {
                        const methodConfig = getPaymentMethodBadge(
                          payment.paymentMethod
                        );
                        const statusConfig = getStatusBadge(payment.status);

                        return (
                          <div
                            key={payment.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <Badge
                                    variant="outline"
                                    className="font-mono text-xs bg-gray-50"
                                  >
                                    #{payment.receiptNumber}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${methodConfig.color}`}
                                  >
                                    {methodConfig.label}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${statusConfig.color}`}
                                  >
                                    {statusConfig.label}
                                  </Badge>
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                  ₹{payment.amount.toFixed(2)}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <PaymentReceiptButton payment={payment} />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <div className="font-medium mb-1 text-xs text-gray-500 uppercase tracking-wide">
                                  Transaction Details
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm">
                                    <span className="font-medium">Date:</span>{" "}
                                    {new Date(
                                      payment.createdAt
                                    ).toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </div>
                                  {payment.transactionId && (
                                    <div className="text-sm">
                                      <span className="font-medium">
                                        Transaction ID:
                                      </span>{" "}
                                      <code className="bg-gray-100 px-1 rounded text-xs">
                                        {payment.transactionId}
                                      </code>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="font-medium mb-1 text-xs text-gray-500 uppercase tracking-wide">
                                  Balance Information
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm">
                                    <span className="font-medium">
                                      Balance Due:
                                    </span>{" "}
                                    <span
                                      className={
                                        payment.balanceDue &&
                                        payment.balanceDue > 0
                                          ? "text-red-600 font-semibold"
                                          : "text-green-600"
                                      }
                                    >
                                      ₹
                                      {payment.balanceDue?.toFixed(2) || "0.00"}
                                    </span>
                                  </div>
                                  {payment.dueDate && (
                                    <div className="text-sm">
                                      <span className="font-medium">
                                        Due Date:
                                      </span>{" "}
                                      {new Date(
                                        payment.dueDate
                                      ).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Show contact details for each payment */}
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="text-xs text-gray-500 uppercase font-medium mb-1">
                                Contact Details for this Payment
                              </div>
                              <div className="flex gap-4 text-sm">
                                {payment.customerNumber ? (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{payment.customerNumber}</span>
                                  </div>
                                ) : (
                                  <div className="text-gray-400 text-sm">
                                    No phone
                                  </div>
                                )}
                                {payment.customerEmail ? (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    <span>{payment.customerEmail}</span>
                                  </div>
                                ) : (
                                  <div className="text-gray-400 text-sm">
                                    No email
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <FileText className="h-16 w-16 mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Payments Found
                    </h3>
                    <p>
                      {paymentSearch
                        ? "No payments match your search criteria"
                        : "No payment history available for this customer"}
                    </p>
                    {paymentSearch && (
                      <Button
                        variant="outline"
                        onClick={() => setPaymentSearch("")}
                        className="mt-2"
                      >
                        Clear Search
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
