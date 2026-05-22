/**
 * ThemeProvider — server component.
 *
 * Reads site_settings and injects CSS custom properties onto the <html> element
 * via an inline <style> tag. This approach works with Next.js App Router server
 * components and avoids layout shift (values are in the initial HTML, not set
 * by JS after hydration).
 *
 * With the default seed values, the injected vars resolve to exactly the same
 * values as the hardcoded fallbacks in globals.css and tailwind.config.ts.
 * Visual output is pixel-identical until an admin changes something.
 */

import { getSiteSettings, buildThemeCssVars } from './settings';

export async function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  const vars = buildThemeCssVars(settings);

  // Build a :root { ... } block — injected as a <style> tag in <head>
  const cssBlock = `:root{${Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')}}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssBlock }} />
      {children}
    </>
  );
}
