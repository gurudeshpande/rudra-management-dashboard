"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Download, FileText, Printer } from "lucide-react";
import InvoicePDF from "@/components/InvoicePDF/InvoicePDF";
import { pdf } from "@react-pdf/renderer";
import { AlertToaster, alert } from "@/components/ui/alert-toaster";
import { convertToWords } from "@/utils/numberToWords";

interface InvoiceDownloadPreviewProps {
  invoiceData: any;
  onClose: () => void;
}

interface CustomerInfo {
  name: string;
  address: string;
  city: string;
  pincode: string;
  gstin: string;
  number?: string;
}

interface InvoiceItem {
  name: string;
  hsn: string;
  quantity: number;
  unit: string;
  rate: number;
  originalPrice: number;
  discount: number;
  cgst: number;
  sgst: number;
  amount: number;
  gstIncluded: boolean;
  description?: string;
}

interface CompanyDetails {
  name: string;
  address: string;
  city: string;
  gstin: string;
  phone: string;
  email: string;
}

interface PreviewData {
  companyDetails: CompanyDetails;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  companyType: "RUDRA" | "YADNYASENI";
  customerInfo: CustomerInfo;
  shippingInfo: CustomerInfo;
  items: InvoiceItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
  extraCharges: number;
  totalInWords: string;
  deliveryDate: string;
  advancePaid: number;
  notes: string;
  previousDue: number;
  discountDetails: {
    hasDiscount: boolean;
    totalDiscount: number;
    itemsWithDiscount: InvoiceItem[];
  };
  gstCalculationType: "INCLUDED_IN_PRICE" | "ADDED_ON_TOP";
}

const InvoiceDownloadPreview: React.FC<InvoiceDownloadPreviewProps> = ({
  invoiceData,
  onClose,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  // Format the invoice data with default values
  React.useEffect(() => {
    if (invoiceData) {
      const formattedData: PreviewData = {
        companyDetails: invoiceData.companyDetails || {
          name:
            invoiceData.companyType === "YADNYASENI"
              ? "Yadnyaseni Creations"
              : "Rudra Arts and Handicrafts",
          address:
            invoiceData.companyType === "YADNYASENI"
              ? "Samata Nagar, Ganesh Nagar Lane No 1, Above Rudra arts & Handicrafts LLP,Famous Chowk, New Sangavi, Pune Maharashtra 411027, India"
              : "Samata Nagar, Ganesh Nagar Lane No 1, Famous Chowk, New Sangavi",
          city: "Pune, Maharashtra 411061, India",
          gstin: "GSTIN 27AMWPV8148A1ZE",
          phone: "9595221296",
          email: "rudraarts30@gmail.com",
        },
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: new Date(invoiceData.invoiceDate).toLocaleDateString(
          "en-IN",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          },
        ),
        dueDate: new Date(invoiceData.dueDate).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        companyType: invoiceData.companyType || "RUDRA",
        customerInfo: {
          name: invoiceData.customer?.name || "",
          address: invoiceData.customer?.address || "",
          city: invoiceData.customer?.city || "",
          pincode: invoiceData.customer?.pincode || "",
          gstin: invoiceData.customer?.gstin || "",
          number: invoiceData.customer?.number || "",
        },
        shippingInfo: {
          name: invoiceData.customer?.name || "",
          address: invoiceData.customer?.address || "",
          city: invoiceData.customer?.city || "",
          pincode: invoiceData.customer?.pincode || "",
          gstin: invoiceData.customer?.gstin || "",
          number: invoiceData.customer?.number || "",
        },
        items: (invoiceData.items || []).map((item: any) => ({
          name: item.name || "",
          hsn: item.hsn || "970300",
          quantity: item.quantity || 1,
          unit: item.unit || "pcs",
          rate: item.price || 0,
          originalPrice: item.originalPrice || item.price || 0,
          discount: item.discount || 0,
          cgst: 2.5,
          sgst: 2.5,
          amount: item.quantity * item.price || 0,
          gstIncluded: invoiceData.companyType === "YADNYASENI",
          description: "",
        })),
        subtotal: invoiceData.subtotal || 0,
        cgst: invoiceData.cgst || 0,
        sgst: invoiceData.sgst || 0,
        total: invoiceData.total || invoiceData.subtotal || 0,
        extraCharges: 0,
        totalInWords: `${convertToWords(invoiceData.total || invoiceData.subtotal || 0)} Only`,
        deliveryDate: new Date().toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        advancePaid: invoiceData.advancePaid || 0,
        notes: "",
        previousDue: 0,
        discountDetails: {
          hasDiscount: false,
          totalDiscount: 0,
          itemsWithDiscount: [],
        },
        gstCalculationType:
          invoiceData.companyType === "YADNYASENI"
            ? "INCLUDED_IN_PRICE"
            : "ADDED_ON_TOP",
      };

      setPreviewData(formattedData);
    }
  }, [invoiceData]);

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!previewData) return;

    try {
      setIsDownloading(true);

      // Prepare data for InvoicePDF component
      const invoicePDFData = {
        ...previewData,
        customerInfo: {
          ...previewData.customerInfo,
          city: previewData.customerInfo.city || "",
          pincode: previewData.customerInfo.pincode || "",
          gstin: previewData.customerInfo.gstin || "",
        },
        shippingInfo: {
          ...previewData.shippingInfo,
          city: previewData.shippingInfo.city || "",
          pincode: previewData.shippingInfo.pincode || "",
          gstin: previewData.shippingInfo.gstin || "",
        },
        items: previewData.items.map((item) => ({
          ...item,
          hsn: item.hsn || "970300",
          unit: item.unit || "pcs",
        })),
      };

      const blob = await pdf(
        <InvoicePDF invoiceData={invoicePDFData} logoUrl="/images/logo.png" />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${previewData.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert.success(
        "Invoice downloaded",
        "PDF has been downloaded successfully",
        { duration: 4000 },
      );
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert.error(
        "Download failed",
        "Failed to download PDF. Please try again.",
        { duration: 4000 },
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle print
  const handlePrint = () => {
    if (!previewData) return;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${previewData.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .invoice-header { text-align: center; margin-bottom: 20px; }
            .invoice-title { font-size: 24px; font-weight: bold; }
            .invoice-details { margin-bottom: 30px; }
            .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .invoice-table th { background-color: #f5f5f5; }
            .invoice-summary { float: right; width: 300px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total { font-size: 18px; font-weight: bold; }
            @media print {
              body { margin: 0; padding: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <h1 class="invoice-title">${previewData.companyDetails.name}</h1>
            <p>${previewData.companyDetails.address}</p>
            <p>GSTIN: ${previewData.companyDetails.gstin}</p>
          </div>
          
          <h2 class="text-center">TAX INVOICE</h2>
          
          <div class="invoice-details">
            <table>
              <tr>
                <td><strong>Invoice No:</strong> ${previewData.invoiceNumber}</td>
                <td><strong>Invoice Date:</strong> ${previewData.invoiceDate}</td>
              </tr>
              <tr>
                <td><strong>Customer:</strong> ${previewData.customerInfo.name}</td>
                <td><strong>Due Date:</strong> ${previewData.dueDate}</td>
              </tr>
            </table>
          </div>
          
          <table class="invoice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Description</th>
                <th>Qty</th>
                <th>Rate (₹)</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${previewData.items
                .map(
                  (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.rate.toFixed(2)}</td>
                  <td>${item.amount.toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="invoice-summary">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td class="text-right">₹${previewData.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td>CGST (2.5%):</td>
                <td class="text-right">₹${previewData.cgst.toFixed(2)}</td>
              </tr>
              <tr>
                <td>SGST (2.5%):</td>
                <td class="text-right">₹${previewData.sgst.toFixed(2)}</td>
              </tr>
              <tr class="total">
                <td>Total:</td>
                <td class="text-right">₹${previewData.total.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div style="clear: both; margin-top: 50px;">
            <p><strong>Amount in Words:</strong> ${previewData.totalInWords}</p>
          </div>
          
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print Invoice
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
              Close
            </button>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (!previewData) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-600 rounded-full animate-spin"></div>
            <p className="text-gray-700">Loading invoice...</p>
          </div>
        </div>
      </div>
    );
  }

  const company = previewData.companyType;
  const showGSTBreakdown =
    company === "RUDRA" && previewData.gstCalculationType === "ADDED_ON_TOP";
  const isGSTIncluded = previewData.gstCalculationType === "INCLUDED_IN_PRICE";

  return (
    <>
      <AlertToaster />

      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b bg-white">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Invoice #{previewData.invoiceNumber}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {formatDate(invoiceData.invoiceDate)}
                </Badge>
                <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                  {company}
                </Badge>
                {isGSTIncluded && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                    GST Included
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Invoice Summary */}
          <div className="p-6 overflow-auto">
            <Card className="border-gray-200">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Company and Customer Info */}
                  <div className="space-y-6">
                    {/* Company Info */}
                    <div>
                      <h3 className="font-bold text-gray-800 mb-2 text-sm">
                        From:
                      </h3>
                      <div className="bg-gray-50 p-4 rounded border">
                        <h4 className="font-bold text-lg">
                          {previewData.companyDetails.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {previewData.companyDetails.address}
                        </p>
                        <p className="text-sm text-gray-600">
                          {previewData.companyDetails.city}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          GSTIN: {previewData.companyDetails.gstin}
                        </p>
                        <p className="text-sm text-gray-600">
                          Phone: {previewData.companyDetails.phone}
                        </p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div>
                      <h3 className="font-bold text-gray-800 mb-2 text-sm">
                        Bill To:
                      </h3>
                      <div className="bg-gray-50 p-4 rounded border">
                        <h4 className="font-medium">
                          {previewData.customerInfo.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {previewData.customerInfo.address}
                        </p>
                        {previewData.customerInfo.city && (
                          <p className="text-sm text-gray-600">
                            {previewData.customerInfo.city}
                          </p>
                        )}
                        {previewData.customerInfo.number && (
                          <p className="text-sm text-gray-600 mt-2">
                            Phone: {previewData.customerInfo.number}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Invoice Details */}
                  <div className="space-y-6">
                    {/* Invoice Details */}
                    <div>
                      <h3 className="font-bold text-gray-800 mb-2 text-sm">
                        Invoice Details:
                      </h3>
                      <div className="bg-gray-50 p-4 rounded border space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Invoice Number:</span>
                          <span className="font-medium">
                            {previewData.invoiceNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Invoice Date:</span>
                          <span className="font-medium">
                            {previewData.invoiceDate}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Due Date:</span>
                          <span className="font-medium">
                            {previewData.dueDate}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Delivery Date:</span>
                          <span className="font-medium">
                            {previewData.deliveryDate}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Billing Entity:</span>
                          <Badge className="bg-blue-100 text-blue-800">
                            {company}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div>
                      <h3 className="font-bold text-gray-800 mb-2 text-sm">
                        Invoice Summary:
                      </h3>
                      <div className="bg-blue-50 p-4 rounded border border-blue-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-700">Total Items:</span>
                          <span className="font-bold text-blue-700">
                            {previewData.items.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-700">Subtotal:</span>
                          <span className="font-medium">
                            ₹{previewData.subtotal.toFixed(2)}
                          </span>
                        </div>
                        {previewData.advancePaid > 0 && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-700">Advance Paid:</span>
                            <span className="font-medium text-green-600">
                              ₹{previewData.advancePaid.toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                          <span className="text-lg font-bold text-gray-900">
                            Total:
                          </span>
                          <span className="text-2xl font-bold text-orange-600">
                            ₹{previewData.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="mt-6">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm">
                    Items ({previewData.items.length}):
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b grid grid-cols-12 text-sm font-medium">
                      <div className="col-span-6">Item Description</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-right">Rate (₹)</div>
                      <div className="col-span-2 text-right">Amount (₹)</div>
                    </div>
                    <div className="divide-y">
                      {previewData.items.slice(0, 3).map((item, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-12 p-3 text-sm"
                        >
                          <div className="col-span-6">{item.name}</div>
                          <div className="col-span-2 text-center">
                            {item.quantity} {item.unit}
                          </div>
                          <div className="col-span-2 text-right">
                            ₹{item.rate.toFixed(2)}
                          </div>
                          <div className="col-span-2 text-right font-medium">
                            ₹{item.amount.toFixed(2)}
                          </div>
                        </div>
                      ))}
                      {previewData.items.length > 3 && (
                        <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                          ... and {previewData.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount in Words */}
                <div className="mt-6 p-4 bg-gray-50 rounded border">
                  <h4 className="font-medium text-gray-800 mb-2 text-sm">
                    Amount in Words:
                  </h4>
                  <p className="text-sm text-gray-700 italic">
                    {previewData.totalInWords}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer Actions - Only Download Button */}
          <div className="flex justify-between items-center p-6 border-t bg-gray-50">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                Invoice Total:{" "}
                <span className="text-orange-700">
                  ₹{previewData.total.toFixed(2)}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                {previewData.items.length} items • {company}
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="border-gray-300"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Preview
              </Button>

              <Button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="bg-orange-800 hover:bg-orange-900 text-white"
              >
                {isDownloading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Helper function to format date
const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default InvoiceDownloadPreview;
