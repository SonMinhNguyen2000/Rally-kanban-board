import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@/styles/tokens.css';
import '@/styles/base.css';

/** The document title, description and icon for every page. */
export const metadata: Metadata = {
  title: 'Rally',
  description: 'Rally is a task board where work moves from lane to lane.',
  icons: { icon: '/favicon.svg' },
};

/** Browser chrome colours per system theme, and room for the phone's safe areas. */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f5ff' },
    { media: '(prefers-color-scheme: dark)', color: '#10132b' },
  ],
};

/**
 * The root layout. AppProviders updates the data-theme attribute after hydration.
 * @param children - The current route.
 * @returns The HTML document around the route.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
