"use client"

import { useAccount, useBalance } from "wagmi"
import { formatUnits } from "viem"

export function useTokenBalance(tokenAddress?: string) {
  const { address } = useAccount()
  const {
    data: balance,
    isLoading,
    error,
  } = useBalance({
    address,
    token: tokenAddress as `0x${string}`,
  })
  const formattedBalance = balance
    ? Number.parseFloat(formatUnits(balance.value, balance.decimals))
      .toString()
      .match(/^\d+\.?\d{0,18}/)?.[0] || "0.0000"
    : "0.0000"

  return {
    balance: formattedBalance,
    symbol: balance?.symbol || "",
    isLoading,
    error,
    rawBalance: balance,
  }
}
