"use client"

import { ERC20_ABI } from "@/constant/abi/erc20"
import { useReadContract } from 'wagmi'

export const useCheckBalance = (tokenAddress: string, userAddress?: `0x${string}`) => {
  const { data: balance, isError, isLoading } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
  })

  const checkBalance = (amount: bigint) => {
    if (balance === undefined) return false
    return balance >= amount
  }

  return {
    balance,
    checkBalance,
    isLoading,
    isError
  }
}
