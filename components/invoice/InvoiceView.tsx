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
  Building,
  Receipt,
  FileBox,
  Tag,
  Percent,
  Wallet,
  CreditCard,
  Package,
  Check,
  Clock,
  AlertCircle,
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
import { pdf } from "@react-pdf/renderer";
import InvoicePDF from "@/components/InvoicePDF/InvoicePDF";
import { convertToWords } from "@/utils/numberToWords"; // Make sure this import exists

interface InvoiceViewProps {
  invoice: any;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Check company type
  const isYadnyaseni = invoice.companyType === "YADNYASENI";
  const companyName = isYadnyaseni
    ? "Yadnyaseni Creations"
    : "Rudra Arts & Handicrafts";

  // Color themes
  const themeColors = {
    primary: isYadnyaseni ? "text-purple-600" : "text-blue-600",
    bgLight: isYadnyaseni ? "bg-purple-50" : "bg-blue-50",
    bgMedium: isYadnyaseni ? "bg-purple-100" : "bg-blue-100",
    text: isYadnyaseni ? "text-purple-700" : "text-blue-700",
    border: isYadnyaseni ? "border-purple-200" : "border-blue-200",
    accent: isYadnyaseni ? "bg-purple-500" : "bg-blue-500",
  };

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
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
            <CheckCircle className="w-3 h-3 mr-1" /> PAID
          </Badge>
        );
      case "UNPAID":
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
            <AlertCircle className="w-3 h-3 mr-1" /> UNPAID
          </Badge>
        );
      case "ADVANCE":
        return (
          <Badge className="bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-50">
            <Wallet className="w-3 h-3 mr-1" /> ADVANCE
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

      // Format dates properly
      const formatDateForPDF = (date: Date) => {
        return new Date(date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      };

      // Prepare invoice data for PDF
      const invoiceData = {
        companyDetails: {
          name: companyName,
          address: isYadnyaseni
            ? "Samata Nagar, Ganesh Nagar Lane No 1, Above Rudra arts & Handicrafts LLP, Famous Chowk, New Sangavi, Pune Maharashtra 411027, India"
            : "Samata Nagar, Ganesh Nagar Lane No 1, Famous Chowk, New Sangavi, Pune Maharashtra 411027, India",
          gstin: isYadnyaseni ? "" : "27AMWPV8148A1ZE",
          city: "Pune",
          phone: "9595221296",
          email: "rudraarts30@gmail.com",
        },
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: formatDateForPDF(invoice.invoiceDate),
        dueDate: formatDateForPDF(invoice.dueDate),
        companyType: invoice.companyType || "RUDRA",
        customerInfo: {
          name: invoice.customer.name,
          address: invoice.customer.address || "",
          city: invoice.customer.city || "",
          pincode: invoice.customer.pincode || "",
          gstin: invoice.customer.gstin || "",
        },
        shippingInfo: {
          name: invoice.customer.name,
          address: invoice.customer.address || "",
          city: invoice.customer.city || "",
          pincode: invoice.customer.pincode || "",
          gstin: invoice.customer.gstin || "",
        },
        items: invoice.items.map((item: any) => ({
          name: item.name,
          description: item.description || "",
          hsn: item.hsn || "970300",
          quantity: item.quantity,
          unit: item.unit || "pcs",
          rate: item.price,
          discount: item.discount || 0,
          cgst: 2.5,
          sgst: 2.5,
          amount: item.total,
          gstIncluded: item.gstIncluded || false,
        })),
        subtotal: invoice.subtotal || 0,
        cgst: invoice.cgst || 0,
        sgst: invoice.sgst || 0,
        total: invoice.total || invoice.subtotal,
        extraCharges: invoice.extraCharges || 0,
        totalInWords:
          invoice.totalInWords ||
          `${convertToWords(invoice.total || invoice.subtotal)} Only`,
        notes: invoice.notes || "",
        deliveryDate: invoice.deliveryDate
          ? formatDateForPDF(invoice.deliveryDate)
          : formatDateForPDF(new Date()),
        advancePaid: invoice.advancePaid || 0,
        previousDue: 0,
        discountDetails: {
          hasDiscount: invoice.items.some(
            (item: any) => item.discount && item.discount > 0,
          ),
          totalDiscount: invoice.items.reduce(
            (sum: number, item: any) => sum + (item.discountedPrice || 0),
            0,
          ),
          itemsWithDiscount: invoice.items.filter(
            (item: any) => item.discount && item.discount > 0,
          ),
        },
        gstCalculationType: isYadnyaseni
          ? ("INCLUDED_IN_PRICE" as const)
          : ("ADDED_ON_TOP" as const),
      };

      // Generate PDF blob
      const blob = await pdf(
        <InvoicePDF
          invoiceData={invoiceData}
          logoUrl="/images/logo.png" // Update this path to your actual logo
        />,
      ).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up URL object
      URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully!");
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
                body { font-family: Arial, sans-serif; margin: 20px; background: white; }
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                Invoice #{invoice.invoiceNumber}
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700 font-medium">
                    {companyName}
                  </span>
                </div>
                {/* <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${themeColors.bgLight} ${themeColors.text}`}
                >
                  {isYadnyaseni ? "GST Included" : "GST Added"}
                </div> */}
                {getStatusBadge(invoice.status)}
              </div>
            </div>
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button> */}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="shadow-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${themeColors.bgLight}`}>
                    <Calendar className={`w-5 h-5 ${themeColors.primary}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Invoice Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(invoice.invoiceDate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${themeColors.bgLight}`}>
                    <Clock className={`w-5 h-5 ${themeColors.primary}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${themeColors.bgLight}`}>
                    <Receipt className={`w-5 h-5 ${themeColors.primary}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {formatCurrency(invoice.total || invoice.subtotal)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Invoice Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Customer & Items */}
          <div className="lg:col-span-2 space-y-8">
            {/* Customer Information */}
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-600" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Customer Name</p>
                    <p className="text-lg font-medium text-gray-900">
                      {invoice.customer.name}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-medium text-gray-900">
                        {invoice.customer.number}
                      </p>
                    </div>
                    {invoice.customer.email && (
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">
                          {invoice.customer.email}
                        </p>
                      </div>
                    )}
                  </div>
                  {invoice.customer.address && (
                    <div>
                      <p className="text-sm text-gray-500">Shipping Address</p>
                      <p className="font-medium text-gray-900">
                        {invoice.customer.address}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-600" />
                    Invoice Items
                  </CardTitle>
                  <Badge variant="outline" className="bg-gray-50">
                    {invoice.items.length} items
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-medium">Item</TableHead>
                        <TableHead className="font-medium text-center">
                          Qty
                        </TableHead>
                        <TableHead className="font-medium">Rate</TableHead>
                        <TableHead className="font-medium text-right">
                          Amount
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items.map((item: any, index: number) => (
                        <TableRow
                          key={item.id}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">
                                {item.name}
                              </div>
                              {item.gstIncluded && isYadnyaseni && (
                                <div
                                  className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs ${themeColors.bgLight} ${themeColors.text}`}
                                >
                                  <Check className="w-3 h-3" />
                                  GST Included
                                </div>
                              )}
                              {item.description && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="font-medium">{item.quantity}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900">
                              {formatCurrency(item.price)}
                            </div>
                            {item.discount > 0 && (
                              <div className="text-sm text-green-600 flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {item.discount}% off
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-semibold text-gray-900">
                              {formatCurrency(item.total)}
                            </div>
                            {item.discount > 0 && (
                              <div className="text-sm text-gray-400 line-through">
                                {formatCurrency(
                                  item.originalPrice * item.quantity,
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment Summary */}
          <div>
            <Card className="shadow-sm border-0 sticky top-8">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(invoice.subtotal)}
                    </span>
                  </div>

                  {/* GST Display */}
                  {isYadnyaseni ? (
                    // Yadnyaseni - GST Included
                    invoice.gstTotal > 0 && (
                      <div
                        className={`flex justify-between items-center py-2 px-3 rounded-lg ${themeColors.bgLight}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${themeColors.text}`}>
                            GST Included (5%)
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${themeColors.bgLight} ${themeColors.text} ${themeColors.border}`}
                          >
                            Included
                          </Badge>
                        </div>
                        <span className={`font-medium ${themeColors.text}`}>
                          {formatCurrency(invoice.gstTotal)}
                        </span>
                      </div>
                    )
                  ) : (
                    // Rudra - Separate CGST/SGST
                    <>
                      {invoice.cgst > 0 && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">CGST (2.5%)</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(invoice.cgst)}
                          </span>
                        </div>
                      )}
                      {invoice.sgst > 0 && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">SGST (2.5%)</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(invoice.sgst)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Discount */}
                  {invoice.totalDiscount > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <div className="flex items-center gap-2 text-green-600">
                        <Percent className="w-4 h-4" />
                        <span>Total Discount</span>
                      </div>
                      <span className="font-medium text-green-600">
                        -{formatCurrency(invoice.totalDiscount)}
                      </span>
                    </div>
                  )}

                  <Separator className="my-3" />

                  {/* Total */}
                  <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3">
                    <div>
                      <span className="text-lg font-semibold text-gray-900">
                        Total Amount
                      </span>
                      {invoice.totalInWords && (
                        <p className="text-xs text-gray-500 mt-1">
                          {invoice.totalInWords}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(invoice.total || invoice.subtotal)}
                      </div>
                      <p className="text-xs text-gray-500">
                        Inclusive of all taxes
                      </p>
                    </div>
                  </div>

                  {/* Advance Payment */}
                  {invoice.advancePaid > 0 && (
                    <>
                      <div className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <Wallet className="w-4 h-4" />
                          <span>Advance Paid</span>
                        </div>
                        <span className="font-medium text-emerald-600">
                          -{formatCurrency(invoice.advancePaid)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-amber-50 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-700">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">Balance Due</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-amber-700">
                            {formatCurrency(
                              (invoice.total || invoice.subtotal) -
                                invoice.advancePaid,
                            )}
                          </div>
                          <p className="text-xs text-amber-600">
                            Payment pending
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    <Button
                      onClick={generatePDF}
                      disabled={isGeneratingPDF}
                      className={`w-full ${isYadnyaseni ? "bg-blue-600 hover:bg-purple-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isGeneratingPDF ? "Generating PDF..." : "Download PDF"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              <p>
                Invoice #{invoice.invoiceNumber} • Generated on{" "}
                {formatDate(invoice.createdAt)}
              </p>
              <p className="mt-1">This secure link expires in 30 days</p>
            </div>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${themeColors.bgLight}`}
            >
              <div
                className={`w-2 h-2 rounded-full ${themeColors.accent}`}
              ></div>
              {/* <span className={`text-sm font-medium ${themeColors.text}`}>
                {isYadnyaseni
                  ? "GST included in all prices"
                  : "GST added separately"}
              </span> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
