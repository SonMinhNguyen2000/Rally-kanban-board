import { App } from '@/components/features/App';
import { AppProviders } from '@/components/features/AppProviders';

/**
 * The board route. The page is client-rendered, and its session starts in the browser.
 * @returns The board app inside its providers.
 */
export default function BoardPage() {
  return (
    <AppProviders>
      <App />
    </AppProviders>
  );
}
