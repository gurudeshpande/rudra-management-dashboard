import { prisma } from "@/lib/prisma";

export async function generateInvoiceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const nextYearShort = (currentYear + 1).toString().slice(-2);

  // Find the latest invoice number for the current year
  const latestInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: `${currentYear}/`,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      invoiceNumber: true,
    },
  });

  let sequenceNumber = 1;

  if (latestInvoice) {
    // Extract the sequence number from the latest invoice
    const matches = latestInvoice.invoiceNumber.match(/-(\d+)$/);
    if (matches && matches[1]) {
      sequenceNumber = parseInt(matches[1]) + 1;
    }
  }

  // Format the sequence number with leading zeros
  const formattedSequence = sequenceNumber.toString().padStart(4, "0");

  return `${currentYear}/${nextYearShort}-INV-${formattedSequence}`;
}
