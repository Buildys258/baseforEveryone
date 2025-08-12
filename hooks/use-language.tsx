"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"

type Language = "en" | "zh"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    // Header
    "header.title": "Base for Everyone",
    "header.updated": "Updated",
    "header.updating": "Updating...",
    "header.priceError": "Price error",
    "header.fallbackPrices": "Fallback prices",

    // Main content
    "main.swap": "Swap",
    "main.anytime": "anytime,",
    "main.anywhere": "anywhere.",
    "main.description": "The largest onchain marketplace. Buy and sell crypto on Ethereum and 12+ other chains.",

    // Swap interface
    "swap.youPay": "You pay",
    "swap.youReceive": "You receive",
    "swap.selectToken": "Select token",
    "swap.enterAmount": "Enter an amount",
    "swap.insufficientBalance": "Insufficient Balance",
    "swap.connectWallet": "Connect Wallet",
    "swap.switchNetwork": "Switch to Base Network",
    "swap.swapping": "Swapping...",

    // Quick amount buttons
    "amount.25percent": "25%",
    "amount.50percent": "50%",
    "amount.75percent": "75%",
    "amount.max": "Max",

    // Token selector
    "token.selectToken": "Select a token",
    "token.baseNetwork": "Base Network",
    "token.searchPlaceholder": "Search tokens or paste contract address",
    "token.searching": "Searching for token...",
    "token.noTokenFound": "No token found",
    "token.invalidContract": "Contract address may be invalid or not an ERC20 token",
    "token.noResults": "No tokens found",
    "token.searchHint": "Try searching by token name, symbol, or contract address",
    "token.addressLength": "Contract address should be 42 characters long",
    "token.add": "Add",

    // Confirmation dialog
    "confirm.title": "You're swapping",
    "confirm.fee": "Fee (0.25%)",
    "confirm.networkFee": "Network fee",
    "confirm.rate": "Rate",
    "confirm.slippageLimit": "Slippage limit",
    "confirm.auto": "Auto",
    "confirm.orderRouting": "Order routing",
    "confirm.priceImpact": "Price impact",
    "confirm.swap": "Swap",

    // Alerts and errors
    "alert.swapSuccess": "Swap completed successfully!",
    "alert.viewDetails": "View Details",
    "alert.fallbackPrices": "Using fallback prices - live data temporarily unavailable",
    "alert.transactionRejected": "Transaction was rejected",
    "alert.insufficientFunds": "Insufficient funds for transaction",
    "alert.transactionFailed": "Transaction failed - this may be due to insufficient liquidity or slippage",
    "alert.gasError": "Transaction failed due to gas estimation error",
    "alert.tryAgain": "Please try again",

    // Wallet connection
    "wallet.connectWallet": "Connect Wallet",
    "wallet.connecting": "Connecting...",
    "wallet.retrying": "Retrying...",
    "wallet.connectionCancelled": "Connection cancelled",
    "wallet.tryAgain": "Please try connecting your wallet again",
    "wallet.noWallet": "No wallet detected",
    "wallet.installWallet": "Please install MetaMask or another supported wallet",
    "wallet.timeout": "Connection timeout",
    "wallet.networkError": "Please check your network connection and try again",
    "wallet.connectionFailed": "Connection failed",
    "wallet.contactSupport": "Please try again or contact support",
    "wallet.copyAddress": "Copy Address",
    "wallet.viewExplorer": "View on Explorer",
    "wallet.disconnect": "Disconnect",
    "wallet.notInstalled": "Not installed",
    "wallet.newToWallets": "New to Ethereum wallets?",
    "wallet.learnMore": "Learn more about wallets",
    "wallet.retryConnection": "Retry Connection",

    // Legal disclaimer
    "legal.title": "Important Notice",
    "legal.demo": "This website is for educational and demonstration purposes only.",
    "legal.noServices": "This is a demo project and does not provide real financial services.",
    "legal.notProtected":
      "Any transactions or payments made through this website are not protected and may result in loss of funds.",
    "legal.noResponsibility":
      "The website developers are not responsible for any losses, damages, or other consequences arising from the use of this website. Please do not conduct real financial transactions on this site.",

    // Language
    "language.english": "English",
    "language.chinese": "中文简体",
  },
  zh: {
    // Header
    "header.title": "Base for Everyone",
    "header.updated": "已更新",
    "header.updating": "更新中...",
    "header.priceError": "价格错误",
    "header.fallbackPrices": "备用价格",

    // Main content
    "main.swap": "交换",
    "main.anytime": "随时随地，",
    "main.anywhere": "自由交易。",
    "main.description": "最大的链上交易市场。在以太坊和12+条链上买卖加密货币。",

    // Swap interface
    "swap.youPay": "您支付",
    "swap.youReceive": "您接收",
    "swap.selectToken": "选择代币",
    "swap.enterAmount": "输入金额",
    "swap.insufficientBalance": "余额不足",
    "swap.connectWallet": "连接钱包",
    "wallet.switchNetwork": "切换到 Base 网络",
    "wallet.swapping": "交换中...",

    // Quick amount buttons
    "amount.25percent": "25%",
    "amount.50percent": "50%",
    "amount.75percent": "75%",
    "amount.max": "最大",

    // Token selector
    "token.selectToken": "选择代币",
    "token.baseNetwork": "Base 网络",
    "token.searchPlaceholder": "搜索代币或粘贴合约地址",
    "token.searching": "搜索代币中...",
    "token.noTokenFound": "未找到代币",
    "token.invalidContract": "合约地址可能无效或不是 ERC20 代币",
    "token.noResults": "未找到代币",
    "token.searchHint": "尝试按代币名称、符号或合约地址搜索",
    "token.addressLength": "合约地址应为42个字符",
    "token.add": "添加",

    // Token selector - 添加缺失的翻译
    "token.validAddress": "有效的合约地址格式",
    "token.invalidAddress": "无效的地址格式",
    "token.addressProgress": "地址应为42个字符 ({current}/42)",
    "token.contractSearchMode": "合约搜索模式",
    "token.searchingAt": "正在搜索ERC20代币：",
    "token.alreadyInList": "⚠️ 此代币已在您的列表中",
    "token.calculatingPrice": "计算价格中...",
    "token.gettingMarketData": "从Uniswap V3获取市场数据...",
    "token.readingContract": "读取合约信息...",
    "token.verifyingContract": "验证合约",
    "token.gettingPrice": "获取价格",
    "token.tokenFoundSuccess": "代币搜索成功！",
    "token.decimals": "小数位数",
    "token.network": "网络",
    "token.contractVerified": "合约已验证且兼容ERC20",
    "token.fetchingPrice": "获取当前市场价格...",
    "token.customTokenWarning": "⚠️ 自定义代币警告",
    "token.verifyWarning": "交易前请务必验证代币合约。恶意合约可能导致资金损失。此代币将自动选择用于交易。",
    "token.contractNotFound": "合约地址有效但在Base网络上未找到ERC20代币",
    "token.tokenNotFound": "未找到代币",
    "token.contractInvalid": "找不到合约地址或不是Base网络上的有效ERC20代币。",
    "token.addressFormat": "合约地址格式",
    "token.validEthereumAddress": "有效的以太坊地址应该：",
    "token.startWith0x": '以"0x"开头',
    "token.exactly42chars": "恰好42个字符长",
    "token.hexOnly": "只包含十六进制字符 (0-9, a-f)",
    "token.example": "示例：",
    "token.currentLength": "当前长度：{length}/42个字符",
    "token.adding": "添加中...",

    // Confirmation dialog
    "confirm.title": "您正在交换",
    "confirm.fee": "手续费 (0.25%)",
    "confirm.networkFee": "网络费用",
    "confirm.rate": "汇率",
    "confirm.slippageLimit": "滑点限制",
    "confirm.auto": "自动",
    "confirm.orderRouting": "订单路由",
    "confirm.priceImpact": "价格影响",
    "confirm.swap": "交换",

    // Alerts and errors
    "alert.swapSuccess": "交换成功完成！",
    "alert.viewDetails": "查看详情",
    "alert.fallbackPrices": "使用备用价格 - 实时数据暂时不可用",
    "alert.transactionRejected": "交易被拒绝",
    "alert.insufficientFunds": "交易资金不足",
    "alert.transactionFailed": "交易失败 - 可能由于流动性不足或滑点过大",
    "alert.gasError": "交易失败，Gas 估算错误",
    "alert.tryAgain": "请重试",

    // Wallet connection
    "wallet.connectWallet": "连接钱包",
    "wallet.connecting": "连接中...",
    "wallet.retrying": "重试中...",
    "wallet.connectionCancelled": "连接已取消",
    "wallet.tryAgain": "请重新尝试连接钱包",
    "wallet.noWallet": "未检测到钱包",
    "wallet.installWallet": "请安装 MetaMask 或其他支持的钱包",
    "wallet.timeout": "连接超时",
    "wallet.networkError": "请检查网络连接并重试",
    "wallet.connectionFailed": "连接失败",
    "wallet.contactSupport": "请重试或联系技术支持",
    "wallet.copyAddress": "复制地址",
    "wallet.viewExplorer": "在浏览器中查看",
    "wallet.disconnect": "断开连接",
    "wallet.notInstalled": "未安装",
    "wallet.newToWallets": "初次使用以太坊钱包？",
    "wallet.learnMore": "了解更多关于钱包的信息",
    "wallet.retryConnection": "重试连接",

    // Legal disclaimer
    "legal.title": "重要声明",
    "legal.demo": "本网站仅用于教育和演示目的。",
    "legal.noServices": "这是一个演示项目，不提供真实的金融服务。",
    "legal.notProtected": "通过本网站进行的任何交易或付款都不受保护，可能导致资金损失。",
    "legal.noResponsibility":
      "网站开发者不对因使用本网站而产生的任何损失、损害或其他后果承担责任。请不要在本网站上进行真实的金融交易。",

    // Language
    "language.english": "English",
    "language.chinese": "中文简体",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  useEffect(() => {
    // Load language from localStorage, but default to English if nothing is saved
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "zh")) {
      setLanguageState(savedLanguage)
    } else {
      // If no saved language or invalid language, default to English
      setLanguageState("en")
      localStorage.setItem("language", "en")
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}
