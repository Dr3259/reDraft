"use client";

import { Button } from "@/components/ui/button";
import { useChangeLocale, useCurrentLocale, useI18n } from "@/locales/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobeIcon } from "lucide-react";

export function LanguageSwitcher() {
  const t = useI18n();
  const changeLocale = useChangeLocale();
  const currentLocale = useCurrentLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t('languageSwitcher.changeLanguage')}>
          <GlobeIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => changeLocale("en")}
          disabled={currentLocale === "en"}
        >
          {t("languageSwitcher.english")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLocale("zh")}
          disabled={currentLocale === "zh"}
        >
          {t("languageSwitcher.chinese")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
