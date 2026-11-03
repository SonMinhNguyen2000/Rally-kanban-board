import { defineConfig } from '@playwright/test';

/**
 * End-to-end tests against the production build and the local Supabase stack. Uses the
 * installed Chrome rather than a downloaded browser. One worker, because guests are created
 * per spec file and anonymous sign-ins are rate limited.
 */
// E2E_PORT lets the tests run while a dev server holds port 3000.
const PORT = process.env.E2E_PORT ?? '3000';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  fullyParallel: false,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  outputDir: 'test-results/artifacts',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: 'chrome',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/board`,
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
