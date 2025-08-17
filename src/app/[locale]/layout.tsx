
import type { Metadata } from 'next';
import '../globals.css';
import { getI18n } from '@/locales/server';
import { Toaster } from "@/components/ui/toaster";
import { ClientIntlWrapper } from '@/components/client-intl-wrapper';


export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getI18n(locale);
  return {
    title: t('appTitle'),
    description: t('appDescription'),
  };
}

export default function LocaleLayout({
  children,
  params: { locale }
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  // The html and body tags are now in the root layout: src/app/layout.tsx
  // This layout is nested inside the root layout.
  return (
    <ClientIntlWrapper locale={locale}>
      {children}
      <Toaster />
    </ClientIntlWrapper>
  );
}
