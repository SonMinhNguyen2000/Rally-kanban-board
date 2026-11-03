'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ThemeChoice } from '@/lib/ui/useTheme';

export const ThemeContext = createContext<{
  theme: ThemeChoice;
  setTheme: (theme: ThemeChoice) => void;
}>({
  theme: 'system',
  setTheme: () => undefined,
});

/**
 * Creates the query cache with the board's defaults.
 * @returns A new query client.
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, refetchOnWindowFocus: true },
    },
  });
}

/**
 * Application-wide providers. The cache lives in state, so it is never shared between requests.
 * @param props.children - The app content that uses the theme and query cache.
 * @returns The children, wrapped in the theme and query providers.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const [theme, setThemeState] = useState<ThemeChoice>('system');

  useEffect(() => {
    const saved = window.localStorage.getItem('rally-theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') setThemeState(saved);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    /** Sets the page to the chosen theme, resolving "system" from the operating system. */
    const applyTheme = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
    };
    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  const themeValue = useMemo(
    () => ({
      theme,
      setTheme: (nextTheme: ThemeChoice) => {
        setThemeState(nextTheme);
        window.localStorage.setItem('rally-theme', nextTheme);
      },
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeContext.Provider>
  );
}
