"use client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, Check } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  const languages = [
    { code: "en", name: t("language.english") },
    { code: "zh", name: t("language.chinese") },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 rounded-2xl px-2 sm:px-3"
        >
          <Globe className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">{languages.find((lang) => lang.code === language)?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40 bg-gray-900 border-gray-700 rounded-2xl" align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code as "en" | "zh")}
            className="text-white hover:bg-gray-800 cursor-pointer rounded-xl mx-1 flex items-center justify-between"
          >
            <span>{lang.name}</span>
            {language === lang.code && <Check className="w-4 h-4 text-blue-400" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
