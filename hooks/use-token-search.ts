"use client"

import { useState, useCallback, useRef } from "react"
import { createPublicClient, http, isAddress } from "viem"
import { base } from "wagmi/chains"

interface TokenInfo {
  symbol: string
  name: string
  address: string
  decimals: number
  icon?: string
}

const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
] as const

export function useTokenSearch() {
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false) // 新增：是否已经搜索过

  // 创建独立的公共客户端，不依赖钱包连接
  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  })

  // 使用 ref 来跟踪当前搜索请求，避免竞态条件
  const currentSearchRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const searchToken = useCallback(
    async (query: string): Promise<TokenInfo | null> => {
      // 检查是否为有效的合约地址
      if (!isAddress(query)) {
        return null
      }

      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // 创建新的 AbortController
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      // 设置当前搜索地址
      currentSearchRef.current = query

      try {
        console.log("Searching for token:", query)
        const contractAddress = query as `0x${string}`

        // 检查是否被取消
        if (abortController.signal.aborted) {
          return null
        }

        let name: string
        let symbol: string
        let decimals: number

        // 获取 token name
        try {
          const nameResult = await publicClient.readContract({
            address: contractAddress,
            abi: ERC20_ABI,
            functionName: "name",
          })

          // 检查是否被取消或不是当前请求
          if (abortController.signal.aborted || currentSearchRef.current !== query) {
            return null
          }

          name = nameResult as string
          if (!name || typeof name !== "string" || name.trim() === "") {
            throw new Error("Invalid token name")
          }
        } catch (error) {
          if (abortController.signal.aborted || currentSearchRef.current !== query) return null
          throw new Error("Unable to read token name")
        }

        // 获取 token symbol
        try {
          const symbolResult = await publicClient.readContract({
            address: contractAddress,
            abi: ERC20_ABI,
            functionName: "symbol",
          })

          if (abortController.signal.aborted || currentSearchRef.current !== query) {
            return null
          }

          symbol = symbolResult as string
          if (!symbol || typeof symbol !== "string" || symbol.trim() === "") {
            throw new Error("Invalid token symbol")
          }
        } catch (error) {
          if (abortController.signal.aborted || currentSearchRef.current !== query) return null
          throw new Error("Unable to read token symbol")
        }

        // 获取 token decimals
        try {
          const decimalsResult = await publicClient.readContract({
            address: contractAddress,
            abi: ERC20_ABI,
            functionName: "decimals",
          })

          if (abortController.signal.aborted || currentSearchRef.current !== query) {
            return null
          }

          decimals = Number(decimalsResult)
          if (isNaN(decimals) || decimals < 0 || decimals > 255) {
            throw new Error("Invalid token decimals")
          }
        } catch (error) {
          if (abortController.signal.aborted || currentSearchRef.current !== query) return null
          throw new Error("Unable to read token decimals")
        }

        // 最终检查是否被取消或不是当前请求
        if (abortController.signal.aborted || currentSearchRef.current !== query) {
          return null
        }

        const iconUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/${query}/logo.png`

        const tokenInfo: TokenInfo = {
          name: name.trim(),
          symbol: symbol.trim(),
          address: query,
          decimals,
          icon: iconUrl,
        }

        console.log("Token info found:", tokenInfo)
        return tokenInfo
      } catch (error) {
        // 检查是否被取消或不是当前请求
        if (abortController.signal.aborted || currentSearchRef.current !== query) {
          return null
        }

        console.error("Token search error:", error)

        if (error instanceof Error) {
          if (error.message.includes("Unable to read token")) {
            throw new Error("Contract is not a valid ERC20 token")
          } else if (error.message.includes("execution reverted")) {
            throw new Error("Contract exists but does not implement ERC20 interface")
          } else if (error.message.includes("call exception") || error.message.includes("CALL_EXCEPTION")) {
            throw new Error("Contract not found or invalid address")
          } else if (error.message.includes("network") || error.message.includes("fetch")) {
            throw new Error("Network error - please check your connection")
          } else {
            throw new Error("Failed to fetch token information")
          }
        } else {
          throw new Error("Unknown error occurred while searching for token")
        }
      }
    },
    [publicClient],
  )

  const performSearch = useCallback(
    async (query: string) => {
      // 重置状态
      setSearchError(null)
      setHasSearched(false)

      // 如果不是有效地址，直接返回
      if (!isAddress(query) || query.length !== 42) {
        setIsSearching(false)
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
    [searchToken],
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
