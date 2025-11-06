// components/payment/PaymentReceiptPDF.tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Payment } from "@prisma/client";

// Create styles for payment receipt
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    marginBottom: 2,
    color: "#4a5568",
    textAlign: "center",
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a365d",
    textAlign: "center",
    marginBottom: 15,
  },
  receiptInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 4,
  },
  twoColumn: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
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
  paymentDetails: {
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 4,
    padding: 15,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 10,
    color: "#4a5568",
    fontWeight: "bold",
  },
  detailValue: {
    fontSize: 10,
    color: "#4a5568",
  },
  amountSection: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 4,
    marginBottom: 15,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  totalAmount: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#d0d0d0",
    fontSize: 12,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    fontSize: 8,
    color: "#666",
    textAlign: "center",
  },
  signature: {
    marginTop: 30,
    alignItems: "center",
  },
  boldText: {
    fontWeight: "bold",
  },
});

interface PaymentReceiptPDFProps {
  payment: Payment;
}

// Helper function to format currency
const formatIndianCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Helper function to convert number to words
const numberToWords = (num: number): string => {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  // Handle decimal part (paise)
  let rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let words = "";

  // Function to convert numbers less than 1000
  const convertHundreds = (n: number): string => {
    let result = "";

    // Hundreds place
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }

    // Tens and ones place
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }

    if (n > 0) {
      result += ones[n] + " ";
    }

    return result.trim();
  };

  // Convert rupees part
  if (rupees === 0) {
    words = "Zero";
  } else {
    // Crores
    if (rupees >= 10000000) {
      words += convertHundreds(Math.floor(rupees / 10000000)) + " Crore ";
      rupees %= 10000000;
    }

    // Lakhs
    if (rupees >= 100000) {
      words += convertHundreds(Math.floor(rupees / 100000)) + " Lakh ";
      rupees %= 100000;
    }

    // Thousands
    if (rupees >= 1000) {
      words += convertHundreds(Math.floor(rupees / 1000)) + " Thousand ";
      rupees %= 1000;
    }

    // Hundreds
    if (rupees > 0) {
      words += convertHundreds(rupees);
    }
  }

  // Trim and add "Rupees"
  words = words.trim();
  if (words === "Zero") {
    words = "Zero Rupees";
  } else {
    words += " Rupees";
  }

  // Add paise if exists
  if (paise > 0) {
    let paiseWords = "";

    if (paise >= 20) {
      paiseWords += tens[Math.floor(paise / 10)];
      if (paise % 10 > 0) {
        paiseWords += " " + ones[paise % 10];
      }
    } else if (paise > 0) {
      paiseWords = ones[paise];
    }

    words += " and " + paiseWords + " Paise";
  }

  return words + " Only";
};

const PaymentReceiptPDF: React.FC<PaymentReceiptPDFProps> = ({ payment }) => {
  const getPaymentMethodText = (
    method: "UPI" | "CASH" | "BANK_TRANSFER" | "CARD"
  ) => {
    const methods = {
      UPI: "UPI Payment",
      CASH: "Cash",
      BANK_TRANSFER: "Bank Transfer",
      CARD: "Card Payment",
    } as const;
    return methods[method];
  };

  const getStatusText = (status: Payment["status"]) => {
    const statuses: Record<Payment["status"], string> = {
      DUE: "DUE",
      COMPLETED: "Completed",
      OVERDUE: "OVERDUE",
    };
    return statuses[status];
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>Rudra Arts & Handicrafts</Text>
          <Text style={styles.companyDetails}>
            Samata Nagar, Ganesh Nagar Lane No 1, Famous Chowk, New Sangavi,
            Pune
          </Text>
          <Text style={styles.companyDetails}>
            Maharashtra 411061, India | GSTIN: 27AMWPV8148A1ZE
          </Text>
          <Text style={styles.companyDetails}>
            Phone: 9595221296 | Email: rudraarts30@gmail.com
          </Text>
        </View>

        {/* Receipt Title */}
        <Text style={styles.receiptTitle}>PAYMENT RECEIPT</Text>

        {/* Receipt Information */}
        <View style={styles.receiptInfo}>
          <View>
            <Text style={styles.infoText}>
              <Text style={styles.boldText}>Receipt No:</Text>{" "}
              {payment.receiptNumber}
            </Text>
          </View>
          <View>
            <Text style={styles.infoText}>
              <Text style={styles.boldText}>Date:</Text>{" "}
              {new Date(payment.createdAt).toLocaleDateString("en-IN")}
            </Text>
          </View>
        </View>

        {/* Customer and Payment Details */}
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Customer Details</Text>
            <Text style={styles.infoText}>
              <Text style={styles.boldText}>Name:</Text> {payment.customerName}
            </Text>
            {payment.customerNumber && (
              <Text style={styles.infoText}>
                <Text style={styles.boldText}>Phone:</Text>{" "}
                {payment.customerNumber}
              </Text>
            )}
            {payment.customerEmail && (
              <Text style={styles.infoText}>
                <Text style={styles.boldText}>Email:</Text>{" "}
                {payment.customerEmail}
              </Text>
            )}
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            <Text style={styles.infoText}>
              <Text style={styles.boldText}>Status:</Text>{" "}
              {getStatusText(payment.status)}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.boldText}>Method:</Text>{" "}
              {getPaymentMethodText(payment.paymentMethod)}
            </Text>
            {payment.dueDate && (
              <Text style={styles.infoText}>
                <Text style={styles.boldText}>Due Date:</Text>{" "}
                {new Date(payment.dueDate).toLocaleDateString("en-IN")}
              </Text>
            )}
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.paymentDetails}>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid:</Text>
            <Text style={styles.detailValue}>
              Rs.{formatIndianCurrency(payment.amount)}
            </Text>
          </View>

          {payment.balanceDue && payment.balanceDue > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Balance Due:</Text>
              <Text style={styles.detailValue}>
                Rs.{formatIndianCurrency(payment.balanceDue)}
              </Text>
            </View>
          )}

          {payment.transactionId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID:</Text>
              <Text style={styles.detailValue}>{payment.transactionId}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Date:</Text>
            <Text style={styles.detailValue}>
              {new Date(payment.createdAt).toLocaleString("en-IN")}
            </Text>
          </View>
        </View>

        {/* Amount Section */}
        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <Text style={styles.detailLabel}>Total Amount:</Text>
            <Text style={styles.detailValue}>
              Rs.{formatIndianCurrency(payment.amount)}
            </Text>
          </View>

          <View style={styles.totalAmount}>
            <Text style={styles.detailLabel}>Amount in Words:</Text>
            <Text style={[styles.detailValue, { textAlign: "right", flex: 1 }]}>
              {numberToWords(payment.amount)}
            </Text>
          </View>
        </View>

        {/* Terms and Conditions */}
        <View style={{ marginBottom: 15 }}>
          <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          <Text style={styles.infoText}>
            1. This is a computer generated receipt and does not require
            signature.
          </Text>
          <Text style={styles.infoText}>
            2. Please keep this receipt for your records.
          </Text>
          <Text style={styles.infoText}>
            3. For any queries, contact us within 7 days of payment.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signature}>
          <Text>_________________________</Text>
          <Text>Authorized Signature</Text>
          <Text>Rudra Arts & Handicrafts</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This is an electronically generated receipt - Valid without
            signature
          </Text>
          <Text>Generated on: {new Date().toLocaleString("en-IN")}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PaymentReceiptPDF;
