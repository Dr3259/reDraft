
import type { Metadata } from 'next';
import '../globals.css';
import { getI18n } from '@/locales/server';
import ClientIntlWrapper from '@/components/client-intl-wrapper';

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
