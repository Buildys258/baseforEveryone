"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Activity, Wifi, WifiOff } from "lucide-react"
import { useTokenPrice } from "@/hooks/use-token-price"

export function PriceTestPanel() {
  const [isVisible, setIsVisible] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunningTest, setIsRunningTest] = useState(false)

  const {
    prices,
    isLoading,
    error,
    lastUpdated,
    dataSource,
    getTokenPrice,
    getTokenPriceChange,
    calculateUSDValue,
    formatUSDValue,
    refreshPrices,
  } = useTokenPrice()

  const runPriceTest = async () => {
    setIsRunningTest(true)
    setTestResults([])

    const results = []

    // Test 1: Check if prices are loaded
    results.push({
      test: "Prices Loaded",
      status: Object.keys(prices).length > 0 ? "pass" : "fail",
      details: `${Object.keys(prices).length} tokens loaded`,
      data: prices,
    })

    // Test 2: Check data source
    results.push({
      test: "Data Source",
      status: dataSource ? "pass" : "fail",
      details: `Source: ${dataSource || "unknown"}`,
      data: dataSource,
    })

    // Test 3: Test API endpoint directly
    try {
      const response = await fetch("/api/prices")
      const apiData = await response.json()
      results.push({
        test: "API Endpoint",
        status: response.ok && apiData.success ? "pass" : "fail",
        details: `Status: ${response.status}, Success: ${apiData.success}`,
        data: apiData,
      })
    } catch (err) {
      results.push({
        test: "API Endpoint",
        status: "fail",
        details: `Error: ${err.message}`,
        data: err,
      })
    }

    // Test 4: Test individual token prices
    const testTokens = ["ETH", "USDC", "USDT"]
    testTokens.forEach((token) => {
      const price = getTokenPrice(token)
      const change = getTokenPriceChange(token)
      results.push({
        test: `${token} Price`,
        status: price > 0 ? "pass" : "fail",
        details: `$${price.toFixed(2)} (${change > 0 ? "+" : ""}${change.toFixed(2)}%)`,
        data: { price, change },
      })
    })

    // Test 5: Test USD value calculation
    const testAmount = "1.5"
    const usdValue = calculateUSDValue("ETH", testAmount)
    results.push({
      test: "USD Calculation",
      status: usdValue > 0 ? "pass" : "fail",
      details: `${testAmount} ETH = ${formatUSDValue(usdValue)}`,
      data: { amount: testAmount, usdValue },
    })

    // Test 6: Test last updated timestamp
    results.push({
      test: "Last Updated",
      status: lastUpdated ? "pass" : "fail",
      details: lastUpdated ? lastUpdated.toLocaleString() : "Never updated",
      data: lastUpdated,
    })

    setTestResults(results)
    setIsRunningTest(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "fail":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getDataSourceBadge = () => {
    if (!dataSource) return null

    const config = {
      coingecko: { color: "bg-green-600", icon: <Wifi className="w-3 h-3" />, text: "Live Data" },
      fallback: { color: "bg-orange-600", icon: <WifiOff className="w-3 h-3" />, text: "Fallback" },
    }

    const { color, icon, text } = config[dataSource] || config.fallback

    return (
      <Badge className={`${color} text-white`}>
        {icon}
        <span className="ml-1">{text}</span>
      </Badge>
    )
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 rounded-full p-3"
          title="Open Price Test Panel"
        >
          <Activity className="w-5 h-5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="bg-gray-900 border-gray-700 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">Price Test Panel</h3>
            {getDataSourceBadge()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white"
          >
            ×
          </Button>
        </div>

        {/* Current Status */}
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Current Status</span>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              ) : error ? (
                <XCircle className="w-4 h-4 text-red-400" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-400" />
              )}
            </div>
          </div>

          <div className="text-xs space-y-1">
            <div>Tokens: {Object.keys(prices).length}</div>
            <div>Source: {dataSource || "Unknown"}</div>
            <div>Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Never"}</div>
            {error && <div className="text-red-400">Error: {error}</div>}
          </div>
        </div>

        {/* Sample Prices */}
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">Sample Prices</div>
          <div className="space-y-1 text-xs">
            {["ETH", "USDC", "USDT"].map((token) => {
              const price = getTokenPrice(token)
              const change = getTokenPriceChange(token)
              return (
                <div key={token} className="flex items-center justify-between">
                  <span>{token}</span>
                  <div className="flex items-center gap-2">
                    <span>${price.toFixed(price < 1 ? 4 : 2)}</span>
                    {change !== 0 && (
                      <span className={`flex items-center gap-1 ${change > 0 ? "text-green-400" : "text-red-400"}`}>
                        {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(change).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Test Controls */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={runPriceTest}
            disabled={isRunningTest}
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isRunningTest ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 mr-2" />
                Run Tests
              </>
            )}
          </Button>

          <Button
            onClick={refreshPrices}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="border-gray-600 bg-transparent"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <div className="text-sm text-gray-400 mb-2">Test Results</div>
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-800 rounded text-xs">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <span>{result.test}</span>
                </div>
                <div className="text-right text-gray-400">
                  <div>{result.details}</div>
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="mt-3 p-2 bg-gray-800 rounded">
              <div className="text-xs text-gray-400">
                Summary: {testResults.filter((r) => r.status === "pass").length}/{testResults.length} tests passed
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
