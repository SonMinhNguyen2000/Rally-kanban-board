import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Unit tests only. Next.js bundles the app, so this file is the only Vite-based configuration
 * in the project. The alias mirrors the "@/*" path in tsconfig.json.
 */
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { include: ['src/**/*.test.ts'] },
});
