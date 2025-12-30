"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  TrendingUp,
  Users,
  Package,
  FileText,
  IndianRupee,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "react-hot-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";

// Types for analytics data based on your schema
interface AnalyticsData {
  quarterlyRevenue: QuarterlyData[];
  topProducts: ProductData[];
  topCustomers: CustomerData[];
  annualIncome: AnnualData[];
  quarterlyInvoices: QuarterlyInvoiceData[];
  summary: SummaryData;
}

interface QuarterlyData {
  quarter: string;
  revenue: number;
  invoices: number;
}

interface ProductData {
  product: string;
  quantity: number;
  revenue: number;
  [key: string]: string | number;
}

interface CustomerData {
  customer: string;
  totalSpent: number;
  invoiceCount: number;
}

interface AnnualData {
  year: number;
  revenue: number;
  growth: number;
}

interface QuarterlyInvoiceData {
  quarter: string;
  paid: number;
  advance: number;
  unpaid: number;
}

interface SummaryData {
  totalRevenue: number;
  totalInvoices: number;
  averageOrderValue: number;
  growthRate: number;
}

const InvoiceAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<string>("current_year");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Customer-specific filters
  const [customerCountFilter, setCustomerCountFilter] = useState<string>("5");
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>(""); // Separate state for input

  // Theme colors
  const themeColors = {
    primary: "#954C2E",
    secondary: "#F5E9E4",
    chart: ["#954C2E", "#D4A76A", "#8B7355", "#4A2C2A", "#BF8B67", "#7D5D3B"],
  };

  // Your actual product categories
  const productCategories = [
    "All",
    "Mavala",
    "Maharaj",
    "Shastra (Weapons)",
    "Miniature Weapons",
    "Miniatures",
    "Spiritual Statues",
    "Car Dashboard",
    "Frame Collection",
    "Shilekhana (Weapon Vault)",
    "Symbolic & Cultural Artefacts",
    "Sanch",
    "Keychains",
    "Jewellery",
    "Historical Legends",
    "Badges",
    "Taxidermy",
  ];

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        timeFilter,
        category: categoryFilter,
        customerLimit: customerCountFilter,
        customerSearch: customerSearchTerm,
      });

      console.log("API Call with params:", {
        timeFilter,
        categoryFilter,
        customerCountFilter,
        customerSearchTerm,
      });

      const response = await fetch(
        `/api/analytics/invoices?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [timeFilter, categoryFilter, customerCountFilter, customerSearchTerm]);

  // Effect for all filters except search (immediate execution)
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeFilter, categoryFilter, customerCountFilter, fetchAnalyticsData]);

  // Effect for search term with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCustomerSearchTerm(searchInput);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // Handle count filter change
  const handleCountFilterChange = (value: string) => {
    setCustomerCountFilter(value);
  };

  // Enhanced customer filtering logic
  const getFilteredCustomers = () => {
    if (
      !analyticsData?.topCustomers ||
      !Array.isArray(analyticsData.topCustomers)
    ) {
      return [];
    }

    // The API now handles the main filtering, so we just return all customers from API
    return analyticsData.topCustomers;
  };

  const filteredCustomers = getFilteredCustomers();

  // Loading skeleton
  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Invoice Analytics
              </h1>
              <p className="text-gray-600">
                Detailed insights into your invoice data
              </p>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[120px] mb-2" />
                  <Skeleton className="h-3 w-[80px]" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analyticsData) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Invoice Analytics
              </h1>
              <p className="text-gray-600">
                Detailed insights into your invoice data
              </p>
            </div>
            <Button onClick={fetchAnalyticsData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
          <Card>
            <CardContent className="py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No data available
              </h3>
              <p className="text-gray-500 mb-4">
                Unable to load analytics data. Please try again.
              </p>
              <Button onClick={fetchAnalyticsData}>Retry Loading Data</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Invoice Analytics
            </h1>
            <p className="text-gray-600">
              Detailed insights into your invoice data
            </p>
          </div>
          <Button
            onClick={fetchAnalyticsData}
            variant="outline"
            className="mt-4 md:mt-0"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Time Period
              </label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto bg-white">
                  <SelectItem value="current_quarter">
                    Current Quarter
                  </SelectItem>
                  <SelectItem value="current_year">Current Year</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Product Category
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto bg-white">
                  {productCategories.map((category) => (
                    <SelectItem
                      key={category}
                      value={category.toLowerCase().replace(/\s+/g, "_")}
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analyticsData.summary.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.summary.growthRate >= 0 ? (
                  <span className="text-green-600">
                    +{analyticsData.summary.growthRate}%
                  </span>
                ) : (
                  <span className="text-red-600">
                    {analyticsData.summary.growthRate}%
                  </span>
                )}{" "}
                from previous period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Invoices
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.summary.totalInvoices}
              </div>
              <p className="text-xs text-muted-foreground">
                Average:{" "}
                {formatCurrency(analyticsData.summary.averageOrderValue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Order Value
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analyticsData.summary.averageOrderValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across {analyticsData.summary.totalInvoices} invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top Customer
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.topCustomers[0]
                  ? formatCurrency(analyticsData.topCustomers[0].totalSpent)
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {analyticsData.topCustomers[0]?.customer || "No data"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quarterly Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Quarterly Revenue & Invoices</CardTitle>
              <CardDescription>
                Revenue and invoice count by quarter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.quarterlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value: any, name: string | undefined) => {
                      if (name === "Revenue") {
                        return [formatCurrency(Number(value)), "Revenue"];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Quarter: ${label}`}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    fill={themeColors.primary}
                    name="Revenue"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="invoices"
                    stroke="#ff7300"
                    name="Invoices"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>By revenue generated</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.topProducts.slice(0, 6)} // Show top 6 products
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ payload }): string =>
                      `${payload?.product}: ${formatCurrency(
                        Number(payload?.revenue)
                      )}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {analyticsData.topProducts
                      .slice(0, 6)
                      .map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            themeColors.chart[index % themeColors.chart.length]
                          }
                        />
                      ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [
                      formatCurrency(Number(value)),
                      "Revenue",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Annual Income Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Annual Income Trend</CardTitle>
              <CardDescription>Revenue growth over years</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.annualIncome}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(value) => formatCurrency(value)}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: any, name: string | undefined) => {
                      if (name === "Revenue") {
                        return [formatCurrency(Number(value)), "Revenue"];
                      }
                      if (name === "growth") {
                        return [`${Number(value).toFixed(1)}%`, "Growth Rate"];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Year: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={themeColors.primary}
                    fill={themeColors.secondary}
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quarterly Invoices Status */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Status by Quarter</CardTitle>
              <CardDescription>
                Paid, Advance, and Unpaid invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.quarterlyInvoices}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="paid" fill="#10b981" name="Paid" />
                  <Bar dataKey="advance" fill="#f59e0b" name="Advance" />
                  <Bar dataKey="unpaid" fill="#ef4444" name="Unpaid" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Customers Card with Filters */}
          <Card className="lg:col-span-2 mt-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Top Customers</CardTitle>
                  <CardDescription>By total spending</CardDescription>
                </div>

                {/* Customer Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Filter */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="Search customers..."
                      className="pl-8 w-full sm:w-48"
                      value={searchInput} // Use searchInput instead of customerSearchTerm
                      onChange={handleSearchChange} // Use the new handler
                    />
                  </div>

                  {/* Count Filter */}
                  <Select
                    value={customerCountFilter}
                    onValueChange={handleCountFilterChange} // Use the new handler
                  >
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Show" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto bg-white">
                      <SelectItem value="5">Top 5</SelectItem>
                      <SelectItem value="10">Top 10</SelectItem>
                      <SelectItem value="25">Top 25</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Results Count */}
              <div className="mb-4 text-sm text-gray-600">
                Showing {filteredCustomers.length} customer
                {filteredCustomers.length !== 1 ? "s" : ""}
                {customerSearchTerm && ` matching "${customerSearchTerm}"`}
              </div>

              {/* Customers List */}
              <div className="space-y-4">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer, index) => (
                    <div
                      key={customer.customer}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <Badge
                          variant="secondary"
                          className="h-8 w-8 flex-shrink-0 flex items-center justify-center"
                        >
                          {index + 1}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">
                            {customer.customer}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {customer.invoiceCount} invoice
                            {customer.invoiceCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="font-bold text-lg">
                          {formatCurrency(customer.totalSpent)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Avg:{" "}
                          {formatCurrency(
                            customer.totalSpent / customer.invoiceCount
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No customers found
                    </h3>
                    <p className="text-gray-500">
                      {customerSearchTerm
                        ? `No customers match "${customerSearchTerm}"`
                        : "No customer data available for the selected period"}
                    </p>
                    {customerSearchTerm && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setCustomerSearchTerm("")}
                      >
                        Clear Search
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Total Summary */}
              {filteredCustomers.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">
                        Total from displayed customers
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {filteredCustomers.length} customer
                        {filteredCustomers.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl">
                        {formatCurrency(
                          filteredCustomers.reduce(
                            (sum, customer) => sum + customer.totalSpent,
                            0
                          )
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {filteredCustomers.reduce(
                          (sum, customer) => sum + customer.invoiceCount,
                          0
                        )}{" "}
                        total invoices
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceAnalytics;
