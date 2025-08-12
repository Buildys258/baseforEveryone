"use client"

import { useState, useCallback } from "react"
import { useAccount, useWriteContract, useSwitchChain, useReadContract } from "wagmi"
import { base } from "wagmi/chains"
import { readContract } from "@wagmi/core"
import { config } from "@/lib/web3-config"
import { parseUnits } from "viem"
import { UNISWAP_V3_ROUTER_ADDRESS } from "@/constant/address/uniswap-router"
import { UNISWAP_V3_ROUTER_ABI } from "@/constant/abi/uniswap-router"
import { ERC20_ABI } from "@/constant/abi/erc20"

interface SwapState {
  isSwapping: boolean
  swapError: string | null
  swapSuccess: boolean
  transactionHash: string | null
}

export function useSwap() {
  const [swapState, setSwapState] = useState<SwapState>({
    isSwapping: false,
    swapError: null,
    swapSuccess: false,
    transactionHash: null,
  })

  const { address, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()


  // 检查代币余额
  const checkTokenBalance = async (tokenAddress: string, userAddress: string, amount: bigint) => {
    try {
      const balance = await readContract(config,{
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress],
      }) as bigint
      return balance >= amount
    } catch (error) {
      console.error("Failed to check token balance:", error)
      return false
    }
  }

  // 检查当前授权额度
  const checkAllowance = async (tokenAddress: string, userAddress: string, spender: string) => {
    try {
      const allowance = await readContract(config,{
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [userAddress, spender],
      })

      return allowance || 0n
    } catch (error) {
      console.error("Failed to check allowance:", error)
      return 0n
    }
  }

  const executeSwap = useCallback(
    async (fromToken: any, toToken: any, fromAmount: string, toAmount: string) => {
      setSwapState({
        isSwapping: true,
        swapError: null,
        swapSuccess: false,
        transactionHash: null,
      })

      try {
        // 检测钱包类型
        const isOKXWallet = typeof window !== "undefined" && (window as any).okxwallet

        console.log("Wallet detection:", { isOKXWallet })

        // 检查钱包连接
        if (!isConnected || !address) {
          throw new Error("Please connect your wallet")
        }

        console.log("Executing swap:", {
          from: fromToken.symbol,
          to: toToken.symbol,
          fromAmount,
          toAmount,
        })

        // 转换代币地址 - 重要：ETH swap需要使用WETH地址
        const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" // Base WETH

        const tokenInAddress = fromToken.address || WETH_ADDRESS
        const tokenOutAddress = toToken.address || WETH_ADDRESS

        if (!tokenInAddress || !tokenOutAddress) {
          throw new Error("Invalid token addresses")
        }

        // ETH到其他代币：tokenIn = WETH, 发送ETH value
        // 其他代币到ETH：tokenOut = WETH, 不发送value但需要unwrap
        const isETHInput = !fromToken.address // 输入是原生ETH
        const isETHOutput = !toToken.address // 输出是原生ETH

        // 解析金额
        const amountIn = parseUnits(fromAmount, fromToken.decimals)
        const amountOutMinimum = parseUnits((Number.parseFloat(toAmount) * 0.95).toString(), toToken.decimals) // 5% slippage

        // 设置截止时间（20分钟后）
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200)

        console.log("Swap parameters:", {
          tokenIn: tokenInAddress,
          tokenOut: tokenOutAddress,
          fee: 3000,
          recipient: address,
          deadline: deadline.toString(),
          amountIn: amountIn.toString(),
          amountOutMinimum: amountOutMinimum.toString(),
        })

        let swapHash: string

        // 步骤1：如果不是原生ETH输入，需要先处理代币授权
        if (!isETHInput && fromToken.address) {
          console.log("Checking token balance and allowance...")

          // 1. 检查代币余额
          const hasEnoughBalance = await checkTokenBalance(fromToken.address, address, amountIn)
          if (!hasEnoughBalance) {
            throw new Error(`Insufficient ${fromToken.symbol} balance`)
          }

          // 2. 检查当前授权额度
          const currentAllowance = await checkAllowance(fromToken.address, address, UNISWAP_V3_ROUTER_ADDRESS)
          console.log('@@',currentAllowance )
          // 3. 如果授权不足，需要先授权
          if (currentAllowance < amountIn) {
            console.log(`Current allowance: ${currentAllowance}, Required: ${amountIn}`)

            // 如果已有授权但不足，先重置为0（某些代币如USDT需要）
            if (currentAllowance > 0n) {
              console.log("Resetting allowance to 0 first...")
              try {
                const resetHash = await writeContractAsync({
                  address: fromToken.address as `0x${string}`,
                  abi: ERC20_ABI,
                  functionName: "approve",
                  args: [UNISWAP_V3_ROUTER_ADDRESS, 0n],
                })
                console.log("Reset approval hash:", resetHash)

                // 等待重置交易确认
                await new Promise((resolve) => setTimeout(resolve, 5000))
              } catch (resetError) {
                console.error("Failed to reset allowance:", resetError)
                throw new Error("Failed to reset token allowance")
              }
            }

            console.log("Approving token spending...")
            try {
              // 授权足够大的金额（或者使用最大值）
              const approvalAmount = amountIn * 2n // 授权2倍金额，避免频繁授权

              const approveHash = await writeContractAsync({
                address: fromToken.address as `0x${string}`,
                abi: ERC20_ABI,
                functionName: "approve",
                args: [UNISWAP_V3_ROUTER_ADDRESS, approvalAmount],
                // 增加gas限制
                gas: 100000n,
              })

              console.log("Approval transaction hash:", approveHash)

              // 等待授权交易确认（增加等待时间）
              await new Promise((resolve) => setTimeout(resolve, 8000))

              // 验证授权是否成功
              const newAllowance = await checkAllowance(fromToken.address, address, UNISWAP_V3_ROUTER_ADDRESS)
              if (newAllowance < amountIn) {
                throw new Error("Token approval was not successful, please try again")
              }

              console.log("Token approval successful, new allowance:", newAllowance.toString())

            } catch (approveError: any) {
              console.error("Approval failed:", approveError)

              if (
                approveError.message.includes("User rejected") ||
                approveError.message.includes("user rejected") ||
                approveError.message.includes("User denied")
              ) {
                throw new Error("Token approval was rejected")
              } else if (approveError.message.includes("execution reverted")) {
                throw new Error("Token approval failed. This token may have special approval requirements or insufficient balance.")
              } else {
                throw new Error(`Failed to approve token spending: ${approveError.message}`)
              }
            }
          } else {
            console.log("Sufficient allowance already exists:", currentAllowance.toString())
          }
        }

        // 步骤2：执行交换
        console.log("Executing swap transaction...")

        const swapParams = {
          tokenIn: tokenInAddress,
          tokenOut: tokenOutAddress,
          fee: 3000, // 0.3% fee tier
          recipient: address,
          deadline: deadline,
          amountIn: amountIn,
          amountOutMinimum: amountOutMinimum,
          sqrtPriceLimitX96: 0n, // No price limit
        }

        try {
          // 使用 writeContractAsync 进行真实的合约调用
          swapHash = await writeContractAsync({
            address: UNISWAP_V3_ROUTER_ADDRESS,
            abi: UNISWAP_V3_ROUTER_ABI,
            functionName: "exactInputSingle",
            args: [swapParams],
            value: isETHInput ? amountIn : undefined, // 只有原生ETH输入时才需要 value
            // 增加gas限制
            gas: 300000n,
          })

          console.log("Swap transaction hash:", swapHash)

          // 验证交易哈希格式
          if (!swapHash || typeof swapHash !== "string" || !swapHash.startsWith("0x") || swapHash.length !== 66) {
            console.error("Invalid transaction hash format:", swapHash)
            throw new Error("Transaction submitted but hash format is invalid")
          }

          // 交易已提交，显示成功状态
          setSwapState({
            isSwapping: false,
            swapError: null,
            swapSuccess: true,
            transactionHash: swapHash,
          })

          console.log("Swap transaction submitted successfully:", swapHash)

          // 10秒后清除成功状态
          setTimeout(() => {
            setSwapState((prev) => ({
              ...prev,
              swapSuccess: false,
              transactionHash: null,
            }))
          }, 10000)
        } catch (contractError: any) {
          console.error("Contract execution failed:", contractError)

          // 更详细的错误处理
          let errorMessage = "Transaction failed"

          if (contractError.message.includes("execution reverted")) {
            if (contractError.message.includes("STF")) {
              errorMessage = "Insufficient balance or token transfer failed"
            } else if (contractError.message.includes("Too little received")) {
              errorMessage = "Price slippage too high, try increasing slippage tolerance"
            } else if (contractError.message.includes("Too much requested")) {
              errorMessage = "Requested amount exceeds available liquidity"
            } else {
              errorMessage = "Transaction failed due to insufficient liquidity or high slippage. Please try reducing the amount."
            }
          } else if (contractError.message.includes("insufficient funds")) {
            errorMessage = "Insufficient funds for transaction including gas fees"
          } else if (
            contractError.message.includes("user rejected") ||
            contractError.message.includes("User rejected") ||
            contractError.message.includes("User denied")
          ) {
            errorMessage = "Transaction was rejected by user"
          } else if (contractError.message.includes("gas")) {
            errorMessage = "Transaction failed due to gas estimation error. Please try again."
          }

          throw new Error(errorMessage)
        }
      } catch (error: any) {
        console.error("Swap failed:", error)

        let errorMessage = "Swap failed"

        if (error instanceof Error) {
          errorMessage = error.message
        }

        setSwapState({
          isSwapping: false,
          swapError: errorMessage,
          swapSuccess: false,
          transactionHash: null,
        })
      }
    },
    [isConnected, address, writeContractAsync],
  )

  const clearSwapError = useCallback(() => {
    setSwapState((prev) => ({ ...prev, swapError: null }))
  }, [])

  const switchToBase = useCallback(() => {
    switchChain({ chainId: base.id })
  }, [switchChain])

  const getBaseScanUrl = useCallback((txHash: string) => {
    return `https://basescan.org/tx/${txHash}`
  }, [])

  return {
    ...swapState,
    executeSwap,
    clearSwapError,
    switchToBase,
    getBaseScanUrl,
  }
}