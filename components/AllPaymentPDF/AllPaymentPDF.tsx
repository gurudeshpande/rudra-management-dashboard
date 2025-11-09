import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface Payment {
  id: string;
  customerName: string;
  customerNumber: string | null;
  customerEmail?: string;
  amount: number;
  paymentMethod: "UPI" | "CASH" | "BANK_TRANSFER" | "CARD";
  transactionId: string | null;
  createdAt: string;
  receiptNumber: string;
  status: "COMPLETED" | "DUE" | "OVERDUE";
  dueDate?: string;
  balanceDue?: number;
}

// Create elegant styles for all payments report
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  header: {
    alignItems: "center",
    marginBottom: 25,
    borderBottom: "1pt solid #e5e7eb",
    paddingBottom: 15,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 8,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 2,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e3a8a",
    textAlign: "center",
    marginBottom: 20,
    textTransform: "uppercase",
  },
  reportInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f8fafc",
    border: "1pt solid #e2e8f0",
    borderRadius: 4,
  },
  infoColumn: {
    flexDirection: "column",
    gap: 4,
  },
  summarySection: {
    backgroundColor: "#f0f9ff",
    padding: 15,
    border: "1pt solid #bae6fd",
    borderRadius: 6,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0369a1",
    marginBottom: 8,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryItem: {
    flexDirection: "column",
    alignItems: "center",
    minWidth: "23%",
  },
  summaryLabel: {
    fontSize: 7,
    color: "#475569",
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1e3a8a",
  },
  tableContainer: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1e3a8a",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRowEven: {
    backgroundColor: "#f8fafc",
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 7,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    paddingHorizontal: 2,
  },
  tableCell: {
    flex: 1,
    fontSize: 7,
    textAlign: "center",
    paddingHorizontal: 2,
    color: "#374151",
  },
  receiptCell: {
    flex: 0.8,
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 2,
    color: "#1e3a8a",
  },
  amountCell: {
    flex: 1,
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 2,
    color: "#059669",
  },
  statusCell: {
    flex: 1,
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 2,
  },
  footer: {
    marginTop: 25,
    paddingTop: 12,
    borderTop: "1pt solid #e5e7eb",
    fontSize: 7,
    color: "#6b7280",
    textAlign: "center",
  },
  boldText: {
    fontWeight: "bold",
  },
  statusCompleted: {
    color: "#059669",
  },
  statusDue: {
    color: "#d97706",
  },
  statusOverdue: {
    color: "#dc2626",
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
});

interface AllPaymentsPDFProps {
  payments: Payment[];
  searchTerm: string;
  customerName?: string;
}

// Helper function to format currency
const formatIndianCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
};

// Helper function to get status style
const getStatusStyle = (status: Payment["status"]) => {
  switch (status) {
    case "COMPLETED":
      return styles.statusCompleted;
    case "DUE":
      return styles.statusDue;
    case "OVERDUE":
      return styles.statusOverdue;
    default:
      return {};
  }
};

// Helper function to get status text
const getStatusText = (status: Payment["status"]) => {
  switch (status) {
    case "COMPLETED":
      return "Paid";
    case "DUE":
      return "Due";
    case "OVERDUE":
      return "Overdue";
    default:
      return status;
  }
};

// Helper function to truncate long text
const truncateText = (text: string, maxLength: number = 15): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
};

const AllPaymentsPDF: React.FC<AllPaymentsPDFProps> = ({
  payments,
  searchTerm,
  customerName,
}) => {
  const totalAmount = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const completedCount = payments.filter(
    (p) => p.status === "COMPLETED"
  ).length;
  const dueCount = payments.filter((p) => p.status === "DUE").length;
  const overdueCount = payments.filter((p) => p.status === "OVERDUE").length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>RUDRA ARTS & HANDICRAFTS</Text>
          <Text style={styles.companyDetails}>
            Samata Nagar, Ganesh Nagar Lane No 1, Famous Chowk, New Sangavi,
            Pune
          </Text>
          <Text style={styles.companyDetails}>
            Maharashtra 411061 • GSTIN: 27AMWPV8148A1ZE
          </Text>
          <Text style={styles.companyDetails}>
            9595221296 • rudraarts30@gmail.com
          </Text>
        </View>

        {/* Report Title */}
        <Text style={styles.reportTitle}>
          {customerName
            ? `PAYMENT HISTORY - ${customerName.toUpperCase()}`
            : "COMPREHENSIVE PAYMENTS REPORT"}
        </Text>

        {/* Report Information */}
        <View style={styles.reportInfo}>
          <View style={styles.infoColumn}>
            <Text style={styles.boldText}>
              Report Date: {new Date().toLocaleDateString("en-IN")}
            </Text>
            <Text style={styles.boldText}>
              Total Records: {payments.length}
            </Text>
            {searchTerm && (
              <Text style={styles.boldText}>Search Filter: "{searchTerm}"</Text>
            )}
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.boldText}>
              Generated:{" "}
              {new Date().toLocaleString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Text>
            <Text style={styles.boldText}>
              Customer: {customerName || "All Customers"}
            </Text>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>SUMMARY OVERVIEW</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.summaryValue}>
                Rs.{formatIndianCurrency(totalAmount)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>COMPLETED</Text>
              <Text style={styles.summaryValue}>{completedCount}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>DUE</Text>
              <Text style={styles.summaryValue}>{dueCount}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>OVERDUE</Text>
              <Text style={styles.summaryValue}>{overdueCount}</Text>
            </View>
          </View>
        </View>

        {/* Payments Table */}
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>
              RECEIPT #
            </Text>
            <Text style={styles.tableHeaderCell}>DATE</Text>
            {/* <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>
              CUSTOMER
            </Text> */}
            <Text style={styles.tableHeaderCell}>AMOUNT</Text>
            <Text style={styles.tableHeaderCell}>METHOD</Text>
            <Text style={styles.tableHeaderCell}>STATUS</Text>
            <Text style={styles.tableHeaderCell}>BALANCE DUE</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>
              TRANSACTION ID
            </Text>
          </View>

          {/* Table Rows */}
          {payments.map((payment, index) => (
            <View
              style={[
                styles.tableRow,
                index % 2 === 0 ? styles.tableRowEven : {},
              ]}
              key={payment.id}
            >
              <Text style={styles.receiptCell}>#{payment.receiptNumber}</Text>
              <Text style={styles.tableCell}>
                {formatDate(payment.createdAt)}
              </Text>
              {/* <Text style={styles.tableCell}>
                {truncateText(payment.customerName, 20)}
              </Text> */}
              <Text style={styles.amountCell}>
                Rs.{formatIndianCurrency(payment.amount)}
              </Text>
              <Text style={styles.tableCell}>{payment.paymentMethod}</Text>
              <Text style={[styles.statusCell, getStatusStyle(payment.status)]}>
                {getStatusText(payment.status)}
              </Text>
              <Text style={styles.tableCell}>
                {payment.balanceDue && payment.balanceDue > 0
                  ? `Rs.${formatIndianCurrency(payment.balanceDue)}`
                  : "Rs.0.00"}
              </Text>
              <Text style={styles.tableCell}>
                {payment.transactionId ? payment.transactionId : "N/A"}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This is an electronically generated report and does not require
            physical signature
          </Text>
          <Text>Rudra Arts & Handicrafts • Payment Management System</Text>
        </View>

        {/* Page Number */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

export default AllPaymentsPDF;
