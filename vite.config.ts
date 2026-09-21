import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  test: {
    // Logic suites need no DOM; only the one view suite opts into jsdom via a
    // `@vitest-environment` docblock. Keeps the default run fast.
    environment: "node",
    // Not for describe/it (every suite imports those): @testing-library/react
    // only registers its auto-cleanup when a global afterEach exists.
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.*", "src/**/*.view.tsx", "src/main.tsx", "src/test/**"]
    }
  }
});
