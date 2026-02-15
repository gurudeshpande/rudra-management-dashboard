// app/super-admin/invoices/edit/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Invoices from "../../page"; // Import your invoice page component

interface InvoiceItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  originalPrice: number;
  total: number;
  discount: number;
  discountedPrice: number;
  searchQuery: string;
  showDropdown: boolean;
  gstIncluded: boolean;
  applyGST: boolean;
}

interface CustomerInfo {
  id?: number;
  name: string;
  phone: string;
  billingAddress?: string;
  email: string;
  gst?: string;
  pan?: string;
}

interface InvoiceData {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  customer: {
    id: number;
    name: string;
    number: string;
    address: string | null;
    email: string | null;
    gst: string | null;
    pan: string | null;
  };
  items: Array<{
    id: number;
    productId: number;
    name: string;
    quantity: number;
    price: number;
    total: number;
    notes: string | null;
  }>;
  subtotal: number;
  extraCharges: number;
  cgst: number;
  sgst: number;
  total: number;
  advancePaid: number;
  balanceDue: number;
  status: "PAID" | "UNPAID" | "ADVANCE";
  companyType: "RUDRA" | "YADNYASENI";
  description: string | null;
}

const EditInvoicePage = () => {
  const params = useParams();
  const router = useRouter();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/allinvoices/getallinvoices/${params.id}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch invoice");
        }

        const data = await response.json();
        setInvoiceData(data);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching invoice:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-800 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading invoice...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Invoice
          </h3>
          <p className="text-red-600 mb-4">{error || "Invoice not found"}</p>
          <button
            onClick={() => router.push("/super-admin/invoicemanagement")}
            className="px-4 py-2 bg-orange-800 text-white rounded hover:bg-orange-900 transition-colors"
          >
            Back to Invoice Management
          </button>
        </div>
      </div>
    );
  }

  // Transform the invoice data to match the format expected by Invoices component
  const transformedData = {
    id: invoiceData.id,
    invoiceNumber: invoiceData.invoiceNumber,
    customerInfo: {
      name: invoiceData.customer.name,
      phone: invoiceData.customer.number,
      billingAddress: invoiceData.customer.address || "",
      email: invoiceData.customer.email || "",
      gst: invoiceData.customer.gst || "",
      pan: invoiceData.customer.pan || "",
    },
    items: invoiceData.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      originalPrice: item.price, // You might need to calculate this based on GST
      total: item.total,
      discount: 0, // Calculate if needed
      discountedPrice: 0,
      searchQuery: item.name,
      showDropdown: false,
      gstIncluded: invoiceData.companyType === "YADNYASENI",
      applyGST: invoiceData.companyType === "RUDRA",
    })),
    invoiceDate: new Date(invoiceData.invoiceDate).toISOString().split("T")[0],
    company: invoiceData.companyType,
    status: invoiceData.status,
    advancePaid: invoiceData.advancePaid,
    description: invoiceData.description || "",
    extraCharges: invoiceData.extraCharges,
    subtotal: invoiceData.subtotal,
    total: invoiceData.total,
  };

  return <Invoices initialData={transformedData} isEditMode={true} />;
};

export default EditInvoicePage;
