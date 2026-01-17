"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  FileText,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Link from "next/link";

interface Vendor {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  companyName?: string;
  gstin?: string;
  address?: string;
  openingBalance?: number;
  creditLimit?: number;
  currentBalance: number; // Add this to track current balance
  outstandingCreditNotes: number; // Add this to track total credit notes
  outstandingBills: number; // Add this to track total bills due
  createdAt: string;
  updatedAt: string;
}
export default function VendorManager() {
  const [activeTab, setActiveTab] = useState("vendors");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    companyName: "",
    gstin: "",
    address: "",
    openingBalance: "0",
    creditLimit: "0",
  });

  // Load vendors
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/vendors");
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // const handleApplyCredit = async (billId: number) => {
  //   const bill = bills.find((b) => b.id === billId);
  //   if (!bill) return;

  //   try {
  //     // Get available credit notes for this vendor
  //     const response = await fetch(
  //       `/api/vendor-credit-notes?vendorId=${bill.vendorId}&status=ISSUED&applied=false`
  //     );
  //     const availableCreditNotes = await response.json();

  //     if (availableCreditNotes.length === 0) {
  //       alert("No available credit notes for this vendor");
  //       return;
  //     }

  //     const totalCredit = availableCreditNotes.reduce(
  //       (sum: number, note: any) => sum + note.amount,
  //       0
  //     );

  //     const apply = confirm(
  //       `Apply ₹${totalCredit.toFixed(2)} in credit notes to bill ${
  //         bill.billNumber
  //       }?\n` +
  //         `Current balance: ₹${bill.balanceDue.toFixed(2)}\n` +
  //         `New balance: ₹${Math.max(0, bill.balanceDue - totalCredit).toFixed(
  //           2
  //         )}`
  //     );

  //     if (apply) {
  //       // Apply credit notes
  //       for (const note of availableCreditNotes) {
  //         await fetch(`/api/vendor-credit-notes?id=${note.id}`, {
  //           method: "PUT",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({
  //             status: "APPLIED",
  //             appliedToBill: bill.billNumber,
  //             appliedDate: new Date().toISOString(),
  //           }),
  //         });
  //       }

  //       // Update bill balance
  //       const newBalance = Math.max(0, bill.balanceDue - totalCredit);
  //       await fetch(`/api/vendor-bills?id=${billId}`, {
  //         method: "PUT",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           balanceDue: newBalance,
  //           totalAmount: newBalance,
  //           originalTotal: bill.originalTotal || bill.totalAmount,
  //           appliedCreditNotes: [
  //             ...(bill.appliedCreditNotes || []),
  //             ...availableCreditNotes.map((n: any) => ({
  //               creditNoteNumber: n.creditNoteNumber,
  //               amount: n.amount,
  //             })),
  //           ],
  //         }),
  //       });

  //       await fetchBills();
  //       alert("Credit notes applied successfully!");
  //     }
  //   } catch (error) {
  //     console.error("Error applying credit:", error);
  //     alert("Failed to apply credit notes");
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      alert("Vendor name is required");
      return;
    }

    setLoading(true);

    try {
      const url = editingVendor
        ? `/api/vendors?id=${editingVendor.id}`
        : "/api/vendors";
      const method = editingVendor ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          companyName: formData.companyName.trim() || null,
          gstin: formData.gstin.trim() || null,
          address: formData.address.trim() || null,
          openingBalance: formData.openingBalance
            ? parseFloat(formData.openingBalance)
            : null,
          creditLimit: formData.creditLimit
            ? parseFloat(formData.creditLimit)
            : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save vendor");
      }

      await fetchVendors();
      resetForm();
      alert(`Vendor ${editingVendor ? "updated" : "created"} successfully!`);
    } catch (error) {
      console.error("Error saving vendor:", error);
      alert(error instanceof Error ? error.message : "Failed to save vendor");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      companyName: "",
      gstin: "",
      address: "",
      openingBalance: "",
      creditLimit: "",
    });
    setEditingVendor(null);
    setShowForm(false);
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      phone: vendor.phone || "",
      email: vendor.email || "",
      companyName: vendor.companyName || "",
      gstin: vendor.gstin || "",
      address: vendor.address || "",
      openingBalance: vendor.openingBalance?.toString() || "",
      creditLimit: vendor.creditLimit?.toString() || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vendor?")) {
      return;
    }

    try {
      const response = await fetch(`/api/vendors?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete vendor");
      }

      await fetchVendors();
      alert("Vendor deleted successfully!");
    } catch (error) {
      console.error("Error deleting vendor:", error);
      alert("Failed to delete vendor");
    }
  };

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.phone?.includes(searchTerm) ||
      vendor.gstin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Purchases</h2>
            <p className="text-gray-600">
              Manage vendors, credit notes, and payments
            </p>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          )}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="vendors">
              Vendors ({vendors.length})
            </TabsTrigger>
            <TabsTrigger value="credit-notes">Credit Notes</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="bills">Bills</TabsTrigger>
          </TabsList>

          {/* Vendors Tab */}
          <TabsContent value="vendors" className="space-y-6">
            {showForm ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingVendor ? "Edit Vendor" : "Add New Vendor"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Basic Information
                        </h3>

                        <div className="space-y-2">
                          <Label htmlFor="name">Vendor Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                              handleInputChange("name", e.target.value)
                            }
                            placeholder="Enter vendor name"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="companyName">Company Name</Label>
                          <Input
                            id="companyName"
                            value={formData.companyName}
                            onChange={(e) =>
                              handleInputChange("companyName", e.target.value)
                            }
                            placeholder="Enter company name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gstin">GSTIN</Label>
                          <Input
                            id="gstin"
                            value={formData.gstin}
                            onChange={(e) =>
                              handleInputChange("gstin", e.target.value)
                            }
                            placeholder="Enter GST number"
                          />
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Contact Information
                        </h3>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              handleInputChange("phone", e.target.value)
                            }
                            placeholder="Enter phone number"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            placeholder="Enter email address"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Textarea
                            id="address"
                            value={formData.address}
                            onChange={(e) =>
                              handleInputChange("address", e.target.value)
                            }
                            placeholder="Enter address"
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Financial Information */}
                      {/* <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Financial Information
                        </h3>

                        <div className="space-y-2">
                          <Label htmlFor="openingBalance">
                            Opening Balance
                          </Label>
                          <Input
                            id="openingBalance"
                            type="number"
                            step="0.01"
                            value={formData.openingBalance}
                            onChange={(e) =>
                              handleInputChange(
                                "openingBalance",
                                e.target.value
                              )
                            }
                            placeholder="Enter opening balance"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="creditLimit">Credit Limit</Label>
                          <Input
                            id="creditLimit"
                            type="number"
                            step="0.01"
                            value={formData.creditLimit}
                            onChange={(e) =>
                              handleInputChange("creditLimit", e.target.value)
                            }
                            placeholder="Enter credit limit"
                          />
                        </div>
                      </div> */}
                    </div>

                    <div className="flex gap-4 pt-4 border-t">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {editingVendor ? "Update Vendor" : "Create Vendor"}
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Search Bar */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search vendors by name, company, GSTIN, phone, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSearchTerm("")}
                    disabled={!searchTerm}
                  >
                    Clear
                  </Button>
                </div>

                {/* Vendors Grid */}
                {filteredVendors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVendors.map((vendor) => (
                      <Link
                        href={`/super-admin/vendors/${vendor.id}/history`}
                        key={vendor.id}
                      >
                        <Card
                          key={vendor.id}
                          className="hover:shadow-lg transition-shadow"
                        >
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {vendor.name}
                                </h3>
                                {vendor.companyName && (
                                  <p className="text-sm text-gray-600">
                                    {vendor.companyName}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(vendor)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(vendor.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {vendor.gstin && (
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">
                                    GSTIN: {vendor.gstin}
                                  </span>
                                </div>
                              )}

                              {vendor.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">
                                    {vendor.phone}
                                  </span>
                                </div>
                              )}

                              {vendor.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600 truncate">
                                    {vendor.email}
                                  </span>
                                </div>
                              )}

                              {vendor.address && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-gray-600 line-clamp-2">
                                    {vendor.address}
                                  </span>
                                </div>
                              )}

                              {/* {(vendor.openingBalance !== undefined ||
                              vendor.creditLimit !== undefined) && (
                              <div className="pt-3 border-t">
                                <div className="grid grid-cols-2 gap-2">
                                  {vendor.openingBalance !== undefined && (
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500">
                                        Opening Balance
                                      </p>
                                      <p
                                        className={`text-sm font-medium ${
                                          vendor.openingBalance >= 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        ₹{vendor.openingBalance.toFixed(2)}
                                      </p>
                                    </div>
                                  )}
                                  {vendor.creditLimit !== undefined && (
                                    <div className="text-center">
                                      <p className="text-xs text-gray-500">
                                        Credit Limit
                                      </p>
                                      <p className="text-sm font-medium text-blue-600">
                                        ₹{vendor.creditLimit.toFixed(2)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )} */}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {searchTerm ? "No Vendors Found" : "No Vendors Added"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm
                        ? "Try adjusting your search terms."
                        : "Get started by adding your first vendor."}
                    </p>
                    <Button
                      onClick={() => setShowForm(true)}
                      className="bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Vendor
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Credit Notes Tab */}
          <TabsContent value="credit-notes">
            <VendorCreditNoteTab vendors={vendors} />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <VendorPaymentTab vendors={vendors} />
          </TabsContent>

          {/* Bills Tab */}
          <TabsContent value="bills">
            <VendorBillTab vendors={vendors} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Vendor Credit Note Tab Component
// Vendor Credit Note Tab Component
function VendorCreditNoteTab({ vendors }: { vendors: Vendor[] }) {
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]); // Add products state
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    vendorId: "",
    billNumber: "",
    reason: "",
    amount: "",
    taxAmount: "",
    notes: "",
    status: "DRAFT",
    productName: "", // Add productName field
    productId: "", // Add productId field
    quantity: "1", // Add quantity field
  });

  useEffect(() => {
    fetchCreditNotes();
    fetchProducts(); // Fetch products on component mount
  }, []);

  // Add fetchProducts function
  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCreditNotes = async () => {
    try {
      const response = await fetch("/api/vendor-credit-notes");
      if (response.ok) {
        const data = await response.json();
        setCreditNotes(data);
      }
    } catch (error) {
      console.error("Error fetching credit notes:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Function to handle product selection
  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find((p) => p.id === parseInt(productId));
    if (selectedProduct) {
      // Calculate amount based on product price and quantity
      const quantity = parseInt(formData.quantity) || 1;
      const amount = selectedProduct.price * quantity;
      setFormData((prev) => ({
        ...prev,
        productId,
        productName: `${selectedProduct.name} ${selectedProduct.size}`, // Store product name
        amount: amount.toString(),
      }));
    }
  };

  // Function to handle quantity change
  const handleQuantityChange = (quantity: string) => {
    const qty = parseInt(quantity) || 1;
    if (formData.productId) {
      const selectedProduct = products.find(
        (p) => p.id === parseInt(formData.productId)
      );
      if (selectedProduct) {
        const amount = selectedProduct.price * qty;
        setFormData((prev) => ({
          ...prev,
          quantity,
          amount: amount.toString(),
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        quantity,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vendorId || !formData.amount || !formData.reason) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Get next credit note number
      const counterResponse = await fetch("/api/vendor-credit-note-counter", {
        method: "POST",
      });

      if (!counterResponse.ok) {
        const errorData = await counterResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to generate credit note number"
        );
      }

      const counterData = await counterResponse.json();
      const creditNoteNumber = counterData.receiptNumber;

      // Create credit note with product info
      const response = await fetch("/api/vendor-credit-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId: parseInt(formData.vendorId),
          productId: formData.productId ? parseInt(formData.productId) : null, // Send productId
          productName: formData.productName || null, // Send productName
          quantity: formData.quantity ? parseInt(formData.quantity) : null, // Send quantity
          billNumber: formData.billNumber.trim() || null,
          reason: formData.reason,
          amount: parseFloat(formData.amount),
          taxAmount: parseFloat(formData.taxAmount || "0"),
          notes: formData.notes.trim() || null,
          status: formData.status,
          creditNoteNumber,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create credit note");
      }

      await fetchCreditNotes();
      resetForm();
      alert("Credit note created successfully!");
    } catch (error) {
      console.error("Error creating credit note:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create credit note"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCreditNote = async (creditNoteId: number) => {
    if (
      !confirm(
        "Are you sure you want to issue this credit note? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/vendor-credit-notes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: creditNoteId,
          status: "ISSUED",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to issue credit note");
      }

      // Refresh the credit notes list
      await fetchCreditNotes();
      alert("Credit note issued successfully!");
    } catch (error) {
      console.error("Error issuing credit note:", error);
      alert("Failed to issue credit note");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vendorId: "",
      billNumber: "",
      reason: "",
      amount: "",
      taxAmount: "",
      notes: "",
      status: "DRAFT",
      productName: "", // Reset productName
      productId: "", // Reset productId
      quantity: "1", // Reset quantity
    });
    setShowForm(false);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-800" },
      ISSUED: { label: "Issued", color: "bg-blue-100 text-blue-800" },
      APPLIED: { label: "Applied", color: "bg-green-100 text-green-800" },
      CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800" },
    };

    const { label, color } = config[status] || config.DRAFT;
    return (
      <Badge variant="secondary" className={color}>
        {label}
      </Badge>
    );
  };

  const handleViewCreditNote = (creditNote: any) => {
    // You can implement a modal or detailed view here
    const details = `
    Credit Note: ${creditNote.creditNoteNumber}
    Vendor: ${creditNote.vendor?.name}
    Reason: ${creditNote.reason}
    Amount: ₹${creditNote.amount.toFixed(2)}
    Tax: ₹${creditNote.taxAmount.toFixed(2)}
    Total: ₹${creditNote.totalAmount.toFixed(2)}
    Status: ${creditNote.status}
    Created: ${new Date(creditNote.issueDate).toLocaleDateString()}
    ${creditNote.notes ? `Notes: ${creditNote.notes}` : ""}
  `;

    alert(details);
  };

  const filteredNotes = creditNotes.filter(
    (note) =>
      note.creditNoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.billNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Vendor Credit Notes</h3>
          <p className="text-gray-600">Manage credit notes for vendors</p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Credit Note
          </Button>
        )}
      </div>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Create Vendor Credit Note</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendorId">Vendor *</Label>
                    <Select
                      value={formData.vendorId}
                      onValueChange={(value) =>
                        handleInputChange("vendorId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {vendors.map((vendor) => (
                          <SelectItem
                            key={vendor.id}
                            value={vendor.id.toString()}
                          >
                            {vendor.name}{" "}
                            {vendor.companyName && `(${vendor.companyName})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productId">Product (Optional)</Label>
                    <Select
                      value={formData.productId}
                      onValueChange={handleProductSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent className="bg-white max-h-60 overflow-y-auto">
                        {products.map((product) => (
                          <SelectItem
                            key={product.id}
                            value={product.id.toString()}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {product.name} {product.size}
                              </span>
                              <span className="text-xs text-gray-500">
                                Price: ₹{product.price} | Category:{" "}
                                {product.category}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.productId && (
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => handleQuantityChange(e.target.value)}
                        placeholder="Enter quantity"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="billNumber">Bill Number (Optional)</Label>
                    <Input
                      id="billNumber"
                      value={formData.billNumber}
                      onChange={(e) =>
                        handleInputChange("billNumber", e.target.value)
                      }
                      placeholder="Reference bill number"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason *</Label>
                    <Select
                      value={formData.reason}
                      onValueChange={(value) =>
                        handleInputChange("reason", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="RETURN">Return of Goods</SelectItem>
                        <SelectItem value="DISCOUNT">Discount</SelectItem>
                        <SelectItem value="ADJUSTMENT">
                          Price Adjustment
                        </SelectItem>
                        <SelectItem value="CANCELLATION">
                          Order Cancellation
                        </SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) =>
                        handleInputChange("amount", e.target.value)
                      }
                      placeholder="Enter amount"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxAmount">Tax Amount</Label>
                    <Input
                      id="taxAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.taxAmount}
                      onChange={(e) =>
                        handleInputChange("taxAmount", e.target.value)
                      }
                      placeholder="Enter tax amount"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleInputChange("status", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ISSUED">Issued</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Additional notes"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Create Credit Note
                    </>
                  )}
                </Button>

                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search credit notes by number, vendor, or bill..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setSearchTerm("")}
              disabled={!searchTerm}
            >
              Clear
            </Button>
          </div>

          {filteredNotes.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit Note No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product & Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNotes.map((note) => (
                    <tr key={note.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="font-mono">
                          {note.creditNoteNumber}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {note.vendor?.name}
                        </div>
                        {note.vendor?.companyName && (
                          <div className="text-sm text-gray-600">
                            {note.vendor.companyName}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {note.productName && (
                            <div className="text-sm font-medium">
                              {note.productName}
                              {note.quantity && ` (Qty: ${note.quantity})`}
                            </div>
                          )}
                          {note.billNumber && (
                            <div className="text-sm text-gray-600">
                              Bill: {note.billNumber}
                            </div>
                          )}
                          <div className="text-lg font-bold text-green-600">
                            ₹{note.totalAmount.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Base: ₹{note.amount.toFixed(2)}
                            {note.taxAmount > 0 && (
                              <span> + Tax: ₹{note.taxAmount.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div>{getStatusBadge(note.status)}</div>
                          <div className="text-sm text-gray-600">
                            Issued:{" "}
                            {new Date(note.issueDate).toLocaleDateString()}
                          </div>
                          {note.appliedToBill && (
                            <div className="text-sm text-green-600">
                              Applied to bill
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewCreditNote(note)}
                          >
                            View
                          </Button>
                          {note.status === "DRAFT" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                              onClick={() => handleIssueCreditNote(note.id)}
                              disabled={loading}
                            >
                              {loading ? "Processing..." : "Issue"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Credit Notes
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first vendor credit note for returns, discounts, or
                adjustments.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Credit Note
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Vendor Payment Tab Component
function VendorPaymentTab({ vendors }: { vendors: Vendor[] }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]); // Add products state
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    vendorId: "",
    amount: "",
    paymentMethod: "BANK_TRANSFER",
    transactionId: "",
    referenceNumber: "",
    paymentDate: new Date().toISOString().split("T")[0],
    billNumbers: "",
    status: "PAID",
    dueDate: "",
    notes: "",
    productId: "", // Add productId field
    productName: "", // Add productName field
    quantity: "1", // Add quantity field
  });

  useEffect(() => {
    fetchPayments();
    fetchProducts(); // Fetch products on component mount
  }, []);

  // Add fetchProducts function
  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/vendor-payments");
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Function to handle product selection
  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find((p) => p.id === parseInt(productId));
    if (selectedProduct) {
      // Calculate amount based on product price and quantity
      const quantity = parseInt(formData.quantity) || 1;
      const amount = selectedProduct.price * quantity;
      setFormData((prev) => ({
        ...prev,
        productId,
        productName: `${selectedProduct.name} ${selectedProduct.size}`, // Store product name
        amount: amount.toString(),
      }));
    }
  };

  // Function to handle quantity change
  const handleQuantityChange = (quantity: string) => {
    const qty = parseInt(quantity) || 1;
    if (formData.productId) {
      const selectedProduct = products.find(
        (p) => p.id === parseInt(formData.productId)
      );
      if (selectedProduct) {
        const amount = selectedProduct.price * qty;
        setFormData((prev) => ({
          ...prev,
          quantity,
          amount: amount.toString(),
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        quantity,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vendorId || !formData.amount) {
      alert("Please fill in required fields");
      return;
    }

    setLoading(true);

    try {
      // Get next payment reference
      const counterResponse = await fetch("/api/vendor-payment-counter", {
        method: "POST",
      });

      if (!counterResponse.ok) {
        const errorData = await counterResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to generate payment reference"
        );
      }

      const counterData = await counterResponse.json();
      const referenceNumber = counterData.receiptNumber;

      // Create payment with product info
      const response = await fetch("/api/vendor-payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId: parseInt(formData.vendorId),
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          transactionId: formData.transactionId.trim() || null,
          referenceNumber,
          paymentDate: formData.paymentDate || new Date(),
          billNumbers:
            formData.billNumbers
              .split(",")
              .map((b) => b.trim())
              .filter((b) => b) || [],
          status: formData.status,
          dueDate: formData.dueDate || null,
          notes: formData.notes.trim() || null,
          productId: formData.productId ? parseInt(formData.productId) : null, // Send productId
          productName: formData.productName || null, // Send productName
          quantity: formData.quantity ? parseInt(formData.quantity) : null, // Send quantity
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment");
      }

      await fetchPayments();
      resetForm();
      alert("Payment recorded successfully!");
    } catch (error) {
      console.error("Error creating payment:", error);
      alert(
        error instanceof Error ? error.message : "Failed to create payment"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vendorId: "",
      amount: "",
      paymentMethod: "BANK_TRANSFER",
      transactionId: "",
      referenceNumber: "",
      paymentDate: new Date().toISOString().split("T")[0],
      billNumbers: "",
      status: "PAID",
      dueDate: "",
      notes: "",
      productId: "", // Reset productId
      productName: "", // Reset productName
      quantity: "1", // Reset quantity
    });
    setShowForm(false);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      DUE: { label: "Due", color: "bg-yellow-100 text-yellow-800" },
      PAID: { label: "Paid", color: "bg-green-100 text-green-800" },
      OVERDUE: { label: "Overdue", color: "bg-red-100 text-red-800" },
      PARTIAL: { label: "Partial", color: "bg-blue-100 text-blue-800" },
    };

    const { label, color } = config[status] || config.DUE;
    return (
      <Badge variant="secondary" className={color}>
        {label}
      </Badge>
    );
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.referenceNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payment.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Vendor Payments</h3>
          <p className="text-gray-600">Record and manage payments to vendors</p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        )}
      </div>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Record Vendor Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendorId">Vendor *</Label>
                    <Select
                      value={formData.vendorId}
                      onValueChange={(value) =>
                        handleInputChange("vendorId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {vendors.map((vendor) => (
                          <SelectItem
                            key={vendor.id}
                            value={vendor.id.toString()}
                          >
                            {vendor.name}{" "}
                            {vendor.companyName && `(${vendor.companyName})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Product Selection Section */}
                  <div className="space-y-2">
                    <Label htmlFor="productId">Product (Optional)</Label>
                    <Select
                      value={formData.productId}
                      onValueChange={handleProductSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent className="bg-white max-h-60 overflow-y-auto">
                        {products.map((product) => (
                          <SelectItem
                            key={product.id}
                            value={product.id.toString()}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {product.name} {product.size}
                              </span>
                              <span className="text-xs text-gray-500">
                                Price: ₹{product.price} | Category:{" "}
                                {product.category}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.productId && (
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => handleQuantityChange(e.target.value)}
                        placeholder="Enter quantity"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) =>
                        handleInputChange("amount", e.target.value)
                      }
                      placeholder="Enter payment amount"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) =>
                        handleInputChange("paymentMethod", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="BANK_TRANSFER">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="CARD">Card</SelectItem>
                        <SelectItem value="CHEQUE">Cheque</SelectItem>
                        <SelectItem value="ONLINE">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Payment Date</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) =>
                        handleInputChange("paymentDate", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transactionId">Transaction ID</Label>
                    <Input
                      id="transactionId"
                      value={formData.transactionId}
                      onChange={(e) =>
                        handleInputChange("transactionId", e.target.value)
                      }
                      placeholder="Enter transaction ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billNumbers">
                      Bill Numbers (Comma separated)
                    </Label>
                    <Input
                      id="billNumbers"
                      value={formData.billNumbers}
                      onChange={(e) =>
                        handleInputChange("billNumbers", e.target.value)
                      }
                      placeholder="BILL-001, BILL-002"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleInputChange("status", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="DUE">Due</SelectItem>
                        <SelectItem value="PARTIAL">Partial</SelectItem>
                        <SelectItem value="OVERDUE">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date (if not paid)</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        handleInputChange("dueDate", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Payment notes or description"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Record Payment
                    </>
                  )}
                </Button>

                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search payments by reference, vendor, or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setSearchTerm("")}
              disabled={!searchTerm}
            >
              Clear
            </Button>
          </div>

          {filteredPayments.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product & Payment Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bills
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="font-mono">
                          {payment.referenceNumber}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {payment.vendor?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {payment.productName && (
                            <div className="text-sm font-medium">
                              {payment.productName}
                              {payment.quantity &&
                                ` (Qty: ${payment.quantity})`}
                            </div>
                          )}
                          <div className="text-lg font-bold text-green-600">
                            ₹{payment.amount.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {payment.paymentMethod.replace("_", " ")}
                          </div>
                          {payment.transactionId && (
                            <div className="text-sm text-gray-500">
                              TXN: {payment.transactionId}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div>{getStatusBadge(payment.status)}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {payment.billNumbers.length > 0 ? (
                          <div className="space-y-1">
                            {payment.billNumbers.map(
                              (bill: string, index: number) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="mr-1"
                                >
                                  {bill}
                                </Badge>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">No bills</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Payments Recorded
              </h3>
              <p className="text-gray-600 mb-4">
                Start recording payments made to your vendors.
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Record First Payment
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Vendor Bill Tab Component
// Vendor Bill Tab Component
function VendorBillTab({ vendors }: { vendors: Vendor[] }) {
  const [bills, setBills] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "BANK_TRANSFER",
    transactionId: "",
    notes: "",
  });

  const [formData, setFormData] = useState({
    vendorId: "",
    billDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    subtotal: "",
    taxAmount: "",
    totalAmount: "",
    paymentTerms: "",
    notes: "",
    itemsDescription: "",
  });

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await fetch("/api/vendor-bills");
      if (response.ok) {
        const data = await response.json();
        setBills(data);
      }
    } catch (error) {
      console.error("Error fetching bills:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vendorId || !formData.totalAmount) {
      alert("Please fill in required fields");
      return;
    }

    setLoading(true);

    try {
      // Get next bill number
      const counterResponse = await fetch("/api/bill-counter", {
        method: "POST",
      });

      if (!counterResponse.ok) {
        const errorData = await counterResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate bill number");
      }

      const counterData = await counterResponse.json();
      const billNumber = counterData.receiptNumber;

      const subtotal = parseFloat(formData.subtotal || formData.totalAmount);
      const taxAmount = parseFloat(formData.taxAmount || "0");
      const totalAmount = parseFloat(formData.totalAmount);

      // Create bill
      const response = await fetch("/api/vendor-bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId: parseInt(formData.vendorId),
          billNumber,
          billDate: formData.billDate,
          dueDate: formData.dueDate || formData.billDate,
          subtotal,
          taxAmount,
          totalAmount,
          amountPaid: 0,
          balanceDue: totalAmount,
          paymentTerms: formData.paymentTerms.trim() || null,
          notes: formData.notes.trim() || null,
          itemsDescription: formData.itemsDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create bill");
      }

      await fetchBills();
      resetForm();
      alert("Bill created successfully!");
    } catch (error) {
      console.error("Error creating bill:", error);
      alert(error instanceof Error ? error.message : "Failed to create bill");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      vendorId: "",
      billDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      subtotal: "",
      taxAmount: "",
      totalAmount: "",
      paymentTerms: "",
      notes: "",
      itemsDescription: "",
    });
    setShowForm(false);
  };

  // ==================== handlePayBill FUNCTION ====================
  const handlePayBill = (bill: any) => {
    setSelectedBill(bill);
    setPaymentForm({
      amount: bill.balanceDue.toString(),
      paymentMethod: "BANK_TRANSFER",
      transactionId: "",
      notes: `Payment for bill ${bill.billNumber}`,
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBill || !paymentForm.amount) {
      alert("Please enter payment amount");
      return;
    }

    const paymentAmount = parseFloat(paymentForm.amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    if (paymentAmount > selectedBill.balanceDue) {
      alert(
        `Payment amount cannot exceed balance due of ₹${selectedBill.balanceDue.toFixed(
          2
        )}`
      );
      return;
    }

    if (
      !confirm(
        `Confirm payment of ₹${paymentAmount.toFixed(2)} for bill ${
          selectedBill.billNumber
        }?`
      )
    ) {
      return;
    }

    try {
      // Update bill payment - Send id in request body
      const billResponse = await fetch(`/api/vendor-bills`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedBill.id, // Send ID in body
          amountPaid: selectedBill.amountPaid + paymentAmount,
          balanceDue: selectedBill.balanceDue - paymentAmount,
          status:
            paymentAmount >= selectedBill.balanceDue
              ? "PAID"
              : selectedBill.amountPaid + paymentAmount > 0
              ? "PARTIAL"
              : "PENDING",
        }),
      });

      if (!billResponse.ok) {
        const errorData = await billResponse.json();
        throw new Error(errorData.error || "Failed to update bill payment");
      }

      // Get next payment reference
      const counterResponse = await fetch("/api/vendor-payment-counter", {
        method: "POST",
      });

      if (!counterResponse.ok) {
        throw new Error("Failed to generate payment reference");
      }

      const counterData = await counterResponse.json();
      const referenceNumber = counterData.receiptNumber;

      // Create payment record
      const paymentResponse = await fetch("/api/vendor-payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId: selectedBill.vendorId,
          amount: paymentAmount,
          billNumbers: [selectedBill.billNumber],
          paymentMethod: paymentForm.paymentMethod,
          transactionId: paymentForm.transactionId.trim() || null,
          referenceNumber,
          paymentDate: new Date().toISOString(),
          status: "PAID",
          notes:
            paymentForm.notes.trim() ||
            `Payment for bill ${selectedBill.billNumber}`,
        }),
      });

      if (!paymentResponse.ok) {
        console.warn("Payment recorded but payment entry not created");
      }

      await fetchBills();
      setShowPaymentModal(false);
      alert("Payment recorded successfully!");
    } catch (error) {
      console.error("Error processing payment:", error);
      alert(
        error instanceof Error ? error.message : "Failed to process payment"
      );
    }
  };

  // ==================== handleApplyCredit FUNCTION ====================
  const handleApplyCredit = async (bill: any) => {
    if (!bill) return;

    try {
      // Get available credit notes for this vendor
      const response = await fetch(
        `/api/vendor-credit-notes?vendorId=${bill.vendorId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch credit notes");
      }

      const availableCreditNotes = await response.json();

      // Filter for notes that are not already applied
      const unappliedNotes = availableCreditNotes.filter(
        (note: any) => !note.appliedToBill && !note.appliedBillId
      );

      if (unappliedNotes.length === 0) {
        alert("No available unapplied credit notes for this vendor");
        return;
      }

      // Display available credit notes with their amounts
      let creditNotesHtml = `<div style="max-height: 300px; overflow-y: auto;">
      <h3 style="margin-top: 0; margin-bottom: 10px;">Available Credit Notes:</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Credit Note</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Amount (₹)</th>
            <th style="padding: 8px; text-align: left; border: 1px solid #d1d5db;">Apply Amount (₹)</th>
          </tr>
        </thead>
        <tbody>`;

      unappliedNotes.forEach((note: any, index: number) => {
        creditNotesHtml += `
        <tr>
          <td style="padding: 8px; border: 1px solid #d1d5db;">${
            note.creditNoteNumber
          }</td>
          <td style="padding: 8px; border: 1px solid #d1d5db;">${note.amount.toFixed(
            2
          )}</td>
          <td style="padding: 8px; border: 1px solid #d1d5db;">
            <input 
              type="number" 
              id="credit-note-${index}" 
              min="0" 
              max="${note.amount}" 
              step="0.01" 
              value="${note.amount}" 
              style="width: 100%; padding: 4px; border: 1px solid #d1d5db; border-radius: 4px;"
            />
          </td>
        </tr>`;
      });

      creditNotesHtml += `
        </tbody>
      </table>
      <div style="margin-top: 10px; font-weight: bold;">
        Bill Balance: ₹${bill.balanceDue.toFixed(2)}
      </div>
    </div>`;

      // Create a modal for credit note selection
      const modal = document.createElement("div");
      modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;

      const modalContent = document.createElement("div");
      modalContent.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    `;

      modalContent.innerHTML = `
      <h2 style="margin-top: 0;">Apply Credit Notes to Bill ${bill.billNumber}</h2>
      ${creditNotesHtml}
      <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cancel-btn" style="padding: 8px 16px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer;">
          Cancel
        </button>
        <button id="apply-btn" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Apply Credit
        </button>
      </div>
    `;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      return new Promise<void>((resolve) => {
        const cancelBtn = document.getElementById("cancel-btn");
        const applyBtn = document.getElementById("apply-btn");

        const cleanup = () => {
          modal.remove();
          resolve();
        };

        cancelBtn?.addEventListener("click", cleanup);

        applyBtn?.addEventListener("click", async () => {
          try {
            // Collect the amounts to apply for each credit note
            const creditApplications: Array<{
              note: any;
              applyAmount: number;
            }> = [];

            let totalToApply = 0;

            unappliedNotes.forEach((note: any, index: number) => {
              const input = document.getElementById(
                `credit-note-${index}`
              ) as HTMLInputElement;
              const applyAmount = parseFloat(input.value) || 0;

              if (applyAmount > 0 && applyAmount <= note.amount) {
                creditApplications.push({
                  note,
                  applyAmount,
                });
                totalToApply += applyAmount;
              }
            });

            if (creditApplications.length === 0) {
              alert("Please enter valid amounts to apply");
              return;
            }

            if (totalToApply > bill.balanceDue) {
              alert(
                `Total amount to apply (₹${totalToApply.toFixed(
                  2
                )}) cannot exceed bill balance (₹${bill.balanceDue.toFixed(2)})`
              );
              return;
            }

            const confirmApply = confirm(
              `Apply ₹${totalToApply.toFixed(2)} in credit to bill ${
                bill.billNumber
              }?\n` +
                `Current balance: ₹${bill.balanceDue.toFixed(2)}\n` +
                `New balance: ₹${(bill.balanceDue - totalToApply).toFixed(2)}`
            );

            if (!confirmApply) {
              return;
            }

            setLoading(true);

            // Process each credit note application
            for (const { note, applyAmount } of creditApplications) {
              if (applyAmount === note.amount) {
                // Apply full credit note
                await fetch(`/api/vendor-credit-notes`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    id: note.id,
                    status: "APPLIED",
                    appliedToBill: bill.billNumber,
                    appliedBillId: bill.id,
                  }),
                });
              } else {
                // Apply partial credit - create a new partial application record
                // First, reduce the original credit note amount
                const remainingAmount = note.amount - applyAmount;

                // Update the original credit note to reflect partial application
                await fetch(`/api/vendor-credit-notes`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    id: note.id,
                    amount: remainingAmount,
                    totalAmount: remainingAmount + (note.taxAmount || 0),
                    notes: `${
                      note.notes || ""
                    }\nPartially applied: ₹${applyAmount.toFixed(2)} to bill ${
                      bill.billNumber
                    }`.trim(),
                    partialAppliedAmount: applyAmount,
                    partialAppliedToBill: bill.billNumber,
                  }),
                });

                // Create a new applied credit note record for the partial amount
                await fetch(`/api/vendor-credit-notes`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    vendorId: note.vendorId,
                    creditNoteNumber: `${note.creditNoteNumber}-PARTIAL`,
                    reason: `Partial application from ${note.creditNoteNumber}`,
                    amount: applyAmount,
                    taxAmount: 0,
                    totalAmount: applyAmount,
                    status: "APPLIED",
                    appliedToBill: bill.billNumber,
                    appliedBillId: bill.id,
                    notes: `Partial application (₹${applyAmount.toFixed(
                      2
                    )}) from credit note ${note.creditNoteNumber}`,
                    originalCreditNoteId: note.id,
                  }),
                });
              }
            }

            // Update bill balance
            const newBalance = bill.balanceDue - totalToApply;
            const newAmountPaid = bill.amountPaid + totalToApply;

            const billResponse = await fetch(`/api/vendor-bills`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: bill.id,
                balanceDue: newBalance,
                amountPaid: newAmountPaid,
                status:
                  newBalance === 0
                    ? "PAID"
                    : newAmountPaid > 0
                    ? "PARTIAL"
                    : "PENDING",
              }),
            });

            if (!billResponse.ok) {
              const errorData = await billResponse.json();
              throw new Error(
                errorData.error || "Failed to update bill with credit"
              );
            }

            await fetchBills();
            cleanup();

            if (totalToApply > bill.balanceDue) {
              alert(
                `Credit applied successfully! ₹${bill.balanceDue.toFixed(
                  2
                )} used, ₹${(totalToApply - bill.balanceDue).toFixed(
                  2
                )} credit remains available.`
              );
            } else {
              alert(
                `Credit notes applied successfully! ₹${totalToApply.toFixed(
                  2
                )} applied to bill.`
              );
            }
          } catch (error) {
            console.error("Error applying credit:", error);
            alert("Failed to apply credit notes");
          } finally {
            setLoading(false);
          }
        });
      });
    } catch (error) {
      console.error("Error applying credit:", error);
      alert("Failed to apply credit notes");
    }
  };

  // ==================== handleViewBill FUNCTION ====================
  const handleViewBill = (bill: any) => {
    // You can implement a detailed view modal or PDF generation here
    alert(
      `Viewing bill: ${bill.billNumber}\nVendor: ${
        bill.vendor?.name
      }\nTotal: ₹${bill.totalAmount.toFixed(
        2
      )}\nDue: ₹${bill.balanceDue.toFixed(2)}`
    );
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-800" },
      PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
      PARTIAL: { label: "Partial", color: "bg-blue-100 text-blue-800" },
      PAID: { label: "Paid", color: "bg-green-100 text-green-800" },
      OVERDUE: { label: "Overdue", color: "bg-red-100 text-red-800" },
      CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800" },
    };

    const { label, color } = config[status] || config.DRAFT;
    return (
      <Badge variant="secondary" className={color}>
        {label}
      </Badge>
    );
  };

  const filteredBills = bills.filter(
    (bill) =>
      bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.paymentTerms?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Vendor Bills</h3>
          <p className="text-gray-600">Manage vendor bills and invoices</p>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Bill
          </Button>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Make Payment</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPaymentModal(false)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Bill: {selectedBill.billNumber}
                </p>
                <p className="text-sm text-gray-600">
                  Vendor: {selectedBill.vendor?.name}
                </p>
                <p className="text-lg font-bold text-red-600">
                  Balance Due: ₹{selectedBill.balanceDue.toFixed(2)}
                </p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentAmount">Payment Amount *</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedBill.balanceDue}
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, amount: e.target.value })
                    }
                    placeholder="Enter payment amount"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Maximum: ₹{selectedBill.balanceDue.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={paymentForm.paymentMethod}
                    onValueChange={(value) =>
                      setPaymentForm({ ...paymentForm, paymentMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BANK_TRANSFER">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transactionId">
                    Transaction ID (Optional)
                  </Label>
                  <Input
                    id="transactionId"
                    value={paymentForm.transactionId}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        transactionId: e.target.value,
                      })
                    }
                    placeholder="Enter transaction ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentNotes">Notes</Label>
                  <Textarea
                    id="paymentNotes"
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, notes: e.target.value })
                    }
                    placeholder="Payment notes"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Confirm Payment
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Create Vendor Bill</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendorId">Vendor *</Label>
                    <Select
                      value={formData.vendorId}
                      onValueChange={(value) =>
                        handleInputChange("vendorId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {vendors.map((vendor) => (
                          <SelectItem
                            key={vendor.id}
                            value={vendor.id.toString()}
                          >
                            {vendor.name}{" "}
                            {vendor.companyName && `(${vendor.companyName})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billDate">Bill Date</Label>
                    <Input
                      id="billDate"
                      type="date"
                      value={formData.billDate}
                      onChange={(e) =>
                        handleInputChange("billDate", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        handleInputChange("dueDate", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <Input
                      id="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={(e) =>
                        handleInputChange("paymentTerms", e.target.value)
                      }
                      placeholder="Net 30, Immediate, etc."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subtotal">Subtotal</Label>
                    <Input
                      id="subtotal"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.subtotal}
                      onChange={(e) =>
                        handleInputChange("subtotal", e.target.value)
                      }
                      placeholder="Enter subtotal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxAmount">Tax Amount</Label>
                    <Input
                      id="taxAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.taxAmount}
                      onChange={(e) =>
                        handleInputChange("taxAmount", e.target.value)
                      }
                      placeholder="Enter tax amount"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">Total Amount *</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.totalAmount}
                      onChange={(e) =>
                        handleInputChange("totalAmount", e.target.value)
                      }
                      placeholder="Enter total amount"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="itemsDescription">
                    Items/Services Description
                  </Label>
                  <Textarea
                    id="itemsDescription"
                    value={formData.itemsDescription}
                    onChange={(e) =>
                      handleInputChange("itemsDescription", e.target.value)
                    }
                    placeholder="Describe the goods or services"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Additional notes"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Create Bill
                    </>
                  )}
                </Button>

                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search bills by number, vendor, or terms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setSearchTerm("")}
              disabled={!searchTerm}
            >
              Clear
            </Button>
          </div>

          {filteredBills.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bill No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor & Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="font-mono">
                          {bill.billNumber}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {bill.vendor?.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            Date: {new Date(bill.billDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            Due: {new Date(bill.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-black">
                            ₹{bill.totalAmount.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Subtotal: ₹{bill.subtotal.toFixed(2)}
                            {bill.taxAmount > 0 && (
                              <span> + Tax: ₹{bill.taxAmount.toFixed(2)}</span>
                            )}
                          </div>
                          {bill.appliedCreditNotes &&
                            bill.appliedCreditNotes.length > 0 && (
                              <div className="text-sm text-green-600">
                                - Credit: ₹
                                {bill.appliedCreditNotes
                                  .reduce(
                                    (sum: number, note: any) =>
                                      sum + note.amount,
                                    0
                                  )
                                  .toFixed(2)}
                              </div>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div>{getStatusBadge(bill.status)}</div>
                          <div className="text-sm text-gray-600">
                            Paid: ₹{bill.amountPaid.toFixed(2)}
                          </div>
                          <div className="text-sm font-medium text-red-600">
                            Due: ₹{bill.balanceDue.toFixed(2)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewBill(bill)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600"
                            onClick={() => handlePayBill(bill)}
                            disabled={
                              bill.balanceDue <= 0 || bill.status === "PAID"
                            }
                          >
                            Pay
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600"
                            onClick={() => handleApplyCredit(bill)}
                            disabled={
                              bill.balanceDue <= 0 || bill.status === "PAID"
                            }
                            title="Apply credit notes to this bill"
                          >
                            Apply Credit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Bills Created
              </h3>
              <p className="text-gray-600 mb-4">
                Create bills for vendor invoices and track payments.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Bill
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
