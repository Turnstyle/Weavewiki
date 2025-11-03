/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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