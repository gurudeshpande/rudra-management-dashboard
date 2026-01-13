// components/invoice/InvoiceView.tsx
"use client";

import React, { useState } from "react";
import {
  Download,
  Printer,
  Share2,
  CheckCircle,
  FileText,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface InvoiceViewProps {
  invoice: any;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" /> PAID
          </Badge>
        );
      case "UNPAID":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
            UNPAID
          </Badge>
        );
      case "ADVANCE":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
            ADVANCE PAYMENT
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Generate PDF
  const generatePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const element = document.getElementById("invoice-content");

      if (!element) {
        throw new Error("Invoice content not found");
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);

      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Print invoice
  const printInvoice = () => {
    const content = document.getElementById("invoice-content");
    if (content) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice ${invoice.invoiceNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .invoice-header { text-align: center; margin-bottom: 30px; }
                .company-info { margin-bottom: 20px; }
                .invoice-details { margin-bottom: 30px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f4f4f4; }
                .totals { float: right; width: 300px; }
                .footer { margin-top: 50px; text-align: center; }
                @media print {
                  .no-print { display: none; }
                  body { margin: 0; }
                }
              </style>
            </head>
            <body>
              ${content.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  // Share invoice
  const shareInvoice = async () => {
    const invoiceUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNumber}`,
          text: `Invoice ${invoice.invoiceNumber} - ${invoice.customer.name}`,
          url: invoiceUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(invoiceUrl);
      toast.success("Invoice link copied to clipboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Invoice #{invoice.invoiceNumber}
              </h1>
              <p className="text-gray-600 mt-2">
                View, download, and share your invoice
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.history.back()}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* Invoice Content */}
        <Card id="invoice-content" className="mb-6 shadow-lg">
          <CardContent className="p-6">
            {/* Invoice Header */}
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <FileText className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {invoice.companyType || "RUDRA ARTS & HANDICRAFTS"}
                      </h2>
                      <p className="text-gray-600">Invoice Document</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Invoice Date: {formatDate(invoice.invoiceDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Due Date: {formatDate(invoice.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {getStatusBadge(invoice.status)}
                  <div className="mt-4">
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(invoice.total || invoice.subtotal)}
                    </div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Billed To
                </h3>
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {invoice.customer.name}
                          </p>
                          <p className="text-sm text-gray-600">Customer</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {invoice.customer.number}
                          </p>
                          <p className="text-sm text-gray-600">Phone</p>
                        </div>
                      </div>

                      {invoice.customer.email && (
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {invoice.customer.email}
                            </p>
                            <p className="text-sm text-gray-600">Email</p>
                          </div>
                        </div>
                      )}

                      {invoice.customer.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900 break-words">
                              {invoice.customer.address}
                            </p>
                            <p className="text-sm text-gray-600">Address</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Summary
                </h3>
                <Card className="bg-gray-50">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        {formatCurrency(invoice.subtotal)}
                      </span>
                    </div>

                    {invoice.cgst > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">CGST</span>
                        <span className="font-medium">
                          {formatCurrency(invoice.cgst)}
                        </span>
                      </div>
                    )}

                    {invoice.sgst > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">SGST</span>
                        <span className="font-medium">
                          {formatCurrency(invoice.sgst)}
                        </span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>
                        {formatCurrency(invoice.total || invoice.subtotal)}
                      </span>
                    </div>

                    {invoice.advancePaid > 0 && (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span>Advance Paid</span>
                          <span>- {formatCurrency(invoice.advancePaid)}</span>
                        </div>
                        <div className="flex justify-between text-red-600 font-bold">
                          <span>Balance Due</span>
                          <span>
                            {formatCurrency(
                              (invoice.total || invoice.subtotal) -
                                invoice.advancePaid
                            )}
                          </span>
                        </div>
                      </>
                    )}

                    {invoice.totalInWords && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-600">
                          Amount in Words:
                        </p>
                        <p className="font-medium italic">
                          {invoice.totalInWords}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Invoice Items
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="font-semibold">Item</TableHead>
                      <TableHead className="font-semibold">
                        Description
                      </TableHead>
                      <TableHead className="font-semibold">Quantity</TableHead>
                      <TableHead className="font-semibold">Price</TableHead>
                      <TableHead className="font-semibold text-right">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item: any, index: number) => (
                      <TableRow
                        key={item.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell>
                          {item.description || item.product?.category || "N/A"}
                          {item.notes && (
                            <p className="text-xs text-gray-500 mt-1">
                              {item.notes}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.price)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Footer Notes */}
            {invoice.deliveryDate && (
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-blue-800">
                    Delivery Information
                  </h4>
                </div>
                <p className="text-blue-700">
                  Scheduled delivery: {formatDate(invoice.deliveryDate)}
                </p>
              </div>
            )}

            {/* Terms & Conditions */}
            <div className="mt-8 pt-6 border-t">
              <h4 className="font-semibold text-gray-900 mb-2">
                Terms & Conditions
              </h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                <li>Payment is due within {formatDate(invoice.dueDate)}</li>
                <li>Late payments may be subject to interest charges</li>
                <li>Goods once sold cannot be returned</li>
                <li>All disputes are subject to local jurisdiction</li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="bg-gray-50 px-6 py-4 border-t">
            <div className="w-full flex flex-col sm:flex-row justify-between items-center">
              <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                <p>Invoice #{invoice.invoiceNumber}</p>
                <p>Generated on {formatDate(invoice.createdAt)}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={printInvoice}
                  className="gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </Button>

                <Button
                  onClick={generatePDF}
                  disabled={isGeneratingPDF}
                  className="gap-2 bg-amber-600 hover:bg-amber-700"
                >
                  <Download className="w-4 h-4" />
                  {isGeneratingPDF ? "Generating..." : "Download PDF"}
                </Button>

                <Button
                  variant="outline"
                  onClick={shareInvoice}
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            onClick={() =>
              (window.location.href = `tel:${invoice.customer.number}`)
            }
            variant="outline"
            className="gap-2"
          >
            <Phone className="w-4 h-4" />
            Call Customer
          </Button>

          <Button
            onClick={() =>
              (window.location.href = `https://wa.me/${invoice.customer.number}`)
            }
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Share2 className="w-4 h-4" />
            Send WhatsApp Reminder
          </Button>
        </div>

        {/* Security Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            🔒 This invoice is securely shared. The link will expire in 30 days.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Invoice ID: {invoice.id} • Customer ID: {invoice.customerId}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
