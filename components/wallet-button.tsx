"use client"

import { useState, useEffect } from "react"
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Copy, ExternalLink, LogOut, Wallet, ChevronDown, AlertTriangle, RefreshCw, X, Zap, Ghost } from "lucide-react"
import { base } from "wagmi/chains"
import { useLanguage } from "@/hooks/use-language"

interface WalletError {
  type: "connection" | "network" | "rejection" | "timeout" | "unknown"
  message: string
  action?: string
}

interface WalletButtonProps {
  forceOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function WalletButton({ forceOpen = false, onOpenChange }: WalletButtonProps = {}) {
  const { t } = useLanguage()
  const { address, isConnected } = useAccount()
  const { connectors:formatConnectors, connect, isPending, error: connectError } = useConnect()
  // 过滤新版本okx wallet 老版本不兼容
  const connectors = formatConnectors.filter((item) => item.id === 'okxWallet') 
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitchPending, error: switchError } = useSwitchChain()

  const [isConnectOpen, setIsConnectOpen] = useState(false)
  const [walletError, setWalletError] = useState<WalletError | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  // 处理弹窗状态变化
  const handleOpenChange = (open: boolean) => {
    setIsConnectOpen(open)
    onOpenChange?.(open)
  }

  // 监听外部强制打开
  useEffect(() => {
    if (forceOpen) {
      setIsConnectOpen(true)
    }
  }, [forceOpen])

  // Clear errors when dialog opens
  useEffect(() => {
    if (isConnectOpen) {
      setWalletError(null)
    }
  }, [isConnectOpen])

  // Handle connection errors
  useEffect(() => {
    if (connectError) {
      handleConnectionError(connectError)
    }
  }, [connectError])

  // Handle network switch errors
  useEffect(() => {
    if (switchError) {
      handleSwitchError(switchError)
    }
  }, [switchError])

  const handleConnectionError = (error: Error) => {
    console.error("Wallet connection error:", error)

    // Clear any existing errors first
    setWalletError(null)

    // Add a small delay to ensure state is cleared
    setTimeout(() => {
      const errorMessage = error?.message || error?.toString() || "Unknown error"

      if (
        errorMessage.includes("User rejected") ||
        errorMessage.includes("user rejected") ||
        errorMessage.includes("User denied")
      ) {
        setWalletError({
          type: "rejection",
          message: "Connection cancelled",
          action: "Please try connecting your wallet again",
        })
      } else if (errorMessage.includes("No injected provider") || errorMessage.includes("No provider")) {
        setWalletError({
          type: "connection",
          message: "No wallet detected",
          action: "Please install MetaMask or another supported wallet",
        })
      } else if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
        setWalletError({
          type: "timeout",
          message: "Connection timeout",
          action: "Please check your network connection and try again",
        })
      } else if (errorMessage.includes("network") || errorMessage.includes("Network")) {
        setWalletError({
          type: "network",
          message: "Network connection error",
          action: "Please check your network settings and try again",
        })
      } else {
        // For any other errors, show a generic message
        setWalletError({
          type: "unknown",
          message: "Connection failed",
          action: "Please try again or contact support",
        })
      }
    }, 100)
  }

  const handleSwitchError = (error: Error) => {
    console.error("Network switch error:", error)

    if (error.message.includes("User rejected")) {
      setWalletError({
        type: "rejection",
        message: "User rejected network switch",
        action: "Please manually switch to Base network",
      })
    } else {
      setWalletError({
        type: "network",
        message: "Network switch failed",
        action: "Please manually switch to Base network in your wallet",
      })
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address)
        // You could add a toast notification here
      } catch (error) {
        console.error("Failed to copy address:", error)
      }
    }
  }

  const openBlockExplorer = () => {
    if (address) {
      const baseUrl = chainId === base.id ? "https://basescan.org" : "https://etherscan.io"
      window.open(`${baseUrl}/address/${address}`, "_blank")
    }
  }

  const getChainName = () => {
    if (chainId === base.id) return "Base"
    if (chainId === 1) return "Ethereum"
    return "Unknown Network"
  }

  const isOnWrongNetwork = isConnected && chainId !== base.id

  const handleConnectWallet = async (connector: any) => {
    try {
      setWalletError(null)
      setIsRetrying(false)
      await connect({ connector })
      setIsConnectOpen(false)
    } catch (error) {
      // Don't handle error here, let useEffect handle it
      console.log("Connection attempt failed:", error?.message)
    }
  }

  const handleRetry = async () => {
    setIsRetrying(true)
    setWalletError(null)

    // Wait a bit before retrying
    setTimeout(() => {
      setIsRetrying(false)
    }, 1000)
  }

  const handleSwitchToBase = async () => {
    try {
      setWalletError(null)
      await switchChain({ chainId: base.id })
    } catch (error) {
      // Error will be handled by useEffect
    }
  }

  const getWalletIcon = (connectorName: string) => {
    switch (connectorName) {
      case "OKX Wallet":
        return (
          <img
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJDSURBVHgB7Zq9jtpAEMfHlhEgQLiioXEkoAGECwoKxMcTRHmC5E3IoyRPkPAEkI7unJYmTgEFTYwA8a3NTKScLnCHN6c9r1e3P2llWQy7M/s1Gv1twCP0ej37dDq9x+Zut1t3t9vZjDEHIiSRSPg4ZpDL5fxkMvn1cDh8m0wmfugfO53OoFQq/crn8wxfY9EymQyrVCqMfHvScZx1p9ls3pFxXBy/bKlUipGPrVbLuQqAfsCliq3zl0H84zwtjQrOw4Mt1W63P5LvBm2d+Xz+YzqdgkqUy+WgWCy+Mc/nc282m4FqLBYL+3g8fjDxenq72WxANZbLJeA13zDX67UDioL5ybXwafMYu64Ltn3bdDweQ5R97fd7GyhBQMipx4POeEDHIu2LfDdBIGGz+hJ9CQ1ABjoA2egAZPM6AgiCAEQhsi/C4jHyPA/6/f5NG3Ks2+3CYDC4aTccDrn6ojG54MnEvG00GoVmWLIRNZ7wTCwDHYBsdACy0QHIhiuRETxlICWpMMhGZHmqS8qH6JLyGegAZKMDkI0uKf8X4SWlaZo+Pp1bRrwlJU8ZKLIvUjKh0WiQ3sRUbNVq9c5Ebew7KEo2m/1p4jJ4qAmDaqDQBzj5XyiAT4VCQezJigAU+IDU+z8vJFnGWeC+bKQV/5VZ71FV6L7PA3gg3tXrdQ+DgLhC+75Wq3no69P3MC0NFQpx2lL04Ql9gHK1bRDjsSBIvScBnDTk1WrlGIZBorIDEYJj+rhdgnQ67VmWRe0zlplXl81vcyEt0rSoYDUAAAAASUVORK5CYII="
            alt="OKX Wallet"
            className="w-4 h-4 rounded-sm"
          />
        )
      default:
        return <Wallet className="w-4 h-4 text-gray-400" />
    }
  }
  const isWalletInstalled = (connectorName: string) => {
    if (connectorName === "OKX Wallet") {
      return typeof window !== "undefined" && window.okxwallet
    }

    return true // For other wallets, assume they're available
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Network Button */}
        <Button
          onClick={handleSwitchToBase}
          disabled={isSwitchPending}
          variant="outline"
          className={`bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 rounded-2xl px-2 sm:px-3 ${
            isOnWrongNetwork ? "border-red-500 text-red-400" : ""
          }`}
        >
          <div className="flex items-center gap-1 sm:gap-2">
            {isSwitchPending ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <div className={`w-2 h-2 rounded-full ${chainId === base.id ? "bg-blue-500" : "bg-red-500"}`}></div>
            )}
            <span className="hidden sm:inline">{getChainName()}</span>
          </div>
        </Button>

        {/* Account Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 rounded-2xl px-2 sm:px-3"
            >
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">{formatAddress(address)}</span>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-gray-900 border-gray-700 rounded-2xl" align="end">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-white">{formatAddress(address)}</p>
              <p className="text-xs text-gray-400">{getChainName()}</p>
            </div>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem
              onClick={copyAddress}
              className="text-white hover:bg-gray-800 cursor-pointer rounded-xl mx-1"
            >
              <Copy className="mr-2 h-4 w-4" />
              {t("wallet.copyAddress")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={openBlockExplorer}
              className="text-white hover:bg-gray-800 cursor-pointer rounded-xl mx-1"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("wallet.viewExplorer")}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem
              onClick={() => disconnect()}
              className="text-red-400 hover:bg-gray-800 cursor-pointer rounded-xl mx-1"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("wallet.disconnect")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Network Switch Error Alert */}
        {switchError && (
          <Alert className="fixed top-4 right-4 w-80 bg-red-900/50 border-red-600 z-50 rounded-2xl">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Network switch failed</p>
                  <p className="text-sm mt-1">Please manually switch to Base network in your wallet</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWalletError(null)}
                  className="text-red-200 hover:text-white p-1 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  return (
    <>
      <Dialog open={isConnectOpen || forceOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            disabled={isPending || isRetrying}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 sm:px-6 rounded-2xl text-sm sm:text-base"
          >
            {isPending || isRetrying ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">{isRetrying ? t("wallet.retrying") : t("wallet.connecting")}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">{t("wallet.connectWallet")}</span>
              </div>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border-gray-700 text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle>{t('swap.connectWallet')}</DialogTitle>
          </DialogHeader>

          {/* Error Alert */}
          {walletError && (
            <Alert
              className={`mb-4 rounded-2xl ${
                walletError.type === "rejection" ? "bg-yellow-900/50 border-yellow-600" : "bg-red-900/50 border-red-600"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className={walletError.type === "rejection" ? "text-yellow-200" : "text-red-200"}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{walletError.message}</p>
                    {walletError.action && <p className="text-sm mt-1">{walletError.action}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setWalletError(null)}
                    className={`${
                      walletError.type === "rejection"
                        ? "text-yellow-200 hover:text-white"
                        : "text-red-200 hover:text-white"
                    } p-1 rounded-full`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {connectors.map((connector) => {
              const isInstalled = isWalletInstalled(connector.name)

              return (
                <Button
                  key={connector.uid}
                  onClick={() => handleConnectWallet(connector)}
                  variant="outline"
                  className={`w-full justify-start bg-gray-800 border-gray-700 hover:bg-gray-700 text-white rounded-2xl ${
                    !isInstalled ? "opacity-50" : ""
                  }`}
                  disabled={isPending || isRetrying || !isInstalled}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 bg-gradient-to-r from-gray-700 to-gray-600 rounded-lg flex items-center justify-center border border-gray-600">
                      {getWalletIcon(connector.name)}
                    </div>
                    <div className="flex-1 text-left">
                      <span>{connector.name}</span>
                      {!isInstalled && <p className="text-xs text-gray-400 mt-1">{t("wallet.notInstalled")}</p>}
                    </div>
                    {isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                  </div>
                </Button>
              )
            })}
          </div>

          {/* Retry Button */}
          {walletError && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={handleRetry}
                variant="outline"
                disabled={isRetrying}
                className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white rounded-2xl"
              >
                {isRetrying ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t("wallet.retrying")}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    {t("wallet.retryConnection")}
                  </div>
                )}
              </Button>
            </div>
          )}

          {/* Help Text */}
          <div className="text-center text-sm text-gray-400 mt-4">
            <p>{t("wallet.newToWallets")}</p>
            <p className="mt-1">{t("wallet.learnMore")}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
