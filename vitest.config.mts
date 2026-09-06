import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import path from 'node:path';

export default defineConfig({
  plugins: [mdx(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    // Serialize file execution: integration tests in src/db/__tests__/* share a
    // real Postgres database and cross-truncate the `users` table (cohort
    // tables have FK cascades back to it). Running test files in parallel
    // causes FK violations mid-flight. Single fork keeps DB state coherent.
    fileParallelism: false,
    server: {
      deps: {
        inline: ['next-auth', '@auth/core', '@auth/drizzle-adapter'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        branches: 70,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      exclude: [
        'node_modules/',
        '.next/',
        'src/__tests__/**',
        'src/components/hero/engine/renderer.ts',
        '**/*.config.*',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
