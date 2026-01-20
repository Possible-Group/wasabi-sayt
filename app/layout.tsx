import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

import "@/styles/globals.css";
import "@/styles/site.css";

const bodyFont = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  icons: {
    icon: "/icons/logo.png",
    apple: "/icons/logo.png",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Root layout ALWAYS must render html/body
  return (
    <html lang="ru">
      <body className={`ws-body ${bodyFont.variable} ${displayFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
