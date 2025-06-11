
"use client";

import type React from 'react';
import { I18nProviderClient } from '@/locales/client';
import { Toaster } from "@/components/ui/toaster";

export default function ClientIntlWrapper({ children, locale }: { children: React.ReactNode, locale: string }) {
  return (
    <I18nProviderClient locale={locale}>
      <>
        {children}
        <Toaster />
      </>
    </I18nProviderClient>
  );
}
