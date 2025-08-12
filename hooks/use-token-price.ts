"use client"

import { useState, useEffect, useCallback } from "react"

interface TokenPrice {
  usd: number
  usd_24h_change: number
}

interface PriceData {
  [key: string]: TokenPrice
}

// CoinGecko API 的代币映射
const TOKEN_IDS = {
  ETH: "ethereum",
  USDC: "usd-coin",
  USDT: "tether",
  cbETH: "coinbase-wrapped-staked-eth",
  WETH: "weth",
  DAI: "dai",
  COMP: "compound-governance-token",
  UNI: "uniswap",
  BTC: "bitcoin",
  BNB: "binancecoin",
  ADA: "cardano",
  SOL: "solana",
}

// 备用价格数据
const FALLBACK_PRICES: PriceData = {
  ETH: { usd: 2400, usd_24h_change: 2.5 },
  USDC: { usd: 1.0, usd_24h_change: 0.1 },
  USDT: { usd: 1.0, usd_24h_change: -0.05 },
  cbETH: { usd: 2420, usd_24h_change: 2.3 },
  WETH: { usd: 2400, usd_24h_change: 2.5 },
  DAI: { usd: 1.0, usd_24h_change: 0.02 },
  COMP: { usd: 45, usd_24h_change: -1.2 },
  UNI: { usd: 8.5, usd_24h_change: 3.1 },
  BTC: { usd: 45000, usd_24h_change: 1.8 },
  BNB: { usd: 320, usd_24h_change: -0.5 },
  ADA: { usd: 0.45, usd_24h_change: 3.2 },
  SOL: { usd: 95, usd_24h_change: 4.1 },
}

export function useTokenPrice() {
  const [prices, setPrices] = useState<PriceData>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [dataSource, setDataSource] = useState<"coingecko" | "fallback" | null>(null)

  const fetchPrices = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("直接请求 CoinGecko API...")

      // 构建 CoinGecko API URL
      const tokenIds = Object.values(TOKEN_IDS).join(",")
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds}&vs_currencies=usd&include_24hr_change=true`

      console.log("请求URL:", url)

      // 创建 AbortController 用于超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "TokenPriceTracker/1.0",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("CoinGecko 原始响应:", data)

      // 转换数据格式
      const priceData: PriceData = {}

      for (const [symbol, coinId] of Object.entries(TOKEN_IDS)) {
        const coinData = data[coinId]
        if (coinData) {
          priceData[symbol] = {
            usd: coinData.usd || 0,
            usd_24h_change: coinData.usd_24h_change || 0,
          }
        }
      }

      // 检查是否获取到了数据
      if (Object.keys(priceData).length === 0) {
        throw new Error("No price data received from CoinGecko")
      }

      setPrices(priceData)
      setDataSource("coingecko")
      setLastUpdated(new Date())
      setError(null)

      console.log("成功获取价格数据:", priceData)
    } catch (err) {
      console.error("请求 CoinGecko 失败:", err)

      // 使用备用数据
      setPrices(FALLBACK_PRICES)
      setDataSource("fallback")
      setLastUpdated(new Date())

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          setError("请求超时 - 使用备用价格数据")
        } else {
          setError(`CoinGecko API 不可用: ${err.message} - 使用备用价格数据`)
        }
      } else {
        setError("网络错误 - 使用备用价格数据")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getDynamicTokenPrice = useCallback(
    async (tokenAddress: string, tokenSymbol: string) => {
      try {
        // 首先检查是否已有缓存价格
        if (prices[tokenSymbol]) {
          return prices[tokenSymbol].usd
        }

        console.log(`获取动态代币价格: ${tokenSymbol} (${tokenAddress})`)

        // 直接通过 CoinGecko API 获取价格（通过合约地址）
        const url = `https://api.coingecko.com/api/v3/simple/token_price/base?contract_addresses=${tokenAddress}&vs_currencies=usd&include_24hr_change=true`

        console.log("动态价格请求URL:", url)

        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "TokenPriceTracker/1.0",
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log("动态价格响应:", data)

          const tokenData = data[tokenAddress.toLowerCase()]

          if (tokenData && tokenData.usd) {
            // 更新本地价格缓存
            setPrices((prev) => ({
              ...prev,
              [tokenSymbol]: {
                usd: tokenData.usd,
                usd_24h_change: tokenData.usd_24hr_change || 0,
              },
            }))
            return tokenData.usd
          }
        }

        console.warn(`无法获取 ${tokenSymbol} 的价格`)
        return 0
      } catch (error) {
        console.error("获取动态代币价格失败:", error)
        return 0
      }
    },
    [prices],
  )

  // 初始加载
  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  // 每60秒更新一次价格
  useEffect(() => {
    const interval = setInterval(fetchPrices, 60000)
    return () => clearInterval(interval)
  }, [fetchPrices])

  const getTokenPrice = useCallback(
    (symbol: string): number => {
      return prices[symbol]?.usd || 0
    },
    [prices],
  )

  const getTokenPriceChange = useCallback(
    (symbol: string): number => {
      return prices[symbol]?.usd_24h_change || 0
    },
    [prices],
  )

  const calculateUSDValue = useCallback(
    (symbol: string, amount: string | number): number => {
      const price = getTokenPrice(symbol)
      const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
      if (isNaN(numAmount) || !price) return 0
      return price * numAmount
    },
    [getTokenPrice],
  )

  const formatUSDValue = useCallback((value: number): string => {
    if (value === 0) return "$0.00"
    if (value < 0.01) return "<$0.01"
    if (value < 1) return `$${value.toFixed(3)}`
    if (value < 1000) return `$${value.toFixed(2)}`
    if (value < 1000000) return `$${(value / 1000).toFixed(2)}K`
    return `$${(value / 1000000).toFixed(2)}M`
  }, [])

  const refreshPrices = useCallback(() => {
    fetchPrices()
  }, [fetchPrices])

  return {
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
    getDynamicTokenPrice,
  }
}
