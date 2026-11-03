import type { NextConfig } from 'next';

/**
 * Next.js configuration. Strict mode surfaces effects that aren't safe to run twice.
 * agentRules: false stops `next dev` from adding a generated file to the project root.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  agentRules: false,
};

export default nextConfig;
