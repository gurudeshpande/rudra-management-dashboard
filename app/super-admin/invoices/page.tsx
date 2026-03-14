"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import React, { useState, useEffect } from "react";
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
  ReceiptIndianRupee,
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import InvoicePDF from "@/components/InvoicePDF/InvoicePDF";
import { convertToWords } from "@/utils/numberToWords";
import { pdf } from "@react-pdf/renderer";
import { AlertToaster, alert } from "@/components/ui/alert-toaster";
import InvoicePreviewPage from "@/components/InvoicePreview/InvoicePreviewPage";

// Define types

interface InvoicesProps {
  initialData?: {
    id: number;
    invoiceNumber: string;
    customerInfo: CustomerInfo;
    items: InvoiceItem[];
    invoiceDate: string;
    company: "RUDRA" | "YADNYASENI";
    status: "PAID" | "UNPAID" | "ADVANCE";
    advancePaid: number;
    description: string;
    extraCharges: number;
    subtotal: number;
    total: number;
  };
  isEditMode?: boolean;
}

interface DiscountType {
  type: "percentage" | "amount";
  value: number;
}

interface Product {
  stock: undefined;
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
  price: number;
  originalPrice: number;
  total: number;
  discount: DiscountType;
  discountedPrice: number;
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
  phone?: string;
  billingAddress?: string;
  email: string;
  city?: string;
  pincode?: string;
  gst?: string;
  pan?: string;
}

interface BulkProduct {
  product: Product;
  quantity: number;
  selected: boolean;
}

const Invoices = ({ initialData, isEditMode = false }: InvoicesProps) => {
  // State for customer information
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    phone: "",
    email: "",
    billingAddress: "",
    gst: "",
  });

  console.log(initialData, "initial Data");

  const [productDescription, setProductDescription] = useState<string>("");

  // State for existing customers
  const [existingCustomers, setExistingCustomers] = useState<CustomerInfo[]>(
    [],
  );
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

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

  // State for company selection
  const [company, setCompany] = useState<"RUDRA" | "YADNYASENI">("RUDRA");

  // State for invoice items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      productId: 0,
      name: "",
      quantity: 1,
      price: 0,
      originalPrice: 0,
      total: 0,
      discount: { type: "percentage", value: 0 },
      discountedPrice: 0,
      searchQuery: "",
      showDropdown: false,
      gstIncluded: false,
      applyGST: true,
    },
  ]);

  const [isEditing, setIsEditing] = useState(isEditMode);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(
    initialData?.id || null,
  );

  // State for bulk upload
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkSearch, setBulkSearch] = useState("");
  const [bulkProducts, setBulkProducts] = useState<BulkProduct[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [invoicePreviewData, setInvoicePreviewData] = useState<any>(null);

  const [applyExtraCharges, setApplyExtraCharges] = useState<boolean>(false);
  const [extraChargesAmount, setExtraChargesAmount] = useState<number>(0);

  // State for advance payment
  const [advancePayment, setAdvancePayment] = useState<number>(0);

  // State for overall discount
  const [overallDiscount, setOverallDiscount] = useState<DiscountType>({
    type: "percentage",
    value: 0,
  });

  // State for GST (only applicable for RUDRA in UI)
  const [includeGst, setIncludeGst] = useState<boolean>(true);

  const [productsData, setProductsData] = useState<Product[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [invoiceStatus, setInvoiceStatus] = useState<
    "PAID" | "UNPAID" | "ADVANCE"
  >("UNPAID");

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

    if (
      customerFormData.gst &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        customerFormData.gst,
      )
    ) {
      errors.gst = "Invalid GST format. Example: 27ABCDE1234F1Z5";
    }

    if (
      customerFormData.pan &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(customerFormData.pan)
    ) {
      errors.pan = "Invalid PAN format. Example: ABCDE1234F";
    }

    setCustomerFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

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

      // Auto-select the newly created customer
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

      // Close modal and reset form
      setIsCustomerModalOpen(false);
      resetCustomerForm();

      // Refresh customer list
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

  // Fetch existing customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/customer-management");
        if (res.ok) {
          const data = await res.json();
          console.log(data, "data");
          setExistingCustomers(data.customers);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      }
    };
    fetchCustomers();
  }, []);

  // Initialize bulk products when products data is loaded
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

  useEffect(() => {
    if (isEditMode && initialData) {
      // Populate customer info (make it non-editable)
      setCustomerInfo({
        name: initialData.customerInfo.name,
        phone: initialData.customerInfo.phone,
        billingAddress: initialData.customerInfo.billingAddress || "",
        email: initialData.customerInfo.email || "",
        gst: initialData.customerInfo.gst || "",
        pan: initialData.customerInfo.pan || "",
      });

      // Set invoice date
      setInvoiceDate(initialData.invoiceDate);

      // Set company
      setCompany(initialData.company);

      // Set invoice status
      setInvoiceStatus(initialData.status);

      // Set advance payment
      setAdvancePayment(initialData.advancePaid);

      // Set product description
      setProductDescription(initialData.description || "");

      // Set extra charges
      if (initialData.extraCharges > 0) {
        setApplyExtraCharges(true);
        setExtraChargesAmount(initialData.extraCharges);
      }

      // Set items
      setItems(initialData.items);

      // Set invoice number display
      setInvoiceNumber(initialData.invoiceNumber);
    }
  }, [initialData, isEditMode]);

  type CustomerType = "CUSTOMER" | "FRANCHISE" | "RESELLER";

  const [customerType, setCustomerType] = useState<CustomerType>("CUSTOMER");

  console.log(items, "Data items");

  const handleCustomerTypeChange = (type: CustomerType) => {
    setCustomerType(type);

    // Apply automatic discounts to all items based on customer type
    const updatedItems = items.map((item) => {
      if (item.originalPrice > 0) {
        let discountValue = 0;
        switch (type) {
          case "RESELLER":
            discountValue = 30;
            break;
          case "FRANCHISE":
            discountValue = 40;
            break;
          case "CUSTOMER":
          default:
            discountValue = 0;
            break;
        }

        const finalTotal = calculateItemTotal(
          item.originalPrice,
          item.quantity,
          { type: "percentage" as const, value: discountValue },
          overallDiscount,
          item.applyGST,
          company,
        );

        return {
          ...item,
          discount: { type: "percentage" as const, value: discountValue },
          total: finalTotal,
          discountedPrice: item.originalPrice * item.quantity - finalTotal,
          price: item.originalPrice,
          gstIncluded: company === "YADNYASENI",
        };
      }
      return item;
    });

    setItems(updatedItems);
  };

  // Filter customers based on search
  const filteredCustomers = existingCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (customer.phone ?? "").includes(customerSearch),
  );

  // Filter products for bulk upload
  const filteredBulkProducts = bulkProducts.filter(
    (bulkProduct) =>
      bulkProduct.product.name
        .toLowerCase()
        .includes(bulkSearch.toLowerCase()) ||
      bulkProduct.product.category
        .toLowerCase()
        .includes(bulkSearch.toLowerCase()),
  );

  // Filter products for custom dropdown search
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

  // Handle search change for product dropdown
  const handleSearchChange = (index: number, query: string) => {
    const newItems = [...items];
    newItems[index].searchQuery = query;
    setItems(newItems);
  };

  // Handle dropdown toggle
  const handleDropdownToggle = (index: number, show: boolean) => {
    const newItems = [...items];
    newItems[index].showDropdown = show;
    // Close other dropdowns
    if (show) {
      newItems.forEach((item, i) => {
        if (i !== index) item.showDropdown = false;
      });
    }
    setItems(newItems);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest(".custom-dropdown")) {
        const newItems = items.map((item) => ({
          ...item,
          showDropdown: false,
        }));
        setItems(newItems);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [items]);

  // Handle customer selection from dropdown
  const handleCustomerSelect = (customer: CustomerInfo) => {
    setCustomerInfo({
      name: customer.name,
      phone: customer.phone,
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

    // If user starts typing in name field, show dropdown and search
    if (name === "name") {
      setCustomerSearch(value);
      if (value.length > 0) {
        setShowCustomerDropdown(true);
      } else {
        setShowCustomerDropdown(false);
      }
    }
  };

  // Clear customer selection and allow new customer entry
  const handleClearCustomerSelection = () => {
    setCustomerInfo({
      name: "",
      phone: "",
      billingAddress: "",
      email: "",
    });
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

  // Calculate item total with discounts
  const calculateItemTotal = (
    originalPrice: number,
    quantity: number,
    itemDiscount: DiscountType,
    overallDiscount: DiscountType,
    applyGST: boolean,
    company: "RUDRA" | "YADNYASENI",
  ) => {
    // Start with base price * quantity
    let baseTotal = originalPrice * quantity;
    let discountedTotal = baseTotal;

    // Apply item discount
    if (itemDiscount.value > 0) {
      if (itemDiscount.type === "percentage") {
        discountedTotal = baseTotal - (baseTotal * itemDiscount.value) / 100;
      } else {
        // Amount discount
        discountedTotal = Math.max(0, baseTotal - itemDiscount.value);
      }
    }

    // Apply overall discount on the already discounted amount
    if (overallDiscount.value > 0) {
      if (overallDiscount.type === "percentage") {
        discountedTotal =
          discountedTotal - (discountedTotal * overallDiscount.value) / 100;
      } else {
        // Amount discount
        discountedTotal = Math.max(0, discountedTotal - overallDiscount.value);
      }
    }

    // Add GST if applicable
    if (applyGST) {
      discountedTotal = discountedTotal * 1.05;
    }

    return discountedTotal;
  };

  // Calculate GST breakdown (used internally for both companies but only shown for RUDRA)
  const calculateGST = (subtotal: number) => {
    const gstAmount = subtotal * 0.05; // 5% GST total
    const cgst = gstAmount / 2; // 2.5% CGST
    const sgst = gstAmount / 2; // 2.5% SGST

    return { cgst, sgst, total: subtotal + gstAmount };
  };

  // Apply overall discount to all items
  const applyOverallDiscountToItems = (discount: DiscountType) => {
    const updatedItems: InvoiceItem[] = items.map((item) => {
      if (item.originalPrice > 0) {
        const finalTotal = calculateItemTotal(
          item.originalPrice,
          item.quantity,
          item.discount,
          discount,
          item.applyGST,
          company,
        );

        let discountAmount = 0;
        if (item.discount.type === "percentage") {
          discountAmount =
            (item.originalPrice * item.quantity * item.discount.value) / 100;
        } else {
          discountAmount = item.discount.value;
        }

        return {
          ...item,
          total: finalTotal,
          discountedPrice: discountAmount,
          price: item.originalPrice,
          discount: {
            type: item.discount.type,
            value: item.discount.value,
          },
        };
      }
      return item;
    });

    setItems(updatedItems);
  };

  const roundTo2 = (num: number) =>
    Math.round((num + Number.EPSILON) * 100) / 100;

  // Apply overall discount when percentage changes
  useEffect(() => {
    if (overallDiscount.value > 0) {
      applyOverallDiscountToItems(overallDiscount);
    } else {
      // Remove overall discount but keep individual discounts
      const updatedItems = items.map((item) => {
        if (item.originalPrice > 0) {
          const finalTotal = calculateItemTotal(
            item.originalPrice,
            item.quantity,
            item.discount,
            { type: "percentage", value: 0 },
            item.applyGST,
            company,
          );

          return {
            ...item,
            total: finalTotal,
            discountedPrice: item.originalPrice * item.quantity - finalTotal,
          };
        }
        return item;
      });
      setItems(updatedItems);
    }
  }, [overallDiscount.value, overallDiscount.type]);

  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalGST = 0;

    items.forEach((item) => {
      if (item.name && item.price > 0) {
        // Get the base price (GST-exclusive)
        let itemBasePrice = item.originalPrice;

        // Calculate base amount before any discounts
        let baseAmount = itemBasePrice * item.quantity;

        // Apply item-specific discount
        if (item.discount.value > 0) {
          if (item.discount.type === "percentage") {
            baseAmount = baseAmount - (baseAmount * item.discount.value) / 100;
          } else {
            baseAmount = Math.max(0, baseAmount - item.discount.value);
          }
        }

        // Apply overall discount if enabled
        if (overallDiscount.value > 0) {
          if (overallDiscount.type === "percentage") {
            baseAmount =
              baseAmount - (baseAmount * overallDiscount.value) / 100;
          } else {
            baseAmount = Math.max(0, baseAmount - overallDiscount.value);
          }
        }

        // Calculate GST if item has GST applied
        if (item.applyGST) {
          const gstAmount = baseAmount * 0.05;
          totalGST += gstAmount;
          subtotal += baseAmount;
        } else {
          subtotal += baseAmount;
        }

        // Calculate total discount
        const originalTotal = item.originalPrice * item.quantity;
        totalDiscount += originalTotal - baseAmount;
      }
    });

    // Calculate total with GST (always add GST on top, regardless of company)
    let total = subtotal + totalGST;

    // Add extra charges
    if (applyExtraCharges) {
      total += extraChargesAmount;
    }

    const balance = total - advancePayment;

    return {
      subtotal: roundTo2(subtotal),
      totalDiscount: roundTo2(totalDiscount),
      // Keep these for internal calculations but don't display them for Yadnyaseni
      cgst: roundTo2(totalGST / 2),
      sgst: roundTo2(totalGST / 2),
      gstTotal: roundTo2(totalGST),
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

  // Save Invoice to API
  const saveInvoice = async (status: "PAID" | "ADVANCE" | "UNPAID") => {
    try {
      // Filter out empty items
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

      // Calculate due date (30 days from invoice date)
      const invoiceDateObj = new Date(invoiceDate);
      const dueDateObj = new Date(invoiceDateObj);
      dueDateObj.setDate(dueDateObj.getDate() + 30);

      // Use current date for delivery date
      const deliveryDateObj = new Date();

      const invoiceData = {
        invoiceNumber,
        invoiceDate: new Date(invoiceDate).toISOString(),
        dueDate: dueDateObj.toISOString(),
        deliveryDate: deliveryDateObj.toISOString(),
        ...(!isEditing && { customerInfo }),
        companyType: company,
        items: validItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          originalPrice: item.originalPrice,
          total: item.total,
          discount: item.discount,
          discountedPrice: item.discountedPrice,
        })),
        subtotal,
        extraCharges,
        cgst,
        sgst,
        total,
        advancePaid: advancePayment,
        balanceDue: balance,
        totalInWords: `${convertToWords(total)} Only`,
        status,
        description: productDescription,
      };

      let url = "/api/invoices";
      let method = "POST";

      if (isEditing && editingInvoiceId) {
        url = `/api/allinvoices/${editingInvoiceId}`;
        method = "PUT";
        delete invoiceData.customerInfo;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Failed to save invoice");

      alert.success(
        `Invoice ${isEditing ? "updated" : "created"} successfully!`,
        `Invoice number: ${result.invoice?.invoiceNumber || invoiceNumber}`,
        {
          duration: 6000,
          action: {
            label: "View Invoices",
            onClick: () => {
              window.location.href = "/super-admin/invoicemanagement";
            },
          },
        },
      );

      // If editing, redirect back to invoice management after a short delay
      if (isEditing) {
        setTimeout(() => {
          window.location.href = "/super-admin/invoicemanagement";
        }, 2000);
      }

      return result;
    } catch (error: any) {
      console.error("❌ Error saving invoice:", error);
      alert.error(
        "Failed to save invoice",
        error.message || "Please try again later",
      );
      throw error;
    }
  };

  const updateProductQuantity = async (
    productId: number,
    quantityToDeduct: number,
  ) => {
    try {
      const res = await fetch("/api/products/update-quantity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantityToDeduct,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update product quantity");
      }

      return await res.json();
    } catch (error) {
      console.error(`Error updating quantity for product ${productId}:`, error);
      throw error;
    }
  };

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();
        setProductsData(data);

        if (data.length === 0) {
          alert.info(
            "No products found",
            "Add products to your inventory first",
            {
              action: {
                label: "Add Products",
                onClick: () => {
                  window.location.href = "/dashboard/products";
                },
              },
            },
          );
        }
      } catch (error: any) {
        console.error("Failed to fetch products:", error);
        alert.error(
          "Failed to load products",
          error.message || "Please try again later",
          {
            duration: 6000,
            action: {
              label: "Retry",
              onClick: fetchProducts,
            },
          },
        );
      }
    };
    fetchProducts();
  }, []);

  const handlePreviewInvoice = async () => {
    try {
      // Filter out empty items
      const validItems = items.filter((item) => item.name && item.price > 0);

      if (validItems.length === 0) {
        alert.error(
          "No items added",
          "Please add at least one product to the invoice",
          { duration: 6000 },
        );
        return;
      }

      if (!customerInfo.name || !customerInfo.phone) {
        alert.error(
          "Customer information incomplete",
          "Please fill customer name and phone number",
          { duration: 6000 },
        );
        return;
      }

      // Prepare preview data
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
        discount: item.discount.value || 0,
        discountType: item.discount.type,
        cgst: 2.5,
        sgst: 2.5,
        amount: item.total,
        description: "",
        gstIncluded: item.gstIncluded || false,
      }));

      const previewData = {
        companyDetails: currentCompany,
        invoiceNumber: `PREVIEW-${Date.now().toString().slice(-6)}`,
        invoiceDate: formattedInvoiceDate,
        dueDate: formattedInvoiceDate,
        companyType: company,
        customerInfo: {
          name: customerInfo.name || "",
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
          hasDiscount: validItems.some(
            (item) => item.discount.value && item.discount.value > 0,
          ),
          totalDiscount: validItems.reduce(
            (sum, item) => sum + (item.discountedPrice || 0),
            0,
          ),
          itemsWithDiscount: validItems
            .filter((item) => item.discount.value && item.discount.value > 0)
            .map((item) => ({
              name: item.name,
              hsn: item.hsn || "970300",
              quantity: item.quantity,
              unit: item.unit || "pcs",
              rate: item.price,
              originalPrice: item.originalPrice,
              discount: item.discount.value || 0,
              discountType: item.discount.type,
              cgst: 2.5,
              sgst: 2.5,
              amount: item.total,
              gstIncluded: item.gstIncluded || false,
            })),
        },
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
        { duration: 6000 },
      );
    }
  };

  // Helper function to calculate GST for display
  const calculateGSTForDisplay = (amount: number, includeGST: boolean) => {
    if (!includeGST) return amount;

    // For YADNYASENI: Amount is GST-inclusive, convert to GST-exclusive for calculations
    if (company === "YADNYASENI") {
      return amount / 1.05;
    }
    // For RUDRA: Amount is GST-exclusive
    return amount;
  };

  // Handle status change
  const handleStatusChange = (status: "PAID" | "UNPAID" | "ADVANCE") => {
    setInvoiceStatus(status);
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
        discount: { type: "percentage", value: 0 },
        discountedPrice: 0,
        searchQuery: "",
        showDropdown: false,
        gstIncluded: company === "YADNYASENI",
        applyGST: company === "RUDRA",
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

  // Handle item change
  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: any,
  ) => {
    const updatedItems: InvoiceItem[] = items.map((item, i) => {
      if (i === index) {
        const updatedItem: InvoiceItem = { ...item, [field]: value };

        // Recalculate total when relevant fields change
        if (
          field === "quantity" ||
          field === "discount" ||
          field === "originalPrice" ||
          field === "applyGST"
        ) {
          const finalTotal = calculateItemTotal(
            updatedItem.originalPrice,
            updatedItem.quantity,
            updatedItem.discount,
            overallDiscount,
            updatedItem.applyGST,
            company,
          );

          updatedItem.total = finalTotal;
          updatedItem.discountedPrice =
            updatedItem.originalPrice * updatedItem.quantity -
            finalTotal / (updatedItem.applyGST ? 1.05 : 1);

          // Update displayed price based on company and GST
          if (updatedItem.applyGST && company === "YADNYASENI") {
            updatedItem.price = updatedItem.originalPrice * 1.05;
          } else {
            updatedItem.price = updatedItem.originalPrice;
          }

          updatedItem.gstIncluded =
            company === "YADNYASENI" && updatedItem.applyGST;
        }

        return updatedItem;
      }
      return item;
    });

    setItems(updatedItems);
  };

  const handleProductSelect = (index: number, product: Product) => {
    let discountValue = 0;
    switch (customerType) {
      case "RESELLER":
        discountValue = 30;
        break;
      case "FRANCHISE":
        discountValue = 40;
        break;
      case "CUSTOMER":
      default:
        discountValue = 0;
        break;
    }

    const updatedItems: InvoiceItem[] = items.map((item, i) => {
      if (i === index) {
        // Store base price (this is GST-exclusive price from database)
        const basePrice = product.price;

        const finalTotal = calculateItemTotal(
          basePrice,
          item.quantity,
          { type: "percentage" as const, value: discountValue },
          overallDiscount,
          item.applyGST,
          company,
        );

        // Calculate displayed rate
        let displayedRate = basePrice;
        if (item.applyGST) {
          if (company === "YADNYASENI") {
            displayedRate = basePrice * 1.05;
          } else {
            displayedRate = basePrice;
          }
        } else {
          displayedRate = basePrice;
        }

        return {
          ...item,
          productId: product.id,
          name: `${product.name} ${product.size}`,
          price: displayedRate,
          originalPrice: basePrice,
          total: finalTotal,
          discount: { type: "percentage" as const, value: discountValue },
          discountedPrice:
            basePrice * item.quantity - finalTotal / (item.applyGST ? 1.05 : 1),
          searchQuery: `${product.name} ${product.size}`,
          showDropdown: false,
          gstIncluded: company === "YADNYASENI" && item.applyGST,
          applyGST: item.applyGST,
        };
      }
      return item;
    });

    setItems(updatedItems);
  };

  // Handle individual item discount change
  const handleItemDiscountChange = (index: number, discount: DiscountType) => {
    let validValue = discount.value;
    if (discount.type === "percentage") {
      validValue = Math.max(0, Math.min(100, discount.value));
    } else {
      validValue = Math.max(0, discount.value);
    }

    const updatedItems: InvoiceItem[] = items.map((item, i) => {
      if (i === index) {
        const finalTotal = calculateItemTotal(
          item.originalPrice,
          item.quantity,
          { type: discount.type as "percentage" | "amount", value: validValue },
          overallDiscount,
          item.applyGST,
          company,
        );

        return {
          ...item,
          discount: {
            type: discount.type as "percentage" | "amount",
            value: validValue,
          },
          total: finalTotal,
          discountedPrice: item.originalPrice * item.quantity - finalTotal,
          price: finalTotal / item.quantity,
          gstIncluded: company === "YADNYASENI" && item.applyGST,
        };
      }
      return item;
    });

    setItems(updatedItems);
  };

  // Bulk Upload Functions
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
        { duration: 4000 },
      );
      return;
    }

    let discountValue = 0;
    switch (customerType) {
      case "RESELLER":
        discountValue = 40;
        break;
      case "FRANCHISE":
        discountValue = 30;
        break;
      case "CUSTOMER":
      default:
        discountValue = 0;
        break;
    }

    const newItems = selectedProducts.map((bp) => {
      const finalTotal = calculateItemTotal(
        bp.product.price,
        bp.quantity,
        { type: "percentage" as const, value: discountValue },
        overallDiscount,
        company === "RUDRA",
        company,
      );

      return {
        productId: bp.product.id,
        name: `${bp.product.name} ${bp.product.size}`,
        quantity: bp.quantity,
        price: bp.product.price,
        originalPrice: bp.product.price,
        total: finalTotal,
        discount: { type: "percentage" as const, value: discountValue },
        discountedPrice: bp.product.price * bp.quantity - finalTotal,
        searchQuery: `${bp.product.name} ${bp.product.size}`,
        showDropdown: false,
        gstIncluded: company === "YADNYASENI",
        applyGST: company === "RUDRA",
      } as InvoiceItem;
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
      { duration: 4000 },
    );
  };

  // Handle company change
  useEffect(() => {
    const updatedItems: InvoiceItem[] = items.map((item) => {
      if (item.originalPrice > 0) {
        const finalTotal = calculateItemTotal(
          item.originalPrice,
          item.quantity,
          item.discount,
          overallDiscount,
          item.applyGST,
          company,
        );

        // Update displayed price based on new company
        let displayedPrice = item.originalPrice;
        if (company === "YADNYASENI" && item.applyGST) {
          displayedPrice = item.originalPrice * 1.05;
        }

        return {
          ...item,
          total: finalTotal,
          discountedPrice: item.originalPrice * item.quantity - finalTotal,
          price: displayedPrice,
          gstIncluded: company === "YADNYASENI" && item.applyGST,
        };
      }
      return {
        ...item,
        gstIncluded: company === "YADNYASENI" && item.applyGST,
      };
    });

    setItems(updatedItems);
  }, [company]);

  // Company details
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

  // Handle final invoice generation
  const handleGenerateInvoice = async () => {
    try {
      // Filter out empty items
      const validItems = items.filter((item) => item.name && item.price > 0);

      if (validItems.length === 0) {
        alert.error(
          "No items added",
          "Please add at least one product to the invoice",
          { duration: 6000 },
        );
        return;
      }

      if (!customerInfo.name || !customerInfo.phone) {
        alert.error(
          "Customer information incomplete",
          "Please fill customer name and phone number",
          { duration: 6000 },
        );
        return;
      }

      // Calculate due date
      const invoiceDateObj = new Date(invoiceDate);
      const dueDateObj = new Date(invoiceDateObj);
      dueDateObj.setDate(dueDateObj.getDate() + 30);

      // Proceed with invoice generation
      const result = await saveInvoice(invoiceStatus);

      // Map items to the expected format
      const mappedItems = validItems.map((item) => ({
        name: item.name,
        hsn: item.hsn || "970300",
        quantity: item.quantity,
        unit: item.unit || "pcs",
        rate: item.price,
        originalPrice: item.originalPrice,
        discount: item.discount.value || 0,
        discountType: item.discount.type,
        cgst: 2.5,
        sgst: 2.5,
        amount: item.total,
        gstIncluded: item.gstIncluded || false,
      }));

      // Generate PDF
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
              hasDiscount: validItems.some(
                (item) => item.discount.value && item.discount.value > 0,
              ),
              totalDiscount: validItems.reduce(
                (sum, item) => sum + (item.discountedPrice || 0),
                0,
              ),
              itemsWithDiscount: validItems
                .filter(
                  (item) => item.discount.value && item.discount.value > 0,
                )
                .map((item) => ({
                  name: item.name,
                  hsn: item.hsn || "970300",
                  quantity: item.quantity,
                  unit: item.unit || "pcs",
                  rate: item.price,
                  originalPrice: item.originalPrice,
                  discount: item.discount.value || 0,
                  discountType: item.discount.type,
                  cgst: 2.5,
                  sgst: 2.5,
                  amount: item.total,
                  gstIncluded: item.gstIncluded || false,
                })),
            },
            gstCalculationType:
              company === "YADNYASENI" ? "INCLUDED_IN_PRICE" : "ADDED_ON_TOP",
          }}
          logoUrl="/images/logo.png"
        />,
      ).toBlob();

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${result.invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      if (invoiceStatus === "ADVANCE") {
        alert.info(
          "Invoice saved as ADVANCE",
          `Advance payment of ₹${advancePayment} received. Balance due: ₹${balance}`,
          { duration: 8000 },
        );
      } else if (invoiceStatus === "PAID") {
        alert.success(
          "Invoice marked as PAID",
          "Full payment received. Invoice is now complete.",
          { duration: 6000 },
        );
      } else {
        alert.info(
          "Invoice saved as UNPAID",
          "No payment received. Invoice will be marked as pending.",
          { duration: 6000 },
        );
      }

      // Clear the form after successful invoice generation
      setItems([
        {
          productId: 0,
          name: "",
          quantity: 1,
          price: 0,
          originalPrice: 0,
          total: 0,
          discount: { type: "percentage", value: 0 },
          discountedPrice: 0,
          searchQuery: "",
          showDropdown: false,
          gstIncluded: company === "YADNYASENI",
          applyGST: company === "RUDRA",
        },
      ]);
      setAdvancePayment(0);
      setOverallDiscount({ type: "percentage", value: 0 });
      setCustomerInfo({ name: "", phone: "", billingAddress: "", email: "" });
    } catch (error: any) {
      console.error("Failed to generate invoice:", error);

      // Show specific error message for inventory issues
      if (error?.message?.includes("Insufficient quantity")) {
        alert.error(
          "Insufficient Stock",
          "Some products don't have enough quantity in inventory. Please adjust quantities and try again.",
          { duration: 8000 },
        );
      } else {
        alert.error(
          "Failed to generate invoice",
          (error && error.message) || String(error) || "Please try again later",
          { duration: 6000 },
        );
      }
    }
  };

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
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products by name or category..."
                  value={bulkSearch}
                  onChange={(e) => setBulkSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Products List */}
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

              {/* Action Buttons */}
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
          <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
          {/* Company Selection */}
          <div className="space-y-3">
            <Label className="font-semibold">Company *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Rudra */}
              <label
                htmlFor="company-rudra"
                className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition
        ${
          company === "RUDRA"
            ? "border-blue-600 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
              >
                <input
                  type="radio"
                  id="company-rudra"
                  name="company"
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

              {/* Yadnyaseni */}
              <label
                htmlFor="company-yadnyaseni"
                className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition
    ${
      company === "YADNYASENI"
        ? "border-blue-600 bg-blue-50"
        : "border-gray-300 hover:border-gray-400"
    }`}
              >
                <input
                  type="radio"
                  id="company-yadnyaseni"
                  name="company"
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

        {/* All sections in vertical flow */}
        <div className="space-y-6">
          {/* Customer Information - Compact Grid Layout */}
          <div className="border border-black/20 py-5 rounded-2xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">
                    Customer Information
                  </CardTitle>
                  {!isEditMode && (
                    <CardDescription>
                      Select existing customer or add new customer details
                    </CardDescription>
                  )}
                </div>
                {!isEditMode && (
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
                )}
              </div>
            </CardHeader>

            <CardContent>
              {/* Two-column compact layout */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-3">
                  <div className="relative">
                    <Label className="text-xs text-gray-500">
                      Customer Name *
                    </Label>
                    <Input
                      name="name"
                      value={customerInfo.name}
                      onChange={handleCustomerInfoChange}
                      placeholder="Type customer name or phone"
                      onFocus={() => setShowCustomerDropdown(true)}
                      disabled={isEditMode}
                      className="mt-1"
                    />
                    <ChevronDown className="absolute right-3 top-8 h-4 w-4 text-gray-400" />

                    {/* Customer Dropdown */}
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
                      name="number"
                      value={customerInfo.phone}
                      onChange={handleCustomerInfoChange}
                      placeholder="Customer Phone"
                      disabled={isEditMode}
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
                      disabled={isEditMode}
                      placeholder="email@example.com"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500">GST Number</Label>
                    <Input
                      name="gstin"
                      value={customerInfo.gst || ""}
                      onChange={handleCustomerInfoChange}
                      disabled={isEditMode}
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
                      disabled={isEditMode}
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
                      disabled={isEditMode}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Full-width Address */}
              <div className="mt-3">
                <Label className="text-xs text-gray-500">Billing Address</Label>
                <Textarea
                  name="address"
                  value={customerInfo.billingAddress}
                  onChange={handleCustomerInfoChange}
                  disabled={isEditMode}
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
                    Add products and services to the invoice
                  </CardDescription>

                  {/* Customer Type Radio Buttons */}
                  <div className="flex items-center space-x-4 mt-3">
                    <Label className="font-medium text-sm">
                      Customer Type:
                    </Label>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={customerType === "CUSTOMER"}
                        onChange={() => handleCustomerTypeChange("CUSTOMER")}
                        className="h-3 w-3 text-blue-600"
                      />
                      <Label className="text-sm">Customer</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={customerType === "FRANCHISE"}
                        onChange={() => handleCustomerTypeChange("FRANCHISE")}
                        className="h-3 w-3 text-blue-600"
                      />
                      <Label className="text-sm">Franchise (40%)</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={customerType === "RESELLER"}
                        onChange={() => handleCustomerTypeChange("RESELLER")}
                        className="h-3 w-3 text-blue-600"
                      />
                      <Label className="text-sm">Reseller (30%)</Label>
                    </div>
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
              {/* Table Container */}
              <div className="space-y-4" style={{ overflow: "visible" }}>
                {/* TABLE HEADER */}
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 pb-2 border-b">
                  <div className="col-span-5">Product</div>
                  <div className="col-span-1 text-right">Qty</div>
                  <div className="col-span-2 text-right">Rate (₹)</div>
                  {customerType !== "CUSTOMER" && (
                    <div className="col-span-2 text-right">Discount</div>
                  )}
                  <div className="col-span-1 text-right">GST</div>
                  <div className="col-span-1 text-right">Amount (₹)</div>
                  <div className="col-span-1 text-center">Action</div>{" "}
                  {/* New column */}
                </div>

                {/* LINE ITEMS */}
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-start py-2 border-b border-gray-100 last:border-b-0"
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDropdownToggle(index, true);
                            }}
                            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs bg-white"
                            autoComplete="off"
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <ChevronDown className="h-3 w-3" />
                          </div>
                        </div>

                        {/* DROPDOWN - INSIDE TABLE */}
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
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Search inside dropdown */}
                            <div className="p-2 border-b sticky top-0 bg-white">
                              <input
                                type="text"
                                placeholder="Search product..."
                                value={item.searchQuery}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleSearchChange(index, e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md"
                                autoFocus
                              />
                            </div>

                            {/* Product List */}
                            <div className="py-1">
                              {filteredProducts(index).length === 0 ? (
                                <div className="px-2 py-1.5 text-xs text-gray-500">
                                  No products found
                                </div>
                              ) : (
                                filteredProducts(index).map((product) => (
                                  <div
                                    key={product.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleProductSelect(index, product);
                                    }}
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

                      {/* STOCK WARNING */}
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
                        className="text-right h-8 text-xs"
                      />
                    </div>

                    {/* DISCOUNT */}
                    {customerType !== "CUSTOMER" && (
                      <div className="col-span-2 flex justify-end gap-1">
                        <select
                          value={item.discount.type}
                          onChange={(e) =>
                            handleItemDiscountChange(index, {
                              type: e.target.value as any,
                              value: 0,
                            })
                          }
                          className="border border-gray-300 rounded-md px-1 py-1 text-xs w-14"
                        >
                          <option value="percentage">%</option>
                          <option value="amount">₹</option>
                        </select>

                        <Input
                          type="number"
                          value={item.discount.value}
                          onChange={(e) =>
                            handleItemDiscountChange(index, {
                              type: item.discount.type,
                              value: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="text-right h-8 w-16 text-xs"
                        />
                      </div>
                    )}

                    {/* GST */}
                    <div className="col-span-1 flex justify-end">
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

                    {/* ACTION - TRASH BUTTON */}
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

          {/* Invoice Settings and Summary - Side by side on larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Settings - Tabular Format */}
            <div className="border border-black/20 py-5 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Invoice Settings</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="divide-y divide-gray-100">
                  {/* Extra Charges Row */}
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

                  {/* Overall Discount Row */}
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="applyOverallDiscount"
                        checked={overallDiscount.value > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const newDiscount = {
                              type: "percentage" as const,
                              value: 5,
                            };
                            setOverallDiscount(newDiscount);
                            applyOverallDiscountToItems(newDiscount);
                          } else {
                            setOverallDiscount({
                              type: "percentage",
                              value: 0,
                            });
                            const updatedItems = items.map((item) => {
                              if (item.originalPrice > 0) {
                                const finalTotal = calculateItemTotal(
                                  item.originalPrice,
                                  item.quantity,
                                  item.discount,
                                  { type: "percentage", value: 0 },
                                  item.applyGST,
                                  company,
                                );
                                return { ...item, total: finalTotal };
                              }
                              return item;
                            });
                            setItems(updatedItems);
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
                            applyOverallDiscountToItems({
                              type: newType,
                              value: overallDiscount.value,
                            });
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
                            const newDiscount = {
                              ...overallDiscount,
                              value: newValue,
                            };
                            setOverallDiscount(newDiscount);
                            applyOverallDiscountToItems(newDiscount);
                          }}
                          className="w-20 text-right"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>

                  {/* GST Settings - Only for RUDRA */}
                  {company === "RUDRA" && (
                    <div className="py-3 flex items-center">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="includeGst"
                          checked={includeGst}
                          onCheckedChange={(checked) =>
                            setIncludeGst(checked === true)
                          }
                        />
                        <Label
                          htmlFor="includeGst"
                          className="font-medium cursor-pointer"
                        >
                          Include GST (5%)
                        </Label>
                      </div>
                    </div>
                  )}

                  {/* Invoice Status */}
                  <div className="py-3">
                    <Label className="font-medium block mb-2">
                      Invoice Status *
                    </Label>
                    <div className="flex space-x-6">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="status-paid"
                          name="invoiceStatus"
                          checked={invoiceStatus === "PAID"}
                          onChange={() => handleStatusChange("PAID")}
                          className="h-4 w-4 text-blue-600"
                        />
                        <Label htmlFor="status-paid" className="cursor-pointer">
                          Paid
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="status-unpaid"
                          name="invoiceStatus"
                          checked={invoiceStatus === "UNPAID"}
                          onChange={() => handleStatusChange("UNPAID")}
                          className="h-4 w-4 text-blue-600"
                        />
                        <Label
                          htmlFor="status-unpaid"
                          className="cursor-pointer"
                        >
                          Unpaid
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="status-advance"
                          name="invoiceStatus"
                          checked={invoiceStatus === "ADVANCE"}
                          onChange={() => handleStatusChange("ADVANCE")}
                          className="h-4 w-4 text-blue-600"
                        />
                        <Label
                          htmlFor="status-advance"
                          className="cursor-pointer"
                        >
                          Advance
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Advance Payment - Conditionally shown */}
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
            {/* Invoice Summary - Clean Tabular Format */}
            <div className="border border-black/20 py-5 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Invoice Summary</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  {/* Subtotal */}
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-mono">₹{subtotal.toFixed(0)}</span>
                  </div>

                  {/* Discount */}
                  {totalDiscount > 0 && (
                    <div className="flex justify-between py-1 text-green-600">
                      <span>Discount:</span>
                      <span className="font-mono">
                        -₹{totalDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* GST Breakdown - Only for RUDRA */}
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

                  {/* Extra Charges */}
                  {extraCharges > 0 && (
                    <div className="flex justify-between py-1 text-blue-600">
                      <span>Extra Charges:</span>
                      <span className="font-mono">
                        +₹{extraCharges.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200 mt-2">
                    <span>Total Amount:</span>
                    <span className="font-mono">₹{total.toFixed(0)}</span>
                  </div>

                  {/* Advance Payment and Balance */}
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

                  {/* Amount in Words */}
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
                onClick={() => saveInvoice(invoiceStatus)}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button
                className="bg-orange-800 hover:bg-orange-900 text-white"
                onClick={handlePreviewInvoice}
              >
                <IndianRupee className="mr-2 h-4 w-4" />
                {isEditMode ? "Update Invoice" : "Generate Invoice"}
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
            companyDetails: currentCompany,
            companyType: company,
            description: productDescription,
            gstCalculationType:
              company === "YADNYASENI" ? "INCLUDED_IN_PRICE" : "ADDED_ON_TOP",
          }}
          isEditMode={isEditMode}
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
                { duration: 5000 },
              );
            } catch (error) {
              console.error("Failed to save draft:", error);
              throw error;
            }
          }}
        />
      )}

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
                  className={customerFormErrors.gst ? "border-red-500" : ""}
                />
                {customerFormErrors.gst && (
                  <p className="text-sm text-red-500">
                    {customerFormErrors.gst}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-pan">PAN Number</Label>
                <Input
                  id="modal-pan"
                  name="pan"
                  placeholder="ABCDE1234F"
                  value={customerFormData.pan}
                  onChange={handleCustomerInputChange}
                  className={customerFormErrors.pan ? "border-red-500" : ""}
                  style={{ textTransform: "uppercase" }}
                />
                {customerFormErrors.pan && (
                  <p className="text-sm text-red-500">
                    {customerFormErrors.pan}
                  </p>
                )}
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

export default Invoices;
