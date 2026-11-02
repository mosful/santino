import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Node.js 靜態驗收工具採 CommonJS，這些檔案可使用 require。
  { files: ["scripts/**/*.cjs", "tests/e2e/**/*.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    // 本機驗收輸出與臨時探測腳本，不屬於應用程式原始碼。
    "test-results/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
