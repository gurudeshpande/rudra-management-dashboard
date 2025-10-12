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

  const router = useRouter();

  // Theme colors
  const themeColor = "#954C2E";
  const themeLight = "#F5E9E4";

  // Fetch invoices from API
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

      const response = await fetch(
        `/api/allinvoices/getallinvoices?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setInvoices(data);
      setFilteredInvoices(data); // Initialize filtered invoices with all invoices
    } catch (error) {
      console.error("Error fetching invoices:", error);
      // Set empty array instead of showing error for better UX
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
  }, [searchTerm, statusFilter]);

  const statusFilterOptions = [
    { value: "ALL", label: "All Statuses" },
    { value: "PAID", label: "Paid" },
    { value: "UNPAID", label: "Unpaid" },
    { value: "ADVANCE", label: "Advance" }, // DRAFT represents Advance status
  ];

  // Handle invoice deletion
  // Handle invoice deletion
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/allinvoices/${id}`, {
        // ✅ Use dynamic route
        method: "DELETE",
      });

      if (response.ok) {
        // Remove the deleted invoice from state
        setInvoices(invoices.filter((invoice) => invoice.id !== id));
        setFilteredInvoices(
          filteredInvoices.filter((invoice) => invoice.id !== id)
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

  // Get status badge variant (restricted to allowed Badge variants)
  const getStatusVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" | undefined => {
    switch (status) {
      case "PAID":
        return "default"; // Green
      case "UNPAID":
        return "destructive"; // Red
      case "ADVANCE": // DRAFT represents Advance status
        return "secondary"; // Orange/Yellow
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
      case "ADVANCE": // DRAFT represents Advance status
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
  // Export filtered invoices to Excel with additional summary row
  const exportToExcel = () => {
    if (filteredInvoices.length === 0) {
      toast.info("No data to export", {
        description: "There are no invoices matching your current filters.",
      });
      return;
    }

    try {
      // Create CSV content
      let csvContent =
        "Invoice Number,Customer Name,Customer Phone,Date,Due Date,Total Amount,Advance Paid,Balance Due,Status\n";

      // Calculate overall totals
      let overallTotal = 0;
      let overallAdvancePaid = 0;
      let overallBalanceDue = 0;

      filteredInvoices.forEach((invoice) => {
        let balanceDue = invoice.subtotal - invoice.advancePaid;

        if (invoice.advancePaid <= 0) {
          balanceDue = 0;
        }

        // Add to overall totals
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
        ].join(",");

        csvContent += row + "\n";
      });

      // Add summary row
      csvContent += "\n";
      csvContent += `"","","","","","TOTAL: ${overallTotal}","ADVANCE: ${overallAdvancePaid}","BALANCE: ${overallBalanceDue}",""\n`;

      // Create blob and download
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
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setMode("view");
                              }}
                              title="View Invoice"
                              className="cursor-pointer"
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
                              onClick={() => setDeleteConfirm(invoice.id)}
                              title="Delete Invoice"
                              className="cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
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

        {/* View Dialog */}
        <Dialog open={mode === "view"} onOpenChange={() => setMode(null)}>
          <DialogContent className="w-7xl bg-white">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
              <DialogDescription>
                View details for invoice #{selectedInvoice?.invoiceNumber}
              </DialogDescription>
            </DialogHeader>

            {selectedInvoice && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Invoice #</h4>
                    <p>{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Status</h4>
                    {selectedInvoice.status === "PAID" ? (
                      <Badge className="bg-green-600 text-white hover:bg-green-700">
                        {selectedInvoice.status}
                      </Badge>
                    ) : (
                      <Badge variant={getStatusVariant(selectedInvoice.status)}>
                        {selectedInvoice.status}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Date</h4>
                    <p>{formatDate(selectedInvoice.invoiceDate)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Due Date</h4>
                    <p>{formatDate(selectedInvoice.dueDate)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Customer</h4>
                  <p>{selectedInvoice.customer.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedInvoice.customer.number}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Amount</h4>
                  <p>{formatCurrency(selectedInvoice.subtotal)}</p>
                  {selectedInvoice.advancePaid > 0 && (
                    <p className="text-sm text-gray-500">
                      Advance: {formatCurrency(selectedInvoice.advancePaid)}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2 wrap-anywhere">Items</h4>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium break-words whitespace-normal max-w-[250px]">
                              {item.name}
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.price)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.quantity * item.price)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
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
                    // For unpaid invoices, set the paid amount as advance
                    newAdvancePaid = paidAmount;
                    newStatus = paidAmount > 0 ? "ADVANCE" : "UNPAID";
                    if (paidAmount >= selectedInvoice.subtotal) {
                      newStatus = "PAID";
                      newAdvancePaid = selectedInvoice.subtotal;
                    }
                  } else if (selectedInvoice.status === "ADVANCE") {
                    // For advance invoices, add to existing advance
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
                    }
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
                              selectedInvoice.advancePaid
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
                        selectedInvoice.subtotal - selectedInvoice.advancePaid
                      )})`}
                    />
                    <p className="text-xs text-gray-500">
                      {selectedInvoice.status === "UNPAID"
                        ? "Enter the amount being paid now. This will update the invoice status accordingly."
                        : `Enter additional payment. Already paid: ${formatCurrency(
                            selectedInvoice.advancePaid
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
                                    "paidAmount"
                                  ) as HTMLInputElement
                                )?.value
                              ) || 0)
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
                                    "paidAmount"
                                  ) as HTMLInputElement
                                )?.value
                              ) || 0)
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
                                    "paidAmount"
                                  ) as HTMLInputElement
                                )?.value
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
                  {/* Mark as Fully Paid Button - Only show for unpaid/advance invoices */}
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
                          }
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
