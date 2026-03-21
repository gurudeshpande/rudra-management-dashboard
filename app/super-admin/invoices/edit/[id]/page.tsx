// app/super-admin/invoices/edit/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Save,
  IndianRupee,
  ChevronDown,
  Search,
  Upload,
  X,
  Minus,
  UserPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import InvoicePDF from "@/components/InvoicePDF/InvoicePDF";
import { convertToWords } from "@/utils/numberToWords";
import { pdf } from "@react-pdf/renderer";
import { AlertToaster, alert } from "@/components/ui/alert-toaster";
import InvoicePreviewPage from "@/components/InvoicePreview/InvoicePreviewPage";

interface Product {
  id: number;
  name: string;
  size: string;
  price: number;
  category: string;
  quantity: number;
}

interface InvoiceItem {
  productId: number;
  name: string;
  quantity: number;
  price: number; // Display price (with GST if YADNYASENI and GST checked, else original)
  originalPrice: number; // Base price from database
  total: number;
  hsn?: string;
  unit?: string;
  searchQuery: string;
  showDropdown: boolean;
  gstIncluded?: boolean;
  applyGST: boolean;
}

interface CustomerInfo {
  id?: number;
  name: string;
  phone: string;
  billingAddress?: string;
  email: string;
  city?: string;
  pincode?: string;
  gst?: string;
  pan?: string;
}

interface DiscountType {
  type: "percentage" | "amount";
  value: number;
}

interface BulkProduct {
  product: Product;
  quantity: number;
  selected: boolean;
}

const EditInvoicePage = () => {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productsData, setProductsData] = useState<Product[]>([]);

  // Form states
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    phone: "",
    email: "",
    billingAddress: "",
    gst: "",
    pan: "",
  });
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [company, setCompany] = useState<"RUDRA" | "YADNYASENI">("RUDRA");
  const [invoiceStatus, setInvoiceStatus] = useState<
    "PAID" | "UNPAID" | "ADVANCE" | "DRAFT"
  >("UNPAID");
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [productDescription, setProductDescription] = useState<string>("");
  const [applyExtraCharges, setApplyExtraCharges] = useState<boolean>(false);
  const [extraChargesAmount, setExtraChargesAmount] = useState<number>(0);
  const [overallDiscount, setOverallDiscount] = useState<DiscountType>({
    type: "percentage",
    value: 0,
  });
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);

  // UI states
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkSearch, setBulkSearch] = useState("");
  const [bulkProducts, setBulkProducts] = useState<BulkProduct[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [invoicePreviewData, setInvoicePreviewData] = useState<any>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    name: "",
    email: "",
    phone: "",
    billingAddress: "",
    gst: "",
    pan: "",
  });
  const [customerFormErrors, setCustomerFormErrors] = useState<
    Partial<typeof customerFormData>
  >({});
  const [existingCustomers, setExistingCustomers] = useState<CustomerInfo[]>(
    [],
  );
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // Calculate displayed price based on company and GST setting
  const getDisplayPrice = (
    originalPrice: number,
    applyGST: boolean,
    company: "RUDRA" | "YADNYASENI",
  ) => {
    if (company === "YADNYASENI" && applyGST) {
      // For YADNYASENI, when GST is applied, show price with GST
      return originalPrice * 1.05;
    } else {
      // For RUDRA or when GST is not applied, show original price
      return originalPrice;
    }
  };

  // Calculate item total based on company type
  const calculateItemTotal = (
    originalPrice: number,
    quantity: number,
    applyGST: boolean,
    company: "RUDRA" | "YADNYASENI",
  ) => {
    let baseTotal = originalPrice * quantity;

    if (applyGST) {
      if (company === "RUDRA") {
        // For RUDRA: Add GST on top
        baseTotal = baseTotal * 1.05;
      } else if (company === "YADNYASENI") {
        // For YADNYASENI: GST is included in the displayed price
        // So total is already with GST
        baseTotal = baseTotal * 1.05;
      }
    }

    return baseTotal;
  };

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProductsData(data);
      } catch (error: any) {
        console.error("Failed to fetch products:", error);
        alert.error("Failed to load products", error.message);
      }
    };
    fetchProducts();
  }, []);

  // Fetch invoice data
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

        // Set basic invoice info
        setEditingInvoiceId(data.id);
        setInvoiceNumber(data.invoiceNumber);
        setInvoiceDate(new Date(data.invoiceDate).toISOString().split("T")[0]);
        setCompany(data.companyType);
        setInvoiceStatus(data.status);
        setAdvancePayment(data.advancePaid || 0);
        setProductDescription(data.description || "");
        setExtraChargesAmount(data.extraCharges || 0);
        setApplyExtraCharges((data.extraCharges || 0) > 0);

        // Set customer info
        setCustomerInfo({
          name: data.customer.name,
          phone: data.customer.number,
          email: data.customer.email || "",
          billingAddress: data.customer.address || "",
          gst: data.customer.gst || "",
          pan: data.customer.pan || "",
        });

        // Transform items with proper product search data and GST settings
        const transformedItems = data.items.map((item: any) => {
          // Find the product in productsData to get current price
          const product = productsData.find((p) => p.id === item.productId);
          const originalPrice = product?.price || item.price;

          // Determine if GST was applied to this item
          let applyGST = true;

          if (data.companyType === "RUDRA") {
            // For RUDRA: Check if total matches with GST
            const calculatedWithGST = item.quantity * originalPrice * 1.05;
            const calculatedWithoutGST = item.quantity * originalPrice;
            applyGST = Math.abs(item.total - calculatedWithGST) < 0.01;
          } else {
            // For YADNYASENI: Check if total matches with GST included
            const calculatedWithGST = item.quantity * originalPrice * 1.05;
            const calculatedWithoutGST = item.quantity * originalPrice;
            applyGST = Math.abs(item.total - calculatedWithGST) < 0.01;
          }

          // Calculate display price based on company and GST setting
          const displayPrice = getDisplayPrice(
            originalPrice,
            applyGST,
            data.companyType,
          );

          // Calculate total
          const total = calculateItemTotal(
            originalPrice,
            item.quantity,
            applyGST,
            data.companyType,
          );

          return {
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: displayPrice,
            originalPrice: originalPrice,
            total: total,
            searchQuery: item.name,
            showDropdown: false,
            gstIncluded: data.companyType === "YADNYASENI" && applyGST,
            applyGST: applyGST,
            hsn: item.hsn,
            unit: item.unit,
          };
        });

        setItems(transformedItems);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching invoice:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id && productsData.length > 0) {
      fetchInvoice();
    } else if (params.id && productsData.length === 0) {
      // Wait for products to load
      const interval = setInterval(() => {
        if (productsData.length > 0) {
          fetchInvoice();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [params.id, productsData]);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/customer-management");
        if (res.ok) {
          const data = await res.json();
          setExistingCustomers(data.customers);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      }
    };
    fetchCustomers();
  }, []);

  // Initialize bulk products
  useEffect(() => {
    if (productsData.length > 0) {
      setBulkProducts(
        productsData.map((product) => ({
          product,
          quantity: 1,
          selected: false,
        })),
      );
    }
  }, [productsData]);

  // Update items when company changes
  useEffect(() => {
    if (items.length > 0) {
      const updatedItems = items.map((item) => {
        if (item.originalPrice > 0) {
          // Recalculate total based on new company
          const newTotal = calculateItemTotal(
            item.originalPrice,
            item.quantity,
            item.applyGST,
            company,
          );

          // Update displayed price
          const newDisplayPrice = getDisplayPrice(
            item.originalPrice,
            item.applyGST,
            company,
          );

          return {
            ...item,
            total: newTotal,
            price: newDisplayPrice,
            gstIncluded: company === "YADNYASENI" && item.applyGST,
          };
        }
        return {
          ...item,
          gstIncluded: company === "YADNYASENI" && item.applyGST,
        };
      });

      setItems(updatedItems);
    }
  }, [company]);

  // Filter products for dropdown
  const filteredProducts = (index: number) => {
    const searchQuery = items[index]?.searchQuery?.toLowerCase() || "";
    if (!searchQuery) return productsData;

    return productsData.filter((product) => {
      const productName = product?.name?.toLowerCase() || "";
      const productSize = product?.size?.toLowerCase() || "";
      const productCategory = product?.category?.toLowerCase() || "";
      const productId = product?.id?.toString() || "";

      return (
        productName.includes(searchQuery) ||
        productSize.includes(searchQuery) ||
        productCategory.includes(searchQuery) ||
        productId.includes(searchQuery)
      );
    });
  };

  // Filter customers
  const filteredCustomers = existingCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (customer.phone ?? "").includes(customerSearch),
  );

  // Calculate totals
  const roundTo2 = (num: number) =>
    Math.round((num + Number.EPSILON) * 100) / 100;

  // Update the calculateTotals function in your EditInvoicePage component

  const calculateTotals = () => {
    let subtotalBeforeDiscount = 0;

    items.forEach((item) => {
      if (item.name && item.originalPrice > 0) {
        if (company === "RUDRA") {
          // For RUDRA: Add original price * quantity (without GST)
          subtotalBeforeDiscount += item.originalPrice * item.quantity;
        } else {
          // For YADNYASENI: Add the total amount (which already includes GST if applied)
          subtotalBeforeDiscount += item.total;
        }
      }
    });

    let discountAmount = 0;
    if (overallDiscount.value > 0) {
      if (overallDiscount.type === "percentage") {
        discountAmount = (subtotalBeforeDiscount * overallDiscount.value) / 100;
      } else {
        discountAmount = Math.min(
          overallDiscount.value,
          subtotalBeforeDiscount,
        );
      }
    }

    const afterDiscount = subtotalBeforeDiscount - discountAmount;

    let gstAmount = 0;
    let cgst = 0;
    let sgst = 0;

    if (company === "RUDRA") {
      // For RUDRA: Calculate GST on the discounted amount
      gstAmount = afterDiscount * 0.05;
      cgst = gstAmount / 2;
      sgst = gstAmount / 2;
    }

    let total = afterDiscount;
    if (company === "RUDRA") {
      total = afterDiscount + gstAmount;
    } else {
      // For YADNYASENI: total is already the afterDiscount amount (which includes GST)
      total = afterDiscount;
    }

    if (applyExtraCharges) {
      total += extraChargesAmount;
    }

    const balance = total - advancePayment;

    return {
      subtotal: roundTo2(subtotalBeforeDiscount),
      totalDiscount: roundTo2(discountAmount),
      cgst: roundTo2(cgst),
      sgst: roundTo2(sgst),
      gstTotal: roundTo2(gstAmount),
      extraCharges: applyExtraCharges ? roundTo2(extraChargesAmount) : 0,
      total: roundTo2(total),
      balance: roundTo2(balance),
    };
  };

  const {
    subtotal,
    totalDiscount,
    cgst,
    sgst,
    gstTotal,
    extraCharges,
    total,
    balance,
  } = calculateTotals();

  // Handle item changes
  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: any,
  ) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (
      field === "quantity" ||
      field === "originalPrice" ||
      field === "applyGST"
    ) {
      const finalTotal = calculateItemTotal(
        updatedItems[index].originalPrice,
        updatedItems[index].quantity,
        updatedItems[index].applyGST,
        company,
      );
      updatedItems[index].total = finalTotal;

      // Update displayed price based on company and GST
      const newDisplayPrice = getDisplayPrice(
        updatedItems[index].originalPrice,
        updatedItems[index].applyGST,
        company,
      );
      updatedItems[index].price = newDisplayPrice;
      updatedItems[index].gstIncluded =
        company === "YADNYASENI" && updatedItems[index].applyGST;
    }

    setItems(updatedItems);
  };

  // Handle product selection
  const handleProductSelect = (index: number, product: Product) => {
    const updatedItems = [...items];
    const basePrice = product.price;

    // Default: apply GST
    const shouldApplyGST = true;

    const finalTotal = calculateItemTotal(
      basePrice,
      updatedItems[index].quantity,
      shouldApplyGST,
      company,
    );

    const displayPrice = getDisplayPrice(basePrice, shouldApplyGST, company);

    updatedItems[index] = {
      ...updatedItems[index],
      productId: product.id,
      name: `${product.name} ${product.size}`,
      price: displayPrice,
      originalPrice: basePrice,
      total: finalTotal,
      searchQuery: `${product.name} ${product.size}`,
      showDropdown: false,
      gstIncluded: company === "YADNYASENI" && shouldApplyGST,
      applyGST: shouldApplyGST,
    };

    setItems(updatedItems);
  };

  // Handle search change
  const handleSearchChange = (index: number, query: string) => {
    const updatedItems = [...items];
    updatedItems[index].searchQuery = query;
    setItems(updatedItems);
  };

  // Handle dropdown toggle
  const handleDropdownToggle = (index: number, show: boolean) => {
    const updatedItems = [...items];
    updatedItems[index].showDropdown = show;
    if (show) {
      updatedItems.forEach((_, i) => {
        if (i !== index) updatedItems[i].showDropdown = false;
      });
    }
    setItems(updatedItems);
  };

  // Add new row
  const handleAddRow = () => {
    setItems([
      ...items,
      {
        productId: 0,
        name: "",
        quantity: 1,
        price: 0,
        originalPrice: 0,
        total: 0,
        searchQuery: "",
        showDropdown: false,
        gstIncluded: company === "YADNYASENI",
        applyGST: true,
      },
    ]);
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer: CustomerInfo) => {
    setCustomerInfo({
      name: customer.name,
      phone: customer.phone || "",
      billingAddress: customer.billingAddress || "",
      email: customer.email || "",
      gst: customer.gst || "",
      pan: customer.pan || "",
    });
    setShowCustomerDropdown(false);
    setCustomerSearch("");
  };

  // Handle customer info change
  const handleCustomerInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));

    if (name === "name") {
      setCustomerSearch(value);
      if (value.length > 0) {
        setShowCustomerDropdown(true);
      } else {
        setShowCustomerDropdown(false);
      }
    }
  };

  // Validate customer form
  const validateCustomerForm = (): boolean => {
    const errors: Partial<typeof customerFormData> = {};

    if (!customerFormData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!customerFormData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(customerFormData.phone)) {
      errors.phone = "Please enter a valid 10-digit phone number";
    }

    if (
      customerFormData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerFormData.email)
    ) {
      errors.email = "Please enter a valid email address";
    }

    setCustomerFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create new customer
  const handleCreateCustomer = async () => {
    if (!validateCustomerForm()) return;

    try {
      const response = await fetch("/api/customer-management", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create customer");
      }

      setCustomerInfo({
        name: customerFormData.name,
        phone: customerFormData.phone,
        email: customerFormData.email,
        billingAddress: customerFormData.billingAddress,
        gst: customerFormData.gst,
        pan: customerFormData.pan,
      });

      alert.success(
        "Customer created successfully!",
        "New customer has been added and selected",
      );

      setIsCustomerModalOpen(false);
      setCustomerFormData({
        name: "",
        email: "",
        phone: "",
        billingAddress: "",
        gst: "",
        pan: "",
      });

      const res = await fetch("/api/customer-management");
      if (res.ok) {
        const data = await res.json();
        setExistingCustomers(data.customers);
      }
    } catch (error: any) {
      alert.error(
        "Failed to create customer",
        error.message || "Please try again later",
      );
    }
  };

  // Handle customer input change in modal
  const handleCustomerInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === "pan") {
      processedValue = value.toUpperCase();
    }
    setCustomerFormData((prev) => ({ ...prev, [name]: processedValue }));
    if (customerFormErrors[name as keyof typeof customerFormData]) {
      setCustomerFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Reset customer form
  const resetCustomerForm = () => {
    setCustomerFormData({
      name: "",
      email: "",
      phone: "",
      billingAddress: "",
      gst: "",
      pan: "",
    });
    setCustomerFormErrors({});
  };

  // Save invoice
  // Update the saveInvoice function signature and implementation
  const saveInvoice = async (
    status: "PAID" | "ADVANCE" | "UNPAID" | "DRAFT",
  ) => {
    try {
      const validItems = items.filter((item) => item.name && item.price > 0);

      if (validItems.length === 0) {
        alert.error(
          "No items added",
          "Please add at least one product to the invoice",
        );
        return;
      }

      if (!customerInfo.name || !customerInfo.phone) {
        alert.error(
          "Customer information incomplete",
          "Please fill customer name and phone number",
        );
        return;
      }

      const invoiceData = {
        invoiceNumber,
        invoiceDate: new Date(invoiceDate).toISOString(),
        dueDate: new Date(
          new Date(invoiceDate).setDate(new Date(invoiceDate).getDate() + 30),
        ).toISOString(),
        deliveryDate: new Date().toISOString(),
        customerInfo,
        companyType: company,
        items: validItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.originalPrice, // Store original price without GST
          originalPrice: item.originalPrice,
          total: item.total,
          applyGST: item.applyGST,
        })),
        subtotal,
        extraCharges,
        cgst,
        sgst,
        total,
        advancePaid: advancePayment,
        balanceDue: balance,
        totalInWords: `${convertToWords(total)} Only`,
        status, // Now accepts "DRAFT" as well
        description: productDescription,
        overallDiscount: overallDiscount.value > 0 ? overallDiscount : null,
      };

      const url = `/api/allinvoices/${editingInvoiceId}`;
      const method = "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Failed to update invoice");

      // Show appropriate success message based on status
      if (status === "DRAFT") {
        alert.success(
          `Invoice saved as draft!`,
          `Invoice number: ${invoiceNumber}`,
          {
            duration: 6000,
            action: {
              label: "View Invoices",
              onClick: () => {
                router.push("/super-admin/invoicemanagement");
              },
            },
          },
        );
      } else {
        alert.success(
          `Invoice updated successfully!`,
          `Invoice number: ${invoiceNumber}`,
          {
            duration: 6000,
            action: {
              label: "View Invoices",
              onClick: () => {
                router.push("/super-admin/invoicemanagement");
              },
            },
          },
        );
      }

      setTimeout(() => {
        router.push("/super-admin/invoicemanagement");
      }, 2000);

      return result;
    } catch (error: any) {
      console.error("Error updating invoice:", error);
      alert.error(
        "Failed to update invoice",
        error.message || "Please try again later",
      );
      throw error;
    }
  };

  // Handle preview
  const handlePreviewInvoice = async () => {
    try {
      const validItems = items.filter((item) => item.name && item.price > 0);

      if (validItems.length === 0) {
        alert.error(
          "No items added",
          "Please add at least one product to the invoice",
        );
        return;
      }

      if (!customerInfo.name || !customerInfo.phone) {
        alert.error(
          "Customer information incomplete",
          "Please fill customer name and phone number",
        );
        return;
      }

      const formattedInvoiceDate = new Date(invoiceDate).toLocaleDateString(
        "en-IN",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      );

      const mappedItems = validItems.map((item) => ({
        name: item.name,
        hsn: item.hsn || "970300",
        quantity: item.quantity,
        unit: item.unit || "pcs",
        rate: item.price,
        originalPrice: item.originalPrice,
        amount: item.total,
        description: "",
        gstIncluded: item.gstIncluded || false,
      }));

      const companyDetails = {
        RUDRA: {
          name: "Rudra Arts and Handicrafts",
          address:
            "Samata Nagar, Ganesh Nagar Lane No 1, Famous Chowk, New Sangavi",
          city: "Pune, Maharashtra 411061, India",
          gstin: "GSTIN 27AMWPV8148A1ZE",
          phone: "9595221296",
          email: "rudraarts30@gmail.com",
        },
        YADNYASENI: {
          name: "Yadnyaseni Creations",
          address:
            "Samata Nagar, Ganesh Nagar Lane No 1, Above Rudra arts & Handicrafts LLP,Famous Chowk, New Sangavi, Pune Maharashtra 411027, India",
          city: "Pune, Maharashtra 411061, India",
          gstin: "GSTIN 27AMWPV8148A1ZE",
          phone: "9595221296",
          email: "rudraarts30@gmail.com",
        },
      };

      const currentCompany = companyDetails[company];

      const previewData = {
        companyDetails: currentCompany,
        invoiceNumber: invoiceNumber,
        invoiceDate: formattedInvoiceDate,
        dueDate: formattedInvoiceDate,
        companyType: company,
        customerInfo: {
          name: customerInfo.name || "",
          address: customerInfo.billingAddress || "",
          phone: customerInfo.phone || "",
          city: customerInfo.city || "",
          pincode: customerInfo.pincode || "",
          gstin: customerInfo.gst || "",
        },
        shippingInfo: {
          name: customerInfo.name || "",
          address: customerInfo.billingAddress || "",
          city: customerInfo.city || "",
          pincode: customerInfo.pincode || "",
          gstin: customerInfo.gst || "",
        },
        items: mappedItems,
        subtotal,
        cgst,
        sgst,
        total,
        totalInWords: `${convertToWords(total)} Only`,
        deliveryDate: new Date().toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        advancePaid: advancePayment,
        notes: "",
        previousDue: 0,
        overallDiscount: overallDiscount.value > 0 ? overallDiscount : null,
        gstCalculationType:
          company === "YADNYASENI" ? "INCLUDED_IN_PRICE" : "ADDED_ON_TOP",
      };

      setInvoicePreviewData(previewData);
      setShowPreview(true);
    } catch (error) {
      console.error("Failed to prepare preview:", error);
      alert.error(
        "Failed to prepare preview",
        "Please check your inputs and try again",
      );
    }
  };

  // Handle generate invoice
  const handleGenerateInvoice = async () => {
    try {
      const result = await saveInvoice(invoiceStatus);

      const validItems = items.filter((item) => item.name && item.price > 0);

      const companyDetails = {
        RUDRA: {
          name: "Rudra Arts and Handicrafts",
          address:
            "Samata Nagar, Ganesh Nagar Lane No 1, Famous Chowk, New Sangavi",
          city: "Pune, Maharashtra 411061, India",
          gstin: "GSTIN 27AMWPV8148A1ZE",
          phone: "9595221296",
          email: "rudraarts30@gmail.com",
        },
        YADNYASENI: {
          name: "Yadnyaseni Creations",
          address:
            "Samata Nagar, Ganesh Nagar Lane No 1, Above Rudra arts & Handicrafts LLP,Famous Chowk, New Sangavi, Pune Maharashtra 411027, India",
          city: "Pune, Maharashtra 411061, India",
          gstin: "GSTIN 27AMWPV8148A1ZE",
          phone: "9595221296",
          email: "rudraarts30@gmail.com",
        },
      };

      const currentCompany = companyDetails[company];
      const dueDateObj = new Date(invoiceDate);
      dueDateObj.setDate(dueDateObj.getDate() + 30);

      const mappedItems = validItems.map((item) => ({
        name: item.name,
        hsn: item.hsn || "970300",
        quantity: item.quantity,
        unit: item.unit || "pcs",
        rate: item.price,
        originalPrice: item.originalPrice,
        discount: 0,
        discountType: "percentage" as const,
        cgst: 2.5,
        sgst: 2.5,
        amount: item.total,
        description: "",
        gstIncluded: item.gstIncluded || false,
      }));

      const blob = await pdf(
        <InvoicePDF
          invoiceData={{
            companyDetails: currentCompany,
            invoiceNumber: result.invoice.invoiceNumber,
            invoiceDate,
            dueDate: dueDateObj.toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            companyType: company,
            description: productDescription,
            customerInfo: {
              name: customerInfo.name || "",
              phone: customerInfo.phone || "",
              address: customerInfo.billingAddress || "",
              city: customerInfo.city || "",
              pincode: customerInfo.pincode || "",
              gstin: customerInfo.gst || "",
            },
            shippingInfo: {
              name: customerInfo.name || "",
              address: customerInfo.billingAddress || "",
              city: customerInfo.city || "",
              pincode: customerInfo.pincode || "",
              gstin: customerInfo.gst || "",
            },
            items: mappedItems,
            subtotal,
            cgst,
            sgst,
            total,
            extraCharges: extraCharges || 0,
            totalInWords: `${convertToWords(total)} Only`,
            deliveryDate: new Date().toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            advancePaid: advancePayment,
            notes: "",
            previousDue: 0,
            discountDetails: {
              hasDiscount: totalDiscount > 0,
              totalDiscount: totalDiscount,
              itemsWithDiscount: [],
            },
            gstCalculationType:
              company === "YADNYASENI" ? "INCLUDED_IN_PRICE" : "ADDED_ON_TOP",
          }}
          logoUrl="/images/logo.png"
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${result.invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setShowPreview(false);
    } catch (error: any) {
      console.error("Failed to generate invoice:", error);
      alert.error(
        "Failed to generate invoice",
        error.message || "Please try again later",
      );
    }
  };

  // Handle bulk upload
  const handleBulkProductSelect = (index: number) => {
    const updatedBulkProducts = [...bulkProducts];
    updatedBulkProducts[index].selected = !updatedBulkProducts[index].selected;
    setBulkProducts(updatedBulkProducts);
  };

  const handleBulkQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedBulkProducts = [...bulkProducts];
    updatedBulkProducts[index].quantity = newQuantity;
    setBulkProducts(updatedBulkProducts);
  };

  const handleAddBulkProducts = () => {
    const selectedProducts = bulkProducts.filter((bp) => bp.selected);

    if (selectedProducts.length === 0) {
      alert.error(
        "No products selected",
        "Please select at least one product to add",
      );
      return;
    }

    const newItems = selectedProducts.map((bp) => {
      const shouldApplyGST = true;
      const finalTotal = calculateItemTotal(
        bp.product.price,
        bp.quantity,
        shouldApplyGST,
        company,
      );

      const displayPrice = getDisplayPrice(
        bp.product.price,
        shouldApplyGST,
        company,
      );

      return {
        productId: bp.product.id,
        name: `${bp.product.name} ${bp.product.size}`,
        quantity: bp.quantity,
        price: displayPrice,
        originalPrice: bp.product.price,
        total: finalTotal,
        searchQuery: `${bp.product.name} ${bp.product.size}`,
        showDropdown: false,
        gstIncluded: company === "YADNYASENI",
        applyGST: shouldApplyGST,
      };
    });

    setItems((prevItems) => [...prevItems, ...newItems]);
    setBulkProducts((prev) =>
      prev.map((bp) => ({ ...bp, selected: false, quantity: 1 })),
    );
    setShowBulkUpload(false);
    setBulkSearch("");

    alert.success(
      "Products added successfully",
      `${selectedProducts.length} product(s) added to invoice`,
    );
  };

  const filteredBulkProducts = bulkProducts.filter(
    (bulkProduct) =>
      bulkProduct.product.name
        .toLowerCase()
        .includes(bulkSearch.toLowerCase()) ||
      bulkProduct.product.category
        .toLowerCase()
        .includes(bulkSearch.toLowerCase()),
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-800 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading invoice...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Error Loading Invoice
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button
              onClick={() => router.push("/super-admin/invoicemanagement")}
              className="bg-orange-800 hover:bg-orange-900"
            >
              Back to Invoice Management
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AlertToaster />

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Bulk Add Products
                </h2>
                <p className="text-sm text-gray-600">
                  Search and select multiple products to add to invoice
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowBulkUpload(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products by name or category..."
                  value={bulkSearch}
                  onChange={(e) => setBulkSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="border rounded-lg max-h-96 overflow-auto">
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b font-medium text-sm">
                  <div className="col-span-1"></div>
                  <div className="col-span-5">Product</div>
                  <div className="col-span-3 text-center">Price</div>
                  <div className="col-span-3 text-center">Quantity</div>
                </div>

                <div className="divide-y">
                  {filteredBulkProducts.map((bulkProduct, index) => (
                    <div
                      key={bulkProduct.product.id}
                      className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50"
                    >
                      <div className="col-span-1">
                        <Checkbox
                          checked={bulkProduct.selected}
                          onCheckedChange={() => handleBulkProductSelect(index)}
                        />
                      </div>
                      <div className="col-span-5">
                        <div className="font-medium">
                          {bulkProduct.product.name} {bulkProduct.product.size}
                        </div>
                        <div className="text-sm text-gray-500">
                          {bulkProduct.product.category}
                        </div>
                        <div className="text-xs text-gray-400">
                          Stock: {bulkProduct.product.quantity}
                        </div>
                      </div>
                      <div className="col-span-3 text-center font-medium">
                        ₹{bulkProduct.product.price}
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleBulkQuantityChange(
                                index,
                                bulkProduct.quantity - 1,
                              )
                            }
                            disabled={bulkProduct.quantity <= 1}
                            className="h-8 w-8"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={bulkProduct.quantity}
                            onChange={(e) =>
                              handleBulkQuantityChange(
                                index,
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className="w-16 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              handleBulkQuantityChange(
                                index,
                                bulkProduct.quantity + 1,
                              )
                            }
                            className="h-8 w-8"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkUpload(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddBulkProducts}
                  className="bg-orange-800 hover:bg-orange-900"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Selected Products (
                  {bulkProducts.filter((bp) => bp.selected).length})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
            <p className="text-sm text-gray-500 mt-1">
              Invoice Number: {invoiceNumber}
            </p>
          </div>
          <div className="space-y-3">
            <Label className="font-semibold">Company *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition ${
                  company === "RUDRA"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input
                  type="radio"
                  checked={company === "RUDRA"}
                  onChange={() => setCompany("RUDRA")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium">Rudra Arts & Handicrafts</span>
                  <div className="text-xs text-gray-500 mt-1">
                    GST added separately
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition ${
                  company === "YADNYASENI"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input
                  type="radio"
                  checked={company === "YADNYASENI"}
                  onChange={() => setCompany("YADNYASENI")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium">Yadnyaseni Creations</span>
                  <div className="text-xs text-gray-500 mt-1">
                    GST included in prices
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Customer Information */}
          <div className="border border-black/20 py-5 rounded-2xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">
                    Customer Information
                  </CardTitle>
                  <CardDescription>
                    View and edit customer details
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    resetCustomerForm();
                    setIsCustomerModalOpen(true);
                  }}
                  variant="outline"
                  className="bg-orange-800 hover:bg-orange-900 text-white cursor-pointer"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Customer
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="relative">
                    <Label className="text-xs text-gray-500">
                      Customer Name *
                    </Label>
                    <Input
                      name="name"
                      value={customerInfo.name}
                      onChange={handleCustomerInfoChange}
                      placeholder="Customer name"
                      className="mt-1"
                    />
                    <ChevronDown className="absolute right-3 top-8 h-4 w-4 text-gray-400" />

                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            <div className="font-medium text-sm">
                              {customer.name}
                            </div>
                            <div className="text-xs text-gray-600">
                              {customer.phone}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">
                      Phone Number *
                    </Label>
                    <Input
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handleCustomerInfoChange}
                      placeholder="Customer Phone"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">Email</Label>
                    <Input
                      name="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={handleCustomerInfoChange}
                      placeholder="email@example.com"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500">GST Number</Label>
                    <Input
                      name="gst"
                      value={customerInfo.gst || ""}
                      onChange={handleCustomerInfoChange}
                      placeholder="27ABCDE1234F1Z5"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">PAN Number</Label>
                    <Input
                      name="pan"
                      value={customerInfo.pan || ""}
                      onChange={handleCustomerInfoChange}
                      placeholder="ABCDE1234F"
                      className="mt-1 uppercase"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">
                      Invoice Date *
                    </Label>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <Label className="text-xs text-gray-500">Billing Address</Label>
                <Textarea
                  name="billingAddress"
                  value={customerInfo.billingAddress}
                  onChange={handleCustomerInfoChange}
                  placeholder="Customer Billing Address"
                  rows={2}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </div>

          {/* Invoice Items */}
          <div className="py-5 -z-10">
            <CardHeader className="px-0">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Invoice Items</CardTitle>
                  <CardDescription>
                    Edit products in the invoice
                  </CardDescription>
                  <div className="text-xs text-gray-500 mt-2">
                    {company === "YADNYASENI"
                      ? "✓ When GST is checked, 5% GST will be added to the rate"
                      : "✓ When GST is checked, 5% GST will be added to the total"}
                  </div>
                </div>
                <Button
                  onClick={() => setShowBulkUpload(true)}
                  variant="outline"
                  className="border-orange-200 text-orange-800 hover:bg-orange-50"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Upload
                </Button>
              </div>
            </CardHeader>

            <CardContent className="px-0 -z-40">
              <div className="space-y-4" style={{ overflow: "visible" }}>
                {/* TABLE HEADER */}
                <div className="grid grid-cols-11 gap-2 text-xs font-medium text-gray-600 pb-2 border-b">
                  <div className="col-span-5">Product</div>
                  <div className="col-span-1 text-right">Qty</div>
                  <div className="col-span-2 text-right">Rate (₹)</div>
                  <div className="col-span-1 text-right">GST</div>
                  <div className="col-span-1 text-right">Amount (₹)</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>

                {/* LINE ITEMS */}
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-11 gap-2 items-start py-2 border-b border-gray-100 last:border-b-0"
                    style={{ overflow: "visible" }}
                  >
                    {/* PRODUCT */}
                    <div className="col-span-5" style={{ overflow: "visible" }}>
                      <div
                        className="relative custom-dropdown"
                        style={{ overflow: "visible" }}
                      >
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search product..."
                            value={item.searchQuery}
                            onChange={(e) =>
                              handleSearchChange(index, e.target.value)
                            }
                            onFocus={() => handleDropdownToggle(index, true)}
                            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs bg-white"
                            autoComplete="off"
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <ChevronDown className="h-3 w-3" />
                          </div>
                        </div>

                        {item.showDropdown && (
                          <div
                            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              zIndex: 50,
                            }}
                          >
                            <div className="p-2 border-b sticky top-0 bg-white">
                              <input
                                type="text"
                                placeholder="Search product..."
                                value={item.searchQuery}
                                onChange={(e) =>
                                  handleSearchChange(index, e.target.value)
                                }
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md"
                              />
                            </div>

                            <div className="py-1">
                              {filteredProducts(index).length === 0 ? (
                                <div className="px-2 py-1.5 text-xs text-gray-500">
                                  No products found
                                </div>
                              ) : (
                                filteredProducts(index).map((product) => (
                                  <div
                                    key={product.id}
                                    onClick={() =>
                                      handleProductSelect(index, product)
                                    }
                                    className={`px-2 py-1.5 text-xs cursor-pointer hover:bg-gray-100 flex justify-between items-center ${
                                      item.productId === product.id
                                        ? "bg-blue-50 text-blue-700"
                                        : ""
                                    }`}
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {product.name} {product.size}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        ₹{product.price}
                                      </div>
                                    </div>
                                    <div>
                                      {product.quantity === 0 && (
                                        <span className="text-red-600 text-xs">
                                          Stock: 0
                                        </span>
                                      )}
                                      {product.quantity > 0 &&
                                        product.quantity < 10 && (
                                          <span className="text-orange-600 text-xs">
                                            Stock: {product.quantity}
                                          </span>
                                        )}
                                      {product.quantity >= 10 && (
                                        <span className="text-green-600 text-xs">
                                          Stock: {product.quantity}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {item.productId &&
                        item.quantity > 0 &&
                        (() => {
                          const selectedProduct = productsData.find(
                            (p) => p.id === item.productId,
                          );
                          if (!selectedProduct) return null;

                          const quantity = selectedProduct.quantity;
                          const required = item.quantity;

                          if (quantity === 0) {
                            return (
                              <div className="text-[10px] text-red-600 font-medium mt-1">
                                Out of Stock
                              </div>
                            );
                          } else if (required > quantity) {
                            return (
                              <div className="text-[10px] text-orange-600 mt-1">
                                Only {quantity} left
                              </div>
                            );
                          } else if (quantity < 10) {
                            return (
                              <div className="text-[10px] text-blue-600 mt-1">
                                Low Stock
                              </div>
                            );
                          }
                          return null;
                        })()}
                    </div>

                    {/* QTY */}
                    <div className="col-span-1">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 1,
                          )
                        }
                        className="text-right h-8 text-xs"
                      />
                    </div>

                    {/* RATE */}
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.price.toFixed(0)}
                        readOnly
                        className="text-right h-8 text-xs bg-gray-50"
                      />
                      {/* {company === "YADNYASENI" && item.applyGST && (
                        <div className="text-[10px] text-green-600 text-right mt-0.5">
                          (Incl. 5% GST)
                        </div>
                      )}
                      {company === "YADNYASENI" && !item.applyGST && (
                        <div className="text-[10px] text-gray-500 text-right mt-0.5">
                          (Excl. GST)
                        </div>
                      )} */}
                    </div>

                    {/* GST Checkbox */}
                    <div className="col-span-1 flex justify-end items-center">
                      <Checkbox
                        checked={item.applyGST}
                        onCheckedChange={(checked) =>
                          handleItemChange(index, "applyGST", checked === true)
                        }
                      />
                    </div>

                    {/* AMOUNT */}
                    <div className="col-span-1 text-right font-medium text-xs">
                      ₹{item.total.toFixed(0)}
                    </div>

                    {/* ACTION */}
                    <div className="col-span-1 flex justify-center items-center">
                      <button
                        onClick={() => handleRemoveRow(index)}
                        disabled={items.length === 1}
                        className={`p-1.5 rounded-full transition-all duration-200 ${
                          items.length === 1
                            ? "opacity-30 cursor-not-allowed text-gray-400"
                            : "text-red-500 hover:text-red-700 hover:bg-red-50 hover:scale-110"
                        }`}
                        title={
                          items.length === 1
                            ? "Cannot remove the last row"
                            : "Remove item"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* ADD ANOTHER ROW BUTTON */}
                <div className="flex justify-start pt-2">
                  <Button
                    onClick={handleAddRow}
                    variant="outline"
                    size="sm"
                    className="border-dashed border-2 border-gray-300 hover:border-orange-300 hover:bg-orange-50 text-gray-600 hover:text-orange-800 transition-colors"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Row
                  </Button>
                </div>
              </div>
            </CardContent>
          </div>

          {/* Invoice Settings and Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Settings */}
            <div className="border border-black/20 py-5 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Invoice Settings</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="divide-y divide-gray-100">
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="applyExtraCharges"
                        checked={applyExtraCharges}
                        onCheckedChange={(checked) =>
                          setApplyExtraCharges(checked === true)
                        }
                      />
                      <Label
                        htmlFor="applyExtraCharges"
                        className="font-medium cursor-pointer"
                      >
                        Apply Extra Charges
                      </Label>
                    </div>

                    {applyExtraCharges && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">₹</span>
                        <Input
                          type="number"
                          min="0"
                          value={extraChargesAmount}
                          onChange={(e) =>
                            setExtraChargesAmount(
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-24 text-right"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>

                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="applyOverallDiscount"
                        checked={overallDiscount.value > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setOverallDiscount({
                              type: "percentage",
                              value: 5,
                            });
                          } else {
                            setOverallDiscount({
                              type: "percentage",
                              value: 0,
                            });
                          }
                        }}
                      />
                      <Label
                        htmlFor="applyOverallDiscount"
                        className="font-medium cursor-pointer"
                      >
                        Apply Overall Discount
                      </Label>
                    </div>

                    {overallDiscount.value > 0 && (
                      <div className="flex items-center gap-2">
                        <select
                          value={overallDiscount.type}
                          onChange={(e) => {
                            const newType = e.target.value as
                              | "percentage"
                              | "amount";
                            setOverallDiscount((prev) => ({
                              ...prev,
                              type: newType,
                            }));
                          }}
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-16"
                        >
                          <option value="percentage">%</option>
                          <option value="amount">₹</option>
                        </select>
                        <Input
                          type="number"
                          min="0"
                          max={
                            overallDiscount.type === "percentage"
                              ? 100
                              : undefined
                          }
                          value={overallDiscount.value}
                          onChange={(e) => {
                            const newValue = parseFloat(e.target.value) || 0;
                            setOverallDiscount((prev) => ({
                              ...prev,
                              value: newValue,
                            }));
                          }}
                          className="w-20 text-right"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>

                  <div className="py-3">
                    <Label className="font-medium block mb-2">
                      Invoice Status *
                    </Label>
                    <div className="flex space-x-6">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={invoiceStatus === "PAID"}
                          onChange={() => setInvoiceStatus("PAID")}
                          className="h-4 w-4 text-blue-600"
                        />
                        <Label className="cursor-pointer">Paid</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={invoiceStatus === "UNPAID"}
                          onChange={() => setInvoiceStatus("UNPAID")}
                          className="h-4 w-4 text-blue-600"
                        />
                        <Label className="cursor-pointer">Unpaid</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={invoiceStatus === "ADVANCE"}
                          onChange={() => setInvoiceStatus("ADVANCE")}
                          className="h-4 w-4 text-blue-600"
                        />
                        <Label className="cursor-pointer">Advance</Label>
                      </div>
                    </div>
                  </div>

                  {invoiceStatus === "ADVANCE" && (
                    <div className="py-3 flex items-center justify-between">
                      <Label htmlFor="advance" className="font-medium">
                        Advance Payment
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">₹</span>
                        <Input
                          id="advance"
                          type="number"
                          min="0"
                          max={total}
                          value={advancePayment}
                          onChange={(e) =>
                            setAdvancePayment(parseFloat(e.target.value) || 0)
                          }
                          className="w-32 text-right"
                          placeholder="Enter amount"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </div>

            {/* Invoice Summary */}
            <div className="border border-black/20 py-5 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Invoice Summary</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-mono">₹{subtotal.toFixed(0)}</span>
                  </div>

                  {totalDiscount > 0 && (
                    <div className="flex justify-between py-1 text-green-600">
                      <span>Discount:</span>
                      <span className="font-mono">
                        -₹{totalDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {company === "RUDRA" && gstTotal > 0 && (
                    <>
                      <div className="flex justify-between py-1 text-sm">
                        <span className="text-gray-600">CGST (2.5%):</span>
                        <span className="font-mono">₹{cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1 text-sm">
                        <span className="text-gray-600">SGST (2.5%):</span>
                        <span className="font-mono">₹{sgst.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {company === "YADNYASENI" && (
                    <div className="flex justify-between py-1 text-xs text-gray-500 italic">
                      <span>GST (5%):</span>
                      <span>Included in rates when checked</span>
                    </div>
                  )}

                  {extraCharges > 0 && (
                    <div className="flex justify-between py-1 text-blue-600">
                      <span>Extra Charges:</span>
                      <span className="font-mono">
                        +₹{extraCharges.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200 mt-2">
                    <span>Total Amount:</span>
                    <span className="font-mono">₹{total.toFixed(0)}</span>
                  </div>

                  {invoiceStatus === "ADVANCE" && (
                    <>
                      <div className="flex justify-between py-1 text-green-600">
                        <span>Advance Paid:</span>
                        <span className="font-mono">
                          -₹{advancePayment.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-blue-700 pt-2 border-t border-gray-200">
                        <span>Balance Due:</span>
                        <span className="font-mono">₹{balance.toFixed(0)}</span>
                      </div>
                    </>
                  )}

                  <div className="pt-4 text-xs text-gray-500 italic border-t border-gray-100 mt-2">
                    {convertToWords(total)} Only
                  </div>
                </div>
              </CardContent>
            </div>
          </div>

          <div className="flex items-center justify-between w-full">
            <div></div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => saveInvoice("DRAFT")}
              >
                <Save className="mr-2 h-4 w-4" />
                Update Draft
              </Button>
              <Button
                className="bg-orange-800 hover:bg-orange-900 text-white"
                onClick={handlePreviewInvoice}
              >
                <IndianRupee className="mr-2 h-4 w-4" />
                Update Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && invoicePreviewData && (
        <InvoicePreviewPage
          invoiceData={{
            ...invoicePreviewData,
            description: productDescription,
          }}
          isEditMode={true}
          onClose={() => {
            setShowPreview(false);
            setInvoicePreviewData(null);
          }}
          onGenerateInvoice={handleGenerateInvoice}
          onSaveAsDraft={async () => {
            try {
              await saveInvoice("UNPAID");
              alert.success(
                "Invoice saved as draft",
                "You can find it in the invoice management section",
              );
            } catch (error) {
              console.error("Failed to save draft:", error);
              throw error;
            }
          }}
        />
      )}

      {/* Add Customer Modal */}
      <Dialog
        open={isCustomerModalOpen}
        onOpenChange={(open) => {
          setIsCustomerModalOpen(open);
          if (!open) resetCustomerForm();
        }}
      >
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Enter customer details below. The customer will be saved to your
              database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="modal-name">Name *</Label>
              <Input
                id="modal-name"
                name="name"
                placeholder="Customer/Company name"
                value={customerFormData.name}
                onChange={handleCustomerInputChange}
                className={customerFormErrors.name ? "border-red-500" : ""}
              />
              {customerFormErrors.name && (
                <p className="text-sm text-red-500">
                  {customerFormErrors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-phone">Phone Number *</Label>
              <Input
                id="modal-phone"
                name="phone"
                placeholder="10-digit phone number"
                value={customerFormData.phone}
                onChange={handleCustomerInputChange}
                className={customerFormErrors.phone ? "border-red-500" : ""}
              />
              {customerFormErrors.phone && (
                <p className="text-sm text-red-500">
                  {customerFormErrors.phone}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-email">Email Address</Label>
              <Input
                id="modal-email"
                name="email"
                type="email"
                placeholder="email@example.com"
                value={customerFormData.email}
                onChange={handleCustomerInputChange}
                className={customerFormErrors.email ? "border-red-500" : ""}
              />
              {customerFormErrors.email && (
                <p className="text-sm text-red-500">
                  {customerFormErrors.email}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modal-gst">GST Number</Label>
                <Input
                  id="modal-gst"
                  name="gst"
                  placeholder="27ABCDE1234F1Z5"
                  value={customerFormData.gst}
                  onChange={handleCustomerInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-pan">PAN Number</Label>
                <Input
                  id="modal-pan"
                  name="pan"
                  placeholder="ABCDE1234F"
                  value={customerFormData.pan}
                  onChange={handleCustomerInputChange}
                  style={{ textTransform: "uppercase" }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-billingAddress">Billing Address</Label>
              <Textarea
                id="modal-billingAddress"
                name="billingAddress"
                placeholder="Complete billing address"
                value={customerFormData.billingAddress}
                onChange={handleCustomerInputChange}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCustomerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCustomer}
              className="bg-orange-800 hover:bg-orange-900 text-white"
            >
              Create Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default EditInvoicePage;
