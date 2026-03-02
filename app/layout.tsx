import type { Metadata } from "next";
import React from "react";
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
  title: {
    default: "Rudra Arts and Handicrafts",
    template: "%s",
  },
  description: "Invoice management system for Rudra Arts and Handicrafts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
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
