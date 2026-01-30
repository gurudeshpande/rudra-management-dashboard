// types/invoice.ts
export interface CompanyDetails {
  name: string;
  address?: string;
  city?: string;
  gstin?: string;
  phone?: string;
  email?: string;
}

export interface CustomerInfo {
  name: string;
  address: string;
  city: string;
  pincode: string;
  gstin: string;
}

export interface InvoiceItem {
  name: string;
  hsn: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  cgst: number;
  sgst: number;
  description?: string;
  amount: number;
}

export interface InvoiceData {
  companyDetails: CompanyDetails;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerInfo: CustomerInfo;
  shippingInfo: CustomerInfo;
  companyType?: "RUDRA" | "YADNYASENI";
  items: InvoiceItem[];
  subtotal: number;
  extraCharges?: number;
  notes: string;
  previousDue: number;
  cgst: number;
  sgst: number;
  total: number;
  advancePaid?: number;
  balanceDue?: number;
  status?: string;
  totalInWords: string;
  deliveryDate: string;
  gstCalculationType: "INCLUDED_IN_PRICE" | "ADDED_ON_TOP";
  discountDetails: {
    hasDiscount: boolean;
    totalDiscount: number;
    itemsWithDiscount: InvoiceItem[];
  };
}
