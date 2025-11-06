import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FontProvider } from "@/components/font-provider/font-provider";
import { AlertToaster } from "@/components/ui/alert-toaster";
import { ReturnedItemsProvider } from "@/contexts/ReturnedItemsContext"; // Add this import
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rudra Arts and Handicrafts",
  description: "Invoice management system for Rudra Arts and Handicrafts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <FontProvider>
          <ReturnedItemsProvider>
            {" "}
            {/* Wrap with ReturnedItemsProvider */}
            {children}
            <AlertToaster />
          </ReturnedItemsProvider>
        </FontProvider>
      </body>
    </html>
  );
}
