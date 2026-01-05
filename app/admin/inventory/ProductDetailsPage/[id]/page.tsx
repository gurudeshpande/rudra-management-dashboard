"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Prisma } from "@prisma/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Tag,
  DollarSign,
  BarChart3,
} from "lucide-react";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    items: true;
  };
}>;

const ProductDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const themeColor = "#954C2E";
  const themeLight = "#F5E9E4";

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${params.id}`);

        if (!response.ok) {
          throw new Error("Product not found");
        }

        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError("Failed to load product details");
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateProfit = () => {
    if (!product) return { amount: 0, percentage: 0 };
    const profit = product.price - (product.costPrice || 0);
    const percentage = product.costPrice
      ? (profit / product.costPrice) * 100
      : 0;
    return { amount: profit, percentage };
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0)
      return { status: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (quantity <= 10)
      return { status: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { status: "In Stock", color: "bg-green-100 text-green-800" };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex justify-center items-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: themeColor }}
            ></motion.div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !product) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {error || "Product not found"}
              </h3>
              <Button
                onClick={() =>
                  router.push("/super-admin/inventory/inventory-management")
                }
              >
                Back to Products
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const profit = calculateProfit();
  const stockStatus = getStockStatus(product.quantity || 0);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() =>
                  router.push("/super-admin/inventory/inventory-management")
                }
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {product.name}
                </h1>
                <p className="text-gray-600">Product ID: {product.id}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              {/* <Button
                variant="outline"
                onClick={() =>
                  router.push(`/dashboard/products/edit/${product.id}`)
                }
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button> */}
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Product Name
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {product.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Size
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {product.size || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Category
                      </label>
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-sm">
                          {product.category}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Stock Status
                      </label>
                      <div className="mt-1">
                        <Badge className={stockStatus.color}>
                          {stockStatus.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pricing Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Pricing Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                      className="text-center p-4 rounded-lg border-2"
                      style={{ borderColor: themeLight }}
                    >
                      <label className="text-sm font-medium text-gray-600">
                        Cost Price
                      </label>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {formatCurrency(product.costPrice || 0)}
                      </p>
                    </div>
                    <div
                      className="text-center p-4 rounded-lg border-2"
                      style={{ borderColor: themeLight }}
                    >
                      <label className="text-sm font-medium text-gray-600">
                        Selling Price
                      </label>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                    <div
                      className={`text-center p-4 rounded-lg border-2 ${
                        profit.amount >= 0
                          ? "border-green-200"
                          : "border-red-200"
                      }`}
                    >
                      <label className="text-sm font-medium text-gray-600">
                        Profit
                      </label>
                      <p
                        className={`text-2xl font-bold mt-2 ${
                          profit.amount >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(profit.amount)}
                      </p>
                      <p
                        className={`text-sm ${
                          profit.amount >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        ({profit.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Inventory Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Inventory Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center p-6 rounded-lg bg-gray-50">
                      <label className="text-sm font-medium text-gray-600">
                        Current Quantity
                      </label>
                      <p
                        className="text-4xl font-bold mt-2"
                        style={{ color: themeColor }}
                      >
                        {product.quantity || 0}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        units in stock
                      </p>
                    </div>
                    <div className="text-center p-6 rounded-lg bg-gray-50">
                      <label className="text-sm font-medium text-gray-600">
                        Total Value
                      </label>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {formatCurrency(
                          (product.quantity || 0) * (product.costPrice || 0)
                        )}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        at cost price
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            {/* <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Add Stock
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Tag className="w-4 h-4 mr-2" />
                    Update Price
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Details
                  </Button>
                </CardContent>
              </Card>
            </motion.div> */}

            {/* Product Statistics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Product Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-medium">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm font-medium">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {/* <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Items Count</span>
                    <span className="text-sm font-medium">
                      {product.items?.length || 0}
                    </span>
                  </div> */}
                </CardContent>
              </Card>
            </motion.div>

            {/* Category Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant="secondary"
                    className="text-base px-3 py-2 w-full justify-center"
                    style={{ backgroundColor: themeLight }}
                  >
                    {product.category}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProductDetailsPage;
