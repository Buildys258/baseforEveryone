"use client"

import { useState, useCallback, useRef } from "react"
import { isAddress } from "viem"

interface TokenInfo {
  symbol: string
  name: string
  address: string
  decimals: number
  icon?: string
  price?: number
  marketCap?: number
  volume24h?: number
  priceChange24h?: number
  liquidity?: number
}

interface DexScreenerToken {
  address: string
  name: string
  symbol: string
  decimals?: number
}

interface DexScreenerPair {
  chainId:string,
  baseToken: DexScreenerToken
  quoteToken: DexScreenerToken
  dexId: string
  url: string
  pairAddress: string
  priceUsd?: string
  volume?: {
    h24: number
  }
  priceChange?: {
    h24: number
  }
  liquidity?: {
    usd: number
  }
  marketCap?: number
}

interface DexScreenerResponse {
  pairs: DexScreenerPair[]
}

interface CoinGeckoTokenInfo {
  id: string
  symbol: string
  name: string
  image?: {
    thumb?: string
    small?: string
    large?: string
  }
  market_data?: {
    current_price?: {
      usd?: number
    }
    market_cap?: {
      usd?: number
    }
    total_volume?: {
      usd?: number
    }
    price_change_percentage_24h?: number
  }
  contract_address?: string
  detail_platforms?: {
    [key: string]: {
      decimal_place?: number
      contract_address?: string
    }
  }
}

export function useTokenSearch() {
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // 使用 ref 来跟踪当前搜索请求，避免竞态条件
  const currentSearchRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // DexScreener API 搜索
  const searchTokenFromDexScreener = useCallback(
    async (address: string): Promise<TokenInfo | null> => {
      try {
        const response = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${address}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: abortControllerRef.current?.signal,
          }
        )
        if (!response.ok) {
          if (response.status === 404) {
            return null // Token not found on DexScreener
          }
          throw new Error(`DexScreener API error: ${response.status}`)
        }

        const data: DexScreenerResponse = await response.json()
        if (!data.pairs || data.pairs.length === 0 || data?.pairs?.[0].chainId !== 'base') {
          return null
        }

        // 找到最活跃的交易对
        const bestPair = data.pairs.reduce((best, current) => {
          const currentVolume = current.volume?.h24 || 0
          const bestVolume = best.volume?.h24 || 0
          return currentVolume > bestVolume ? current : best
        })

        const token = bestPair.baseToken.address.toLowerCase() === address.toLowerCase() 
          ? bestPair.baseToken 
          : bestPair.quoteToken

        // 如果找到的token地址不匹配，返回null
        if (token.address.toLowerCase() !== address.toLowerCase()) {
          return null
        }

        const tokenInfo: TokenInfo = {
          name: token.name,
          symbol: token.symbol,
          address: token.address,
          decimals: token.decimals || 18,
          price: bestPair.priceUsd ? parseFloat(bestPair.priceUsd) : undefined,
          volume24h: bestPair.volume?.h24,
          priceChange24h: bestPair.priceChange?.h24,
          liquidity: bestPair.liquidity?.usd,
          marketCap: bestPair.marketCap,
          icon: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/${address}/logo.png`
        }
        return tokenInfo
      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) {
          return null
        }
        console.error('DexScreener search error:', error)
        throw error
      }
    },
    []
  )

  // CoinGecko API 搜索（作为备选方案）
  const searchTokenFromCoinGecko = useCallback(
    async (address: string): Promise<TokenInfo | null> => {
      try {
        // 首先尝试通过合约地址搜索
        const searchResponse = await fetch(
          `https://api.coingecko.com/api/v3/search?query=${address}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: abortControllerRef.current?.signal,
          }
        )

        if (!searchResponse.ok) {
          throw new Error(`CoinGecko search API error: ${searchResponse.status}`)
        }

        const searchData = await searchResponse.json()
        
        // 查找匹配的代币
        const matchingCoin = searchData.coins?.find((coin: any) => 
          coin.platforms?.base?.toLowerCase() === address.toLowerCase()
        )

        if (!matchingCoin) {
          return null
        }

        // 获取详细信息
        const detailResponse = await fetch(
          `https://api.coingecko.com/api/v3/coins/${matchingCoin.id}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: abortControllerRef.current?.signal,
          }
        )

        if (!detailResponse.ok) {
          throw new Error(`CoinGecko detail API error: ${detailResponse.status}`)
        }

        const coinData: CoinGeckoTokenInfo = await detailResponse.json()

        // 获取 Base 链的合约信息
        const baseInfo = coinData.detail_platforms?.['base-ecosystem'] || coinData.detail_platforms?.['base']
        
        const tokenInfo: TokenInfo = {
          name: coinData.name,
          symbol: coinData.symbol.toUpperCase(),
          address: address,
          decimals: baseInfo?.decimal_place || 18,
          price: coinData.market_data?.current_price?.usd,
          volume24h: coinData.market_data?.total_volume?.usd,
          priceChange24h: coinData.market_data?.price_change_percentage_24h,
          marketCap: coinData.market_data?.market_cap?.usd,
          icon: coinData.image?.large || coinData.image?.small || coinData.image?.thumb
        }

        return tokenInfo
      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) {
          return null
        }
        console.error('CoinGecko search error:', error)
        throw error
      }
    },
    []
  )

  // 主搜索函数
  const searchToken = useCallback(
    async (query: string): Promise<TokenInfo | null> => {
      // 检查是否为有效的合约地址
      if (!isAddress(query)) {
        throw new Error("Invalid contract address format")
      }

      const address = query.toLowerCase()

      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // 创建新的 AbortController
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      // 设置当前搜索地址
      currentSearchRef.current = query

      console.log("Searching for token:", address)

      try {
        // 首先尝试 DexScreener
        let tokenInfo = await searchTokenFromDexScreener(address)
        
        // 检查是否被取消或不是当前请求
        if (abortController.signal.aborted || currentSearchRef.current !== query) {
          return null
        }

        // 如果 DexScreener 没有找到，尝试 CoinGecko
        if (!tokenInfo) {
          console.log("Token not found on DexScreener, trying CoinGecko...")
          tokenInfo = await searchTokenFromCoinGecko(address)
        }

        // 再次检查是否被取消或不是当前请求
        if (abortController.signal.aborted || currentSearchRef.current !== query) {
          return null
        }

        if (tokenInfo) {
          console.log("Token info found:", tokenInfo)
          return tokenInfo
        } else {
          throw new Error("Token not found on any supported platform")
        }

      } catch (error) {
        // 检查是否被取消或不是当前请求
        if (abortController.signal.aborted || currentSearchRef.current !== query) {
          return null
        }

        console.error("Token search error:", error)

        if (error instanceof Error) {
          if (error.message.includes("Token not found")) {
            throw new Error("Token not found on DexScreener or CoinGecko. The token may not be listed yet.")
          } else if (error.message.includes("API error")) {
            throw new Error("API service temporarily unavailable. Please try again later.")
          } else if (error.message.includes("network") || error.message.includes("fetch")) {
            throw new Error("Network error - please check your connection")
          } else {
            throw new Error(error.message || "Failed to fetch token information")
          }
        } else {
          throw new Error("Unknown error occurred while searching for token")
        }
      }
    },
    [searchTokenFromDexScreener, searchTokenFromCoinGecko]
  )

  const performSearch = useCallback(
    async (query: string) => {
      // 重置状态
      setSearchError(null)
      setHasSearched(false)

      // 如果不是有效地址，直接返回
      if (!isAddress(query) || query.length !== 42) {
        setIsSearching(false)
        setSearchError("Please enter a valid contract address")
        setHasSearched(true)
        return null
      }

      setIsSearching(true)

      try {
        const result = await searchToken(query)

        // 只有当前搜索请求才更新状态
        if (currentSearchRef.current === query) {
          setIsSearching(false)
          setHasSearched(true)
          return result
        }
        return null
      } catch (error) {
        // 只有当前搜索请求才更新错误状态
        if (currentSearchRef.current === query) {
          setIsSearching(false)
          setHasSearched(true)
          if (error instanceof Error) {
            setSearchError(error.message)
          } else {
            setSearchError("Unknown error occurred")
          }
        }
        return null
      }
    },
    [searchToken]
  )

  const clearError = useCallback(() => {
    setSearchError(null)
  }, [])

  const resetSearch = useCallback(() => {
    // 取消当前请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    currentSearchRef.current = null
    setIsSearching(false)
    setSearchError(null)
    setHasSearched(false)
  }, [])

  return {
    performSearch,
    isSearching,
    searchError,
    hasSearched,
    clearError,
    resetSearch,
  }
}