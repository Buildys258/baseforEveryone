import { type NextRequest, NextResponse } from "next/server"

const COINGECKO_API = "https://api.coingecko.com/api/v3"

// Token ID映射 (CoinGecko ID)
const TOKEN_ID_MAP: { [key: string]: string } = {
  ETH: "ethereum",
  USDC: "usd-coin",
  USDT: "tether",
  cbETH: "coinbase-wrapped-staked-eth",
  WETH: "weth",
  DAI: "dai",
  COMP: "compound-governance-token",
  UNI: "uniswap",
}

// Fallback prices in case API fails
const FALLBACK_PRICES = {
  ETH: { usd: 2400, usd_24h_change: 2.5 },
  USDC: { usd: 1.0, usd_24h_change: 0.1 },
  USDT: { usd: 1.0, usd_24h_change: -0.05 },
  cbETH: { usd: 2420, usd_24h_change: 2.3 },
  WETH: { usd: 2400, usd_24h_change: 2.5 },
  DAI: { usd: 1.0, usd_24h_change: 0.02 },
  COMP: { usd: 45, usd_24h_change: -1.2 },
  UNI: { usd: 8.5, usd_24h_change: 3.1 },
}

export async function GET(request: NextRequest) {
  try {
    const tokenIds = Object.values(TOKEN_ID_MAP).join(",")

    console.log("Fetching prices from CoinGecko...")

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${tokenIds}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; UniswapClone/1.0)",
        },
        signal: controller.signal,
      },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.warn(`CoinGecko API returned ${response.status}, using fallback prices`)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Successfully fetched prices from CoinGecko")

    // Transform data to use token symbols as keys
    const formattedPrices: any = {}
    Object.entries(TOKEN_ID_MAP).forEach(([symbol, coinGeckoId]) => {
      if (data[coinGeckoId]) {
        formattedPrices[symbol] = {
          usd: data[coinGeckoId].usd,
          usd_24h_change: data[coinGeckoId].usd_24hr_change || 0,
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedPrices,
      source: "coingecko",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.warn("CoinGecko API failed, using fallback prices:", error)

    // Return fallback prices
    return NextResponse.json({
      success: true,
      data: FALLBACK_PRICES,
      source: "fallback",
      timestamp: new Date().toISOString(),
      warning: "Using fallback prices due to API unavailability",
    })
  }
}
