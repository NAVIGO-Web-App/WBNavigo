/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },

  // ✅ Vitest configuration
  test: {
    environment: "jsdom",
    globals: true,      // Simulate DOM for React components
    setupFiles: "./src/setupTests.ts", // File for jest-dom setup
    coverage: {
      provider: "v8",          // Use built-in V8 engine for coverage
      reporter: ["text", "json", "html"], // Outputs coverage reports
      reportsDirectory: "./coverage",     // Folder for reports
      lines: 80,               // Minimum coverage thresholds
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
}));
