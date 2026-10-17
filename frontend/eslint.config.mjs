import tsParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import opentip from "./eslint-rules/opentip.js";

export default [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "public/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    plugins: { react, opentip },
    settings: { react: { version: "19" } },
    rules: {
      "react/jsx-key": ["error", { checkFragmentShorthand: true, checkKeyMustBeforeSpread: true }],
    },
  },
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    rules: {
      "opentip/ui-copy": "error",
      "opentip/no-serif": "error",
      "opentip/no-icon-src": "error",
      "opentip/directory-icon": "error",
    },
  },
];
