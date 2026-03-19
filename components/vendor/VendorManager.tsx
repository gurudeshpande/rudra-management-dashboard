"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  FileText,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Save,
  Ban,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface Vendor {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  companyName?: string | null;
  gstin?: string | null;
  address?: string | null;
  openingBalance?: number | null;
  creditLimit?: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function VendorManager() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sorting state
  const [sortField, setSortField] = useState<keyof Vendor>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    companyName: "",
    gstin: "",
    address: "",
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete vendor");
      }

      await fetchVendors();
      alert("Vendor deleted successfully!");
    } catch (error) {
      console.error("Error deleting vendor:", error);
      alert(error instanceof Error ? error.message : "Failed to delete vendor");
    }
  };

  // Sorting function
  const handleSort = (field: keyof Vendor) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort vendors
  const filteredVendors = vendors
    .filter(
      (vendor) =>
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.phone?.includes(searchTerm) ||
        vendor.gstin?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      const aValue = a[sortField] ?? "";
      const bValue = b[sortField] ?? "";

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVendors = filteredVendors.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);

  const getSortIcon = (field: keyof Vendor) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Vendor Management</h2>
            <p className="text-gray-600">
              Create, view, update, and delete vendors
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

        {/* Vendors Section */}
        <div className="space-y-6">
          {showForm ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {editingVendor ? "Edit Vendor" : "Add New Vendor"}
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                            Field
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Basic Information Section */}
                        <tr className="bg-gray-50/50">
                          <td colSpan={2} className="px-4 py-2">
                            <span className="text-sm font-semibold text-gray-700">
                              Basic Information
                            </span>
                          </td>
                        </tr>

                        {/* Name */}
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50/30">
                            Vendor Name <span className="text-red-500">*</span>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={formData.name}
                              onChange={(e) =>
                                handleInputChange("name", e.target.value)
                              }
                              placeholder="Enter vendor name"
                              required
                              className="w-full"
                            />
                          </td>
                        </tr>

                        {/* Company Name */}
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50/30">
                            Company Name
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={formData.companyName}
                              onChange={(e) =>
                                handleInputChange("companyName", e.target.value)
                              }
                              placeholder="Enter company name"
                              className="w-full"
                            />
                          </td>
                        </tr>

                        {/* GSTIN */}
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50/30">
                            GSTIN
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={formData.gstin}
                              onChange={(e) =>
                                handleInputChange("gstin", e.target.value)
                              }
                              placeholder="Enter GST number"
                              className="w-full"
                            />
                          </td>
                        </tr>

                        {/* Contact Information Section */}
                        <tr className="bg-gray-50/50">
                          <td colSpan={2} className="px-4 py-2">
                            <span className="text-sm font-semibold text-gray-700">
                              Contact Information
                            </span>
                          </td>
                        </tr>

                        {/* Phone */}
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50/30">
                            Phone Number
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) =>
                                handleInputChange("phone", e.target.value)
                              }
                              placeholder="Enter phone number"
                              className="w-full"
                            />
                          </td>
                        </tr>

                        {/* Email */}
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50/30">
                            Email Address
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="email"
                              value={formData.email}
                              onChange={(e) =>
                                handleInputChange("email", e.target.value)
                              }
                              placeholder="Enter email address"
                              className="w-full"
                            />
                          </td>
                        </tr>

                        {/* Address */}
                        <tr>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50/30">
                            Address
                          </td>
                          <td className="px-4 py-3">
                            <Textarea
                              value={formData.address}
                              onChange={(e) =>
                                handleInputChange("address", e.target.value)
                              }
                              placeholder="Enter address"
                              rows={3}
                              className="w-full"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {editingVendor ? "Update Vendor" : "Create Vendor"}
                        </>
                      )}
                    </Button>

                    <Button type="button" variant="outline" onClick={resetForm}>
                      <Ban className="h-4 w-4 mr-2" />
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

              {/* Vendors Table */}
              {filteredVendors.length > 0 ? (
                <div className="border rounded-lg overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("name")}
                          >
                            <div className="flex items-center">
                              Vendor Name
                              {getSortIcon("name")}
                            </div>
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("companyName")}
                          >
                            <div className="flex items-center">
                              Company
                              {getSortIcon("companyName")}
                            </div>
                          </th>
                          <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("gstin")}
                          >
                            <div className="flex items-center">
                              GSTIN
                              {getSortIcon("gstin")}
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Address
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentVendors.map((vendor) => (
                          <tr key={vendor.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {vendor.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {vendor.companyName || "-"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {vendor.gstin ? (
                                <Badge variant="outline" className="font-mono">
                                  {vendor.gstin}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                {vendor.phone && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                                    {vendor.phone}
                                  </div>
                                )}
                                {vendor.email && (
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="truncate max-w-[150px]">
                                      {vendor.email}
                                    </span>
                                  </div>
                                )}
                                {!vendor.phone && !vendor.email && (
                                  <span className="text-gray-400 text-sm">
                                    -
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {vendor.address ? (
                                <div className="flex items-start text-sm text-gray-600 max-w-[200px]">
                                  <MapPin className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                                  <span className="line-clamp-2">
                                    {vendor.address}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(vendor)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                      <div className="text-sm text-gray-600">
                        Showing {indexOfFirstItem + 1} to{" "}
                        {Math.min(indexOfLastItem, filteredVendors.length)} of{" "}
                        {filteredVendors.length} vendors
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="flex items-center px-4 text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg bg-white">
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
        </div>
      </div>
    </DashboardLayout>
  );
}
