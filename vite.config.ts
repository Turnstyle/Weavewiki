/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from .env files based on the current mode.
  // The third argument '' ensures all variables are loaded, not just those with VITE_ prefix.
  const env = loadEnv(mode, process.cwd(), '');

  // Determine the correct API key. Prioritize API_KEY (used by AI Studio)
  // and fall back to GEMINI_API_KEY (for local development).
  const apiKey = env.API_KEY ?? env.GEMINI_API_KEY ?? '';

  return {
    plugins: [react()],
    // Vite options tailored for deployment within AI Studio
    server: {
      // AI Studio uses a proxy, so we need to allow all hosts
      host: '0.0.0.0',
      port: 3000,
    },
    build: {
      outDir: 'dist',
    },
    define: {
      // This is the core of the fix. It replaces `process.env.API_KEY`
      // in the source code with the actual value from the build environment.
      // It also defines GEMINI_API_KEY for consistency, as requested.
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
    },
  };
});
