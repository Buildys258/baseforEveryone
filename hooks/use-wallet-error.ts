"use client"

import { useState, useCallback } from "react"

interface WalletError {
  type: "connection" | "network" | "rejection" | "timeout" | "unknown"
  message: string
  action?: string
}

export function useWalletError() {
  const [error, setError] = useState<WalletError | null>(null)

  const handleError = useCallback((err: Error, context = "") => {
    console.error(`Wallet error (${context}):`, err)

    if (err.message.includes("User rejected") || err.message.includes("用户拒绝")) {
      setError({
        type: "rejection",
        message: "用户取消了操作",
        action: "请重新尝试",
      })
    } else if (err.message.includes("No injected provider") || err.message.includes("未检测到")) {
      setError({
        type: "connection",
        message: "未检测到钱包",
        action: "请安装 MetaMask 或其他支持的钱包",
      })
    } else if (err.message.includes("timeout") || err.message.includes("超时")) {
      setError({
        type: "timeout",
        message: "操作超时",
        action: "请检查网络连接并重试",
      })
    } else if (err.message.includes("network") || err.message.includes("网络")) {
      setError({
        type: "network",
        message: "网络错误",
        action: "请检查网络设置并重试",
      })
    } else {
      setError({
        type: "unknown",
        message: "操作失败",
        action: "请重试或联系技术支持",
      })
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    handleError,
    clearError,
  }
}
