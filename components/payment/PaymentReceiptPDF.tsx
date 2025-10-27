// components/payment/PaymentReceiptPDF.tsx
"use client";
import { useState } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

interface Payment {
  id: string;
  customerName: string;
  customerNumber: string | null;
  amount: number;
  paymentMethod: "UPI" | "CASH" | "BANK_TRANSFER" | "CARD";
  transactionId: string | null;
  createdAt: string;
  receiptNumber: string;
}

interface PaymentReceiptPDFProps {
  payment: Payment;
  children: (props: {
    loading: boolean;
    generatePDF: () => void;
  }) => React.ReactNode;
}

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2 solid #3B82F6",
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 5,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3B82F6",
    marginBottom: 10,
  },
  section: {
    marginTop: 5,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#374151",
    backgroundColor: "#F3F4F6",
    padding: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  label: {
    fontWeight: "bold",
    color: "#6B7280",
    width: "40%",
  },
  value: {
    width: "60%",
    color: "#374151",
  },
  amountSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#F0F9FF",
    border: "1 solid #3B82F6",
    borderRadius: 5,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#065F46",
    textAlign: "center",
  },
  amountInWords: {
    fontSize: 12,
    color: "#374151",
    textAlign: "center",
    marginTop: 5,
    fontStyle: "italic",
  },
  footer: {
    marginTop: 30,
    paddingTop: 10,
    borderTop: "1 solid #E5E7EB",
    textAlign: "center",
    color: "#6B7280",
    fontSize: 10,
  },
  signature: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
    borderTop: "1 solid #000",
    paddingTop: 5,
    textAlign: "center",
    fontSize: 10,
  },
  address: {
    textAlign: "left",
    marginBottom: 10,
    fontSize: 10,
    color: "#6B7280",
  },
});

// Function to convert number to words (fixed version)
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

  if (num === 0) return "Zero";

  let words = "";

  // Handle rupees part
  let rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  // Helper function to convert numbers below 1000
  const convertBelowThousand = (n: number): string => {
    if (n === 0) return "";

    let result = "";

    // Hundreds
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred";
      n %= 100;
      if (n > 0) result += " and ";
    }

    // Tens and Ones
    if (n > 0) {
      if (n < 20) {
        result += ones[n];
      } else {
        result += tens[Math.floor(n / 10)];
        if (n % 10 > 0) {
          result += " " + ones[n % 10];
        }
      }
    }

    return result;
  };

  if (rupees > 0) {
    // Crores
    if (rupees >= 10000000) {
      const crores = Math.floor(rupees / 10000000);
      words += convertBelowThousand(crores) + " Crore";
      rupees %= 10000000;
      if (rupees > 0) words += " ";
    }

    // Lakhs
    if (rupees >= 100000) {
      const lakhs = Math.floor(rupees / 100000);
      words += convertBelowThousand(lakhs) + " Lakh";
      rupees %= 100000;
      if (rupees > 0) words += " ";
    }

    // Thousands
    if (rupees >= 1000) {
      const thousands = Math.floor(rupees / 1000);
      words += convertBelowThousand(thousands) + " Thousand";
      rupees %= 1000;
      if (rupees > 0) words += " ";
    }

    // Hundreds, Tens and Ones
    if (rupees > 0) {
      words += convertBelowThousand(rupees);
    }
  }

  // Handle paise
  if (paise > 0) {
    if (words !== "") words += " and ";
    words += convertBelowThousand(paise) + " Paise";
  }

  return words.trim() + " Only";
};

// Function to format number with Indian comma separators
const formatIndianNumber = (num: number): string => {
  // Handle decimal part
  const parts = num.toFixed(2).split(".");
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian numbering system: 1,00,000 format
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);

  if (otherNumbers !== "") {
    lastThree = "," + lastThree;
  }

  const formatted =
    otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

  return formatted + "." + decimalPart;
};

// PDF Document Component
const ReceiptDocument = ({ payment }: { payment: Payment }) => {
  const amountInWords = numberToWords(payment.amount);
  const formattedAmount = formatIndianNumber(payment.amount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>Rudra Arts and Handicrafts</Text>
          <Text style={styles.address}>
            Handmade Traditional Arts & Crafts | Quality Assured Products
          </Text>
          <Text style={styles.receiptTitle}>PAYMENT RECEIPT</Text>
          {/* <Text>Official Payment Confirmation</Text> */}
        </View>

        {/* Receipt Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receipt Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Receipt Number:</Text>
            <Text style={styles.value}>{payment.receiptNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date Issued:</Text>
            <Text style={styles.value}>
              {new Date(payment.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Time:</Text>
            <Text style={styles.value}>
              {new Date(payment.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name:</Text>
            <Text style={styles.value}>{payment.customerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone Number:</Text>
            <Text style={styles.value}>
              {payment.customerNumber || "Not Provided"}
            </Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method:</Text>
            <Text style={styles.value}>
              {payment.paymentMethod === "UPI" && "UPI Payment"}
              {payment.paymentMethod === "CASH" && "Cash Payment"}
              {payment.paymentMethod === "BANK_TRANSFER" && "Bank Transfer"}
              {payment.paymentMethod === "CARD" && "Card Payment"}
            </Text>
          </View>
          {payment.transactionId && (
            <View style={styles.row}>
              <Text style={styles.label}>Transaction ID:</Text>
              <Text style={[styles.value, { fontFamily: "Courier" }]}>
                {payment.transactionId}
              </Text>
            </View>
          )}
        </View>

        {/* Amount Section */}
        <View style={styles.amountSection}>
          <Text style={styles.amountText}>
            Amount Paid: Rs.{formattedAmount}
          </Text>
          <Text style={styles.amountInWords}>{amountInWords}</Text>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={[styles.value, { marginBottom: 10 }]}>
            • This receipt acknowledges the payment received for goods/services
            provided
          </Text>
          <Text style={styles.value}>
            • Please retain this receipt for your records and any future
            references
          </Text>
        </View>

        {/* Signature Section */}
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text>Customer Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Authorized Signature</Text>
            <Text style={{ fontSize: 8, marginTop: 2 }}>
              Rudra Arts and Handicrafts
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for choosing Rudra Arts and Handicrafts!</Text>
          <Text>For any queries, contact: +91-7028996666</Text>
          <Text>Website: www.rudraartsandhandicrafts.com</Text>
          <Text style={{ marginTop: 5 }}>
            This is a computer-generated receipt. No physical signature
            required.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// Main PDF Component with Download Functionality
export default function PaymentReceiptPDF({
  payment,
  children,
}: PaymentReceiptPDFProps) {
  const [loading, setLoading] = useState(false);

  const generatePDF = async () => {
    setLoading(true);
    try {
      const blob = await pdf(<ReceiptDocument payment={payment} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${payment.receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return <>{children({ loading, generatePDF })}</>;
}
