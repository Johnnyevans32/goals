import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    rules: {
      // Allow any type for now during CI/CD setup
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unused variables during development
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow unescaped entities in JSX for now
      "react/no-unescaped-entities": "warn",
      // Allow anonymous default exports
      "import/no-anonymous-default-export": "warn",
    },
  },
];

export default eslintConfig;
