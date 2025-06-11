// This file is intentionally left blank or can be removed.
// The main page is now src/app/[locale]/page.tsx due to i18n routing.
// next-international's middleware will redirect or rewrite "/" to "/[defaultLocale]/".

export default function Page() {
  return null; // Or a redirect component if middleware isn't set to redirect root
}
