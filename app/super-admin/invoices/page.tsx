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
  Printer,
  Download,
  Save,
  Search,
  IndianRupee,
  PackageIcon,
  List,
  ReceiptIndianRupee,
  Edit,
  Check,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import InvoicePDF from "@/components/InvoicePDF/InvoicePDF";
import { convertToWords } from "@/utils/numberToWords";
import { pdf } from "@react-pdf/renderer";
import { AlertToaster, alert } from "@/components/ui/alert-toaster";

// Define types
interface Product {
  id: number;
  name: string;
  size: string;
  price: number;
  category: string;
}

interface InvoiceItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  originalPrice: number;
  total: number;
  subtotal: number;
  discount?: number;
  discountedPrice?: number;
  hsn?: string;
  unit?: string;
  description?: string;
  notes?: string;
  isEditing?: boolean;
  tempDiscount?: number;
}

interface CustomerInfo {
  name: string;
  number: string;
  address: string;
  city?: string;
  pincode?: string;
  gstin?: string;
}

const Invoices = () => {
  // State for customer information
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    number: "",
    address: "",
  });

  // State for shipping information
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    address: "",
  });

  // State for invoice items
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // State for advance payment
  const [advancePayment, setAdvancePayment] = useState<number>(0);

  // State for overall discount
  const [applyOverallDiscount, setApplyOverallDiscount] =
    useState<boolean>(false);
  const [overallDiscountPercentage, setOverallDiscountPercentage] =
    useState<number>(0);

  // State for GST
  const [includeGst, setIncludeGst] = useState<boolean>(true);

  // State for search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // State for selected product
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const [productsData, setProductsData] = useState<Product[]>([]);
  const [generatePdf, setGeneratePdf] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [isLoadingInvoiceNumber, setIsLoadingInvoiceNumber] = useState(true);
  const [productStock, setProductStock] = useState<{ [key: number]: number }>(
    {}
  );
  const [invoiceStatus, setInvoiceStatus] = useState<
    "PAID" | "UNPAID" | "ADVANCE"
  >("UNPAID");

  // Apply overall discount to all items
  const applyOverallDiscountToItems = (percentage: number) => {
    if (percentage < 0 || percentage > 100) return;

    const updatedItems = items.map((item) => {
      const discountAmount = (item.originalPrice * percentage) / 100;
      const finalPrice = item.originalPrice - discountAmount;

      return {
        ...item,
        discount: percentage,
        price: finalPrice,
        total: finalPrice * item.quantity,
        discountedPrice: discountAmount * item.quantity,
      };
    });

    setItems(updatedItems);
  };

  // Handle overall discount checkbox change
  const handleOverallDiscountChange = (checked: boolean) => {
    setApplyOverallDiscount(checked);
    if (!checked) {
      // Remove discount from all items
      const updatedItems = items.map((item) => ({
        ...item,
        discount: 0,
        price: item.originalPrice,
        total: item.originalPrice * item.quantity,
        discountedPrice: 0,
      }));
      setItems(updatedItems);
      setOverallDiscountPercentage(0);
    }
  };

  // Apply overall discount when percentage changes
  useEffect(() => {
    if (applyOverallDiscount && overallDiscountPercentage > 0) {
      applyOverallDiscountToItems(overallDiscountPercentage);
    }
  }, [overallDiscountPercentage, applyOverallDiscount]);

  // Start editing individual item discount
  const startEditingDiscount = (index: number) => {
    const updatedItems = items.map((item, i) => ({
      ...item,
      isEditing: i === index,
      tempDiscount: i === index ? item.discount || 0 : item.tempDiscount,
    }));
    setItems(updatedItems);
  };

  // Cancel editing individual item discount
  const cancelEditingDiscount = (index: number) => {
    const updatedItems = items.map((item, i) => ({
      ...item,
      isEditing: i === index ? false : item.isEditing,
      tempDiscount: undefined,
    }));
    setItems(updatedItems);
  };

  // Save individual item discount
  const saveIndividualDiscount = (index: number) => {
    const item = items[index];
    if (
      item.tempDiscount === undefined ||
      item.tempDiscount < 0 ||
      item.tempDiscount > 100
    )
      return;

    const discountAmount = (item.originalPrice * item.tempDiscount) / 100;
    const finalPrice = item.originalPrice - discountAmount;

    const updatedItems = items.map((currentItem, i) =>
      i === index
        ? {
            ...currentItem,
            discount: item.tempDiscount,
            price: finalPrice,
            total: finalPrice * currentItem.quantity,
            discountedPrice: discountAmount * currentItem.quantity,
            isEditing: false,
            tempDiscount: undefined,
          }
        : currentItem
    );

    setItems(updatedItems);
  };

  // Update temp discount while editing
  const updateTempDiscount = (index: number, value: number) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, tempDiscount: value } : item
    );
    setItems(updatedItems);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalDiscount = items.reduce(
    (sum, item) => sum + (item.discountedPrice || 0),
    0
  );
  const cgst = includeGst ? subtotal * 0.06 : 0;
  const sgst = includeGst ? subtotal * 0.06 : 0;
  const gstTotal = cgst + sgst;
  const total = subtotal + gstTotal;
  const advanceAmount = subtotal - advancePayment;
  const balance = total - advanceAmount;

  // Save Invoice to API
  const saveInvoice = async (status: "PAID" | "ADVANCE" | "UNPAID") => {
    try {
      const invoiceData = {
        invoiceNumber, // Include the invoice number from state
        invoiceDate: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        customerInfo,
        shippingInfo: shippingInfo.address ? shippingInfo : customerInfo,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.subtotal,
          description: item.description || "",
          notes: item.notes || "",
        })),
        subtotal,
        cgst,
        sgst,
        total,
        advancePaid: advancePayment,
        balanceDue: balance,
        totalInWords: `${convertToWords(total)} Only`,
        deliveryDate: new Date().toISOString(),
        status,
      };

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });

      const result = await res.json();

      console.log(result, "result after saving invoice");

      setInvoiceNumber(result.invoice.invoiceNumber);
      if (!res.ok) throw new Error(result.error || "Failed to save invoice");

      // Success alert - use the invoice number from the response
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
        }
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
        }
      );
      throw error;
    }
  };

  const checkProductAvailability = async () => {
    const availabilityChecks = items.map(async (item) => {
      try {
        const response = await fetch(`/api/products/${item.productId}`);
        if (!response.ok) throw new Error("Failed to fetch product");

        const product = await response.json();

        return {
          productId: item.productId,
          productName: item.name,
          available: product.quantity,
          requested: item.quantity,
          isAvailable: product.quantity >= item.quantity,
        };
      } catch (error) {
        console.error(
          `Error checking availability for product ${item.productId}:`,
          error
        );
        return {
          productId: item.productId,
          productName: item.name,
          available: 0,
          requested: item.quantity,
          isAvailable: false,
          error: true,
        };
      }
    });

    return Promise.all(availabilityChecks);
  };

  const calculateDiscountedPrice = (
    price: number,
    percentage: number,
    quantity: number
  ) => {
    const discountAmount = (price * percentage) / 100;
    const finalPrice = price - discountAmount;
    return finalPrice * quantity;
  };

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");

        const data = await res.json();
        setProductsData(data);
        setFilteredProducts(data);

        // Fetch quantities for all products
        const stockData: { [key: number]: number } = {};
        for (const product of data) {
          try {
            const response = await fetch(`/api/products/${product.id}`);
            if (response.ok) {
              const productData = await response.json();
              stockData[product.id] = productData.quantity;
            }
          } catch (error) {
            console.error(
              `Error fetching quantity for product ${product.id}:`,
              error
            );
            stockData[product.id] = 0; // Default to 0 if there's an error
          }
        }
        setProductStock(stockData);

        // Show info alert if no products found
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
            }
          );
        }
      } catch (error: any) {
        console.error("Failed to fetch products:", error);

        // Error alert
        alert.error(
          "Failed to load products",
          error.message || "Please try again later",
          {
            duration: 6000,
            action: {
              label: "Retry",
              onClick: fetchProducts,
            },
          }
        );
      }
    };
    fetchProducts();
  }, []);

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = productsData.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(productsData);
    }
  }, [searchQuery]);

  // Determine invoice status based on advance payment
  const getInvoiceStatus = (): "DRAFT" | "PAID" | "UNPAID" => {
    if (invoiceStatus === "PAID") return "PAID";
    if (invoiceStatus === "ADVANCE") return "DRAFT";
    return "UNPAID";
  };

  // Handle status change
  const handleStatusChange = (status: "PAID" | "UNPAID" | "ADVANCE") => {
    setInvoiceStatus(status);
    if (status === "ADVANCE") {
      setAdvancePayment(advanceAmount);
    }
  };

  // Handle customer info change
  const handleCustomerInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));

    // Auto-fill shipping info if empty
    if (name === "name" && !shippingInfo.name) {
      setShippingInfo((prev) => ({ ...prev, name: value }));
    }
    if (name === "address" && !shippingInfo.address) {
      setShippingInfo((prev) => ({ ...prev, address: value }));
    }
  };

  // Handle shipping info change
  const handleShippingInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Handle product selection
  const handleProductSelect = (productId: string) => {
    const product = productsData.find((p) => p.id === parseInt(productId));
    setSelectedProduct(product || null);
  };

  // Add item to invoice
  const handleAddItem = async () => {
    if (!selectedProduct || quantity < 1) return;

    // Check if enough quantity is available
    const isAvailable = await checkQuantityBeforeAdd(
      selectedProduct.id,
      quantity
    );

    if (!isAvailable) {
      alert.error(
        "Insufficient Stock",
        `Not enough quantity available for ${selectedProduct.name}. Please check the current stock.`,
        {
          duration: 6000,
        }
      );
      return;
    }

    const originalPrice = selectedProduct.price;
    let finalPrice = originalPrice;
    let discountAmount = 0;

    // Apply overall discount if set
    if (applyOverallDiscount && overallDiscountPercentage > 0) {
      discountAmount = (originalPrice * overallDiscountPercentage) / 100;
      finalPrice = originalPrice - discountAmount;
    }

    const newItem: InvoiceItem = {
      productId: selectedProduct.id,
      name: selectedProduct.name,
      quantity,
      price: finalPrice,
      originalPrice: originalPrice,
      total: finalPrice * quantity,
      subtotal,
      discount:
        applyOverallDiscount && overallDiscountPercentage > 0
          ? overallDiscountPercentage
          : 0,
      discountedPrice:
        applyOverallDiscount && overallDiscountPercentage > 0
          ? discountAmount * quantity
          : 0,
    };

    setItems([...items, newItem]);
    setSelectedProduct(null);
    setQuantity(1);
    setSearchQuery("");
  };

  // Remove item from invoice
  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // Get current date
  const invoiceDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Company details
  const companyDetails = {
    name: "Rudra Arts and Handicrafts",
    address: "Samata Nagar, Ganesh Nagar Lane No 1, Famous Chowk, New Sangavi",
    city: "Pune, Maharashtra 411061, India",
    gstin: "GSTIN 27AMWPV8148A1ZE",
    phone: "9595221296",
    email: "rudraarts30@gmail.com",
  };

  // Handle final invoice generation
  const handleGenerateInvoice = async () => {
    try {
      // First check if all products have sufficient quantity
      const availabilityResults = await checkProductAvailability();
      const insufficientProducts = availabilityResults.filter(
        (result) => !result.isAvailable
      );

      if (insufficientProducts.length > 0) {
        // Show error message with details
        const errorMessage = insufficientProducts
          .map(
            (product) =>
              `• ${product.productName}: Available ${product.available}, Requested ${product.requested}`
          )
          .join("\n");

        alert.error(
          "Insufficient Stock",
          `The following products don't have enough quantity:\n${errorMessage}`,
          {
            duration: 10000,
          }
        );
        return;
      }

      // Proceed with invoice generation
      const status = getInvoiceStatus();
      const result = await saveInvoice(invoiceStatus);

      // Map your items to the expected InvoiceItem format
      const mappedItems = items.map((item) => ({
        name: item.name,
        hsn: item.hsn || "970300",
        quantity: item.quantity,
        unit: item.unit || "pcs",
        rate: item.price,
        originalPrice: item.originalPrice,
        discount: item.discount || 0,
        cgst: 6,
        sgst: 6,
        amount: item.total,
      }));

      // Generate PDF
      const blob = await pdf(
        <InvoicePDF
          invoiceData={{
            companyDetails,
            invoiceNumber: result.invoice.invoiceNumber,
            invoiceDate,
            dueDate: invoiceDate,
            customerInfo: {
              name: customerInfo.name || "",
              address: customerInfo.address || "",
              city: customerInfo.city || "",
              pincode: customerInfo.pincode || "",
              gstin: customerInfo.gstin || "",
            },
            shippingInfo: shippingInfo.address
              ? {
                  name: customerInfo.name,
                  address: customerInfo.address,
                  city: customerInfo.city ?? "",
                  pincode: customerInfo.pincode ?? "",
                  gstin: customerInfo.gstin ?? "",
                }
              : {
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
            totalInWords: `${convertToWords(subtotal)} Only`,
            deliveryDate: new Date().toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            advancePaid: advancePayment,
            notes: "",
            previousDue: 0,
            discountDetails: {
              hasDiscount: items.some(
                (item) => item.discount && item.discount > 0
              ),
              totalDiscount: items.reduce(
                (sum, item) => sum + (item.discountedPrice || 0),
                0
              ),
              itemsWithDiscount: items
                .filter((item) => item.discount && item.discount > 0)
                .map((item) => ({
                  name: item.name,
                  hsn: item.hsn || "970300",
                  quantity: item.quantity,
                  unit: item.unit || "pcs",
                  rate: item.price,
                  originalPrice: item.originalPrice,
                  discount: item.discount || 0,
                  cgst: 6,
                  sgst: 6,
                  amount: item.total,
                })),
            },
          }}
          logoUrl="/images/logo.png"
        />
      ).toBlob();

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${result.invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      // Show status-specific message
      // if (status === "DRAFT") {
      //   alert.info(
      //     "Invoice saved as DRAFT",
      //     "Advance payment received. Invoice marked as DRAFT until full payment.",
      //     {
      //       duration: 8000,
      //     }
      //   );
      // } else {
      //   alert.success(
      //     "Invoice marked as PAID",
      //     "Full payment received. Invoice is now complete.",
      //     {
      //       duration: 6000,
      //     }
      //   );
      // }

      if (invoiceStatus === "ADVANCE") {
        alert.info(
          "Invoice saved as ADVANCE",
          `Advance payment of ₹${advancePayment} received. Balance due: ₹${
            subtotal - advancePayment
          }`,
          {
            duration: 8000,
          }
        );
      } else if (invoiceStatus === "PAID") {
        alert.success(
          "Invoice marked as PAID",
          "Full payment received. Invoice is now complete.",
          {
            duration: 6000,
          }
        );
      } else {
        alert.info(
          "Invoice saved as UNPAID",
          "No payment received. Invoice will be marked as pending.",
          {
            duration: 6000,
          }
        );
      }

      // Clear the form after successful invoice generation
      setItems([]);
      setAdvancePayment(0);
      setApplyOverallDiscount(false);
      setOverallDiscountPercentage(0);
    } catch (error) {
      console.error("Failed to generate invoice:", error);
    }
  };

  const checkQuantityBeforeAdd = async (
    productId: number,
    quantity: number
  ) => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error("Failed to fetch product");

      const product = await response.json();
      return product.quantity >= quantity;
    } catch (error) {
      console.error("Error checking quantity:", error);
      return false;
    }
  };

  return (
    <DashboardLayout>
      <AlertToaster />
      <div className="container mx-auto p-4 space-y-6 font-open-sans">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold flex items-center text-[#954C2E] font-open-sans">
            <ReceiptIndianRupee className="mr-2 h-8 w-8" />
            Create Invoice
          </h1>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="border-[#954C2E] text-[#954C2E] hover:bg-blue-50 font-open-sans"
              onClick={() => saveInvoice(invoiceStatus)}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button
              className="flex-1 bg-[#954C2E] hover:bg-[#734d26] text-white font-open-sans"
              onClick={handleGenerateInvoice}
            >
              <IndianRupee className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>
          </div>
        </div>

        {/* Status Indicator */}
        {items.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-800">
                  Invoice Status: {invoiceStatus}
                </h3>
                <p className="text-sm text-blue-600">
                  {invoiceStatus === "PAID"
                    ? "Full payment received. Invoice will be marked as PAID."
                    : invoiceStatus === "ADVANCE"
                    ? "Advance payment received. Invoice will be marked as ADVANCE."
                    : "No payment received. Invoice will be marked as UNPAID."}
                </p>
              </div>
              <Badge
                className={
                  invoiceStatus === "PAID"
                    ? "bg-green-100 text-green-800"
                    : invoiceStatus === "ADVANCE"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {invoiceStatus}
              </Badge>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="bg-blue-50/50 pb-3">
                <CardTitle className="text-[#954C2E] flex items-center gap-2 font-open-sans">
                  <div className="w-2 h-5 rounded-full bg-[#954C2E]"></div>
                  Customer Information
                </CardTitle>
                <CardDescription>
                  Enter customer details for the invoice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={customerInfo.name}
                    onChange={handleCustomerInfoChange}
                    placeholder="Customer Name"
                    required
                    className="border-gray-300 focus:border-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number" className="text-gray-700">
                    Phone Number *
                  </Label>
                  <Input
                    id="number"
                    name="number"
                    value={customerInfo.number}
                    onChange={handleCustomerInfoChange}
                    placeholder="Customer Phone Number"
                    required
                    className="border-gray-300 focus:border-blue-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-gray-700">
                    Billing Address
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={customerInfo.address}
                    onChange={handleCustomerInfoChange}
                    placeholder="Customer Billing Address"
                    rows={3}
                    className="border-gray-300 focus:border-blue-400"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Add Products */}
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="bg-blue-50/50 pb-3">
                <CardTitle className="text-[#954C2E] flex items-center gap-2">
                  <div className="w-2 h-5 rounded-full bg-[#954C2E]"></div>
                  Add Products
                </CardTitle>
                <CardDescription>
                  Select products and quantities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">
                    Search and Select Product
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search and select products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-blue-400"
                      onFocus={() => setSearchQuery("")}
                    />
                    {searchQuery && filteredProducts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => {
                              setSelectedProduct(product);
                              setSearchQuery("");
                            }}
                            className="px-4 py-2 cursor-pointer hover:bg-blue-50 flex justify-between items-center"
                          >
                            <div>
                              <span>
                                {product.name} {product.size}
                              </span>
                              <span className="block text-xs text-gray-500">
                                Stock:{" "}
                                {productStock[product.id] !== undefined
                                  ? productStock[product.id]
                                  : "Loading..."}
                              </span>
                            </div>
                            <span className="text-blue-600">
                              ₹{product.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-gray-700">
                      Quantity
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(parseInt(e.target.value) || 1)
                      }
                      className="border-gray-300 focus:border-blue-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700">Selected Product</Label>
                    <div className="p-2 border border-gray-300 rounded-md min-h-[40px] bg-gray-50">
                      {selectedProduct ? (
                        <div>
                          <div className="flex justify-between items-center">
                            <span>{selectedProduct.name}</span>
                            <span className="text-blue-600 font-medium">
                              ₹
                              {(
                                selectedProduct.price * quantity
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          {applyOverallDiscount &&
                            overallDiscountPercentage > 0 && (
                              <div className="flex justify-between text-sm mt-1">
                                <span className="text-green-600">
                                  After {overallDiscountPercentage}% discount:
                                </span>
                                <span className="text-green-600 font-medium">
                                  ₹
                                  {calculateDiscountedPrice(
                                    selectedProduct.price,
                                    overallDiscountPercentage,
                                    quantity
                                  ).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            )}
                        </div>
                      ) : (
                        <span className="text-gray-400">
                          No product selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    if (selectedProduct === null) {
                      alert.warning(
                        "No items added",
                        "Please add at least one product to the invoice"
                      );
                      return;
                    }
                    handleAddItem();
                  }}
                  className="w-full bg-[#954C2E] hover:bg-[#996600] text-white font-open-sans"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </CardContent>
            </Card>

            {/* Product List */}
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="bg-blue-50/50 pb-3">
                <CardTitle className="text-[#954C2E] flex items-center gap-2">
                  <div className="w-2 h-5 rounded-full bg-[#954C2E]"></div>
                  Product List
                </CardTitle>
                <CardDescription>Items added to the invoice</CardDescription>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <Plus className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No products added yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Add products using the form above
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-blue-50/30 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.quantity} x ₹{item.price}
                            {item.discount && item.discount > 0 && (
                              <span className="text-green-600 ml-2">
                                ({item.discount}% off)
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <p className="font-medium text-[#954C2E]">
                            ₹{item.subtotal.toFixed(2)}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Invoice Preview */}
          <div className="space-y-6">
            <Card className="sticky top-6 border-blue-100 shadow-lg">
              <CardHeader className="bg-[#954C2E] text-white p-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white">
                      Invoice Preview
                    </CardTitle>
                    <CardDescription className="text-blue-100">
                      Real-time invoice preview
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Company Header */}
                <div className="p-6 border-b border-blue-100 bg-blue-50/30">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-semibold text-[#954C2E]">
                      {companyDetails.name}
                    </h2>
                    <p className="text-sm text-gray-700">
                      {companyDetails.address}
                    </p>
                    <p className="text-sm text-gray-700">
                      {companyDetails.city}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      {companyDetails.gstin}
                    </p>
                    <p className="text-sm text-gray-700">
                      {companyDetails.phone} | {companyDetails.email}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div>
                      {/* <p className="text-sm text-gray-800">
                        <span className="font-bold">Invoice No:</span>{" "}
                        {isLoadingInvoiceNumber ? "Loading..." : invoiceNumber}
                      </p> */}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-800">
                        <span className="font-bold">Date:</span> {invoiceDate}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bill To / Ship To */}
                <div className="p-6 border-b border-blue-100 grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#954C2E] mb-2">
                      Bill To:
                    </h3>
                    <p className="text-sm text-gray-800 font-bold">
                      {customerInfo.name || "Customer Name"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {customerInfo.number || "Phone Number"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {customerInfo.address || "Billing Address"}
                    </p>
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="p-6 border-b border-blue-100">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-blue-100">
                        <th className="text-left py-3 text-[#954C2E] font-semibold text-sm">
                          Item & Description
                        </th>
                        <th className="text-right py-3 text-[#954C2E] font-semibold text-sm">
                          Qty
                        </th>
                        <th className="text-right py-3 text-[#954C2E] font-semibold text-sm">
                          Rate (₹)
                        </th>
                        <th className="text-right py-3 text-[#954C2E] font-semibold text-sm">
                          Discount (%)
                        </th>
                        <th className="text-right py-3 text-[#954C2E] font-semibold text-sm">
                          CGST (6%)
                        </th>
                        <th className="text-right py-3 text-[#954C2E] font-semibold text-sm">
                          SGST (6%)
                        </th>
                        <th className="text-right py-3 text-[#954C2E] font-semibold text-sm">
                          Amount (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => {
                        const itemCgst = includeGst ? item.total * 0.06 : 0;
                        const itemSgst = includeGst ? item.total * 0.06 : 0;

                        return (
                          <tr key={index} className="border-b border-blue-50">
                            <td className="py-3 text-gray-800 text-sm font-semibold">
                              {item.name}
                            </td>
                            <td className="text-right py-3 text-gray-600 text-sm">
                              {item.quantity.toLocaleString("en-IN")}
                            </td>
                            <td className="text-right py-3 text-gray-600 text-sm">
                              ₹
                              {item.originalPrice.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-right py-3 text-gray-600 text-sm">
                              {item.isEditing ? (
                                <div className="flex items-center justify-end gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={item.tempDiscount || 0}
                                    onChange={(e) =>
                                      updateTempDiscount(
                                        index,
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="w-16 h-8 text-sm"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      saveIndividualDiscount(index)
                                    }
                                    className="h-6 w-6 bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => cancelEditingDiscount(index)}
                                    className="h-6 w-6"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1">
                                  <span>{item.discount || 0}%</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditingDiscount(index)}
                                    className="h-6 w-6 p-0 hover:bg-gray-100"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </td>
                            <td className="text-right py-3 text-gray-600 text-sm">
                              ₹
                              {itemCgst.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-right py-3 text-gray-600 text-sm">
                              ₹
                              {itemSgst.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-right py-3 text-[#954C2E] font-semibold text-sm">
                              ₹
                              {item.subtotal.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Overall Discount Section */}
                <div className="p-6 border-b border-blue-100 bg-amber-50/30">
                  <div className="flex items-center space-x-3 mb-3">
                    <Checkbox
                      id="applyOverallDiscount"
                      checked={applyOverallDiscount}
                      onCheckedChange={handleOverallDiscountChange}
                      className="data-[state=checked]:bg-[#954C2E] text-white border-amber-600"
                    />
                    <Label
                      htmlFor="applyOverallDiscount"
                      className="text-gray-700 cursor-pointer font-semibold"
                    >
                      Apply Overall Discount
                    </Label>
                  </div>

                  {applyOverallDiscount && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="overallDiscountPercentage"
                        className="text-gray-700"
                      >
                        Discount Percentage (0-100%)
                      </Label>
                      <Input
                        id="overallDiscountPercentage"
                        type="number"
                        min="0"
                        max="100"
                        value={overallDiscountPercentage}
                        onChange={(e) => {
                          let value = parseInt(e.target.value) || 0;
                          if (value > 100) value = 100;
                          if (value < 0) value = 0;
                          setOverallDiscountPercentage(value);
                        }}
                        className="border-gray-300 focus:border-amber-400"
                        placeholder="0"
                      />
                      {overallDiscountPercentage > 0 && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-700">
                            ✅ {overallDiscountPercentage}% discount applied to
                            all {items.length} product(s)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Invoice Totals */}
                <div className="p-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-800">
                      ₹
                      {subtotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Total Discount:</span>
                      <span>
                        -₹
                        {totalDiscount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  {/* GST Options */}
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="includeGst"
                      checked={includeGst}
                      onCheckedChange={(checked) =>
                        setIncludeGst(checked === true)
                      }
                      className="data-[state=checked]:bg-[#954C2E] text-white"
                    />
                    <Label
                      htmlFor="includeGst"
                      className="text-gray-700 cursor-pointer"
                    >
                      Include GST (12% total: 6% CGST + 6% SGST)
                    </Label>
                  </div>

                  {includeGst && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-800 font-semibold">
                          CGST:
                        </span>
                        <span className="text-gray-800">6%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-800 font-semibold">
                          SGST:
                        </span>
                        <span className="text-gray-800">6%</span>
                      </div>
                      <div className="flex justify-between border-t border-blue-100 pt-2">
                        <span className="text-gray-800 font-semibold">
                          GST Total:
                        </span>
                        <span className="text-gray-800 font-medium">
                          ₹
                          {gstTotal.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between font-bold text-lg pt-3 border-t border-blue-100">
                    <span className="text-[#954C2E]">Total:</span>
                    <span className="text-[#954C2E]">
                      ₹
                      {subtotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* Invoice Status Section */}
                  <div className="pt-4 mt-4 border-t border-blue-100">
                    <div className="space-y-4">
                      {/* Status Selection */}
                      <div className="space-y-3">
                        <Label className="text-gray-700 font-semibold">
                          Invoice Status *
                        </Label>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="status-paid"
                              name="invoiceStatus"
                              checked={invoiceStatus === "PAID"}
                              onChange={() => handleStatusChange("PAID")}
                              className="h-4 w-4 text-[#954C2E] focus:ring-[#954C2E] border-gray-300"
                            />
                            <Label
                              htmlFor="status-paid"
                              className="text-gray-700 cursor-pointer"
                            >
                              Paid (Full Payment Received)
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="status-unpaid"
                              name="invoiceStatus"
                              checked={invoiceStatus === "UNPAID"}
                              onChange={() => handleStatusChange("UNPAID")}
                              className="h-4 w-4 text-[#954C2E] focus:ring-[#954C2E] border-gray-300"
                            />
                            <Label
                              htmlFor="status-unpaid"
                              className="text-gray-700 cursor-pointer"
                            >
                              Unpaid (No Payment Received)
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="status-advance"
                              name="invoiceStatus"
                              checked={invoiceStatus === "ADVANCE"}
                              onChange={() => handleStatusChange("ADVANCE")}
                              className="h-4 w-4 text-[#954C2E] focus:ring-[#954C2E] border-gray-300"
                            />
                            <Label
                              htmlFor="status-advance"
                              className="text-gray-700 cursor-pointer"
                            >
                              Advance (Partial Payment Received)
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Advance Payment Input - Only show for ADVANCE status */}
                      {invoiceStatus === "ADVANCE" && (
                        <div className="space-y-2">
                          <Label htmlFor="advance" className="text-gray-700">
                            Advance Payment Amount (₹)
                          </Label>
                          <Input
                            id="advance"
                            type="number"
                            min="0"
                            max={subtotal}
                            value={advancePayment}
                            onChange={(e) =>
                              setAdvancePayment(parseFloat(e.target.value) || 0)
                            }
                            placeholder="Enter advance amount"
                            className="border-gray-300 focus:border-blue-400"
                          />
                        </div>
                      )}

                      {/* Payment Summary */}
                      {invoiceStatus !== "UNPAID" && (
                        <div className="mt-4 space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="text-gray-800 font-medium">
                              ₹
                              {subtotal.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>

                          {invoiceStatus === "ADVANCE" && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Advance Paid:
                                </span>
                                <span className="text-green-600 font-medium">
                                  ₹
                                  {advancePayment.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                              <div className="flex justify-between font-bold pt-2 border-t border-blue-200">
                                <span className="text-blue-700">
                                  Balance Due:
                                </span>
                                <span className="text-blue-700">
                                  ₹
                                  {(subtotal - advancePayment).toLocaleString(
                                    "en-IN",
                                    {
                                      minimumFractionDigits: 2,
                                    }
                                  )}
                                </span>
                              </div>
                            </>
                          )}

                          {invoiceStatus === "PAID" && (
                            <div className="flex justify-between font-bold">
                              <span className="text-green-700">
                                Payment Status:
                              </span>
                              <span className="text-green-700">Fully Paid</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  setCustomerInfo({ name: "", number: "", address: "" });
                  setShippingInfo({ name: "", address: "" });
                  setItems([]);
                  setAdvancePayment(0);
                  setIncludeGst(true);
                  setApplyOverallDiscount(false);
                  setOverallDiscountPercentage(0);
                  setInvoiceStatus("UNPAID");
                }}
              >
                Clear All
              </Button>
              <Button
                className="flex-1 bg-[#954C2E] hover:bg-[#734d26] text-white font-open-sans"
                onClick={handleGenerateInvoice}
              >
                <IndianRupee className="mr-2 h-4 w-4" />
                Generate Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Invoices;
