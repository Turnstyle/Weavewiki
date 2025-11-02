/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(() => {
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
    // The 'define' block was removed from here. The application should
    // now correctly use the process.env.API_KEY provided by the
    // AI Studio / Cloud Run runtime environment, rather than a
    // hardcoded value from the build environment.
  };
});
