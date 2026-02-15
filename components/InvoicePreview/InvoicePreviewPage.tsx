"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Save,
  IndianRupee,
  Printer,
  Download,
  CheckCircle,
} from "lucide-react";
import InvoicePDF from "@/components/InvoicePDF/InvoicePDF";
import { pdf } from "@react-pdf/renderer";
import { AlertToaster, alert } from "@/components/ui/alert-toaster";
import { convertToWords } from "@/utils/numberToWords";

interface InvoicePreviewPageProps {
  invoiceData: any;
  onClose: () => void;
  onGenerateInvoice: () => Promise<void>;
  onSaveAsDraft: () => Promise<void>;
  isEditMode?: boolean;
  isGenerating?: boolean;
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

const InvoicePreviewPage: React.FC<InvoicePreviewPageProps> = ({
  invoiceData,
  onClose,
  onGenerateInvoice,
  onSaveAsDraft,
  isEditMode,
  isGenerating = false,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "pdf">("preview");

  // Format the invoice data with default values
  useEffect(() => {
    if (invoiceData) {
      const formattedData: PreviewData = {
        companyDetails: invoiceData.companyDetails || {
          name: "",
          address: "",
          city: "",
          gstin: "",
          phone: "",
          email: "",
        },
        invoiceNumber:
          invoiceData.invoiceNumber ||
          `PREVIEW-${Date.now().toString().slice(-6)}`,
        invoiceDate:
          invoiceData.invoiceDate ||
          new Date().toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        dueDate:
          invoiceData.dueDate ||
          invoiceData.invoiceDate ||
          new Date().toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        companyType: invoiceData.companyType || "RUDRA",
        customerInfo: {
          name: invoiceData.customerInfo?.name || "",
          address: invoiceData.customerInfo?.address || "",
          city: invoiceData.customerInfo?.city || "",
          pincode: invoiceData.customerInfo?.pincode || "",
          gstin: invoiceData.customerInfo?.gstin || "",
          number: invoiceData.customerInfo?.number || "",
        },
        shippingInfo: {
          name:
            invoiceData.shippingInfo?.name ||
            invoiceData.customerInfo?.name ||
            "",
          address:
            invoiceData.shippingInfo?.address ||
            invoiceData.customerInfo?.address ||
            "",
          city:
            invoiceData.shippingInfo?.city ||
            invoiceData.customerInfo?.city ||
            "",
          pincode:
            invoiceData.shippingInfo?.pincode ||
            invoiceData.customerInfo?.pincode ||
            "",
          gstin:
            invoiceData.shippingInfo?.gstin ||
            invoiceData.customerInfo?.gstin ||
            "",
          number:
            invoiceData.shippingInfo?.number ||
            invoiceData.customerInfo?.number ||
            "",
        },
        items: (invoiceData.items || []).map((item: any) => ({
          name: item.name || "",
          hsn: item.hsn || "970300",
          quantity: item.quantity || 1,
          unit: item.unit || "pcs",
          rate: item.rate || 0,
          originalPrice: item.originalPrice || 0,
          discount: item.discount || 0,
          cgst: item.cgst || 2.5,
          sgst: item.sgst || 2.5,
          amount: item.amount || 0,
          gstIncluded: item.gstIncluded || false,
          description: item.description || "",
        })),
        subtotal: invoiceData.subtotal || 0,
        cgst: invoiceData.cgst || 0,
        sgst: invoiceData.sgst || 0,
        total: invoiceData.total || 0,
        extraCharges: invoiceData.extraCharges || 0,
        totalInWords:
          invoiceData.totalInWords ||
          `${convertToWords(invoiceData.total || 0)} Only`,
        deliveryDate:
          invoiceData.deliveryDate ||
          new Date().toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        advancePaid: invoiceData.advancePaid || 0,
        notes: invoiceData.notes || "",
        previousDue: invoiceData.previousDue || 0,
        discountDetails: invoiceData.discountDetails || {
          hasDiscount: false,
          totalDiscount: 0,
          itemsWithDiscount: [],
        },
        gstCalculationType: invoiceData.gstCalculationType || "ADDED_ON_TOP",
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
          // Ensure all required fields are present
          city: previewData.customerInfo.city || "",
          pincode: previewData.customerInfo.pincode || "",
          gstin: previewData.customerInfo.gstin || "",
        },
        shippingInfo: {
          ...previewData.shippingInfo,
          // Ensure all required fields are present
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
      a.download = `invoice-preview-${previewData.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert.success(
        "PDF downloaded",
        "Preview PDF has been downloaded successfully",
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
    const printContent = document.getElementById("invoice-preview-content");
    if (printContent) {
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload(); // Reload to restore original content
    }
  };

  if (!previewData) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-600 rounded-full animate-spin"></div>
            <p className="text-gray-700">Loading preview...</p>
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
        <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b bg-white">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Invoice Preview
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {previewData.invoiceNumber}
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

          {/* Tabs */}
          <div className="flex border-b bg-gray-50">
            <button
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "preview"
                  ? "text-orange-700 border-b-2 border-orange-700 bg-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("preview")}
            >
              Preview View
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "pdf"
                  ? "text-orange-700 border-b-2 border-orange-700 bg-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("pdf")}
            >
              PDF Preview
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {activeTab === "preview" ? (
              <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                {/* Invoice Preview Content */}
                <div id="invoice-preview-content" className="p-8">
                  {/* Company Header */}
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 uppercase mb-2">
                      {previewData.companyDetails.name}
                    </h1>
                    <p className="text-sm text-gray-600 mb-1">
                      {previewData.companyDetails.address}
                    </p>
                    <p className="text-sm text-gray-600">
                      GSTIN: {previewData.companyDetails.gstin} |{" "}
                      {previewData.companyDetails.phone}
                    </p>
                  </div>

                  {/* Invoice Title */}
                  <div className="text-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      TAX INVOICE
                    </h2>
                  </div>

                  {/* Invoice Info */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-gray-800 mb-2 text-sm">
                          Bill To:
                        </h3>
                        <div className="bg-gray-50 p-3 rounded border">
                          <p className="font-medium">
                            {previewData.customerInfo.name}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {previewData.customerInfo.address}
                          </p>
                          {previewData.customerInfo.city && (
                            <p className="text-sm text-gray-600">
                              {previewData.customerInfo.city}
                            </p>
                          )}
                          {previewData.customerInfo.gstin && (
                            <p className="text-sm text-gray-600 mt-2">
                              GSTIN: {previewData.customerInfo.gstin}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-gray-800 mb-2 text-sm">
                          Invoice Details:
                        </h3>
                        <div className="bg-gray-50 p-3 rounded border space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Invoice No:</span>
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
                            <span className="text-gray-600">
                              Delivery Date:
                            </span>
                            <span className="font-medium">
                              {previewData.deliveryDate}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="mb-8">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 p-3 text-left font-bold text-sm">
                              #
                            </th>
                            <th className="border border-gray-300 p-3 text-left font-bold text-sm">
                              Item Description
                            </th>
                            <th className="border border-gray-300 p-3 text-center font-bold text-sm">
                              HSN
                            </th>
                            <th className="border border-gray-300 p-3 text-center font-bold text-sm">
                              Qty
                            </th>
                            <th className="border border-gray-300 p-3 text-right font-bold text-sm">
                              Rate (₹)
                            </th>
                            <th className="border border-gray-300 p-3 text-right font-bold text-sm">
                              Discount
                            </th>
                            {showGSTBreakdown && (
                              <>
                                <th className="border border-gray-300 p-3 text-right font-bold text-sm">
                                  CGST%
                                </th>
                                <th className="border border-gray-300 p-3 text-right font-bold text-sm">
                                  SGST%
                                </th>
                              </>
                            )}
                            <th className="border border-gray-300 p-3 text-right font-bold text-sm">
                              Amount (₹)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 p-3 text-sm">
                                {index + 1}
                              </td>
                              <td className="border border-gray-300 p-3 text-sm">
                                <div className="font-medium">{item.name}</div>
                                {item.description && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {item.description}
                                  </div>
                                )}
                              </td>
                              <td className="border border-gray-300 p-3 text-center text-sm">
                                {item.hsn}
                              </td>
                              <td className="border border-gray-300 p-3 text-center text-sm">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="border border-gray-300 p-3 text-right text-sm">
                                ₹{item.rate.toFixed(2)}
                              </td>
                              <td className="border border-gray-300 p-3 text-right text-sm">
                                {item.discount > 0 ? (
                                  <span className="text-green-600 font-medium">
                                    {item.discount}%
                                  </span>
                                ) : (
                                  <span className="text-gray-400">0%</span>
                                )}
                              </td>
                              {showGSTBreakdown && (
                                <>
                                  <td className="border border-gray-300 p-3 text-right text-sm">
                                    {item.cgst}%
                                  </td>
                                  <td className="border border-gray-300 p-3 text-right text-sm">
                                    {item.sgst}%
                                  </td>
                                </>
                              )}
                              <td className="border border-gray-300 p-3 text-right font-medium text-sm">
                                ₹{item.amount.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex justify-between">
                    <div className="w-1/2 pr-4">
                      {/* Payment Terms */}
                      <div className="bg-gray-50 p-4 rounded border">
                        <h4 className="font-bold text-gray-800 mb-3 text-sm">
                          Payment Terms:
                        </h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                          <li>• Payment due within 7 days of invoice date</li>
                          <li>• Late payment interest: 1.5% per month</li>
                          <li>• All taxes as applicable</li>
                        </ul>
                      </div>

                      {/* Notes */}
                      {previewData.notes && (
                        <div className="mt-4 bg-blue-50 p-4 rounded border border-blue-200">
                          <h4 className="font-bold text-blue-800 mb-2 text-sm">
                            Notes:
                          </h4>
                          <p className="text-sm text-blue-700">
                            {previewData.notes}
                          </p>
                        </div>
                      )}

                      {/* Total in Words */}
                      <div className="mt-6">
                        <div className="p-3 bg-gray-50 rounded border">
                          <p className="text-sm font-medium text-gray-700">
                            Amount in Words:
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {previewData.totalInWords}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Totals */}
                    <div className="w-1/2 pl-4">
                      <Card className="border-gray-300">
                        <CardContent className="p-0">
                          <div className="divide-y divide-gray-200">
                            <div className="p-4">
                              <h4 className="font-bold text-gray-800 text-sm mb-3">
                                Invoice Summary
                              </h4>
                            </div>

                            <div className="p-4 space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600 text-sm">
                                  Subtotal:
                                </span>
                                <span className="font-medium text-sm">
                                  ₹{previewData.subtotal.toFixed(2)}
                                </span>
                              </div>

                              {/* Discount */}
                              {previewData.discountDetails.hasDiscount && (
                                <div className="flex justify-between text-green-600">
                                  <span className="text-sm">
                                    Total Discount:
                                  </span>
                                  <span className="font-medium text-sm">
                                    -₹
                                    {previewData.discountDetails.totalDiscount.toFixed(
                                      2,
                                    )}
                                  </span>
                                </div>
                              )}

                              {/* GST Breakdown */}
                              {showGSTBreakdown && (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 text-sm">
                                      CGST (2.5%):
                                    </span>
                                    <span className="font-medium text-sm">
                                      ₹{previewData.cgst.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 text-sm">
                                      SGST (2.5%):
                                    </span>
                                    <span className="font-medium text-sm">
                                      ₹{previewData.sgst.toFixed(2)}
                                    </span>
                                  </div>
                                </>
                              )}

                              {isGSTIncluded && (
                                <div className="flex justify-between text-sm text-gray-500">
                                  <span>GST (5%) included in prices</span>
                                </div>
                              )}

                              {/* Extra Charges */}
                              {previewData.extraCharges > 0 && (
                                <div className="flex justify-between text-blue-600">
                                  <span className="text-sm">
                                    Extra Charges:
                                  </span>
                                  <span className="font-medium text-sm">
                                    ₹{previewData.extraCharges.toFixed(2)}
                                  </span>
                                </div>
                              )}

                              {/* Previous Due */}
                              {previewData.previousDue > 0 && (
                                <div className="flex justify-between text-orange-600">
                                  <span className="text-sm">Previous Due:</span>
                                  <span className="font-medium text-sm">
                                    ₹{previewData.previousDue.toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Total */}
                            <div className="p-4 bg-gray-50 border-t">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900">
                                  Total Amount:
                                </span>
                                <span className="text-2xl font-bold text-orange-700">
                                  ₹{previewData.total.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {/* Advance Payment */}
                            {previewData.advancePaid > 0 && (
                              <div className="p-4 border-t">
                                <div className="flex justify-between text-green-600">
                                  <span className="font-medium">
                                    Advance Paid:
                                  </span>
                                  <span className="font-bold">
                                    ₹{previewData.advancePaid.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                                  <span className="text-blue-700">
                                    Balance Due:
                                  </span>
                                  <span className="text-blue-700">
                                    ₹
                                    {(
                                      previewData.total -
                                      previewData.advancePaid
                                    ).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Watermark */}
                  <div className="text-center mt-12 opacity-10 pointer-events-none">
                    <div className="text-gray-400 text-6xl font-bold transform -rotate-12">
                      PREVIEW
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg border border-gray-300 overflow-hidden h-[calc(90vh-200px)]">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 inline-block">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        PDF Preview
                      </h3>
                      <p className="text-gray-600 mb-4">
                        The actual PDF will be generated with complete details.
                        Click the buttons below to download or print.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={handleDownloadPDF}
                          variant="outline"
                          disabled={isDownloading}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          {isDownloading ? "Generating..." : "Download PDF"}
                        </Button>
                        <Button
                          onClick={handlePrint}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Printer className="h-4 w-4" />
                          Print Preview
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center p-6 border-t bg-gray-50">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                Total:{" "}
                <span className="text-orange-700">
                  ₹{previewData.total.toFixed(2)}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                {previewData.items.length} items • {company} •{" "}
                {isGSTIncluded ? "GST Included" : "GST Added"}
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isGenerating}
              >
                Cancel
              </Button>

              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await onSaveAsDraft();
                    onClose();
                  } catch (error) {
                    console.error("Failed to save draft:", error);
                  }
                }}
                disabled={isGenerating}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>

              <Button
                onClick={async () => {
                  try {
                    await onGenerateInvoice();
                    onClose();
                  } catch (error) {
                    console.error("Failed to generate invoice:", error);
                  }
                }}
                disabled={isGenerating}
                className="bg-orange-800 hover:bg-orange-900 text-white"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <IndianRupee className="mr-2 h-4 w-4" />
                    {isEditMode ? "Update Invoice" : "Generate Invoice & PDF"}
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

export default InvoicePreviewPage;
