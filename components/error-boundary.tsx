"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Web3 Error Boundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert className="bg-red-900/50 border-red-600">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-200">
                <div className="space-y-4">
                  <div>
                    <p className="font-medium">Application encountered an error</p>
                    <p className="text-sm mt-1">{this.state.error?.message || "Unknown error"}</p>
                  </div>
                  <Button
                    onClick={() => {
                      this.setState({ hasError: false, error: undefined })
                      window.location.reload()
                    }}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reload Page
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
