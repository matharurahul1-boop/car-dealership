import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PWARegister } from "@/components/PWARegister";

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Handysolver Car Dealership",
  description: "WhatsApp Lead Management Dashboard",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Handysolver",
    startupImage: ["/icons/icon-512"],
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/icon-192",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#2563eb",
    "msapplication-tap-highlight": "no",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Capture beforeinstallprompt before React hydrates so it's never missed */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.__installPrompt = e;
          });
        `}} />
        <ThemeProvider>{children}</ThemeProvider>
        <PWARegister />
      </body>
    </html>
  );
}
