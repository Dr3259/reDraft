
import type { Metadata } from 'next';
import './[locale]/../globals.css'; // Adjusted path to globals.css

export const metadata: Metadata = {
  // Metadata can be defined here and overridden in child layouts
  title: 'redraft',
  description: 'A browser-based whiteboard with drawing and text capabilities.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The `lang` attribute will be set in the locale layout
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Long+Cang&family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@400;500;700&family=ZCOOL+XiaoWei&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
      </body>
    </html>
  );
}
