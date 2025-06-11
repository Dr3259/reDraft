// This file is intentionally left blank or can be removed.
// The main layout is now src/app/[locale]/layout.tsx due to i18n routing.
// If a root layout is absolutely necessary for non-localized routes (e.g. /api),
// it would be a minimal one. For this setup, next-international handles routing
// to [locale] segments, so this file is effectively replaced.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
