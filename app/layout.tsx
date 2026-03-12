import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Sidebar from "./components/Sidebar";
import "./globals.css";
import { Toaster } from "sonner";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Inward-Outward Management System",
  description: "A digital logbook for organizations",
};

import LayoutWrapper from "./components/LayoutWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased text-slate-900`}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
