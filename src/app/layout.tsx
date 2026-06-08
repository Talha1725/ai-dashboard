import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Business Health Dashboard",
  description: "A unified daily view of cashflow, profit, overtime, deliveries, and payments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
