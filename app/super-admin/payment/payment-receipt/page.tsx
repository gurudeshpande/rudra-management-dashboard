// app/super-admin/payment/payment-receipt/page.tsx

import PaymentReceiptPDF from "@/components/payment/PaymentReceiptPDF";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getPaymentData(paymentId: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { customer: true },
    });
    return payment;
  } catch (error) {
    console.error("Error fetching payment:", error);
    return null;
  }
}

export default async function PaymentReceiptPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const paymentId = params.id as string;

  if (!paymentId) {
    return <div>Payment ID is required</div>;
  }

  const payment = await getPaymentData(paymentId);

  if (!payment) {
    return <div>Payment not found</div>;
  }

  const paymentData = {
    id: payment.id,
    customerName: payment.customer?.name || "N/A",
    customerNumber: payment.customer?.number || "N/A",
    amount: payment.amount,
    paymentMethod: payment.paymentMethod as
      | "UPI"
      | "CASH"
      | "BANK_TRANSFER"
      | "CARD",
    transactionId: payment.transactionId,
    createdAt: payment.createdAt.toISOString(),
    receiptNumber: payment.receiptNumber,
  };

  return (
    <div className="p-6">
      <h1>Payment Receipt</h1>
    </div>
  );
}
