import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 30,
    borderBottom: 2,
    borderBottomColor: "#1e40af",
    paddingBottom: 10,
  },
  companyInfo: {
    marginBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e40af",
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: 120,
    fontSize: 10,
    fontWeight: "bold",
    color: "#6b7280",
  },
  value: {
    fontSize: 10,
    color: "#374151",
  },
  table: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableCell: {
    fontSize: 10,
    color: "#374151",
  },
  amountCell: {
    fontSize: 10,
    color: "#374151",
    textAlign: "right",
  },
  totalSection: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  totalLabel: {
    width: 100,
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
    textAlign: "right",
  },
  totalValue: {
    width: 100,
    fontSize: 10,
    color: "#374151",
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
});

interface CreditNotePDFProps {
  creditNote: {
    creditNoteNumber: string;
    issueDate: Date;
    customer: {
      name: string;
      number: string;
      email?: string;
      address?: string;
    };
    invoiceNumber?: string;
    reason: string;
    amount: number;
    taxAmount: number;
    totalAmount: number;
    notes?: string;
    status: string;
  };
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin?: string;
  };
}

const CreditNotePDF: React.FC<CreditNotePDFProps> = ({
  creditNote,
  companyInfo = {
    name: "Rudra Arts & Crafts",
    address: "123 Business Street, City, State, ZIP",
    phone: "+91 1234567890",
    email: "info@rudraarts.com",
    gstin: "GSTIN123456789",
  },
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyInfo.name}</Text>
            <Text style={styles.value}>{companyInfo.address}</Text>
            <Text style={styles.value}>Phone: {companyInfo.phone}</Text>
            <Text style={styles.value}>Email: {companyInfo.email}</Text>
            {companyInfo.gstin && (
              <Text style={styles.value}>GSTIN: {companyInfo.gstin}</Text>
            )}
          </View>
          <Text style={styles.title}>CREDIT NOTE</Text>
        </View>

        {/* Credit Note Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Credit Note No:</Text>
            <Text style={styles.value}>{creditNote.creditNoteNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>
              {creditNote.issueDate.toLocaleDateString()}
            </Text>
          </View>
          {creditNote.invoiceNumber && (
            <View style={styles.row}>
              <Text style={styles.label}>Invoice No:</Text>
              <Text style={styles.value}>{creditNote.invoiceNumber}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{creditNote.status}</Text>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "bold",
              marginBottom: 8,
              color: "#374151",
            }}
          >
            BILL TO:
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name:</Text>
            <Text style={styles.value}>{creditNote.customer.name}</Text>
          </View>
          {creditNote.customer.number && (
            <View style={styles.row}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{creditNote.customer.number}</Text>
            </View>
          )}
          {creditNote.customer.email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{creditNote.customer.email}</Text>
            </View>
          )}
          {creditNote.customer.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{creditNote.customer.address}</Text>
            </View>
          )}
        </View>

        {/* Reason */}
        <View style={styles.section}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "bold",
              marginBottom: 8,
              color: "#374151",
            }}
          >
            REASON FOR CREDIT NOTE:
          </Text>
          <Text style={styles.value}>{creditNote.reason}</Text>
          {creditNote.notes && (
            <Text style={[styles.value, { marginTop: 10 }]}>
              {creditNote.notes}
            </Text>
          )}
        </View>

        {/* Amount Details */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { width: "40%" }]}>
              Description
            </Text>
            <Text style={[styles.tableCell, { width: "30%" }]}>Reason</Text>
            <Text style={[styles.amountCell, { width: "30%" }]}>
              Amount (₹)
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: "40%" }]}>
              Credit Note Amount
            </Text>
            <Text style={[styles.tableCell, { width: "30%" }]}>
              {creditNote.reason}
            </Text>
            <Text style={[styles.amountCell, { width: "30%" }]}>
              {creditNote.amount.toFixed(2)}
            </Text>
          </View>
          {creditNote.taxAmount > 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: "40%" }]}>
                Tax Amount
              </Text>
              <Text style={[styles.tableCell, { width: "30%" }]}>-</Text>
              <Text style={[styles.amountCell, { width: "30%" }]}>
                {creditNote.taxAmount.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* Totals */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              ₹{(creditNote.amount + creditNote.taxAmount).toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { fontWeight: "bold" }]}>
              Total Credit:
            </Text>
            <Text
              style={[
                styles.totalValue,
                { fontWeight: "bold", color: "#dc2626" },
              ]}
            >
              -₹{creditNote.totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This is a computer-generated credit note and does not require a
            signature.
          </Text>
          <Text>
            For any queries, please contact {companyInfo.phone} or{" "}
            {companyInfo.email}
          </Text>
          <Text style={{ marginTop: 5 }}>
            Generated on {new Date().toLocaleDateString()}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default CreditNotePDF;
