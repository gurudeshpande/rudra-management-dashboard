"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "react-hot-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

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
  [key: string]: string | number; // Add index signature for recharts compatibility
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
  pending: number;
  overdue: number;
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

  // Theme colors
  const themeColors = {
    primary: "#954C2E",
    secondary: "#F5E9E4",
    chart: ["#954C2E", "#D4A76A", "#8B7355", "#4A2C2A", "#BF8B67", "#7D5D3B"],
  };

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        timeFilter,
        productFilter: categoryFilter,
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
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeFilter, categoryFilter]);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Custom tooltip formatter
  const customTooltipFormatter = (value: any, name: string) => {
    if (name === "revenue" || name === "totalSpent" || name === "price") {
      return [
        formatCurrency(Number(value)),
        name === "revenue" ? "Revenue" : "Amount",
      ];
    }
    return [value, name];
  };

  // Loading skeleton
  if (loading) {
    return (
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
    );
  }

  if (!analyticsData) {
    return (
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
                <SelectContent>
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
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="decor">Home Decor</SelectItem>
                  <SelectItem value="lighting">Lighting</SelectItem>
                  {/* Add more categories as needed based on your Product model */}
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
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={customTooltipFormatter} />
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
                    data={analyticsData.topProducts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ product, revenue }) =>
                      `${product}: ${formatCurrency(Number(revenue))}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {analyticsData.topProducts.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          themeColors.chart[index % themeColors.chart.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={customTooltipFormatter} />
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
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={customTooltipFormatter} />
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
                Paid, pending, and overdue invoices
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
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                  <Bar dataKey="overdue" fill="#ef4444" name="Overdue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Top 5 Customers</CardTitle>
              <CardDescription>By total spending</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topCustomers.length > 0 ? (
                  analyticsData.topCustomers.map((customer, index) => (
                    <div
                      key={customer.customer}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Badge
                          variant="secondary"
                          className="h-8 w-8 flex items-center justify-center"
                        >
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{customer.customer}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.invoiceCount} invoices
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
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
                  <div className="text-center py-8 text-muted-foreground">
                    No customer data available for the selected period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceAnalytics;
