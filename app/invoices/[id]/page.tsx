// app/invoices/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import InvoiceView from "@/components/invoice/InvoiceView";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    token?: string;
    phone?: string;
  }>;
}

export default async function PublicInvoicePage({
  params,
  searchParams,
}: PageProps) {
  // Await both params and searchParams
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const invoiceId = parseInt(resolvedParams.id);
  const token = resolvedSearchParams.token;
  const phone = resolvedSearchParams.phone;

  // Validate token for security
  let allowAccess = false;

  if (process.env.NODE_ENV === "development") {
    // Allow access in development without token
    allowAccess = true;
  } else if (token && phone) {
    // Validate token in production
    allowAccess = validateToken(token, phone, invoiceId);
  }

  if (!allowAccess) {
    notFound();
  }

  // Fetch invoice with all related data
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  return <InvoiceView invoice={invoice} />;
}

// Simple token validation
function validateToken(
  token: string,
  phone: string,
  invoiceId: number
): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("ascii");
    const [decodedInvoiceId, decodedPhone, timestamp] = decoded.split(":");

    // Check if token is not expired (valid for 30 days)
    const tokenDate = new Date(parseInt(timestamp));
    const now = new Date();
    const daysDifference =
      (now.getTime() - tokenDate.getTime()) / (1000 * 60 * 60 * 24);

    return (
      parseInt(decodedInvoiceId) === invoiceId &&
      decodedPhone === phone &&
      daysDifference <= 30
    );
  } catch {
    return false;
  }
}
