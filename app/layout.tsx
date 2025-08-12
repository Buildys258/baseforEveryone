import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Web3Provider } from "@/components/web3-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { LanguageProvider } from "@/hooks/use-language"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Base for Everyone",
  description: "A decentralized exchange interface for Base chain - accessible to everyone",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <ErrorBoundary>
            <Web3Provider>{children}</Web3Provider>
          </ErrorBoundary>
        </LanguageProvider>
      </body>
    </html>
  )
}
