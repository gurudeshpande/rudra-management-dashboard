// lib/whatsapp-service.ts
export class WhatsAppService {
  /**
   * Generate WhatsApp message with invoice link
   * This creates a direct WhatsApp link that opens in WhatsApp Web/App
   */
  generateWhatsAppMessage(invoiceData: {
    invoiceNumber: string;
    customerName: string;
    totalAmount: string;
    dueDate: string;
    invoiceUrl: string;
  }): string {
    const message = `📋 *INVOICE NOTIFICATION*\n\nDear ${invoiceData.customerName},\n\nYour invoice has been generated.\n\n📄 *Invoice #:* ${invoiceData.invoiceNumber}\n💰 *Total Amount:* ${invoiceData.totalAmount}\n📅 *Due Date:* ${invoiceData.dueDate}\n\n🔗 *View & Download Invoice:*\n${invoiceData.invoiceUrl}\n\nThank you for your business!\n\n*Note:* This link allows you to view, download, and share your invoice.`;

    return encodeURIComponent(message);
  }

  /**
   * Generate WhatsApp share URL
   */
  generateWhatsAppShareUrl(phoneNumber: string, message: string): string {
    // Format phone number (remove spaces, plus, etc.)
    const cleanedPhone = phoneNumber.replace(/\D/g, "");

    // WhatsApp Web/App URL format
    return `https://wa.me/${cleanedPhone}?text=${message}`;
  }

  /**
   * Generate invoice URL
   */
  generateInvoiceUrl(invoiceId: number, customerPhone: string): string {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Create a simple token for security
    const token = Buffer.from(
      `${invoiceId}:${customerPhone}:${Date.now()}`
    ).toString("base64");

    return `${baseUrl}/invoice/${invoiceId}?token=${token}&phone=${encodeURIComponent(
      customerPhone
    )}`;
  }

  /**
   * Alternative: Use WhatsApp click-to-chat URL
   */
  getWhatsAppDirectLink(
    phoneNumber: string,
    invoiceData: {
      invoiceNumber: string;
      customerName: string;
      totalAmount: string;
      dueDate: string;
      invoiceUrl: string;
    }
  ): string {
    const message = this.generateWhatsAppMessage(invoiceData);
    return this.generateWhatsAppShareUrl(phoneNumber, message);
  }
}
