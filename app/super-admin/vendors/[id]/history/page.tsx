"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  ArrowLeft,
  FileText,
  DollarSign,
  CreditCard,
  Calendar,
  Building,
  Phone,
  Mail,
  MapPin,
  User,
  Printer,
  Eye,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  Font,
} from "@react-pdf/renderer";

// Register fonts (you'll need to add these fonts to your project)
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
});

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontFamily: "Roboto",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    borderBottomStyle: "solid",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 8,
    backgroundColor: "#f1f5f9",
    padding: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    fontSize: 10,
  },
  label: {
    fontWeight: "bold",
    color: "#475569",
  },
  value: {
    color: "#1e293b",
  },
  table: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    padding: 5,
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#334155",
  },
  tableCell: {
    fontSize: 9,
    color: "#475569",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 8,
    color: "#64748b",
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingTop: 10,
  },
});

// PDF Document Component
const VendorHistoryPDF = ({ vendorData, transactions, summary }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Vendor Transaction History</Text>
        <Text style={styles.subtitle}>
          Generated on {new Date().toLocaleDateString()} | Vendor ID:{" "}
          {vendorData.id}
        </Text>
      </View>

      {/* Vendor Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vendor Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{vendorData.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Company:</Text>
          <Text style={styles.value}>{vendorData.companyName || "N/A"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>GSTIN:</Text>
          <Text style={styles.value}>{vendorData.gstin || "N/A"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Contact:</Text>
          <Text style={styles.value}>
            {vendorData.phone || "N/A"} | {vendorData.email || "N/A"}
          </Text>
        </View>
        {vendorData.address && (
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{vendorData.address}</Text>
          </View>
        )}
      </View>

      {/* Financial Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Summary</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Total Bills:</Text>
          <Text style={styles.value}>₹{summary.totalBills.toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Payments:</Text>
          <Text style={styles.value}>₹{summary.totalPayments.toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Credit Notes:</Text>
          <Text style={styles.value}>
            ₹{summary.totalCreditNotes.toFixed(2)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Current Balance:</Text>
          <Text
            style={[
              styles.value,
              { color: summary.currentBalance >= 0 ? "#059669" : "#dc2626" },
            ]}
          >
            ₹{summary.currentBalance.toFixed(2)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Credit Limit:</Text>
          <Text style={styles.value}>₹{summary.creditLimit.toFixed(2)}</Text>
        </View>
      </View>

      {/* Transactions Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Date</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Type</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Reference</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Amount</Text>
            </View>
          </View>

          {/* Table Rows */}
          {transactions.map((transaction: any, index: number) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {new Date(transaction.date).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {transaction.type === "BILL" && "Bill"}
                  {transaction.type === "PAYMENT" && "Payment"}
                  {transaction.type === "CREDIT_NOTE" && "Credit Note"}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{transaction.reference}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text
                  style={[
                    styles.tableCell,
                    {
                      color:
                        transaction.type === "BILL"
                          ? "#dc2626"
                          : transaction.type === "CREDIT_NOTE"
                          ? "#059669"
                          : "#2563eb",
                    },
                  ]}
                >
                  {transaction.type === "BILL" ? "-" : "+"}₹
                  {transaction.amount.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Generated by Rudra Management System | Confidential</Text>
        <Text>Page 1 of 1</Text>
      </View>
    </Page>
  </Document>
);

interface VendorHistoryData {
  vendor: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    companyName?: string;
    gstin?: string;
    address?: string;
    openingBalance: number;
    creditLimit: number;
    currentBalance: number;
    createdAt: string;
    updatedAt: string;
  };
  bills: any[];
  payments: any[];
  creditNotes: any[];
  summary: {
    totalBills: number;
    totalPayments: number;
    totalCreditNotes: number;
    outstandingBalance: number;
    currentBalance: number;
    creditLimit: number;
    creditUtilization: number;
  };
}

export default function VendorHistory() {
  const router = useRouter();
  const params = useParams();
  const vendorId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState<VendorHistoryData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  useEffect(() => {
    if (vendorId) {
      fetchVendorHistory();
    }
  }, [vendorId]);

  const fetchVendorHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vendors/${vendorId}/history`);
      if (response.ok) {
        const data = await response.json();
        setVendorData(data);
      } else {
        console.error("Failed to fetch vendor history");
        router.push("/vendors");
      }
    } catch (error) {
      console.error("Error fetching vendor history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "BILL":
        return "bg-red-100 text-red-800";
      case "PAYMENT":
        return "bg-green-100 text-green-800";
      case "CREDIT_NOTE":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-800" },
      PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
      PARTIAL: { label: "Partial", color: "bg-blue-100 text-blue-800" },
      PAID: { label: "Paid", color: "bg-green-100 text-green-800" },
      OVERDUE: { label: "Overdue", color: "bg-red-100 text-red-800" },
      ISSUED: { label: "Issued", color: "bg-green-100 text-green-800" },
      APPLIED: { label: "Applied", color: "bg-blue-100 text-blue-800" },
      CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800" },
    };

    const { label, color } = config[status] || config.DRAFT;
    return (
      <Badge variant="secondary" className={color}>
        {label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getAllTransactions = () => {
    if (!vendorData) return [];

    const transactions = [
      ...vendorData.bills.map((bill) => ({
        ...bill,
        type: "BILL",
        reference: bill.billNumber,
        date: bill.billDate,
      })),
      ...vendorData.payments.map((payment) => ({
        ...payment,
        type: "PAYMENT",
        reference: payment.referenceNumber,
        date: payment.paymentDate,
      })),
      ...vendorData.creditNotes.map((note) => ({
        ...note,
        type: "CREDIT_NOTE",
        reference: note.creditNoteNumber,
        date: note.issueDate,
      })),
    ];

    return transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading vendor history...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!vendorData) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Vendor Not Found
          </h3>
          <p className="text-gray-600 mb-4">
            The vendor history could not be loaded.
          </p>
          <Button onClick={() => router.push("/super-admin/vendors")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vendors
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const transactions = getAllTransactions();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/super-admin/vendors")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {vendorData.vendor.name}
              </h2>
              <p className="text-gray-600">Vendor ID: {vendorData.vendor.id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {showPDFPreview ? (
              <PDFDownloadLink
                document={
                  <VendorHistoryPDF
                    vendorData={vendorData.vendor}
                    transactions={transactions}
                    summary={vendorData.summary}
                  />
                }
                fileName={`vendor-history-${vendorData.vendor.id}-${
                  new Date().toISOString().split("T")[0]
                }.pdf`}
              >
                {({ loading }) => (
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Download className="h-4 w-4 mr-2" />
                    {loading ? "Preparing PDF..." : "Download PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
            ) : (
              <Button
                onClick={() => setShowPDFPreview(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview & Generate PDF
              </Button>
            )}
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Vendor Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Company Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {vendorData.vendor.companyName || "No company name"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      GSTIN: {vendorData.vendor.gstin || "Not provided"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Contact Details</h3>
                <div className="space-y-2">
                  {vendorData.vendor.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {vendorData.vendor.phone}
                      </span>
                    </div>
                  )}
                  {vendorData.vendor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 truncate">
                        {vendorData.vendor.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Address</h3>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    {vendorData.vendor.address || "No address provided"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Bills</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(vendorData.summary.totalBills)}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {vendorData.bills.length} bill
                {vendorData.bills.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Payments</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(vendorData.summary.totalPayments)}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {vendorData.payments.length} payment
                {vendorData.payments.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Credit Notes</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(vendorData.summary.totalCreditNotes)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {vendorData.creditNotes.length} note
                {vendorData.creditNotes.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Current Balance</p>
                  <p
                    className={`text-2xl font-bold ${
                      vendorData.summary.currentBalance >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(vendorData.summary.currentBalance)}
                  </p>
                </div>
                {vendorData.summary.currentBalance >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-400" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-400" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Credit Limit: {formatCurrency(vendorData.summary.creditLimit)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Detailed View */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bills">
              Bills ({vendorData.bills.length})
            </TabsTrigger>
            <TabsTrigger value="payments">
              Payments ({vendorData.payments.length})
            </TabsTrigger>
            <TabsTrigger value="credit-notes">
              Credit Notes ({vendorData.creditNotes.length})
            </TabsTrigger>
            <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest transactions with this vendor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.slice(0, 10).map((transaction, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Badge
                          className={getTransactionTypeColor(transaction.type)}
                        >
                          {transaction.type}
                        </Badge>
                        <div>
                          <p className="font-medium">{transaction.reference}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            transaction.type === "BILL"
                              ? "text-red-600"
                              : transaction.type === "CREDIT_NOTE"
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        >
                          {transaction.type === "BILL" ? "-" : "+"}
                          {formatCurrency(transaction.amount)}
                        </p>
                        {transaction.status && (
                          <div className="mt-1">
                            {getStatusBadge(transaction.status)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bills Tab */}
          <TabsContent value="bills" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Bills</CardTitle>
                <CardDescription>
                  All bills issued to this vendor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {vendorData.bills.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bill No.
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {vendorData.bills.map((bill) => (
                          <tr key={bill.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="outline" className="font-mono">
                                {bill.billNumber}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="text-sm text-gray-600">
                                  Date:{" "}
                                  {new Date(bill.billDate).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Due:{" "}
                                  {new Date(bill.dueDate).toLocaleDateString()}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="text-lg font-bold text-red-600">
                                  ₹{bill.totalAmount.toFixed(2)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Paid: ₹{bill.amountPaid.toFixed(2)}
                                </div>
                                <div className="text-sm font-medium text-red-600">
                                  Due: ₹{bill.balanceDue.toFixed(2)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {getStatusBadge(bill.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No bills found for this vendor
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Complete Transaction History</CardTitle>
                <CardDescription>
                  All transactions sorted by date
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((transaction, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-full ${getTransactionTypeColor(
                            transaction.type
                          )}`}
                        >
                          {transaction.type === "BILL" && (
                            <FileText className="h-5 w-5" />
                          )}
                          {transaction.type === "PAYMENT" && (
                            <CreditCard className="h-5 w-5" />
                          )}
                          {transaction.type === "CREDIT_NOTE" && (
                            <DollarSign className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.reference}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            transaction.type === "BILL"
                              ? "text-red-600"
                              : transaction.type === "CREDIT_NOTE"
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        >
                          {transaction.type === "BILL" ? "-" : "+"}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <Badge variant="secondary" className="mt-1">
                          {transaction.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* PDF Preview Modal */}
        {showPDFPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-white">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>PDF Preview</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPDFPreview(false)}
                  >
                    ✕
                  </Button>
                </CardTitle>
                <CardDescription>
                  Preview of the PDF document. Click Download PDF to save the
                  file.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 p-8 rounded-lg bg-white">
                  {/* PDF Preview Content */}
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="border-b-2 border-blue-600 pb-4">
                      <h3 className="text-2xl font-bold text-gray-800">
                        Vendor Transaction History
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Generated on {new Date().toLocaleDateString()} | Vendor
                        ID: {vendorData.vendor.id}
                      </p>
                    </div>

                    {/* Vendor Info */}
                    <div>
                      <h4 className="font-bold text-gray-700 bg-gray-100 p-2 mb-2">
                        Vendor Information
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-semibold">Name:</span>{" "}
                          {vendorData.vendor.name}
                        </div>
                        <div>
                          <span className="font-semibold">Company:</span>{" "}
                          {vendorData.vendor.companyName || "N/A"}
                        </div>
                        <div>
                          <span className="font-semibold">GSTIN:</span>{" "}
                          {vendorData.vendor.gstin || "N/A"}
                        </div>
                        <div>
                          <span className="font-semibold">Contact:</span>{" "}
                          {vendorData.vendor.phone || "N/A"} |{" "}
                          {vendorData.vendor.email || "N/A"}
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div>
                      <h4 className="font-bold text-gray-700 bg-gray-100 p-2 mb-2">
                        Financial Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-semibold">Total Bills:</span>{" "}
                          {formatCurrency(vendorData.summary.totalBills)}
                        </div>
                        <div>
                          <span className="font-semibold">Total Payments:</span>{" "}
                          {formatCurrency(vendorData.summary.totalPayments)}
                        </div>
                        <div>
                          <span className="font-semibold">
                            Total Credit Notes:
                          </span>{" "}
                          {formatCurrency(vendorData.summary.totalCreditNotes)}
                        </div>
                        <div>
                          <span className="font-semibold">
                            Current Balance:
                          </span>{" "}
                          <span
                            className={
                              vendorData.summary.currentBalance >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {formatCurrency(vendorData.summary.currentBalance)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sample Transactions */}
                    <div>
                      <h4 className="font-bold text-gray-700 bg-gray-100 p-2 mb-2">
                        Sample Transactions
                      </h4>
                      <div className="border border-gray-300 text-xs">
                        <div className="grid grid-cols-4 bg-gray-50 p-2 font-semibold border-b">
                          <div>Date</div>
                          <div>Type</div>
                          <div>Reference</div>
                          <div>Amount</div>
                        </div>
                        {transactions.slice(0, 5).map((transaction, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-4 p-2 border-b last:border-b-0"
                          >
                            <div>
                              {new Date(transaction.date).toLocaleDateString()}
                            </div>
                            <div>{transaction.type}</div>
                            <div>{transaction.reference}</div>
                            <div
                              className={
                                transaction.type === "BILL"
                                  ? "text-red-600"
                                  : transaction.type === "CREDIT_NOTE"
                                  ? "text-green-600"
                                  : "text-blue-600"
                              }
                            >
                              {transaction.type === "BILL" ? "-" : "+"}
                              {formatCurrency(transaction.amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowPDFPreview(false)}
                  >
                    Cancel
                  </Button>
                  <PDFDownloadLink
                    document={
                      <VendorHistoryPDF
                        vendorData={vendorData.vendor}
                        transactions={transactions}
                        summary={vendorData.summary}
                      />
                    }
                    fileName={`vendor-history-${vendorData.vendor.id}-${
                      new Date().toISOString().split("T")[0]
                    }.pdf`}
                  >
                    {({ loading }) => (
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Download className="h-4 w-4 mr-2" />
                        {loading ? "Generating..." : "Download PDF"}
                      </Button>
                    )}
                  </PDFDownloadLink>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
