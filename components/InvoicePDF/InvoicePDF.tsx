// components/InvoicePDF.tsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { InvoiceData } from "@/types/invoice";

// Create enhanced styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
    position: "relative",
    minHeight: "100%",
  },
  pageBorder: {
    position: "absolute",
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderStyle: "dashed",
    borderRadius: 4,
    zIndex: -1,
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  logoAndTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logo: {
    width: 23,
    height: 30,
    marginRight: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a365d",
    textTransform: "uppercase",
  },
  companyDetails: {
    fontSize: 9,
    marginBottom: 2,
    color: "#4a5568",
    lineHeight: 1.3,
    textAlign: "center",
    margin: "auto",
  },
  // NEW: Added style for centered address line
  centeredAddressLine: {
    fontSize: 9,
    marginBottom: 2,
    color: "#4a5568",
    lineHeight: 1.3,
    textAlign: "center",
    // width: "100%",
  },
  invoiceTitleSection: {
    alignItems: "center",
    marginBottom: 5,
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 5,
  },
  // Updated invoice info container
  invoiceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 4,
    overflow: "hidden",
  },
  // New styles for bordered invoice number and date
  invoiceNumberContainer: {
    flex: 1,
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: "#d0d0d0",
  },
  invoiceDateContainer: {
    flex: 1,
    padding: 10,
  },
  invoiceNumber: {
    fontSize: 10,
    color: "#4a5568",
  },
  invoiceDate: {
    fontSize: 10,
    color: "#4a5568",
  },
  twoColumn: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    gap: 20,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 4,
    padding: 10,
  },
  column: {
    width: "48%",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#2c3e50",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 5,
  },
  infoText: {
    fontSize: 10,
    marginBottom: 4,
    color: "#4a5568",
  },
  // Table styles
  table: {
    width: "100%",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#d0d0d0",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d0d0d0",
    alignItems: "center",
    minHeight: 30,
  },
  tableHeader: {
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: "#d0d0d0",
    fontWeight: "bold",
  },
  tableCol: {
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#d0d0d0",
    flex: 1,
    height: "100%",
  },
  tableColSmall: {
    padding: 6,
    width: "7%",
    borderRightWidth: 1,
    borderRightColor: "#d0d0d0",
    height: "100%",
  },
  tableColMedium: {
    padding: 6,
    width: "12%",
    borderRightWidth: 1,
    borderRightColor: "#d0d0d0",
    height: "100%",
  },
  tableColLarge: {
    padding: 6,
    width: "30%",
    borderRightWidth: 1,
    borderRightColor: "#d0d0d0",
    height: "100%",
  },
  tableCell: {
    fontSize: 9,
    color: "#4a5568",
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  // Summary section
  summary: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 15,
  },
  summaryContent: {
    width: "40%",
    borderWidth: 1,
    borderColor: "#d0d0d0",
  },
  summaryRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d0d0d0",
    minHeight: 25,
    alignItems: "center",
  },
  summaryHeader: {
    backgroundColor: "#f8f9fa",
    borderTopWidth: 0,
  },
  summaryHeaderText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    width: "100%",
    padding: 5,
  },
  summaryLabelCell: {
    width: "60%",
    padding: 5,
    paddingLeft: 10,
  },
  summaryValueCell: {
    width: "40%",
    padding: 5,
    alignItems: "flex-end",
    paddingRight: 10,
  },
  summaryBorderRight: {
    borderRightWidth: 1,
    borderRightColor: "#d0d0d0",
  },
  summaryLabel: {
    fontSize: 10,
    color: "#4a5568",
  },
  summaryValue: {
    fontSize: 10,
    color: "#4a5568",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    fontWeight: "bold",
  },
  totalInWords: {
    padding: 10,
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    marginBottom: 15,
  },
  terms: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
  },
  termItem: {
    fontSize: 9,
    marginBottom: 4,
    color: "#4a5568",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    fontSize: 9,
    color: "gray",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 15,
  },
  footerLeft: {
    width: "50%",
  },
  footerRight: {
    width: "50%",
    alignItems: "flex-end",
  },
  footerSection: {
    marginBottom: 10,
  },
  footerSectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#2c3e50",
  },
  signature: {
    marginTop: 30,
    alignItems: "center",
  },
  amountDueSection: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    padding: 10,
  },
  amountDueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  amountDueLabel: {
    fontSize: 10,
    color: "#4a5568",
  },
  amountDueValue: {
    fontSize: 10,
    color: "#4a5568",
    fontWeight: "bold",
  },
  watermark: {
    position: "absolute",
    top: "50%",
    left: "30%",
    fontSize: 60,
    color: "#f0f0f0",
    opacity: 0.1,
    transform: "rotate(-45deg)",
  },
  boldText: {
    fontWeight: "bold",
  },
});

// Helper function to format numbers in Indian standard
const formatIndianCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Define props interface for the component
interface InvoicePDFProps {
  invoiceData: InvoiceData;
  logoUrl?: string;
}

// Create Invoice Document component with proper typing
// Create Invoice Document component with proper typing
const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoiceData, logoUrl }) => {
  const {
    invoiceNumber,
    invoiceDate,
    customerInfo,
    shippingInfo,
    items,
    subtotal,
    cgst,
    sgst,
    total,
    totalInWords,
    notes,
    deliveryDate,
    advancePaid,
  } = invoiceData;

  console.log(advancePaid, "advancePaid");

  console.log(invoiceData, "invoiceData in pdf");

  // Table Header Component (to be repeated on each page)
  const TableHeader = () => (
    <View style={[styles.tableRow, styles.tableHeader]} fixed>
      <View style={styles.tableColSmall}>
        <Text style={styles.tableCellHeader}>#</Text>
      </View>
      <View style={styles.tableColLarge}>
        <Text style={styles.tableCellHeader}>Item & Description</Text>
      </View>
      <View style={styles.tableColMedium}>
        <Text style={styles.tableCellHeader}>HSN /SAC</Text>
      </View>
      <View style={styles.tableColSmall}>
        <Text style={styles.tableCellHeader}>Qty</Text>
      </View>
      <View style={styles.tableColMedium}>
        <Text style={styles.tableCellHeader}>Rate (Rs.)</Text>
      </View>
      {items.some((item) => item.discount > 0) && (
        <View style={styles.tableColSmall}>
          <Text style={styles.tableCellHeader}>Disc.</Text>
        </View>
      )}
      <View style={styles.tableColSmall}>
        <Text style={styles.tableCellHeader}>CGST</Text>
      </View>
      <View style={styles.tableColSmall}>
        <Text style={styles.tableCellHeader}>SGST</Text>
      </View>
      <View style={[styles.tableColMedium, { borderRightWidth: 0 }]}>
        <Text style={styles.tableCellHeader}>Amount (Rs.)</Text>
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Page border */}
        <View style={styles.pageBorder} fixed />

        {/* Watermark */}
        <Text style={styles.watermark}>Rudra Arts & Handicrafts</Text>

        {/* Header with centered logo and company name */}
        <View style={styles.header}>
          <View style={styles.logoAndTitle}>
            {logoUrl && <Image style={styles.logo} src={logoUrl} />}
            <Text style={styles.companyName}>Rudra Arts & Handicrafts</Text>
          </View>

          <View>
            {/* First line of address */}
            <Text style={styles.companyDetails}>
              {" "}
              Samata Nagar, Ganesh Nagar Lane No 1, Famous Chowk, New Sangavi,
              Pune Maharashtra 411061, India
            </Text>

            <Text style={styles.companyDetails}>
              GSTIN: 27AMWPV8148A1ZE | 9595221296 | rudraarts30@gmail.com
            </Text>
          </View>
        </View>

        {/* Invoice Title */}
        <View style={styles.invoiceTitleSection}>
          <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
        </View>

        {/* Invoice Number and Date with border and vertical divider */}
        <View style={styles.invoiceInfo}>
          <View style={styles.invoiceNumberContainer}>
            <Text style={styles.invoiceNumber}>
              <Text style={styles.boldText}>Invoice No:</Text> {invoiceNumber}
            </Text>
          </View>
          <View style={styles.invoiceDateContainer}>
            <Text style={styles.invoiceDate}>
              <Text style={styles.boldText}>Invoice Date:</Text> {invoiceDate}
            </Text>
          </View>
        </View>

        {/* Customer and Shipping Information with border */}
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            <Text style={styles.infoText}>{customerInfo.name}</Text>
            <Text style={styles.infoText}>{customerInfo.address}</Text>
            <Text style={styles.infoText}>
              {customerInfo.city} {customerInfo.pincode}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.boldText}>GSTIN:</Text> {customerInfo.gstin}
            </Text>
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Ship To:</Text>
            <Text style={styles.infoText}>{shippingInfo.name}</Text>
            <Text style={styles.infoText}>{shippingInfo.address}</Text>
            <Text style={styles.infoText}>
              {shippingInfo.city} {shippingInfo.pincode}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.boldText}>GSTIN:</Text> {shippingInfo.gstin}
            </Text>
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.sectionTitle}>
          <Text style={styles.infoText}>
            <Text style={styles.boldText}>Place Of Supply:</Text> Maharashtra
            (27)
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.boldText}>Delivery Date:</Text> {deliveryDate}
          </Text>
        </View>

        {/* Items Table with full borders */}
        <View style={styles.table}>
          {/* Table Header - This will appear on every page */}
          <TableHeader />

          {/* Table Rows */}
          {items.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableColSmall}>
                <Text style={styles.tableCell}>{index + 1}</Text>
              </View>
              <View style={styles.tableColLarge}>
                <Text style={styles.tableCell}>{item.name}</Text>
                {item.description && (
                  <Text
                    style={[styles.tableCell, { fontSize: 8, color: "#666" }]}
                  >
                    {item.description}
                  </Text>
                )}
              </View>
              <View style={styles.tableColMedium}>
                <Text style={styles.tableCell}>{item.hsn}</Text>
              </View>
              <View style={styles.tableColSmall}>
                <Text style={styles.tableCell}>
                  {item.quantity} {item.unit}
                </Text>
              </View>
              <View style={styles.tableColMedium}>
                <Text style={styles.tableCell}>
                  {formatIndianCurrency(item.rate * item.quantity)}
                </Text>
              </View>
              {items.some((itm) => itm.discount > 0) && (
                <View style={styles.tableColSmall}>
                  <Text style={styles.tableCell}>
                    {item.discount > 0 ? `${item.discount}%` : "-"}
                  </Text>
                </View>
              )}
              <View style={styles.tableColSmall}>
                <Text style={styles.tableCell}>{item.cgst}%</Text>
              </View>
              <View style={styles.tableColSmall}>
                <Text style={styles.tableCell}>{item.sgst}%</Text>
              </View>
              <View style={[styles.tableColMedium, { borderRightWidth: 0 }]}>
                <Text style={styles.tableCell}>
                  {formatIndianCurrency(item.amount)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals and Summary with borders */}
        <View style={styles.summary} wrap={false}>
          <View style={styles.summaryContent}>
            {/* Summary Header */}
            <View style={[styles.summaryRow, styles.summaryHeader]}>
              <Text style={styles.summaryHeaderText}>Summary</Text>
            </View>

            {/* Subtotal */}
            <View style={styles.summaryRow}>
              <View
                style={[styles.summaryLabelCell, styles.summaryBorderRight]}
              >
                <Text style={styles.summaryLabel}>Subtotal:</Text>
              </View>
              <View style={styles.summaryValueCell}>
                <Text style={styles.summaryValue}>
                  Rs.{formatIndianCurrency(subtotal)}
                </Text>
              </View>
            </View>

            {/* CGST */}
            <View style={styles.summaryRow}>
              <View
                style={[styles.summaryLabelCell, styles.summaryBorderRight]}
              >
                <Text style={styles.summaryLabel}>CGST (2.5%):</Text>
              </View>
              <View style={styles.summaryValueCell}>
                <Text style={styles.summaryValue}>
                  Rs.{formatIndianCurrency(cgst)}
                </Text>
              </View>
            </View>

            {/* SGST */}
            <View style={styles.summaryRow}>
              <View
                style={[styles.summaryLabelCell, styles.summaryBorderRight]}
              >
                <Text style={styles.summaryLabel}>SGST (2.5%):</Text>
              </View>
              <View style={styles.summaryValueCell}>
                <Text style={styles.summaryValue}>
                  Rs.{formatIndianCurrency(sgst)}
                </Text>
              </View>
            </View>

            {/* Total */}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <View
                style={[styles.summaryLabelCell, styles.summaryBorderRight]}
              >
                <Text style={[styles.summaryLabel, styles.boldText]}>
                  Total:
                </Text>
              </View>
              <View style={styles.summaryValueCell}>
                <Text style={[styles.summaryValue, styles.boldText]}>
                  Rs.{formatIndianCurrency(total)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Total in Words */}
        <View style={styles.totalInWords}>
          <Text style={styles.infoText}>
            <Text style={styles.boldText}>Total in Words: </Text>
            {totalInWords}
          </Text>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.terms}>
          <Text style={styles.sectionTitle}>Terms and Conditions:</Text>
          <Text style={styles.termItem}>
            1) Goods once sold cannot be taken back or replaced.
          </Text>
          <Text style={styles.termItem}>
            2) Payment should be done within 10 days from issue date of invoice.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} wrap={false}>
          <View style={styles.footerLeft}>
            <View style={styles.footerSection}>
              <Text style={styles.footerSectionTitle}>Company Details:</Text>
              <Text style={styles.infoText}>
                <Text style={styles.boldText}>State:</Text> Maharashtra
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.boldText}>State Code:</Text> 27
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.boldText}>GSTIN:</Text> 27AMWPV8148A1ZE
              </Text>
            </View>
            <View style={styles.footerSection}>
              <Text style={styles.infoText}>A/C QR Code Placeholder</Text>
            </View>
          </View>

          <View style={styles.footerRight}>
            <View style={styles.signature}>
              <Text>Authorized Signature</Text>
              <Text>_________________________</Text>
              <Text>Rudra Arts & Handicrafts</Text>
            </View>
          </View>
        </View>

        {/* Amount Due Section */}
        <View style={styles.amountDueSection}>
          <View style={styles.amountDueRow}>
            <Text style={styles.amountDueLabel}>Amount Due:</Text>
            <Text style={styles.amountDueValue}>
              Rs.{formatIndianCurrency(total - advancePaid! || 0)}
            </Text>
          </View>
          <View style={styles.amountDueRow}>
            <Text style={styles.amountDueLabel}>Previous Due:</Text>
            <Text style={styles.amountDueValue}>
              Rs.{formatIndianCurrency(advancePaid || 0)}
            </Text>
          </View>
          <View style={styles.amountDueRow}>
            <Text style={styles.amountDueLabel}>Total:</Text>
            <Text style={styles.amountDueValue}>
              Rs.{formatIndianCurrency(total)}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
