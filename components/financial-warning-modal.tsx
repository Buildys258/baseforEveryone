"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/hooks/use-language"

export function FinancialWarningModal() {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    // 检查localStorage中是否已经显示过警告
    const hasSeenWarning = localStorage.getItem("financial-warning-seen")
    if (!hasSeenWarning) {
      setIsOpen(true)
    }
  }, [])

  const handleAccept = () => {
    // 标记用户已经看过警告
    localStorage.setItem("financial-warning-seen", "true")
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 max-w-md rounded-lg bg-background border border-border p-6 shadow-xl">
        <div className="mb-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-center text-xl font-bold text-foreground">{t("financialWarning.title")}</h2>
        </div>

        <div className="mb-6 space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">{t("financialWarning.disclaimer")}</strong>
            {t("financialWarning.disclaimerText")}
          </p>
          <p>{t("financialWarning.risk1")}</p>
          <p>{t("financialWarning.risk2")}</p>
          <p>{t("financialWarning.risk3")}</p>
          <p>{t("financialWarning.risk4")}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("financialWarning.accept")}
          </button>
        </div>
      </div>
    </div>
  )
}
