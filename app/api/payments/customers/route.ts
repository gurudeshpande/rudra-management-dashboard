// app/api/customers/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    // Get all payments with customer details
    const payments = await prisma.payment.findMany({
      include: {
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Group payments by customer (using customerId as unique identifier)
    const customerMap = new Map();

    payments.forEach((payment) => {
      const customerKey = payment.customerId;

      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          id: payment.customer.id,
          name: payment.customer.name,
          number: payment.customer.number,
          email: payment.customer.email,
          totalPayments: 0,
          totalAmount: 0,
          lastPaymentDate: payment.createdAt,
          payments: [],
        });
      }

      const customer = customerMap.get(customerKey);
      customer.totalPayments += 1;
      customer.totalAmount += payment.amount;
      customer.payments.push(payment);

      // Update last payment date if this payment is newer
      if (new Date(payment.createdAt) > new Date(customer.lastPaymentDate)) {
        customer.lastPaymentDate = payment.createdAt;
      }
    });

    const customers = Array.from(customerMap.values()).map((customer) => ({
      id: customer.id,
      name: customer.name,
      number: customer.number,
      email: customer.email,
      totalPayments: customer.totalPayments,
      totalAmount: customer.totalAmount,
      lastPaymentDate: customer.lastPaymentDate,
    }));

    // Sort by last payment date (most recent first)
    customers.sort(
      (a, b) =>
        new Date(b.lastPaymentDate).getTime() -
        new Date(a.lastPaymentDate).getTime()
    );

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
