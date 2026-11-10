/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 纯前端、零后端。base 使用相对路径 "./"，便于 GitHub Pages 子路径托管（项目页 /<repo>）。
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    target: "es2021",
    sourcemap: false,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
