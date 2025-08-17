
"use client";

import { I18nProviderClient } from "@/locales/client";
import type React from "react";

// This is a client-component that can be used in a server-component
// to provide the I18n context to its children
export function ClientIntlWrapper({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  return <I18nProviderClient locale={locale}>{children}</I18nProviderClient>;
}
