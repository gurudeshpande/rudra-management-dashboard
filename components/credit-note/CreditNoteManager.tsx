"use client";

import { useState, useEffect, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  Receipt,
  ArrowLeftRight,
  Tag,
  FileWarning,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface Customer {
  id: number;
  name: string;
  number: string;
  address?: string;
  email?: string;
}

interface CreditNote {
  id: string;
  creditNoteNumber: string;
  invoiceNumber?: string;
  customerId: number;
  customer: Customer;
  issueDate: string;
  reason: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  status: "DRAFT" | "ISSUED" | "CANCELLED" | "APPLIED";
  appliedToInvoice: boolean;
  appliedDate?: string;
  appliedInvoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CreditNoteManager() {
  const [activeTab, setActiveTab] = useState("new-credit-note");
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [nextCreditNoteNumber, setNextCreditNoteNumber] = useState<string>("");
  const [syncing, setSyncing] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerFromDropdown, setSelectedCustomerFromDropdown] =
    useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    customerNumber: "",
    customerEmail: "",
    invoiceNumber: "",
    reason: "",
    amount: "",
    taxAmount: "",
    notes: "",
    status: "DRAFT" as CreditNote["status"],
  });

  // Status counts
  const statusCounts = {
    DRAFT: creditNotes.filter((note) => note.status === "DRAFT").length,
    ISSUED: creditNotes.filter((note) => note.status === "ISSUED").length,
    CANCELLED: creditNotes.filter((note) => note.status === "CANCELLED").length,
    APPLIED: creditNotes.filter((note) => note.status === "APPLIED").length,
  };

  // Total credit amount by status
  const totalAmounts = {
    DRAFT: creditNotes
      .filter((note) => note.status === "DRAFT")
      .reduce((sum, note) => sum + note.totalAmount, 0),
    ISSUED: creditNotes
      .filter((note) => note.status === "ISSUED")
      .reduce((sum, note) => sum + note.totalAmount, 0),
    CANCELLED: creditNotes
      .filter((note) => note.status === "CANCELLED")
      .reduce((sum, note) => sum + note.totalAmount, 0),
    APPLIED: creditNotes
      .filter((note) => note.status === "APPLIED")
      .reduce((sum, note) => sum + note.totalAmount, 0),
  };

  // Load data on component mount
  useEffect(() => {
    fetchCreditNotes();
    fetchNextCreditNoteNumber();
    fetchCustomers();
  }, []);

  // Fetch credit notes when search term changes
  useEffect(() => {
    if (activeTab === "credit-note-history") {
      fetchCreditNotes();
    }
  }, [searchTerm, activeTab]);

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

  const fetchCreditNotes = async () => {
    setFetchLoading(true);
    try {
      const url = searchTerm
        ? `/api/credit-notes?search=${encodeURIComponent(searchTerm)}`
        : "/api/credit-notes";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch credit notes");
      }

      const creditNotesData = await response.json();
      setCreditNotes(creditNotesData);
    } catch (error) {
      console.error("Error fetching credit notes:", error);
      alert("Failed to load credit notes");
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchNextCreditNoteNumber = async () => {
    try {
      const response = await fetch("/api/credit-note-counter");
      if (response.ok) {
        const data = await response.json();
        setNextCreditNoteNumber(data.creditNoteNumber);
      }
    } catch (error) {
      console.error("Error fetching credit note number:", error);
    }
  };

  const syncCounter = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/credit-note-counter", {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to sync counter");
      }

      await fetchNextCreditNoteNumber();
      alert("Counter synced successfully!");
    } catch (error) {
      console.error("Error syncing counter:", error);
      alert("Failed to sync counter");
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
      customerId: customer.id.toString(),
      customerName: customer.name,
      customerNumber: customer.number || "",
      customerEmail: customer.email || "",
    });
    setSelectedCustomerFromDropdown(true);
    setShowCustomerDropdown(false);
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

    if (!formData.customerId || !formData.reason || !formData.amount) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Get the next credit note number
      const counterResponse = await fetch("/api/credit-note-counter", {
        method: "POST",
      });

      if (!counterResponse.ok) {
        const errorData = await counterResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to generate credit note number"
        );
      }

      const counterData = await counterResponse.json();
      const creditNoteNumber = counterData.receiptNumber;

      // Create credit note
      const response = await fetch("/api/credit-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: parseInt(formData.customerId),
          invoiceNumber: formData.invoiceNumber.trim() || null,
          reason: formData.reason,
          amount: parseFloat(formData.amount),
          taxAmount: parseFloat(formData.taxAmount || "0"),
          notes: formData.notes.trim() || null,
          status: formData.status,
          creditNoteNumber,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create credit note");
      }

      // Refresh data
      await fetchCreditNotes();
      await fetchNextCreditNoteNumber();

      // Reset form
      setFormData({
        customerId: "",
        customerName: "",
        customerNumber: "",
        customerEmail: "",
        invoiceNumber: "",
        reason: "",
        amount: "",
        taxAmount: "",
        notes: "",
        status: "DRAFT",
      });

      setSelectedCustomerFromDropdown(false);
      setShowCustomerDropdown(false);

      // Switch to history tab
      setActiveTab("credit-note-history");

      alert("Credit note created successfully!");
    } catch (error) {
      console.error("Error creating credit note:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create credit note"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: CreditNote["status"]
  ) => {
    if (
      !confirm(
        `Are you sure you want to ${status.toLowerCase()} this credit note?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/credit-notes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update credit note");
      }

      await fetchCreditNotes();
      alert(`Credit note ${status.toLowerCase()} successfully!`);
    } catch (error) {
      console.error("Error updating credit note:", error);
      alert("Failed to update credit note");
    }
  };

  const handleDeleteCreditNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this credit note?")) {
      return;
    }

    try {
      const response = await fetch(`/api/credit-notes?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete credit note");
      }

      await fetchCreditNotes();
      alert("Credit note deleted successfully!");
    } catch (error) {
      console.error("Error deleting credit note:", error);
      alert("Failed to delete credit note");
    }
  };

  const getStatusBadge = (status: CreditNote["status"]) => {
    const config = {
      DRAFT: {
        label: "Draft",
        color: "bg-gray-100 text-gray-800",
        icon: <FileText className="h-3 w-3 mr-1" />,
      },
      ISSUED: {
        label: "Issued",
        color: "bg-blue-100 text-blue-800",
        icon: <Receipt className="h-3 w-3 mr-1" />,
      },
      CANCELLED: {
        label: "Cancelled",
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="h-3 w-3 mr-1" />,
      },
      APPLIED: {
        label: "Applied",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
      },
    };

    const { label, color, icon } = config[status];
    return (
      <Badge variant="secondary" className={`flex items-center ${color}`}>
        {icon}
        {label}
      </Badge>
    );
  };

  const getReasonBadge = (reason: string) => {
    const config: Record<string, { label: string; color: string }> = {
      RETURN: { label: "Return", color: "bg-orange-100 text-orange-800" },
      DISCOUNT: { label: "Discount", color: "bg-purple-100 text-purple-800" },
      ADJUSTMENT: {
        label: "Adjustment",
        color: "bg-yellow-100 text-yellow-800",
      },
      CANCELLATION: { label: "Cancellation", color: "bg-red-100 text-red-800" },
      OVERPAYMENT: {
        label: "Overpayment",
        color: "bg-green-100 text-green-800",
      },
    };

    const defaultConfig = { label: reason, color: "bg-gray-100 text-gray-800" };
    const { label, color } = config[reason] || defaultConfig;

    return (
      <Badge variant="secondary" className={color}>
        {label}
      </Badge>
    );
  };

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
            <h2 className="text-3xl font-bold">Credit Note Management</h2>
            <p className="text-gray-600">
              Issue and manage customer credit notes
            </p>
          </div>
          <div className="flex gap-2">
            {nextCreditNoteNumber && (
              <Badge variant="outline" className="text-sm">
                Next CN: {nextCreditNoteNumber}
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={syncCounter}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 border-blue-200 py-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600">Draft</p>
                  <p className="text-xl font-bold text-blue-900">
                    {statusCounts.DRAFT}
                  </p>
                  <p className="text-xs text-blue-700">
                    ₹{totalAmounts.DRAFT.toFixed(2)}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200 py-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600">Issued</p>
                  <p className="text-xl font-bold text-green-900">
                    {statusCounts.ISSUED}
                  </p>
                  <p className="text-xs text-green-700">
                    ₹{totalAmounts.ISSUED.toFixed(2)}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <Receipt className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200 py-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-600">Applied</p>
                  <p className="text-xl font-bold text-purple-900">
                    {statusCounts.APPLIED}
                  </p>
                  <p className="text-xs text-purple-700">
                    ₹{totalAmounts.APPLIED.toFixed(2)}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-gray-200 py-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Cancelled</p>
                  <p className="text-xl font-bold text-gray-900">
                    {statusCounts.CANCELLED}
                  </p>
                  <p className="text-xs text-gray-700">
                    ₹{totalAmounts.CANCELLED.toFixed(2)}
                  </p>
                </div>
                <div className="p-2 bg-gray-100 rounded-full">
                  <XCircle className="h-4 w-4 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full p-2 bg-gray-50">
              <TabsTrigger
                value="new-credit-note"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Credit Note
              </TabsTrigger>
              <TabsTrigger
                value="credit-note-history"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
              >
                <FileText className="h-4 w-4 mr-2" />
                Credit Note History ({creditNotes.length})
              </TabsTrigger>
            </TabsList>

            {/* New Credit Note Tab */}
            <TabsContent value="new-credit-note" className="p-6">
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900">
                      Next Credit Note Number
                    </h3>
                    <p className="text-blue-700 text-sm">
                      <span className="font-mono font-bold">
                        {nextCreditNoteNumber || "Loading..."}
                      </span>
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    Auto-incrementing
                  </Badge>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Name */}
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
                        placeholder="Search or select customer"
                        required
                        className="pr-10"
                      />
                      <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />

                      {showCustomerDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                              <div
                                key={customer.id}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => handleCustomerSelect(customer)}
                              >
                                <div className="font-medium text-gray-900">
                                  {customer.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {customer.number || "No phone"}
                                </div>
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
                  </div>

                  {/* Invoice Number */}
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">
                      Original Invoice Number
                    </Label>
                    <Input
                      id="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={(e) =>
                        handleInputChange("invoiceNumber", e.target.value)
                      }
                      placeholder="Optional - Reference invoice number"
                    />
                  </div>

                  {/* Reason */}
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason *</Label>
                    <Select
                      value={formData.reason}
                      onValueChange={(value) =>
                        handleInputChange("reason", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="RETURN">Return of Goods</SelectItem>
                        <SelectItem value="DISCOUNT">
                          Price Adjustment/Discount
                        </SelectItem>
                        <SelectItem value="ADJUSTMENT">
                          Billing Adjustment
                        </SelectItem>
                        <SelectItem value="CANCELLATION">
                          Order Cancellation
                        </SelectItem>
                        <SelectItem value="OVERPAYMENT">Overpayment</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
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

                  {/* Tax Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="taxAmount">Tax Amount</Label>
                    <Input
                      id="taxAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.taxAmount}
                      onChange={(e) =>
                        handleInputChange("taxAmount", e.target.value)
                      }
                      placeholder="Enter tax amount"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: CreditNote["status"]) =>
                        handleInputChange("status", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ISSUED">Issued</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        handleInputChange("notes", e.target.value)
                      }
                      placeholder="Additional notes or description"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={loading || !nextCreditNoteNumber}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Credit Note
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        customerId: "",
                        customerName: "",
                        customerNumber: "",
                        customerEmail: "",
                        invoiceNumber: "",
                        reason: "",
                        amount: "",
                        taxAmount: "",
                        notes: "",
                        status: "DRAFT",
                      });
                      setSelectedCustomerFromDropdown(false);
                    }}
                  >
                    Clear Form
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Credit Note History Tab */}
            <TabsContent value="credit-note-history" className="p-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by customer, credit note number, or invoice..."
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

                {/* Credit Notes Table */}
                {fetchLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading credit notes...</p>
                  </div>
                ) : creditNotes.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Credit Note No.
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer & Invoice
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reason & Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status & Dates
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {creditNotes.map((note) => (
                          <tr key={note.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className="font-mono text-sm"
                              >
                                {note.creditNoteNumber}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="font-medium text-gray-900">
                                  {note.customer.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {note.customer.number || "No phone"}
                                </div>
                                {note.invoiceNumber && (
                                  <div className="text-sm text-gray-500">
                                    Invoice: {note.invoiceNumber}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                <div>{getReasonBadge(note.reason)}</div>
                                <div className="text-lg font-bold text-red-600">
                                  -₹{note.totalAmount.toFixed(2)}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Base: ₹{note.amount.toFixed(2)}
                                  {note.taxAmount > 0 && (
                                    <span>
                                      {" "}
                                      + Tax: ₹{note.taxAmount.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                {note.notes && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {note.notes}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                <div>{getStatusBadge(note.status)}</div>
                                <div className="text-sm text-gray-600">
                                  <Calendar className="h-3 w-3 inline mr-1" />
                                  Issued:{" "}
                                  {new Date(
                                    note.issueDate
                                  ).toLocaleDateString()}
                                </div>
                                {note.appliedToInvoice && (
                                  <div className="text-sm text-green-600">
                                    <CheckCircle className="h-3 w-3 inline mr-1" />
                                    Applied to invoice
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                {/* Status Update Buttons */}
                                {note.status === "DRAFT" && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleUpdateStatus(note.id, "ISSUED")
                                    }
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    Issue
                                  </Button>
                                )}

                                {note.status === "ISSUED" && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleUpdateStatus(note.id, "APPLIED")
                                      }
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      Apply
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleUpdateStatus(note.id, "CANCELLED")
                                      }
                                      className="text-red-600 border-red-200"
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                )}

                                {/* Delete button (only for DRAFT) */}
                                {note.status === "DRAFT" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleDeleteCreditNote(note.id)
                                    }
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}

                                {/* Download/View button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // TODO: Implement credit note PDF generation
                                    alert("PDF generation coming soon!");
                                  }}
                                >
                                  <Download className="h-4 w-4" />
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
                    <FileWarning className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {searchTerm
                        ? "No Credit Notes Found"
                        : "No Credit Notes Issued"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm
                        ? "Try adjusting your search terms."
                        : "Get started by issuing your first credit note."}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setActiveTab("new-credit-note")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Issue First Credit Note
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
