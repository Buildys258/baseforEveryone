"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useAccount, useChainId } from "wagmi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search,
  ChevronDown,
  AlertTriangle,
  Plus,
  Loader2,
  X,
  CheckCircle,
  Wallet,
  FileX,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowDown,
  ExternalLink,
  Info,
} from "lucide-react"
import { WalletButton } from "@/components/wallet-button"
import { useTokenBalance } from "@/hooks/use-token-balance"
import { useTokenSearch } from "@/hooks/use-token-search"
import { useSwap } from "@/hooks/use-swap"
import { useTokenPrice } from "@/hooks/use-token-price"
import { base } from "wagmi/chains"
import { isAddress } from "viem"
import { useLanguage } from "@/hooks/use-language"
import { LanguageSwitcher } from "@/components/language-switcher"
import { BASE_TOKENS } from '@/constant/tokens/base'

// Base链徽章组件
const BaseBadge = ({ size = "small" }) => {
  const dimensions = {
    small: "w-3 h-3 text-[6px]",
    medium: "w-4 h-4 text-[7px]",
    large: "w-5 h-5 text-[8px]",
  }

  return (
    <div
      className={`${dimensions[size]} bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg border border-white/20`}
    >
      B
    </div>
  )
}

// Token图标组件，带有Base风格的fallback和Base徽章
const TokenIcon = ({ token, size = "w-6 h-6", showBadge = true }) => {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleImageLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setIsLoading(false)
    setImageError(true)
  }

  // Base风格的渐变色方案
  const getGradientForToken = (symbol) => {
    const gradients = {
      ETH: "from-blue-400 to-purple-600",
      USDC: "from-blue-500 to-cyan-500",
      USDT: "from-green-400 to-teal-600",
      cbETH: "from-blue-600 to-indigo-700",
      WETH: "from-blue-400 to-purple-600",
      DAI: "from-yellow-400 to-orange-500",
      COMP: "from-green-400 to-emerald-600",
      UNI: "from-pink-400 to-purple-600",
    }
    return gradients[symbol] || "from-blue-500 to-blue-600"
  }

  // 根据图标尺寸确定徽章大小
  const getBadgeSize = () => {
    if (size.includes("w-8") || size.includes("h-8")) return "medium"
    if (size.includes("w-6") || size.includes("h-6")) return "small"
    return "small"
  }

  // 根据图标尺寸确定徽章位置
  const getBadgePosition = () => {
    if (size.includes("w-8") || size.includes("h-8")) return "-bottom-0.5 -right-0.5"
    return "-bottom-0.5 -right-0.5"
  }

  return (
    <div className={`${size} relative`}>
      {/* 主图标 */}
      {imageError || !token.icon ? (
        <div
          className={`${size} rounded-full bg-gradient-to-r ${getGradientForToken(token.symbol)} flex items-center justify-center text-white font-bold text-xs shadow-lg`}
        >
          {token.symbol.charAt(0)}
        </div>
      ) : (
        <>
          {isLoading && (
            <div
              className={`${size} rounded-full bg-gradient-to-r ${getGradientForToken(token.symbol)} animate-pulse`}
            />
          )}
          <img
            src={token.icon || "/placeholder.svg"}
            alt={token.symbol}
            className={`${size} rounded-full shadow-lg transition-opacity duration-200 ${isLoading ? "opacity-0 absolute inset-0" : "opacity-100"}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </>
      )}

      {/* Base徽章 */}
      {showBadge && (
        <div className={`absolute ${getBadgePosition()} z-10`}>
          <BaseBadge size={getBadgeSize()} />
        </div>
      )}
    </div>
  )
}

const TokenSelector = ({
  token,
  onSelect,
  isOpen,
  setIsOpen,
  placeholder = "Select token",
  excludeToken = null,
  searchQuery,
  setSearchQuery,
  isSearching,
  isContractSearch,
  hasSearched,
  searchedToken,
  searchError,
  clearError,
  addCustomToken,
  filteredTokens,
  fromToken,
  fromTokenBalance,
  toToken,
  toTokenBalance,
  getTokenPrice,
  getTokenPriceChange,
  setSearchedToken,
  resetSearch,
  isConnected,
  calculateUSDValue,
  formatUSDValue,
  existingToken,
  debouncedSearch,
  isCalculatingPrice = false, // 新增参数
}) => {
  const { t } = useLanguage()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-auto px-4 py-3 bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 min-w-[140px] rounded-2xl"
        >
          {token ? (
            <div className="flex items-center gap-2">
              <TokenIcon token={token} size="w-6 h-6" showBadge={true} />
              <span className="font-semibold">{token.symbol}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-blue-400">
              <span className="text-sm">{t("token.selectToken")}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("token.selectToken")}
            <div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded-full">
              <BaseBadge size="small" />
              <span>{t("token.baseNetwork")}</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t("token.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white rounded-2xl"
            />
            {(isSearching || isCalculatingPrice) && (
              <div className="absolute right-3 top-3">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              </div>
            )}
          </div>

          {/* 合约地址输入提示和验证状态 */}
          {searchQuery && (
            <div className="space-y-2">
              {/* 地址格式验证提示 */}
              {searchQuery.startsWith("0x") && (
                <div className="flex items-center gap-2 text-xs">
                  {searchQuery.length === 42 ? (
                    isAddress(searchQuery) ? (
                      <div className="flex items-center gap-1 text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        <span>{t("token.validAddress")}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-400">
                        <X className="w-3 h-3" />
                        <span>{t("token.invalidAddress")}</span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Loader2 className="w-3 h-3" />
                      <span>{t("token.addressProgress").replace("{current}", searchQuery.length.toString())}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 搜索状态指示器 */}
              {isContractSearch && searchQuery.length === 42 && isAddress(searchQuery) && (
                <div className="bg-blue-900/30 border border-blue-600/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-blue-300 font-medium">{t("token.contractSearchMode")}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {t("token.searchingAt")} <br />
                    <code className="bg-gray-800 px-1 py-0.5 rounded text-blue-300">
                      {searchQuery.slice(0, 20)}...{searchQuery.slice(-6)}
                    </code>
                  </div>
                  {existingToken && <div className="mt-2 text-xs text-yellow-400">{t("token.alreadyInList")}</div>}
                </div>
              )}
            </div>
          )}

          {/* Contract Search Loading State - 只在完整地址搜索时显示 */}
          {isContractSearch &&
            searchQuery.length === 42 &&
            isAddress(searchQuery) &&
            (isSearching || isCalculatingPrice) && (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-4 max-w-sm">
                  <div className="relative">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
                    <div className="absolute inset-0 w-10 h-10 border-2 border-blue-400/20 rounded-full animate-ping"></div>
                  </div>

                  {/* 加载状态部分 */}
                  <div className="text-center space-y-2">
                    <p className="text-white font-medium">
                      {isCalculatingPrice ? t("token.calculatingPrice") : t("token.searching")}
                    </p>
                    <p className="text-sm text-gray-400">
                      {isCalculatingPrice ? t("token.gettingMarketData") : t("token.readingContract")}
                    </p>
                    <div className="bg-gray-800 rounded-lg p-2">
                      <code className="text-xs text-blue-300">
                        {searchQuery.slice(0, 10)}...{searchQuery.slice(-8)}
                      </code>
                    </div>
                  </div>

                  {/* 搜索步骤指示器部分 */}
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{t("token.verifyingContract")}</span>
                      <span>{isCalculatingPrice ? t("token.gettingPrice") : t("token.readingContract")}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-blue-400 h-1 rounded-full animate-pulse"
                        style={{ width: isCalculatingPrice ? "90%" : "60%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Contract Search No Results */}
          {isContractSearch &&
            searchQuery.length === 42 &&
            isAddress(searchQuery) &&
            hasSearched &&
            !isSearching &&
            !searchedToken &&
            !searchError && (
              <div className="flex items-center justify-center py-8">
                {/* 无结果显示部分 */}
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <FileX className="w-8 h-8" />
                  <p>{t("token.noTokenFound")}</p>
                  <p className="text-xs text-gray-500 text-center">{t("token.contractNotFound")}</p>
                </div>
              </div>
            )}

          {/* Search Error - 更详细的错误信息 */}
          {searchError && !isSearching && (
            <Alert className="bg-red-900/50 border-red-600 rounded-2xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-200">
                <div className="flex justify-between items-start">
                  {/* 错误信息部分 */}
                  <div className="flex-1">
                    <p className="font-medium mb-1">{t("token.tokenNotFound")}</p>
                    <p className="text-sm">{searchError}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="text-red-200 hover:text-white p-1 ml-2 rounded-full flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* 简化的提示信息 */}
                <div className="bg-red-800/30 rounded-lg p-3 text-xs mt-3">
                  <p className="text-red-100">{t("token.contractInvalid")}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Searched Token Result - 更丰富的代币信息显示 */}
          {searchedToken && !isSearching && (
            <div className="border border-green-600 rounded-2xl p-4 bg-green-900/20">
              <div className="space-y-3">
                {/* 成功标识 */}
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  <span>{t("token.tokenFoundSuccess")}</span>
                </div>

                {/* 代币信息 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TokenIcon token={searchedToken} size="w-10 h-10" showBadge={true} />
                    <div>
                      <div className="font-semibold text-lg">{searchedToken.symbol}</div>
                      <div className="text-sm text-gray-300">{searchedToken.name}</div>
                      <div className="text-xs text-gray-500 font-mono">
                        {searchedToken.address.slice(0, 8)}...{searchedToken.address.slice(-6)}
                      </div>
                      {/* 显示价格信息 */}
                      {getTokenPrice(searchedToken.symbol) > 0 && (
                        <div className="text-xs text-green-300 mt-1">
                          ${getTokenPrice(searchedToken.symbol).toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => addCustomToken(searchedToken)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 rounded-2xl px-4"
                    disabled={isCalculatingPrice}
                  >
                    {isCalculatingPrice ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Plus className="w-4 h-4 mr-1" />
                    )}
                    {/* 添加按钮 */}
                    {isCalculatingPrice ? t("token.adding") : t("token.add")}
                  </Button>
                </div>

                {/* 代币详细信息 */}
                <div className="bg-green-800/20 rounded-lg p-3 space-y-2">
                  {/* 代币详细信息 */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400">{t("token.decimals")}:</span>
                      <span className="ml-2 text-white font-medium">{searchedToken.decimals}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">{t("token.network")}:</span>
                      <span className="ml-2 text-blue-400 font-medium">Base</span>
                    </div>
                  </div>

                  {/* 合约验证状态 */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-300">{t("token.contractVerified")}</span>
                  </div>

                  {/* 价格获取状态 */}
                  {isCalculatingPrice && (
                    <div className="flex items-center gap-2 text-xs">
                      <Loader2 className="w-2 h-2 animate-spin text-blue-400" />
                      <span className="text-blue-300">{t("token.fetchingPrice")}</span>
                    </div>
                  )}
                </div>

                {/* 警告信息 */}
                <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    {/* 警告信息 */}
                    <div className="text-xs text-yellow-200">
                      <p className="font-medium mb-1">{t("token.customTokenWarning")}</p>
                      <p>{t("token.verifyWarning")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Token List */}
          {!isContractSearch && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredTokens
                .filter(
                  (tokenItem) =>
                    !excludeToken ||
                    tokenItem.address !== excludeToken.address ||
                    tokenItem.symbol !== excludeToken.symbol,
                )
                .map((tokenItem) => {
                  const balance =
                    tokenItem === fromToken
                      ? fromTokenBalance
                      : tokenItem === toToken
                        ? toTokenBalance
                        : { balance: "0.0000", isLoading: false }

                  const tokenPrice = getTokenPrice(tokenItem.symbol)
                  const priceChange = getTokenPriceChange(tokenItem.symbol)

                  return (
                    <div
                      key={tokenItem.address || tokenItem.symbol}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-800 cursor-pointer transition-colors duration-200"
                      onClick={() => {
                        onSelect(tokenItem)
                        setIsOpen(false)
                        setSearchQuery("")
                        setSearchedToken(null)
                        resetSearch()
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <TokenIcon token={tokenItem} size="w-8 h-8" showBadge={true} />
                        <div>
                          <div className="font-semibold">{tokenItem.symbol}</div>
                          <div className="text-sm text-gray-400">{tokenItem.name}</div>
                          {tokenPrice > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-gray-300">${tokenPrice.toFixed(tokenPrice < 1 ? 4 : 2)}</span>
                              {priceChange !== 0 && (
                                <span
                                  className={`flex items-center gap-0.5 ${priceChange > 0 ? "text-green-400" : "text-red-400"}`}
                                >
                                  {priceChange > 0 ? (
                                    <TrendingUp className="w-3 h-3" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3" />
                                  )}
                                  {Math.abs(priceChange).toFixed(1)}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {isConnected ? (
                            balance.isLoading ? (
                              <div className="w-16 h-4 bg-gray-700 animate-pulse rounded"></div>
                            ) : (
                              balance.balance
                            )
                          ) : (
                            "--"
                          )}
                        </div>
                        {isConnected &&
                          !balance.isLoading &&
                          tokenPrice > 0 &&
                          Number.parseFloat(balance.balance) > 0 && (
                            <div className="text-xs text-gray-400">
                              {formatUSDValue(calculateUSDValue(tokenItem.symbol, balance.balance))}
                            </div>
                          )}
                      </div>
                    </div>
                  )
                })}

              {/* No results for name/symbol search */}
              {filteredTokens.length === 0 && searchQuery && (
                <div className="text-center py-8 text-gray-400">
                  <p>{t("token.noResults")}</p>
                  <p className="text-sm mt-2">{t("token.searchHint")}</p>
                </div>
              )}
            </div>
          )}

          {/* Show token list when searching by contract but also show existing tokens */}
          {isContractSearch && !isSearching && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredTokens
                .filter(
                  (tokenItem) =>
                    !excludeToken ||
                    tokenItem.address !== excludeToken.address ||
                    tokenItem.symbol !== excludeToken.symbol,
                )
                .map((tokenItem) => {
                  const balance =
                    tokenItem === fromToken
                      ? fromTokenBalance
                      : tokenItem === toToken
                        ? toTokenBalance
                        : { balance: "0.0000", isLoading: false }

                  const tokenPrice = getTokenPrice(tokenItem.symbol)
                  const priceChange = getTokenPriceChange(tokenItem.symbol)

                  return (
                    <div
                      key={tokenItem.address || tokenItem.symbol}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-800 cursor-pointer transition-colors duration-200"
                      onClick={() => {
                        onSelect(tokenItem)
                        setIsOpen(false)
                        setSearchQuery("")
                        setSearchedToken(null)
                        resetSearch()
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <TokenIcon token={tokenItem} size="w-8 h-8" showBadge={true} />
                        <div>
                          <div className="font-semibold">{tokenItem.symbol}</div>
                          <div className="text-sm text-gray-400">{tokenItem.name}</div>
                          {tokenPrice > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-gray-300">${tokenPrice.toFixed(tokenPrice < 1 ? 4 : 2)}</span>
                              {priceChange !== 0 && (
                                <span
                                  className={`flex items-center gap-0.5 ${priceChange > 0 ? "text-green-400" : "text-red-400"}`}
                                >
                                  {priceChange > 0 ? (
                                    <TrendingUp className="w-3 h-3" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3" />
                                  )}
                                  {Math.abs(priceChange).toFixed(1)}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {isConnected ? (
                            balance.isLoading ? (
                              <div className="w-16 h-4 bg-gray-700 animate-pulse rounded"></div>
                            ) : (
                              balance.balance
                            )
                          ) : (
                            "--"
                          )}
                        </div>
                        {isConnected &&
                          !balance.isLoading &&
                          tokenPrice > 0 &&
                          Number.parseFloat(balance.balance) > 0 && (
                            <div className="text-xs text-gray-400">
                              {formatUSDValue(calculateUSDValue(tokenItem.symbol, balance.balance))}
                            </div>
                          )}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}

          {/* Address format help - 改进的格式帮助 */}
          {searchQuery && !isAddress(searchQuery) && searchQuery.startsWith("0x") && (
            <div className="bg-gray-800/50 border border-gray-600 rounded-xl p-4">
              <div className="space-y-3">
                {/* 地址格式帮助 */}
                <div className="flex items-center gap-2 text-yellow-400">
                  <Info className="w-4 h-4" />
                  <span className="text-sm font-medium">{t("token.addressFormat")}</span>
                </div>

                <div className="text-xs text-gray-300 space-y-2">
                  <p>{t("token.validEthereumAddress")}</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-400">
                    <li>{t("token.startWith0x")}</li>
                    <li>{t("token.exactly42chars")}</li>
                    <li>{t("token.hexOnly")}</li>
                  </ul>

                  <div className="mt-3">
                    <p className="text-gray-400 mb-1">{t("token.example")}</p>
                    <code className="bg-gray-700 px-2 py-1 rounded text-blue-300 text-xs">
                      0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
                    </code>
                  </div>

                  <div className="text-yellow-300 text-xs mt-2">
                    {t("token.currentLength").replace("{length}", searchQuery.length.toString())}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}



export default function page() {
  const { t } = useLanguage()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const [fromToken, setFromToken] = useState(BASE_TOKENS[0])
  const [toToken, setToToken] = useState(null)
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isFromTokenOpen, setIsFromTokenOpen] = useState(false)
  const [isToTokenOpen, setIsToTokenOpen] = useState(false)
  const [customTokens, setCustomTokens] = useState([])
  const [searchedToken, setSearchedToken] = useState(null)
  const [showWalletConnect, setShowWalletConnect] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Get balances for selected tokens (only when connected)
  const fromTokenBalance = useTokenBalance(fromToken?.address)
  const toTokenBalance = useTokenBalance(toToken?.address)

  // Token search hook
  const { performSearch, isSearching, searchError, hasSearched, clearError, resetSearch } = useTokenSearch()

  // Swap hook
  const {
    isSwapping,
    swapError,
    swapSuccess,
    transactionHash,
    executeSwap,
    clearSwapError,
    switchToBase,
    getBaseScanUrl,
  } = useSwap()

  // Price hook
  const {
    prices,
    isLoading: isPriceLoading,
    error: priceError,
    lastUpdated,
    dataSource,
    getTokenPrice,
    getTokenPriceChange,
    calculateUSDValue,
    formatUSDValue,
    refreshPrices,
    getDynamicTokenPrice, // 新增
  } = useTokenPrice()

  // 添加价格影响计算状态
  const [priceImpact, setPriceImpact] = useState(0)
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false)

  const isOnBaseChain = chainId === base.id

  // Combine default tokens with custom tokens
  const allTokens = useMemo(() => [...BASE_TOKENS, ...customTokens], [customTokens])

  // 计算汇率和自动换算
  const exchangeRate = useMemo(() => {
    if (!fromToken || !toToken) return null

    const fromPrice = getTokenPrice(fromToken.symbol)
    const toPrice = getTokenPrice(toToken.symbol)

    if (fromPrice > 0 && toPrice > 0) {
      return fromPrice / toPrice
    }

    return null
  }, [fromToken, toToken, getTokenPrice, prices]) // 添加 prices 依赖

  // 添加价格影响计算
  const calculatePriceImpact = useCallback((fromAmount, fromPrice, toAmount, toPrice) => {
    if (!fromAmount || !toAmount || !fromPrice || !toPrice) return 0

    const fromValue = Number.parseFloat(fromAmount) * fromPrice
    const toValue = Number.parseFloat(toAmount) * toPrice

    if (fromValue === 0) return 0

    const impact = ((fromValue - toValue) / fromValue) * 100
    return Math.abs(impact)
  }, [])

  // 修改 addCustomToken 函数以支持自动选择
  const addCustomToken = useCallback(
    async (tokenInfo, autoSelect = false) => {
      // 添加到自定义代币列表
      setCustomTokens((prev) => {
        const exists = prev.find((t) => t.address?.toLowerCase() === tokenInfo.address?.toLowerCase())
        if (exists) return prev
        return [...prev, tokenInfo]
      })

      // 获取代币价格
      setIsCalculatingPrice(true)
      try {
        await getDynamicTokenPrice(tokenInfo.address, tokenInfo.symbol)
      } catch (error) {
        console.error("Failed to get token price:", error)
      }
      setIsCalculatingPrice(false)

      // 如果 autoSelect 为 true，自动选择这个代币
      if (autoSelect) {
        if (!fromToken) {
          setFromToken(tokenInfo)
        } else if (!toToken) {
          setToToken(tokenInfo)
        } else {
          // 如果两个都已选择，替换 toToken
          setToToken(tokenInfo)
        }
      }

      // 清理搜索状态
      setSearchedToken(null)
      setSearchQuery("")
      resetSearch()

      // 关闭对话框
      setIsFromTokenOpen(false)
      setIsToTokenOpen(false)
    },
    [fromToken, toToken, getDynamicTokenPrice, resetSearch],
  )

  // 自动计算接收数量
  useEffect(() => {
    if (fromAmount && exchangeRate && fromToken && toToken) {
      const calculatedAmount = (Number.parseFloat(fromAmount) * exchangeRate).toFixed(6)
      setToAmount(calculatedAmount)

      // 计算价格影响
      const fromPrice = getTokenPrice(fromToken.symbol)
      const toPrice = getTokenPrice(toToken.symbol)
      const impact = calculatePriceImpact(fromAmount, fromPrice, calculatedAmount, toPrice)
      setPriceImpact(impact)
    } else if (!fromAmount) {
      setToAmount("")
      setPriceImpact(0)
    }
  }, [fromAmount, exchangeRate, fromToken, toToken, getTokenPrice, calculatePriceImpact])

  // 过滤tokens - 使用useMemo优化
  const filteredTokens = useMemo(() => {
    if (!searchQuery) return allTokens

    return allTokens.filter(
      (token) =>
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (token.address && token.address.toLowerCase().includes(searchQuery.toLowerCase())),
    )
  }, [allTokens, searchQuery])

  // 检查是否为合约地址搜索
  const isContractSearch = useMemo(() => {
    return isAddress(searchQuery) && searchQuery.length === 42
  }, [searchQuery])

  // 检查token是否已存在
  const existingToken = useMemo(() => {
    if (!isContractSearch) return null
    return allTokens.find((token) => token.address?.toLowerCase() === searchQuery.toLowerCase())
  }, [allTokens, searchQuery, isContractSearch])

  // 防抖搜索 - 使用useCallback优化
  const debouncedSearch = useCallback(
    async (query) => {
      if (!isContractSearch || existingToken) {
        setSearchedToken(null)
        return
      }

      try {
        const tokenInfo = await performSearch(query)
        setSearchedToken(tokenInfo)
      } catch (error) {
        console.error("Search failed:", error)
        setSearchedToken(null)
      }
    },
    [isContractSearch, existingToken, performSearch],
  )

  // 防抖效果 - 移除自动重试逻辑，只在输入完整有效地址时查询
  useEffect(() => {
    // 重置搜索状态
    if (!isContractSearch) {
      setSearchedToken(null)
      resetSearch()
      return
    }

    // 如果token已存在，不需要搜索
    if (existingToken) {
      setSearchedToken(null)
      resetSearch()
      return
    }

    // 只有当地址完整且有效时才进行搜索
    if (searchQuery.length === 42 && isAddress(searchQuery)) {
      const debounceTimer = setTimeout(() => {
        debouncedSearch(searchQuery)
      }, 800) // 减少防抖时间，因为地址已经完整

      return () => {
        clearTimeout(debounceTimer)
      }
    } else {
      // 地址不完整或无效时，清除搜索状态
      setSearchedToken(null)
      resetSearch()
    }
  }, [searchQuery, isContractSearch, existingToken, debouncedSearch, resetSearch])

  // 清理搜索状态当对话框关闭时
  useEffect(() => {
    if (!isFromTokenOpen && !isToTokenOpen) {
      setSearchQuery("")
      setSearchedToken(null)
      resetSearch()
    }
  }, [isFromTokenOpen, isToTokenOpen, resetSearch])

  const handleSwapTokens = () => {
    const tempToken = fromToken
    const tempAmount = fromAmount
    setFromToken(toToken)
    setToToken(tempToken)
    setFromAmount(toAmount)
    setToAmount(tempAmount)
  }

  // Check if user has sufficient balance
  const hasInsufficientBalance = useMemo(() => {
    if (!isConnected || !fromToken || !fromAmount || !fromTokenBalance.balance) {
      return false
    }

    const inputAmount = Number.parseFloat(fromAmount)
    const availableBalance = Number.parseFloat(fromTokenBalance.balance)

    return inputAmount > availableBalance
  }, [isConnected, fromToken, fromAmount, fromTokenBalance.balance])

  // 处理交易按钮点击
  const handleSwapClick = async () => {
    if (!isConnected) {
      setShowWalletConnect(true)
      return
    }

    if (!isOnBaseChain) {
      switchToBase()
      return
    }

    if (!fromToken || !toToken || !fromAmount || hasInsufficientBalance) {
      return
    }

    // Show confirmation dialog instead of executing swap directly
    setShowConfirmation(true)
  }

  // 获取交易按钮文本和状态
  const getSwapButtonState = () => {
    if (isSwapping) {
      return {
        text: t("swap.swapping"),
        disabled: true,
        className: "w-full h-16 text-lg bg-blue-600 opacity-75 cursor-not-allowed rounded-3xl",
      }
    }

    if (!isConnected) {
      return {
        text: t("swap.connectWallet"),
        disabled: false,
        className:
          "w-full h-16 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-3xl",
      }
    }

    if (!isOnBaseChain) {
      return {
        text: t("swap.switchNetwork"),
        disabled: false,
        className: "w-full h-16 text-lg bg-yellow-600 hover:bg-yellow-700 rounded-3xl",
      }
    }

    if (!fromAmount || !toToken) {
      return {
        text: t("swap.enterAmount"),
        disabled: true,
        className: "w-full h-16 text-lg bg-gray-700 text-gray-400 cursor-not-allowed rounded-3xl",
      }
    }

    if (hasInsufficientBalance) {
      return {
        text: t("swap.insufficientBalance"),
        disabled: true,
        className: "w-full h-16 text-lg bg-gray-700 text-gray-400 cursor-not-allowed rounded-3xl",
      }
    }

    return {
      text: t("confirm.swap"),
      disabled: false,
      className:
        "w-full h-16 text-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-3xl",
    }
  }

  const buttonState = getSwapButtonState()

  // 处理钱包连接对话框关闭
  const handleWalletConnectChange = (open: boolean) => {
    setShowWalletConnect(open)
    // 防止页面滚动到顶部
    if (!open) {
      // 不做任何滚动操作，保持当前位置
    }
  }

  // 快速金额选择按钮
  const QuickAmountButtons = ({ token, balance, onAmountSelect }) => {
    if (!isConnected || !token || !balance || Number.parseFloat(balance.balance) === 0) return null
    const balanceNum = Number.parseFloat(balance.balance)
    const amounts = [
      { label: t("amount.25percent"), value: (balanceNum * 0.25).toString() },
      { label: t("amount.50percent"), value: (balanceNum * 0.5).toString() },
      { label: t("amount.75percent"), value: (balanceNum * 0.75).toString() },
      { label: t("amount.max"), value: balanceNum.toString() },
    ]

    return (
      <div className="flex gap-1 sm:gap-2 mb-3 sm:mb-4">
        {amounts.map((amount) => (
          <Button
            key={amount.label}
            variant="outline"
            size="sm"
            onClick={() => onAmountSelect(amount.value)}
            className="rounded-full px-3 sm:px-4 py-1 text-xs bg-gray-800/50 border-gray-600 hover:bg-gray-700/50 text-gray-300 hover:text-white flex-1 sm:flex-none"
          >
            {amount.label}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950/40 to-gray-950 text-white relative overflow-hidden">
      {/* Extended background to prevent white showing on scroll */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-950 via-blue-950/40 to-gray-950"></div>

      {/* Animated background orbs with Base blue theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-indigo-500/30 to-blue-500/30 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute bottom-32 left-32 w-40 h-40 bg-gradient-to-r from-cyan-500/30 to-teal-500/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-gradient-to-r from-sky-500/30 to-blue-500/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-36 h-36 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-xl animate-bounce"></div>
      </div>

      {/* Simplified Header */}
      <header className="relative z-10 flex items-center justify-between p-3 sm:p-4 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="relative">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-lg"
            >
              {/* 外层果实 */}
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="url(#blueberryMain)"
                stroke="url(#blueberryBorder)"
                strokeWidth="1"
              />

              {/* 内层果实纹理 */}
              <circle cx="20" cy="20" r="14" fill="url(#blueberryInner)" opacity="0.9" />

              {/* 高光效果 */}
              <ellipse cx="16" cy="14" rx="4" ry="6" fill="url(#blueberryHighlight)" opacity="0.7" />
              <circle cx="24" cy="16" r="2.5" fill="url(#blueberryHighlight)" opacity="0.5" />
              <circle cx="14" cy="24" r="1.5" fill="url(#blueberryHighlight)" opacity="0.4" />

              {/* 顶部叶子 - 更大更明显 */}
              <path
                d="M20 2 C23 4, 26 7, 24 12 C22 10, 18 8, 16 12 C14 7, 17 4, 20 2 Z"
                fill="url(#leafGradient)"
                opacity="0.9"
              />

              {/* 叶子细节 */}
              <path d="M20 2 L22 8 L20 6 L18 8 Z" fill="url(#leafDetail)" opacity="0.8" />

              {/* 果实表面纹理 */}
              <circle cx="18" cy="18" r="1" fill="rgba(139, 69, 19, 0.3)" />
              <circle cx="22" cy="22" r="0.8" fill="rgba(139, 69, 19, 0.3)" />
              <circle cx="16" cy="22" r="0.6" fill="rgba(139, 69, 19, 0.3)" />

              <defs>
                <radialGradient id="blueberryMain" cx="0.3" cy="0.3" r="0.9">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="30%" stopColor="#7C3AED" />
                  <stop offset="70%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#4338CA" />
                </radialGradient>

                <radialGradient id="blueberryInner" cx="0.4" cy="0.4" r="0.8">
                  <stop offset="0%" stopColor="#A78BFA" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#6366F1" />
                </radialGradient>

                <linearGradient id="blueberryHighlight" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#E0E7FF" />
                  <stop offset="50%" stopColor="#C7D2FE" />
                  <stop offset="100%" stopColor="#A5B4FC" />
                </linearGradient>

                <linearGradient id="leafGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22C55E" />
                  <stop offset="30%" stopColor="#16A34A" />
                  <stop offset="70%" stopColor="#15803D" />
                  <stop offset="100%" stopColor="#166534" />
                </linearGradient>

                <linearGradient id="leafDetail" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#34D399" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>

                <linearGradient id="blueberryBorder" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#4338CA" />
                </linearGradient>
              </defs>
            </svg>

            {/* 添加发光效果 */}
            <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md animate-pulse"></div>
          </div>
          <span className="text-lg sm:text-xl font-bold">{t("header.title")}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Price Status - 在移动端隐藏或简化 */}
          {lastUpdated && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <div
                className={`w-2 h-2 rounded-full ${isPriceLoading ? "bg-yellow-500 animate-pulse" : priceError ? "bg-red-500" : dataSource === "fallback" ? "bg-orange-500" : "bg-green-500"}`}
              ></div>
              <span>
                {isPriceLoading
                  ? t("header.updating")
                  : priceError
                    ? t("header.priceError")
                    : dataSource === "fallback"
                      ? t("header.fallbackPrices")
                      : `${t("header.updated")} ${lastUpdated.toLocaleTimeString()}`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshPrices}
                disabled={isPriceLoading}
                className="p-1 h-auto rounded-full"
              >
                <RefreshCw className={`w-3 h-3 ${isPriceLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          )}

          <LanguageSwitcher />
          <WalletButton forceOpen={showWalletConnect} onOpenChange={handleWalletConnectChange} />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-60px)] sm:min-h-[calc(100vh-80px)] px-3 sm:px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-6xl lg:text-8xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {t("main.swap")}
          </h1>
          <h2 className="text-4xl sm:text-6xl lg:text-8xl font-bold mb-4 sm:mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {t("main.anytime")}
          </h2>
          <h3 className="text-4xl sm:text-6xl lg:text-8xl font-bold mb-4 sm:mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {t("main.anywhere")}
          </h3>
        </div>

        {/* Price Data Source Info */}
        {dataSource === "fallback" && (
          <Alert className="w-full max-w-md mb-4 bg-orange-900/50 border-orange-600 rounded-2xl">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-orange-200">
              <div className="flex justify-between items-start">
                <span>{t("alert.fallbackPrices")}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshPrices}
                  className="text-orange-200 hover:text-white p-1 ml-2 rounded-full"
                >
                  <RefreshCw className={`w-3 h-3 ${isPriceLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Swap Success Alert */}
        {swapSuccess && (
          <Alert className="w-full max-w-md mb-4 bg-green-900/50 border-green-600 rounded-2xl">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-200">
              <div className="flex justify-between items-center">
                <span>{t("alert.swapSuccess")}</span>
                {transactionHash && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(getBaseScanUrl(transactionHash), "_blank")}
                    className="text-green-200 hover:text-white p-1 ml-2 rounded-full"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {transactionHash && (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(getBaseScanUrl(transactionHash), "_blank")}
                    className="bg-green-800/30 border-green-600 text-green-200 hover:bg-green-700/50 rounded-xl"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    {t("alert.viewDetails")}
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Swap Error Alert */}
        {swapError && (
          <Alert className="w-full max-w-md mb-4 bg-red-900/50 border-red-600 rounded-2xl">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              <div className="flex justify-between items-start">
                <span>{swapError}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSwapError}
                  className="text-red-200 hover:text-white p-1 ml-2 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Swap Interface */}
        <div className="w-full max-w-md space-y-2 px-2 sm:px-0">
          {/* From Token Card */}
          <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-700 p-4 sm:p-6 rounded-3xl">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>{t("swap.youPay")}</span>
              </div>

              {/* Quick Amount Buttons */}
              <QuickAmountButtons token={fromToken} balance={fromTokenBalance} onAmountSelect={setFromAmount} />

              <div className="flex gap-2 sm:gap-3 items-center">
                <Input
                  type="text"
                  placeholder="0"
                  value={fromAmount}
                  onChange={(e) => {
                    // 只允许数字和小数点
                    const value = e.target.value.replace(/[^0-9.]/g, "")
                    // 防止多个小数点
                    const parts = value.split(".")
                    if (parts.length > 2) return
                    setFromAmount(value)
                  }}
                  className="flex-1 text-2xl sm:text-3xl font-semibold bg-transparent border-none text-white pl-0 pr-2 sm:pr-4 no-focus-styles"
                />
                <TokenSelector
                  token={fromToken}
                  onSelect={setFromToken}
                  isOpen={isFromTokenOpen}
                  setIsOpen={setIsFromTokenOpen}
                  excludeToken={toToken}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  isSearching={isSearching}
                  isContractSearch={isContractSearch}
                  hasSearched={hasSearched}
                  searchedToken={searchedToken}
                  searchError={searchError}
                  clearError={clearError}
                  addCustomToken={(token) => addCustomToken(token, true)} // 自动选择
                  filteredTokens={filteredTokens}
                  fromToken={fromToken}
                  fromTokenBalance={fromTokenBalance}
                  toToken={toToken}
                  toTokenBalance={toTokenBalance}
                  getTokenPrice={getTokenPrice}
                  getTokenPriceChange={getTokenPriceChange}
                  setSearchedToken={setSearchedToken}
                  resetSearch={resetSearch}
                  isConnected={isConnected}
                  calculateUSDValue={calculateUSDValue}
                  formatUSDValue={formatUSDValue}
                  existingToken={existingToken}
                  debouncedSearch={debouncedSearch}
                  isCalculatingPrice={isCalculatingPrice} // 新增
                />
              </div>

              <div className="flex justify-between items-center">
                {fromToken && fromAmount && (
                  <div className="text-sm text-gray-400">
                    {isPriceLoading ? (
                      <span className="inline-block w-16 h-3 bg-gray-700 animate-pulse rounded"></span>
                    ) : (
                      formatUSDValue(calculateUSDValue(fromToken.symbol, fromAmount))
                    )}
                  </div>
                )}
                {/* Token Balance in bottom right of input */}
                {fromToken && isConnected && isOnBaseChain && (
                  <div className="text-right text-xs sm:text-sm text-gray-500">
                    {fromTokenBalance.isLoading ? (
                      <span className="inline-block w-16 h-3 bg-gray-700 animate-pulse rounded"></span>
                    ) : (
                      `${Number.parseFloat(fromTokenBalance.balance).toFixed(4)} ${fromToken.symbol}`
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Swap Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSwapTokens}
              className="rounded-full bg-blue-500 hover:bg-blue-600 border-4 border-gray-950 w-12 h-12 text-white shadow-lg"
              disabled={!toToken}
            >
              <ArrowDown className="w-5 h-5" />
            </Button>
          </div>

          {/* To Token Card */}
          <Card className="bg-gray-900/80 backdrop-blur-xl border-gray-700 p-4 sm:p-6 rounded-3xl">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>{t("swap.youReceive")}</span>
              </div>

              <div className="flex gap-2 sm:gap-3 items-center">
                <Input
                  type="text"
                  placeholder="0"
                  value={toAmount}
                  readOnly
                  className="flex-1 text-2xl sm:text-3xl font-semibold bg-transparent border-none text-white pl-0 pr-2 sm:pr-4 no-focus-styles cursor-default"
                />
                <TokenSelector
                  token={toToken}
                  onSelect={setToToken}
                  isOpen={isToTokenOpen}
                  setIsOpen={setIsToTokenOpen}
                  placeholder={t("token.selectToken")}
                  excludeToken={fromToken}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  isSearching={isSearching}
                  isContractSearch={isContractSearch}
                  hasSearched={hasSearched}
                  searchedToken={searchedToken}
                  searchError={searchError}
                  clearError={clearError}
                  addCustomToken={(token) => addCustomToken(token, true)} // 自动选择
                  filteredTokens={filteredTokens}
                  fromToken={fromToken}
                  fromTokenBalance={fromTokenBalance}
                  toToken={toToken}
                  toTokenBalance={toTokenBalance}
                  getTokenPrice={getTokenPrice}
                  getTokenPriceChange={getTokenPriceChange}
                  setSearchedToken={setSearchedToken}
                  resetSearch={resetSearch}
                  isConnected={isConnected}
                  calculateUSDValue={calculateUSDValue}
                  formatUSDValue={formatUSDValue}
                  existingToken={existingToken}
                  debouncedSearch={debouncedSearch}
                  isCalculatingPrice={isCalculatingPrice} // 新增
                />
              </div>

              <div className="flex justify-between items-center">
                {toToken && toAmount && (
                  <div className="text-sm text-gray-400">
                    {isPriceLoading ? (
                      <span className="inline-block w-16 h-3 bg-gray-700 animate-pulse rounded"></span>
                    ) : (
                      formatUSDValue(calculateUSDValue(toToken.symbol, toAmount))
                    )}
                  </div>
                )}
                {/* Token Balance in bottom right of input */}
                {toToken && isConnected && isOnBaseChain && (
                  <div className="text-right text-xs sm:text-sm text-gray-500">
                    {toTokenBalance.isLoading ? (
                      <span className="inline-block w-16 h-3 bg-gray-700 animate-pulse rounded"></span>
                    ) : (
                      `${Number.parseFloat(toTokenBalance.balance).toFixed(4)} ${toToken.symbol}`
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Exchange Rate Display */}
          {fromToken && toToken && exchangeRate && (
            <div className="text-center text-xs sm:text-sm text-gray-400 py-2 bg-gray-800/30 rounded-2xl px-3 sm:px-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <span>
                  1 {fromToken.symbol} = {exchangeRate.toFixed(6)} {toToken.symbol}
                </span>
                {getTokenPrice(fromToken.symbol) > 0 && getTokenPrice(toToken.symbol) > 0 && (
                  <span className="text-xs text-gray-500">
                    (${getTokenPrice(fromToken.symbol).toFixed(2)} → ${getTokenPrice(toToken.symbol).toFixed(2)})
                  </span>
                )}
              </div>

              {/* 价格影响警告 */}
              {priceImpact > 0 && (
                <div
                  className={`mt-2 text-xs flex items-center justify-center gap-1 ${priceImpact > 5 ? "text-red-400" : priceImpact > 2 ? "text-yellow-400" : "text-green-400"
                    }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Price Impact: {priceImpact.toFixed(2)}%</span>
                  {priceImpact > 5 && <span className="ml-1">(High Impact!)</span>}
                </div>
              )}

              {isCalculatingPrice && (
                <div className="mt-2 text-xs text-blue-400 flex items-center justify-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Calculating price...</span>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <Button onClick={handleSwapClick} disabled={buttonState.disabled} className={buttonState.className}>
            {isSwapping && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {!isConnected && <Wallet className="w-4 h-4 mr-2" />}
            {buttonState.text}
          </Button>
        </div>

        {/* Bottom Text */}
        <div className="text-center mt-8 sm:mt-12 max-w-2xl px-4">
          <p className="text-gray-400 text-base sm:text-lg">{t("main.description")}</p>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-12 sm:mt-16 mb-6 sm:mb-8 max-w-4xl mx-auto px-3 sm:px-4">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                <p className="font-semibold text-yellow-400 mb-2">{t("legal.title")}</p>
                <p className="mb-2">
                  <strong>{t("legal.demo")}</strong> {t("legal.noServices")}
                </p>
                <p className="mb-2">{t("legal.notProtected")}</p>
                <p className="text-gray-400">{t("legal.noResponsibility")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Swap Confirmation Dialog */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white rounded-3xl max-w-md">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="text-xl font-semibold">{t("confirm.title")}</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmation(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogHeader>

            <div className="space-y-6">
              {/* From Token */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {fromAmount} {fromToken?.symbol}
                  </div>
                  <div className="text-gray-400">
                    {formatUSDValue(calculateUSDValue(fromToken?.symbol || "", fromAmount))}
                  </div>
                </div>
                <div className="relative">
                  <TokenIcon token={fromToken} size="w-10 h-10" showBadge={true} />
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowDown className="w-6 h-6 text-gray-400" />
              </div>

              {/* To Token */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {toAmount} {toToken?.symbol}
                  </div>
                  <div className="text-gray-400">
                    {formatUSDValue(calculateUSDValue(toToken?.symbol || "", toAmount))}
                  </div>
                </div>
                <div className="relative">
                  <TokenIcon token={toToken} size="w-10 h-10" showBadge={true} />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-700"></div>

              {/* Fee Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{t("confirm.fee")}</span>
                  </div>
                  <span className="text-white">
                    {formatUSDValue(calculateUSDValue(fromToken?.symbol || "", fromAmount) * 0.0025)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{t("confirm.networkFee")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BaseBadge size="small" />
                    <span className="text-white">$0.01</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{t("confirm.rate")}</span>
                  <span className="text-white text-right">
                    {fromToken && toToken && exchangeRate && (
                      <>
                        1 {fromToken.symbol} = {exchangeRate.toFixed(2)} {toToken.symbol}
                        <br />
                        <span className="text-xs text-gray-400">
                          ({formatUSDValue(getTokenPrice(fromToken.symbol))})
                        </span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{t("confirm.slippageLimit")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded">{t("confirm.auto")}</span>
                    <span className="text-white">2.5%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{t("confirm.orderRouting")}</span>
                  </div>
                  <span className="text-white">Uniswap API</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{t("confirm.priceImpact")}</span>
                  </div>
                  <span className="text-green-400">-0.05%</span>
                </div>
              </div>

              {/* Confirm Button */}
              <Button
                onClick={async () => {
                  setShowConfirmation(false)
                  await executeSwap(fromToken, toToken, fromAmount, toAmount)
                }}
                disabled={isSwapping}
                className="w-full h-14 text-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-2xl font-semibold"
              >
                {isSwapping ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("swap.swapping")}
                  </div>
                ) : (
                  t("confirm.swap")
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
