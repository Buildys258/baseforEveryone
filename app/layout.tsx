import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/web3-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { LanguageProvider } from "@/hooks/use-language";
import { FinancialWarningModal } from "@/components/financial-warning-modal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Base for Everyone",
  description:
    "A decentralized exchange interface for Base chain - accessible to everyone",
  generator: "v0.dev",
  icons: {
    icon: "/base-icon.jpg", // public/base-icon.jpg
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/base-icon.jpg" />
      </head>
      <body className={inter.className}>
        <LanguageProvider>
          <ErrorBoundary>
            <Web3Provider>
              {children}
              <FinancialWarningModal />
            </Web3Provider>
          </ErrorBoundary>
        </LanguageProvider>
      </body>
    </html>
  );
}
