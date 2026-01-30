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
    // Format URL to be on a separate line for better clickability
    const message = `📋 *INVOICE NOTIFICATION*\n\nDear ${invoiceData.customerName},\n\nYour invoice has been generated.\n\n📄 *Invoice #:* ${invoiceData.invoiceNumber}\n💰 *Total Amount:* ${invoiceData.totalAmount}\n📅 *Due Date:* ${invoiceData.dueDate}\n\n🔗 *View & Download Invoice:*\n${invoiceData.invoiceUrl}\n\nThank you for your business!\n\n*Note:* Click the link above to view, download, and share your invoice.`;

    return message; // Don't encode here, encode only when creating the share URL
  }

  /**
   * Generate WhatsApp share URL
   */
  generateWhatsAppShareUrl(phoneNumber: string, message: string): string {
    // Format phone number (remove spaces, plus, etc.)
    const cleanedPhone = phoneNumber.replace(/\D/g, "");

    // Ensure phone number starts with country code
    const formattedPhone = cleanedPhone.startsWith("91")
      ? cleanedPhone
      : `91${cleanedPhone}`;

    // WhatsApp Web/App URL format - encode the message
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  }

  /**
   * Generate invoice URL
   */
  generateInvoiceUrl(
    invoiceId: number,
    customerPhone: string,
    customerName: string,
  ): string {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Create a simple token for security
    const token = Buffer.from(
      `${invoiceId}:${customerPhone}:${Date.now()}`,
    ).toString("base64");

    return `${baseUrl}/users/${invoiceId}?token=${token}`;
  }

  /**
   * Alternative: Format that often works better for clickable links
   */
  generateWhatsAppMessageWithClickableLink(invoiceData: {
    invoiceNumber: string;
    customerName: string;
    totalAmount: string;
    dueDate: string;
    invoiceUrl: string;
  }): string {
    // Method 1: Put URL on its own line with spaces removed (often works better)
    const message = `📋 *INVOICE NOTIFICATION*\n\nDear ${
      invoiceData.customerName
    },\n\nYour invoice has been generated.\n\n📄 *Invoice #:* ${
      invoiceData.invoiceNumber
    }\n💰 *Total Amount:* ${invoiceData.totalAmount}\n📅 *Due Date:* ${
      invoiceData.dueDate
    }\n\n🔗 *View & Download Invoice:*\n\n${invoiceData.invoiceUrl.replace(
      /\s+/g,
      "",
    )}\n\nThank you for your business!\n\n*Note:* Click the link above to view, download, and share your invoice.`;

    return message;
  }

  /**
   * Method 2: Use shortened URL for better clickability
   */
  async generateWhatsAppMessageWithShortUrl(invoiceData: {
    invoiceNumber: string;
    customerName: string;
    totalAmount: string;
    dueDate: string;
    invoiceUrl: string;
  }): Promise<string> {
    // Optionally shorten the URL for better WhatsApp compatibility
    const shortUrl = await this.shortenUrl(invoiceData.invoiceUrl);

    const message = `📋 *INVOICE NOTIFICATION*\n\nDear ${invoiceData.customerName},\n\nYour invoice has been generated.\n\n📄 *Invoice #:* ${invoiceData.invoiceNumber}\n💰 *Total Amount:* ${invoiceData.totalAmount}\n📅 *Due Date:* ${invoiceData.dueDate}\n\n🔗 *View Invoice:* ${shortUrl}\n\nThank you for your business!`;

    return message;
  }

  /**
   * Shorten URL using a URL shortener service (optional)
   */
  private async shortenUrl(longUrl: string): Promise<string> {
    try {
      // You can use various URL shortening services:
      // 1. Bitly, TinyURL, etc.
      // 2. Or create your own using Next.js API routes

      // Example with your own API route
      const response = await fetch("/api/shorten-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: longUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.shortUrl || longUrl;
      }

      return longUrl;
    } catch (error) {
      console.error("Error shortening URL:", error);
      return longUrl;
    }
  }

  /**
   * Generate WhatsApp link with properly formatted message
   */
  getWhatsAppDirectLink(
    phoneNumber: string,
    invoiceData: {
      invoiceNumber: string;
      customerName: string;
      totalAmount: string;
      dueDate: string;
      invoiceUrl: string;
    },
  ): string {
    // Use the method with better link formatting
    const message = this.generateWhatsAppMessageWithClickableLink(invoiceData);
    return this.generateWhatsAppShareUrl(phoneNumber, message);
  }
}
