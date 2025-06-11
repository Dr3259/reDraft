
import type { Metadata } from 'next';
import '../globals.css';
import { getI18n } from '@/locales/server';
import { I18nProviderClient } from '@/locales/client';
import { Toaster } from "@/components/ui/toaster";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getI18n(locale);
  return {
    title: t('appTitle'),
    description: t('appDescription'),
  };
}

function ClientIntlWrapper({ children, locale }: { children: React.ReactNode, locale: string }) {
  "use client";
  return (
    <I18nProviderClient locale={locale}>
      <>
        {children}
        <Toaster />
      </>
    </I18nProviderClient>
  );
}

export default function LocaleLayout({
  children,
  params: { locale }
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ClientIntlWrapper locale={locale}>
          {children}
        </ClientIntlWrapper>
      </body>
    </html>
  );
}
