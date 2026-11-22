import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    // 画面の部品を描画して確かめるため、ブラウザの DOM を模擬する
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
