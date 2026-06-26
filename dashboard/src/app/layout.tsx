import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Handysolver Car Dealership",
  description: "WhatsApp Lead Management Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
