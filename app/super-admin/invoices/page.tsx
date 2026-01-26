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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import InvoicePDF from "@/components/InvoicePDF/InvoicePDF";
import { convertToWords } from "@/utils/numberToWords";
import { pdf } from "@react-pdf/renderer";
import { AlertToaster, alert } from "@/components/ui/alert-toaster";

// Define types
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
  discount: number;
  discountedPrice: number;
  hsn?: string;
  unit?: string;
  searchQuery: string;
  showDropdown: boolean;
  gstIncluded?: boolean;
}

interface CustomerInfo {
  id?: number;
  name: string;
  number: string;
  address: string;
  city?: string;
  pincode?: string;
  gstin?: string;
}

interface BulkProduct {
  product: Product;
  quantity: number;
  selected: boolean;
}

const Invoices = () => {
  // State for customer information
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    number: "",
    address: "",
  });

  // State for existing customers
  const [existingCustomers, setExistingCustomers] = useState<CustomerInfo[]>(
    [],
  );
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  // State for invoice items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      productId: 0,
      name: "",
      quantity: 1,
      price: 0,
      originalPrice: 0,
      total: 0,
      discount: 0,
      discountedPrice: 0,
      searchQuery: "",
      showDropdown: false,
      gstIncluded: false,
    },
  ]);

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
  const [applyOverallDiscount, setApplyOverallDiscount] =
    useState<boolean>(false);
  const [overallDiscountPercentage, setOverallDiscountPercentage] =
    useState<number>(0);

  // State for GST (only applicable for RUDRA in UI)
  const [includeGst, setIncludeGst] = useState<boolean>(true);

  const [productsData, setProductsData] = useState<Product[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [invoiceStatus, setInvoiceStatus] = useState<
    "PAID" | "UNPAID" | "ADVANCE"
  >("UNPAID");
  const [company, setCompany] = useState<"RUDRA" | "YADNYASENI">("RUDRA");

  // Fetch existing customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/customers");
        if (res.ok) {
          const data = await res.json();
          setExistingCustomers(data);
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

  type CustomerType = "CUSTOMER" | "FRANCHISE" | "RESELLER";

  const [customerType, setCustomerType] = useState<CustomerType>("CUSTOMER");

  const handleCustomerTypeChange = (type: CustomerType) => {
    setCustomerType(type);

    // Apply automatic discounts to all items based on customer type
    const updatedItems = items.map((item) => {
      if (item.originalPrice > 0) {
        let discountPercentage = 0;
        switch (type) {
          case "RESELLER":
            discountPercentage = 30;
            break;
          case "FRANCHISE":
            discountPercentage = 40;
            break;
          case "CUSTOMER":
          default:
            discountPercentage = 0;
            break;
        }

        const finalTotal = calculateItemTotal(
          item.originalPrice,
          item.quantity,
          discountPercentage,
          applyOverallDiscount ? overallDiscountPercentage : 0,
        );

        return {
          ...item,
          discount: discountPercentage,
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
      customer.number.includes(customerSearch),
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
      number: customer.number,
      address: customer.address,
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
      number: "",
      address: "",
    });
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

  // Calculate item total with discounts
  const calculateItemTotal = (
    originalPrice: number,
    quantity: number,
    itemDiscount: number,
    overallDiscount: number,
  ) => {
    // Calculate base total
    const baseTotal = originalPrice * quantity;
    let finalTotal = baseTotal;

    // Apply item discount
    if (itemDiscount > 0) {
      finalTotal = baseTotal - (baseTotal * itemDiscount) / 100;
    }

    // Apply overall discount
    if (overallDiscount > 0) {
      finalTotal = finalTotal - (finalTotal * overallDiscount) / 100;
    }

    return finalTotal;
  };

  // Calculate GST breakdown (used internally for both companies but only shown for RUDRA)
  const calculateGST = (subtotal: number) => {
    const gstAmount = subtotal * 0.05; // 5% GST total
    const cgst = gstAmount / 2; // 2.5% CGST
    const sgst = gstAmount / 2; // 2.5% SGST

    return { cgst, sgst, total: subtotal + gstAmount };
  };

  // Apply overall discount to all items
  const applyOverallDiscountToItems = (percentage: number) => {
    const updatedItems = items.map((item) => {
      if (item.originalPrice > 0) {
        const finalTotal = calculateItemTotal(
          item.originalPrice,
          item.quantity,
          item.discount,
          percentage,
        );
        const discountAmount = item.originalPrice * item.quantity - finalTotal;

        return {
          ...item,
          total: finalTotal,
          discountedPrice: discountAmount,
          price: item.originalPrice,
          gstIncluded: company === "YADNYASENI",
        };
      }
      return item;
    });

    setItems(updatedItems);
  };

  // Handle overall discount checkbox change
  const handleOverallDiscountChange = (checked: boolean) => {
    setApplyOverallDiscount(checked);
    if (!checked) {
      // Remove overall discount from all items
      const updatedItems = items.map((item) => {
        if (item.originalPrice > 0) {
          const finalTotal = calculateItemTotal(
            item.originalPrice,
            item.quantity,
            item.discount,
            0,
          );
          const discountAmount =
            item.originalPrice * item.quantity - finalTotal;

          return {
            ...item,
            total: finalTotal,
            discountedPrice: discountAmount,
            price: item.originalPrice,
            gstIncluded: company === "YADNYASENI",
          };
        }
        return item;
      });
      setItems(updatedItems);
      setOverallDiscountPercentage(0);
    }
  };

  // Apply overall discount when percentage changes
  useEffect(() => {
    if (applyOverallDiscount && overallDiscountPercentage > 0) {
      applyOverallDiscountToItems(overallDiscountPercentage);
    } else if (!applyOverallDiscount) {
      // Remove overall discount but keep individual discounts
      const updatedItems = items.map((item) => {
        if (item.originalPrice > 0) {
          const finalTotal = calculateItemTotal(
            item.originalPrice,
            item.quantity,
            item.discount,
            0,
          );
          const discountAmount =
            item.originalPrice * item.quantity - finalTotal;

          return {
            ...item,
            total: finalTotal,
            discountedPrice: discountAmount,
            price: item.originalPrice,
            gstIncluded: company === "YADNYASENI",
          };
        }
        return item;
      });
      setItems(updatedItems);
    }
  }, [overallDiscountPercentage, applyOverallDiscount]);

  // Calculate totals
  // Calculate totals
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalDiscount = items.reduce(
      (sum, item) => sum + (item.discountedPrice || 0),
      0,
    );

    let cgst = 0;
    let sgst = 0;
    let gstTotal = 0;
    let total = subtotal;

    // Calculate GST internally for both companies
    const gstCalculation = calculateGST(subtotal);
    cgst = gstCalculation.cgst;
    sgst = gstCalculation.sgst;
    gstTotal = gstCalculation.cgst + gstCalculation.sgst;

    // For both companies, add GST to total
    total = subtotal + gstTotal;

    // Add extra charges to total if applicable
    if (applyExtraCharges) {
      total += extraChargesAmount;
    }

    const balance = total - advancePayment;

    return {
      subtotal,
      totalDiscount,
      cgst,
      sgst,
      gstTotal,
      extraCharges: applyExtraCharges ? extraChargesAmount : 0,
      total,
      balance,
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
      const invoiceData = {
        invoiceNumber,
        invoiceDate: new Date(invoiceDate).toISOString(),
        dueDate: new Date().toISOString(),
        customerInfo,
        companyType: company,
        shippingInfo: customerInfo,
        items: items.filter((item) => item.name && item.price > 0),
        subtotal,
        extraCharges,
        cgst,
        sgst,
        total,
        advancePaid: advancePayment,
        balanceDue: balance,
        totalInWords: `${convertToWords(total)} Only`,
        deliveryDate: new Date().toISOString(),
        status,
        gstCalculationType:
          company === "YADNYASENI" ? "INCLUDED_IN_PRICE" : "ADDED_ON_TOP",
      };

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });

      const result = await res.json();

      setInvoiceNumber(result.invoice.invoiceNumber);
      if (!res.ok) throw new Error(result.error || "Failed to save invoice");

      alert.success(
        `Invoice ${status} saved successfully!`,
        `Invoice number: ${result.invoice.invoiceNumber}`,
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

      return result;
    } catch (error: any) {
      console.error("❌ Error saving invoice:", error);
      alert.error(
        "Failed to save invoice",
        error.message || "Please try again later",
        {
          duration: 8000,
          action: {
            label: "Retry",
            onClick: () => saveInvoice(status),
          },
        },
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

      if (!customerInfo.name || !customerInfo.number) {
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
        discount: item.discount || 0,
        cgst: 2.5, // Both companies have 2.5% CGST
        sgst: 2.5, // Both companies have 2.5% SGST
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
          address: customerInfo.address || "",
          city: customerInfo.city || "",
          pincode: customerInfo.pincode || "",
          gstin: customerInfo.gstin || "",
        },
        shippingInfo: {
          name: customerInfo.name || "",
          address: customerInfo.address || "",
          city: customerInfo.city || "",
          pincode: customerInfo.pincode || "",
          gstin: customerInfo.gstin || "",
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
            (item) => item.discount && item.discount > 0,
          ),
          totalDiscount: validItems.reduce(
            (sum, item) => sum + (item.discountedPrice || 0),
            0,
          ),
          itemsWithDiscount: validItems
            .filter((item) => item.discount && item.discount > 0)
            .map((item) => ({
              name: item.name,
              hsn: item.hsn || "970300",
              quantity: item.quantity,
              unit: item.unit || "pcs",
              rate: item.price,
              originalPrice: item.originalPrice,
              discount: item.discount || 0,
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
        discount: 0,
        discountedPrice: 0,
        searchQuery: "",
        showDropdown: false,
        gstIncluded: company === "YADNYASENI",
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
    const updatedItems = items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };

        // Recalculate total when relevant fields change
        if (
          field === "quantity" ||
          field === "discount" ||
          field === "originalPrice"
        ) {
          const finalTotal = calculateItemTotal(
            updatedItem.originalPrice,
            updatedItem.quantity,
            updatedItem.discount,
            applyOverallDiscount ? overallDiscountPercentage : 0,
          );
          updatedItem.total = finalTotal;
          updatedItem.discountedPrice =
            updatedItem.originalPrice * updatedItem.quantity - finalTotal;
          // Price always shows the original price
          updatedItem.price = updatedItem.originalPrice;
        }

        return updatedItem;
      }
      return item;
    });

    setItems(updatedItems);
  };

  // Handle product selection for a row
  const handleProductSelect = (index: number, product: Product) => {
    let discountPercentage = 0;
    switch (customerType) {
      case "RESELLER":
        discountPercentage = 30;
        break;
      case "FRANCHISE":
        discountPercentage = 40;
        break;
      case "CUSTOMER":
      default:
        discountPercentage = 0;
        break;
    }

    const updatedItems = items.map((item, i) => {
      if (i === index) {
        const finalTotal = calculateItemTotal(
          product.price,
          item.quantity,
          discountPercentage,
          applyOverallDiscount ? overallDiscountPercentage : 0,
        );

        return {
          ...item,
          productId: product.id,
          name: `${product.name} ${product.size}`,
          price: product.price,
          originalPrice: product.price,
          total: finalTotal,
          discount: discountPercentage,
          discountedPrice: product.price * item.quantity - finalTotal,
          searchQuery: `${product.name} ${product.size}`,
          showDropdown: false,
          gstIncluded: company === "YADNYASENI",
        };
      }
      return item;
    });

    setItems(updatedItems);
  };

  // Handle individual item discount change
  const handleItemDiscountChange = (
    index: number,
    discountPercentage: number,
  ) => {
    // Ensure discount is between 0 and 100
    const validDiscount = Math.max(0, Math.min(100, discountPercentage));

    const updatedItems = items.map((item, i) => {
      if (i === index) {
        const finalTotal = calculateItemTotal(
          item.originalPrice,
          item.quantity,
          validDiscount,
          applyOverallDiscount ? overallDiscountPercentage : 0,
        );

        return {
          ...item,
          discount: validDiscount,
          total: finalTotal,
          discountedPrice: item.originalPrice * item.quantity - finalTotal,
          // Price remains the original price
          price: item.originalPrice,
          gstIncluded: company === "YADNYASENI",
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

    let discountPercentage = 0;
    switch (customerType) {
      case "RESELLER":
        discountPercentage = 40;
        break;
      case "FRANCHISE":
        discountPercentage = 30;
        break;
      case "CUSTOMER":
      default:
        discountPercentage = 0;
        break;
    }

    const newItems = selectedProducts.map((bp) => {
      const finalTotal = calculateItemTotal(
        bp.product.price,
        bp.quantity,
        discountPercentage,
        applyOverallDiscount ? overallDiscountPercentage : 0,
      );

      return {
        productId: bp.product.id,
        name: `${bp.product.name} ${bp.product.size}`,
        quantity: bp.quantity,
        price: bp.product.price,
        originalPrice: bp.product.price,
        total: finalTotal,
        discount: discountPercentage,
        discountedPrice: bp.product.price * bp.quantity - finalTotal,
        searchQuery: `${bp.product.name} ${bp.product.size}`,
        showDropdown: false,
        gstIncluded: company === "YADNYASENI",
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
      { duration: 4000 },
    );
  };

  // Handle company change
  useEffect(() => {
    // When company changes, update GST inclusion for all items
    const updatedItems = items.map((item) => {
      if (item.originalPrice > 0) {
        // Recalculate total with new company logic
        const finalTotal = calculateItemTotal(
          item.originalPrice,
          item.quantity,
          item.discount,
          applyOverallDiscount ? overallDiscountPercentage : 0,
        );

        return {
          ...item,
          total: finalTotal,
          discountedPrice: item.originalPrice * item.quantity - finalTotal,
          gstIncluded: company === "YADNYASENI",
        };
      }
      return {
        ...item,
        gstIncluded: company === "YADNYASENI",
      };
    });

    setItems(updatedItems);

    // For YADNYASENI, GST is always included but not shown in UI
    // For RUDRA, show GST checkbox in UI
    if (company === "YADNYASENI") {
      setIncludeGst(true); // GST is always included for Yadnyaseni
    }
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

      if (!customerInfo.name || !customerInfo.number) {
        alert.error(
          "Customer information incomplete",
          "Please fill customer name and phone number",
          { duration: 6000 },
        );
        return;
      }

      // First, update product quantities in inventory
      // const quantityUpdatePromises = validItems.map((item) =>
      //   updateProductQuantity(item.productId, item.quantity)
      // );

      // // Wait for all quantity updates to complete
      // await Promise.all(quantityUpdatePromises);

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
        discount: item.discount || 0,
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
            dueDate: invoiceDate,
            companyType: company,
            customerInfo: {
              name: customerInfo.name || "",
              address: customerInfo.address || "",
              city: customerInfo.city || "",
              pincode: customerInfo.pincode || "",
              gstin: customerInfo.gstin || "",
            },
            shippingInfo: {
              name: customerInfo.name || "",
              address: customerInfo.address || "",
              city: customerInfo.city || "",
              pincode: customerInfo.pincode || "",
              gstin: customerInfo.gstin || "",
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
                (item) => item.discount && item.discount > 0,
              ),
              totalDiscount: validItems.reduce(
                (sum, item) => sum + (item.discountedPrice || 0),
                0,
              ),
              itemsWithDiscount: validItems
                .filter((item) => item.discount && item.discount > 0)
                .map((item) => ({
                  name: item.name,
                  hsn: item.hsn || "970300",
                  quantity: item.quantity,
                  unit: item.unit || "pcs",
                  rate: item.price,
                  originalPrice: item.originalPrice,
                  discount: item.discount || 0,
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
          discount: 0,
          discountedPrice: 0,
          searchQuery: "",
          showDropdown: false,
          gstIncluded: company === "YADNYASENI",
        },
      ]);
      setAdvancePayment(0);
      setApplyOverallDiscount(false);
      setOverallDiscountPercentage(0);
      setCustomerInfo({ name: "", number: "", address: "" });
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
          {/* Customer Information */}
          <div className="border border-black/20 py-5 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
              <CardDescription>
                Select existing customer or add new customer details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Search and Dropdown */}
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="customer-search"
                    name="name"
                    value={customerInfo.name}
                    onChange={handleCustomerInfoChange}
                    placeholder="Type customer name or phone number"
                    required
                    onFocus={() => setShowCustomerDropdown(true)}
                  />
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400" />

                  {/* Customer Dropdown */}
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-600">
                            {customer.number} • {customer.address}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {customerInfo.name && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-600">
                      {existingCustomers.find(
                        (c) =>
                          c.name === customerInfo.name &&
                          c.number === customerInfo.number,
                      )
                        ? "Existing customer selected"
                        : "New customer"}
                    </span>
                    {existingCustomers.find(
                      (c) =>
                        c.name === customerInfo.name &&
                        c.number === customerInfo.number,
                    ) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearCustomerSelection}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Phone Number *</Label>
                  <Input
                    id="number"
                    name="number"
                    value={customerInfo.number}
                    onChange={handleCustomerInfoChange}
                    placeholder="Customer Phone Number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Date *</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    required
                    className="w-1/2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Billing Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={customerInfo.address}
                    onChange={handleCustomerInfoChange}
                    placeholder="Customer Billing Address"
                    rows={3}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </div>

          {/* Invoice Items */}
          <div className="border border-black/20 py-5 rounded-2xl">
            <CardHeader>
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
                        id="customer-type-customer"
                        name="customerType"
                        checked={customerType === "CUSTOMER"}
                        onChange={() => handleCustomerTypeChange("CUSTOMER")}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <Label
                        htmlFor="customer-type-customer"
                        className="cursor-pointer text-sm"
                      >
                        Customer
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="customer-type-franchise"
                        name="customerType"
                        checked={customerType === "FRANCHISE"}
                        onChange={() => handleCustomerTypeChange("FRANCHISE")}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <Label
                        htmlFor="customer-type-franchise"
                        className="cursor-pointer text-sm"
                      >
                        Franchise (40%)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="customer-type-reseller"
                        name="customerType"
                        checked={customerType === "RESELLER"}
                        onChange={() => handleCustomerTypeChange("RESELLER")}
                        className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <Label
                        htmlFor="customer-type-reseller"
                        className="cursor-pointer text-sm"
                      >
                        Reseller (30%)
                      </Label>
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
            <CardContent>
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-11 gap-3 text-sm font-medium text-gray-600 pb-2 border-b">
                  <div className="col-span-4">Product</div>
                  <div className="col-span-1 text-center">Qty</div>
                  <div className="col-span-2 text-right">Rate (₹)</div>
                  <div className="col-span-2 text-center">Discount (%)</div>
                  <div className="col-span-1 text-right">Amount (₹)</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Line Items */}
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-11 gap-3 items-center py-2 border-b border-gray-100 last:border-b-0"
                  >
                    {/* Product Selection with Custom Search Dropdown */}
                    <div className="col-span-4 custom-dropdown">
                      <div className="relative">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search products..."
                            value={item.searchQuery}
                            onChange={(e) =>
                              handleSearchChange(index, e.target.value)
                            }
                            onFocus={() => handleDropdownToggle(index, true)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </div>

                        {/* Dropdown Menu */}
                        {item.showDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {/* Search Input inside Dropdown */}
                            <div className="p-2 border-b">
                              <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Type to search products..."
                                  value={item.searchQuery}
                                  onChange={(e) =>
                                    handleSearchChange(index, e.target.value)
                                  }
                                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  autoFocus
                                />
                              </div>
                            </div>

                            {/* Product List */}
                            <div className="py-1">
                              {filteredProducts(index).length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  No products found
                                </div>
                              ) : (
                                filteredProducts(index).map((product) => (
                                  <div
                                    key={product.id}
                                    onClick={() => {
                                      handleProductSelect(index, product);
                                    }}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 flex justify-between items-center ${
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
                                    <div className="text-xs text-gray-500">
                                      {product.quantity !== undefined && (
                                        <span
                                          className={
                                            product.quantity === 0
                                              ? "text-red-600"
                                              : product.quantity < 10
                                                ? "text-orange-600"
                                                : "text-green-600"
                                          }
                                        >
                                          Qty: {product.quantity}
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

                      {/* GST Info for YADNYASENI - Not shown in UI */}

                      {/* Stock warning for selected product */}
                      {item.productId && item.quantity > 0 && (
                        <div className="mt-1">
                          {(() => {
                            const selectedProduct = productsData.find(
                              (p) => p.id === item.productId,
                            );
                            if (
                              !selectedProduct ||
                              selectedProduct.quantity === undefined
                            )
                              return null;

                            const quantity = selectedProduct.quantity;
                            const required = item.quantity;

                            if (quantity === 0) {
                              return (
                                <div className="text-xs text-red-600 font-medium">
                                  Out of Stock
                                </div>
                              );
                            } else if (required > quantity) {
                              return (
                                <div className="text-xs text-orange-600">
                                  Only {quantity} available
                                </div>
                              );
                            } else if (quantity < 10) {
                              return (
                                <div className="text-xs text-blue-600">
                                  Low Stock: {quantity} left
                                </div>
                              );
                            } else {
                              return (
                                <div className="text-xs text-green-600">
                                  {quantity} in stock
                                </div>
                              );
                            }
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value) || 1;
                          handleItemChange(index, "quantity", newQuantity);
                        }}
                        className="text-center"
                      />
                    </div>

                    {/* Rate - Always shows original price */}
                    <div className="col-span-2">
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "price",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="text-right"
                          readOnly
                        />
                      </div>
                    </div>

                    {/* Discount */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) =>
                            handleItemDiscountChange(
                              index,
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="text-center"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                      {item.discount > 0 && (
                        <div className="text-xs text-green-600 text-center mt-1">
                          Save: ₹{item.discountedPrice.toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Amount - Shows discounted total */}
                    <div className="col-span-1 text-right font-medium text-sm">
                      ₹{item.total.toFixed(2)}
                      {item.discount > 0 && (
                        <div className="text-xs text-gray-500 line-through">
                          ₹{(item.originalPrice * item.quantity).toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Remove Button */}
                    <div className="col-span-1 flex justify-center">
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRow(index)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add Row Button */}
                <Button
                  onClick={handleAddRow}
                  variant="outline"
                  className="w-full border-dashed"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Row
                </Button>
              </div>
            </CardContent>
          </div>

          {/* Invoice Settings and Summary - Side by side on larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Settings */}
            <div className="border border-black/20 py-5 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Invoice Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Overall Discount */}
                <div className="space-y-2">
                  <div className="space-y-2">
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
                        className="cursor-pointer"
                      >
                        Apply Extra Charges
                      </Label>
                    </div>

                    {applyExtraCharges && (
                      <div className="flex items-center gap-2 pl-6">
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">
                            ₹
                          </span>
                          <Input
                            type="number"
                            min="0"
                            value={extraChargesAmount}
                            onChange={(e) =>
                              setExtraChargesAmount(
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-32 pl-8"
                            placeholder="Amount"
                          />
                        </div>
                        <span className="text-sm text-gray-500">
                          flat charges
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="applyOverallDiscount"
                      checked={applyOverallDiscount}
                      onCheckedChange={handleOverallDiscountChange}
                    />
                    <Label
                      htmlFor="applyOverallDiscount"
                      className="cursor-pointer"
                    >
                      Apply Overall Discount
                    </Label>
                  </div>

                  {applyOverallDiscount && (
                    <div className="flex items-center gap-2 pl-6">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={overallDiscountPercentage}
                        onChange={(e) =>
                          setOverallDiscountPercentage(
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-24"
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-500">%</span>
                      <Badge variant="secondary" className="ml-2">
                        {customerType === "RESELLER" && "Auto: 40%"}
                        {customerType === "FRANCHISE" && "Auto: 30%"}
                        {customerType === "CUSTOMER" && "Auto: 0%"}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* GST Settings - Only show for RUDRA in UI */}
                {company === "RUDRA" && (
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="includeGst"
                      checked={includeGst}
                      onCheckedChange={(checked) =>
                        setIncludeGst(checked === true)
                      }
                    />
                    <Label htmlFor="includeGst" className="cursor-pointer">
                      Include GST (5%)
                    </Label>
                  </div>
                )}

                {/* Invoice Status */}
                <div className="space-y-3">
                  <Label className="font-semibold">Invoice Status *</Label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="status-paid"
                        name="invoiceStatus"
                        checked={invoiceStatus === "PAID"}
                        onChange={() => handleStatusChange("PAID")}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
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
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <Label htmlFor="status-unpaid" className="cursor-pointer">
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
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
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

                {/* Advance Payment */}
                {invoiceStatus === "ADVANCE" && (
                  <div className="space-y-2">
                    <Label htmlFor="advance" className="font-semibold">
                      Advance Payment Amount (₹)
                    </Label>
                    <Input
                      id="advance"
                      type="number"
                      min="0"
                      max={total}
                      value={advancePayment}
                      onChange={(e) =>
                        setAdvancePayment(parseFloat(e.target.value) || 0)
                      }
                      placeholder="Enter advance amount"
                    />
                  </div>
                )}
              </CardContent>
            </div>

            {/* Invoice Summary - Show GST breakdown only for RUDRA in UI */}
            <div className="border border-black/20 py-5 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-800">₹{subtotal.toFixed(2)}</span>
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Total Discount:</span>
                    <span>-₹{totalDiscount.toFixed(2)}</span>
                  </div>
                )}

                {/* Only show GST breakdown for RUDRA in UI */}
                {includeGst && company === "RUDRA" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CGST (2.5%):</span>
                      <span className="text-gray-800">₹{cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SGST (2.5%):</span>
                      <span className="text-gray-800">₹{sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}

                {extraCharges > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Extra Charges:</span>
                    <span>+₹{extraCharges.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-lg pt-3 border-t">
                  <span className="text-gray-900">Total Amount:</span>
                  <span className="text-gray-900">₹{total.toFixed(2)}</span>
                </div>

                {invoiceStatus === "ADVANCE" && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Advance Paid:</span>
                      <span>₹{advancePayment.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span className="text-blue-700">Balance Due:</span>
                      <span className="text-blue-700">
                        ₹{balance.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}

                <div className="pt-4 text-sm text-gray-500">
                  <p>Total in words: {convertToWords(total)} Only</p>
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
                Generate Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPreview && invoicePreviewData && (
        <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Invoice Preview
                </h2>
                <p className="text-sm text-gray-600">
                  Review your invoice before saving or downloading
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowPreview(false);
                  setInvoicePreviewData(null);
                }}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="border border-gray-300 rounded-lg overflow-hidden h-[70vh]">
                {/* PDF Preview Container */}
                <div className="w-full h-full overflow-auto bg-gray-100">
                  <div className="flex flex-col items-center justify-center min-h-full p-4">
                    {/* Static Preview (Looks like PDF) */}
                    <div className="bg-white p-8 w-full max-w-4xl shadow-lg border border-gray-200">
                      {/* Company Header */}
                      <div className="text-center mb-6">
                        <div className="flex items-center justify-center mb-2">
                          <h1 className="text-xl font-bold text-gray-900 uppercase">
                            {currentCompany.name}
                          </h1>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {currentCompany.address}
                        </p>
                        <p className="text-sm text-gray-600">
                          GSTIN: {currentCompany.gstin} | {currentCompany.phone}
                        </p>
                      </div>

                      {/* Invoice Title */}
                      <div className="text-center mb-4">
                        <h2 className="text-lg font-bold text-gray-900">
                          TAX INVOICE
                        </h2>
                      </div>

                      {/* Invoice Info */}
                      <div className="flex justify-between mb-6 p-3 border border-gray-300 rounded">
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Invoice No:</span>{" "}
                            PREVIEW
                          </p>
                        </div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Invoice Date:</span>{" "}
                            {new Date(invoiceDate).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="grid grid-cols-2 gap-4 mb-6 p-3 border border-gray-300 rounded">
                        <div>
                          <h3 className="font-bold text-gray-800 mb-2">
                            Bill To:
                          </h3>
                          <p className="text-sm">{customerInfo.name}</p>
                          <p className="text-sm">{customerInfo.address}</p>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800 mb-2">
                            Ship To:
                          </h3>
                          <p className="text-sm">{customerInfo.name}</p>
                          <p className="text-sm">{customerInfo.address}</p>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="mb-6 border border-gray-300 rounded overflow-hidden">
                        <div className="grid grid-cols-12 bg-gray-50 p-2 border-b border-gray-300 text-xs font-bold">
                          <div className="col-span-6">Item & Description</div>
                          <div className="col-span-2 text-center">Qty</div>
                          <div className="col-span-2 text-right">Rate (₹)</div>
                          <div className="col-span-2 text-right">
                            Amount (₹)
                          </div>
                        </div>
                        {items
                          .filter((item) => item.name && item.price > 0)
                          .slice(0, 3) // Show only first 3 items in preview
                          .map((item, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-12 p-2 border-b border-gray-100 text-sm"
                            >
                              <div className="col-span-6">{item.name}</div>
                              <div className="col-span-2 text-center">
                                {item.quantity}
                              </div>
                              <div className="col-span-2 text-right">
                                ₹{item.price.toFixed(2)}
                              </div>
                              <div className="col-span-2 text-right font-medium">
                                ₹{item.total.toFixed(2)}
                              </div>
                            </div>
                          ))}
                        {items.filter((item) => item.name && item.price > 0)
                          .length > 3 && (
                          <div className="p-2 text-center text-sm text-gray-500 bg-gray-50">
                            ... and{" "}
                            {items.filter((item) => item.name && item.price > 0)
                              .length - 3}{" "}
                            more items
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      <div className="flex justify-end mb-4">
                        <div className="w-64 border border-gray-300 rounded overflow-hidden">
                          <div className="bg-gray-50 p-2 text-center font-bold border-b border-gray-300">
                            Summary
                          </div>
                          <div className="divide-y divide-gray-200">
                            <div className="flex justify-between p-2">
                              <span>Subtotal:</span>
                              <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            {/* Show GST breakdown in preview for both companies */}
                            {company === "RUDRA" && includeGst && (
                              <>
                                <div className="flex justify-between p-2">
                                  <span>CGST (2.5%):</span>
                                  <span>₹{cgst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between p-2">
                                  <span>SGST (2.5%):</span>
                                  <span>₹{sgst.toFixed(2)}</span>
                                </div>
                              </>
                            )}

                            {company === "YADNYASENI" && (
                              <div className="p-2 text-xs text-gray-500">
                                GST (5%) included in prices
                              </div>
                            )}

                            {/* Extra Charges */}
                            {extraCharges > 0 && (
                              <div className="flex justify-between p-2">
                                <span>Extra Charges:</span>
                                <span>₹{extraCharges.toFixed(2)}</span>
                              </div>
                            )}

                            <div className="flex justify-between p-2 bg-gray-50 font-bold">
                              <span>Total:</span>
                              <span>₹{total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Watermark */}
                      <div className="text-center mt-8">
                        <div className="text-gray-300 text-4xl font-bold opacity-20 transform -rotate-12">
                          PREVIEW
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-center text-sm text-gray-500">
                      This is a preview. The actual PDF will be generated when
                      you click "Generate Invoice & PDF"
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-6 border-t bg-gray-50">
              <div>
                <p className="text-sm text-gray-600">
                  Invoice Total:{" "}
                  <span className="font-bold">₹{total.toFixed(2)}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Items:{" "}
                  {items.filter((item) => item.name && item.price > 0).length}
                </p>
                {company === "YADNYASENI" && (
                  <p className="text-xs text-green-600">
                    GST (5%) included in prices
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPreview(false);
                    setInvoicePreviewData(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      // Save as draft
                      await saveInvoice("UNPAID");
                      setShowPreview(false);
                      setInvoicePreviewData(null);
                      alert.success(
                        "Invoice saved as draft",
                        "You can find it in the invoice management section",
                        { duration: 5000 },
                      );
                    } catch (error) {
                      console.error("Failed to save draft:", error);
                    }
                  }}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      // Generate PDF directly
                      await handleGenerateInvoice();
                      setShowPreview(false);
                      setInvoicePreviewData(null);
                    } catch (error) {
                      console.error("Failed to generate invoice:", error);
                    }
                  }}
                  className="bg-orange-800 hover:bg-orange-900 text-white"
                >
                  <IndianRupee className="mr-2 h-4 w-4" />
                  Generate Invoice & PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Invoices;
