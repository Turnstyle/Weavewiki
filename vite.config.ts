/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// Fix: Reference vitest/config and import defineConfig from vitest/config to correctly type the test configuration.
/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  // The API key is now handled by the backend server.
  // The client-side code will make requests to our server,
  // which will then securely call the Google Gemini API.
  // Therefore, we no longer need to inject the API key here.
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    css: true,
  },
});