/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// FIX: Removed the function wrapper `() => ({...})` and passed the configuration
// object directly to `defineConfig`. This resolves a TypeScript error where the
// function signature did not match `defineConfig`'s expected overloads, causing
// incorrect type inference for the `appType` property.
export default defineConfig({
  plugins: [react()],
  appType: 'spa', // Explicitly set to SPA mode for correct routing
  // Vite options tailored for deployment within AI Studio
  server: {
    // AI Studio uses a proxy, so we need to allow all hosts
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
  // This `define` block is crucial. It tells Vite to find `process.env.API_KEY`
  // in the code and replace it with the actual value of the API_KEY from the
  // build environment. Google Cloud Run makes this variable available during
  // the build step.
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
});
