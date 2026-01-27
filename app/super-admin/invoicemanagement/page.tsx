"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Prisma } from "@prisma/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Eye,
  Pencil,
  Trash2,
  Search,
  FileText,
  Plus,
  Download,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

// Import shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Import the new download preview component
import InvoiceDownloadPreview from "@/components/InvoiceDownload/InvoiceDownloadPreview";

// Define types based on your Prisma schema
type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: {
    customer: true;
    shipping: true;
    items: true;
  };
}>;

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<
    InvoiceWithRelations[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [selectedInvoice, setSelectedInvoice] =
    useState<InvoiceWithRelations | null>(null);
  const [mode, setMode] = useState<"view" | "edit" | null>(null);
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [sendingWhatsApp, setSendingWhatsApp] = useState<number | null>(null);

  // New state for download preview
  const [showDownloadPreview, setShowDownloadPreview] = useState(false);
  const [invoiceForDownload, setInvoiceForDownload] =
    useState<InvoiceWithRelations | null>(null);

  const router = useRouter();

  // Add entity filter options
  const entityFilterOptions = [
    { value: "ALL", label: "All Entities" },
    { value: "RUDRA", label: "Rudra Arts & Handicrafts" },
    { value: "YADNYASENI", label: "Yadnyaseni Creations" },
  ];

  // Theme colors
  const themeColor = "#954C2E";
  const themeLight = "#F5E9E4";

  // Update your fetchInvoices function
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }

      if (statusFilter !== "ALL") {
        queryParams.append("status", statusFilter);
      }

      if (entityFilter !== "ALL") {
        queryParams.append("entity", entityFilter); // Add entity filter
      }

      const response = await fetch(
        `/api/allinvoices/getallinvoices?${queryParams.toString()}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setInvoices(data);
      setFilteredInvoices(data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setInvoices([]);
      setFilteredInvoices([]);
      toast.error("Failed to fetch invoices", {
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [searchTerm, statusFilter, entityFilter]); // Add entityFilter here

  const sendWhatsAppInvoice = async (invoiceId: number) => {
    try {
      setSendingWhatsApp(invoiceId);

      const response = await fetch(`/api/invoices/${invoiceId}/send-whatsapp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        // Show success toast with clickable link
        toast.custom(
          (t) => (
            <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    WhatsApp Link Generated
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Click to open WhatsApp and send invoice to customer
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        window.open(data.data.whatsappUrl, "_blank");
                        toast.dismiss(t);
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Open WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(data.data.invoiceUrl);
                        toast.success("Invoice link copied to clipboard");
                        toast.dismiss(t);
                      }}
                    >
                      Copy Invoice Link
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ),
          {
            duration: 10000, // Show for 10 seconds
          },
        );
      } else {
        toast.error("Failed to generate WhatsApp link", {
          description: data.error || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate WhatsApp link", {
        description: "An unexpected error occurred",
      });
    } finally {
      setSendingWhatsApp(null);
    }
  };

  const statusFilterOptions = [
    { value: "ALL", label: "All Statuses" },
    { value: "PAID", label: "Paid" },
    { value: "UNPAID", label: "Unpaid" },
    { value: "ADVANCE", label: "Advance" },
  ];

  // Handle invoice deletion
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/allinvoices/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove the deleted invoice from state
        setInvoices(invoices.filter((invoice) => invoice.id !== id));
        setFilteredInvoices(
          filteredInvoices.filter((invoice) => invoice.id !== id),
        );
        setDeleteConfirm(null);
        toast.success("Invoice deleted successfully", {
          description: "The invoice has been permanently removed.",
        });
      } else {
        const data = await response.json();
        console.error("Error deleting invoice:", data.error);
        toast.error("Failed to delete invoice", {
          description: data.error || "Please try again.",
        });
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice", {
        description: "An unexpected error occurred.",
      });
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Get status badge variant
  const getStatusVariant = (
    status: string,
  ): "default" | "secondary" | "destructive" | "outline" | undefined => {
    switch (status) {
      case "PAID":
        return "default";
      case "UNPAID":
        return "destructive";
      case "ADVANCE":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-green-600 text-white hover:bg-green-700">
            PAID
          </Badge>
        );
      case "UNPAID":
        return (
          <Badge className="bg-red-600 text-white hover:bg-red-700">
            UNPAID
          </Badge>
        );
      case "ADVANCE":
        return (
          <Badge className="bg-amber-500 text-white hover:bg-amber-600">
            ADVANCE
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Export filtered invoices to Excel
  const exportToExcel = () => {
    if (filteredInvoices.length === 0) {
      toast.info("No data to export", {
        description: "There are no invoices matching your current filters.",
      });
      return;
    }

    try {
      let csvContent =
        "Invoice Number,Customer Name,Customer Phone,Date,Due Date,Total Amount,Advance Paid,Balance Due,Status,Billing Entity\n";

      let overallTotal = 0;
      let overallAdvancePaid = 0;
      let overallBalanceDue = 0;

      filteredInvoices.forEach((invoice) => {
        let balanceDue = invoice.subtotal - invoice.advancePaid;

        if (invoice.advancePaid <= 0) {
          balanceDue = 0;
        }

        overallTotal += invoice.subtotal;
        overallAdvancePaid += invoice.advancePaid;
        overallBalanceDue += balanceDue;

        const row = [
          `"${invoice.invoiceNumber}"`,
          `"${invoice.customer.name}"`,
          `"${invoice.customer.number}"`,
          `"${formatDate(invoice.invoiceDate)}"`,
          `"${formatDate(invoice.dueDate)}"`,
          `"${invoice.subtotal}"`,
          `"${invoice.advancePaid}"`,
          `"${balanceDue}"`,
          `"${invoice.status}"`,
          `"${invoice.companyType || "RUDRA"}"`,
        ].join(",");

        csvContent += row + "\n";
      });

      csvContent += "\n";
      csvContent += `"","","","","","TOTAL: ${overallTotal}","ADVANCE: ${overallAdvancePaid}","BALANCE: ${overallBalanceDue}","",""\n`;
      csvContent += "\n";
      csvContent += `"Filter Information:",,,,,,,,,,\n`;
      csvContent += `"Search Term:","${searchTerm}",,,,,,,,,,\n`;
      csvContent += `"Status Filter:","${statusFilter}",,,,,,,,,,\n`;
      csvContent += `"Entity Filter:","${entityFilter}",,,,,,,,,,\n`;

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `invoices-${new Date().toISOString().split("T")[0]}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Export successful", {
        description: `${filteredInvoices.length} invoice(s) exported to CSV with summary.`,
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Export failed", {
        description: "An error occurred while exporting the data.",
      });
    }
  };

  // Handle eye button click - show download preview
  const handleEyeButtonClick = (invoice: InvoiceWithRelations) => {
    setInvoiceForDownload(invoice);
    setShowDownloadPreview(true);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Invoice Management
          </h1>
          <p className="text-gray-600">View and manage all your invoices</p>
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Search Invoices
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by invoice number or customer name..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="w-full md:w-48">
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Filter by Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {statusFilterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-48">
                <label
                  htmlFor="entity"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Billing Entity
                </label>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by entity" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {entityFilterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  onClick={exportToExcel}
                  variant="outline"
                  className="border-green-600 text-green-700 hover:bg-green-50"
                  disabled={filteredInvoices.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Statement
                </Button>

                <Button
                  onClick={() => router.push("/super-admin/invoices")}
                  style={{ backgroundColor: themeColor }}
                  className="hover:opacity-90 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Invoice
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>
              {filteredInvoices.length} invoice
              {filteredInvoices.length !== 1 ? "s" : ""} found
              {filteredInvoices.length !== invoices.length &&
                ` (filtered from ${invoices.length} total)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  No invoices found
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm || statusFilter !== "ALL"
                    ? "Try changing your search or filter criteria"
                    : "Get started by creating a new invoice."}
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => router.push("/super-admin/invoices")}
                    style={{ backgroundColor: themeColor }}
                    className="hover:opacity-90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Invoice
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Billing Entity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const remainingAmount =
                      invoice.subtotal - invoice.advancePaid;

                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {invoice.customer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invoice.customer.number}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(invoice.subtotal)}
                          </div>
                          {invoice.advancePaid > 0 && (
                            <div className="text-xs space-y-1">
                              {invoice.status === "ADVANCE" ? (
                                <div className="text-amber-600">
                                  Advance: {formatCurrency(invoice.advancePaid)}
                                </div>
                              ) : (
                                <div className="text-green-600">
                                  Paid: {formatCurrency(invoice.advancePaid)}
                                </div>
                              )}
                              <div className="text-blue-600 font-medium">
                                Remaining: {formatCurrency(remainingAmount)}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusDisplay(invoice.status)}
                        </TableCell>
                        <TableCell>{invoice.companyType || "RUDRA"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {/* Eye button - opens download preview */}
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEyeButtonClick(invoice)}
                              title="View and Download Invoice"
                              className="cursor-pointer hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setMode("edit");
                              }}
                              title="Edit Invoice"
                              className="cursor-pointer"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                sendWhatsAppInvoice(invoice.id);
                              }}
                              disabled={sendingWhatsApp === invoice.id}
                              title="Send via WhatsApp"
                              className="cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              {sendingWhatsApp === invoice.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                              ) : (
                                <MessageCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Download Preview Modal */}
        {showDownloadPreview && invoiceForDownload && (
          <InvoiceDownloadPreview
            invoiceData={invoiceForDownload}
            onClose={() => {
              setShowDownloadPreview(false);
              setInvoiceForDownload(null);
            }}
          />
        )}

        {/* Existing Edit Dialog (keep as is) */}
        <Dialog open={mode === "edit"} onOpenChange={() => setMode(null)}>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle>Edit Invoice</DialogTitle>
              <DialogDescription>
                Make changes to invoice #{selectedInvoice?.invoiceNumber}
              </DialogDescription>
            </DialogHeader>

            {selectedInvoice && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const paidAmount = Number(formData.get("paidAmount")) || 0;

                  // Calculate new values based on current status
                  let newAdvancePaid = selectedInvoice.advancePaid;
                  let newStatus = selectedInvoice.status;

                  if (selectedInvoice.status === "UNPAID") {
                    newAdvancePaid = paidAmount;
                    newStatus = paidAmount > 0 ? "ADVANCE" : "UNPAID";
                    if (paidAmount >= selectedInvoice.subtotal) {
                      newStatus = "PAID";
                      newAdvancePaid = selectedInvoice.subtotal;
                    }
                  } else if (selectedInvoice.status === "ADVANCE") {
                    newAdvancePaid = selectedInvoice.advancePaid + paidAmount;
                    if (newAdvancePaid >= selectedInvoice.subtotal) {
                      newStatus = "PAID";
                      newAdvancePaid = selectedInvoice.subtotal;
                    } else {
                      newStatus = "ADVANCE";
                    }
                  }

                  const body = {
                    customer: {
                      name: formData.get("customerName"),
                      number: formData.get("customerNumber"),
                    },
                    advancePaid: newAdvancePaid,
                    status: newStatus,
                  };

                  const updatePromise = fetch(
                    `/api/allinvoices/${selectedInvoice.id}`,
                    {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(body),
                    },
                  );

                  toast.promise(updatePromise, {
                    loading: "Updating invoice...",
                    success: async (res) => {
                      if (res.ok) {
                        await fetchInvoices();
                        setSelectedInvoice(null);
                        setMode(null);
                        return "Invoice updated successfully";
                      } else {
                        throw new Error("Failed to update invoice");
                      }
                    },
                    error: (error) => {
                      return error.message || "Failed to update invoice";
                    },
                  });
                }}
                className="grid gap-4 py-4"
              >
                {/* ... existing edit form content ... */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="customerName"
                      className="text-sm font-medium"
                    >
                      Customer Name
                    </label>
                    <Input
                      id="customerName"
                      name="customerName"
                      defaultValue={selectedInvoice.customer.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="customerNumber"
                      className="text-sm font-medium"
                    >
                      Customer Number
                    </label>
                    <Input
                      id="customerNumber"
                      name="customerNumber"
                      defaultValue={selectedInvoice.customer.number}
                    />
                  </div>
                </div>

                {/* Current Payment Status */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">
                    Current Payment Status
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Amount:</span>
                      <p className="font-medium">
                        {formatCurrency(selectedInvoice.subtotal)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Current Status:</span>
                      <p className="font-medium">
                        {getStatusDisplay(selectedInvoice.status)}
                      </p>
                    </div>
                    {selectedInvoice.advancePaid > 0 && (
                      <div>
                        <span className="text-gray-600">Already Paid:</span>
                        <p className="font-medium text-green-600">
                          {formatCurrency(selectedInvoice.advancePaid)}
                        </p>
                      </div>
                    )}
                    {(selectedInvoice.status === "UNPAID" ||
                      selectedInvoice.status === "ADVANCE") && (
                      <div>
                        <span className="text-gray-600">Balance Due:</span>
                        <p className="font-medium text-red-600">
                          {formatCurrency(
                            selectedInvoice.subtotal -
                              selectedInvoice.advancePaid,
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Input - Different based on status */}
                {(selectedInvoice.status === "UNPAID" ||
                  selectedInvoice.status === "ADVANCE") && (
                  <div className="space-y-2">
                    <label htmlFor="paidAmount" className="text-sm font-medium">
                      {selectedInvoice.status === "UNPAID"
                        ? "Amount Paid"
                        : "Additional Payment"}
                    </label>
                    <Input
                      id="paidAmount"
                      name="paidAmount"
                      type="number"
                      min="0"
                      max={
                        selectedInvoice.subtotal - selectedInvoice.advancePaid
                      }
                      defaultValue="0"
                      placeholder={`Enter amount (max: ${formatCurrency(
                        selectedInvoice.subtotal - selectedInvoice.advancePaid,
                      )})`}
                    />
                    <p className="text-xs text-gray-500">
                      {selectedInvoice.status === "UNPAID"
                        ? "Enter the amount being paid now. This will update the invoice status accordingly."
                        : `Enter additional payment. Already paid: ${formatCurrency(
                            selectedInvoice.advancePaid,
                          )}`}
                    </p>
                  </div>
                )}

                {/* Update Preview */}
                {(selectedInvoice.status === "UNPAID" ||
                  selectedInvoice.status === "ADVANCE") && (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h4 className="font-medium text-amber-800 mb-2">
                      Update Preview
                    </h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-medium">
                          {formatCurrency(selectedInvoice.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>New Total Paid:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(
                            selectedInvoice.advancePaid +
                              (Number(
                                (
                                  document.getElementById(
                                    "paidAmount",
                                  ) as HTMLInputElement
                                )?.value,
                              ) || 0),
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>New Balance:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(
                            selectedInvoice.subtotal -
                              selectedInvoice.advancePaid -
                              (Number(
                                (
                                  document.getElementById(
                                    "paidAmount",
                                  ) as HTMLInputElement
                                )?.value,
                              ) || 0),
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-amber-200 pt-1 font-medium">
                        <span>New Status:</span>
                        <span>
                          {(() => {
                            const paidAmount =
                              Number(
                                (
                                  document.getElementById(
                                    "paidAmount",
                                  ) as HTMLInputElement
                                )?.value,
                              ) || 0;
                            const newTotalPaid =
                              selectedInvoice.advancePaid + paidAmount;

                            if (newTotalPaid >= selectedInvoice.subtotal) {
                              return "PAID";
                            } else if (newTotalPaid > 0) {
                              return "ADVANCE";
                            } else {
                              return "UNPAID";
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter className="gap-5 sm:gap-2">
                  {(selectedInvoice.status === "UNPAID" ||
                    selectedInvoice.status === "ADVANCE") && (
                    <Button
                      type="button"
                      onClick={async () => {
                        const markAsPaidPromise = fetch(
                          `/api/allinvoices/${selectedInvoice.id}`,
                          {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              customer: {
                                name: selectedInvoice.customer.name,
                                number: selectedInvoice.customer.number,
                              },
                              advancePaid: selectedInvoice.subtotal,
                              status: "PAID",
                            }),
                          },
                        );

                        toast.promise(markAsPaidPromise, {
                          loading: "Marking as paid...",
                          success: async (res) => {
                            if (res.ok) {
                              await fetchInvoices();
                              setSelectedInvoice(null);
                              setMode(null);
                              return "Invoice marked as paid successfully";
                            } else {
                              throw new Error("Failed to mark as paid");
                            }
                          },
                          error: (error) => {
                            return error.message || "Failed to mark as paid";
                          },
                        });
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Mark as Fully Paid
                    </Button>
                  )}
                  <Button type="submit" className="bg-amber-500">
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deleteConfirm}
          onOpenChange={() => setDeleteConfirm(null)}
        >
          <DialogContent className="max-w-sm bg-white">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this invoice? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceManagement;
