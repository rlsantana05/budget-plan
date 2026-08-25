import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// eslint-config-next already registers `import`, `jsx-a11y`, `react`,
// `react-hooks` and `@typescript-eslint`. Airbnb's legacy configs re-register
// them, which ESLint 9 rejects ("Cannot redefine plugin"), so keep only
// Airbnb's rules/settings and let the plugins be defined once by next.
//
// `airbnb-typescript` is intentionally omitted: v18 targets
// `@typescript-eslint@7` and references rule names (e.g. `brace-style`) that
// @typescript-eslint v8 removed, so it fails validation. TS-specific rules are
// still covered by `eslint-config-next/typescript`.
const airbnbConfig = compat
  .extends("airbnb", "airbnb/hooks", "plugin:import/typescript")
  .map((config) =>
    Object.fromEntries(
      Object.entries(config).filter(([key]) => key !== "plugins"),
    ),
  );

// Scoped to the planning feature so the rest of the repo (which uses the Next
// defaults and double-quote style) keeps linting clean. Each Airbnb config
// stays a separate flat-config entry (deep-merging them with reduce would
// drop all but the last set of rules).
const airbnbScoped = airbnbConfig.map((config) => ({
  files: ["src/features/planning/**/*.{ts,tsx}"],
  ...config,
}));

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...airbnbScoped,
  {
    files: ["src/features/planning/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    files: ["src/features/planning/**/*.{ts,tsx}"],
    rules: {
      // Airbnb's base `no-unused-vars` (core rule) fires false positives on
      // parameter names inside TS type signatures. Swap it for the TS-aware
      // rule (what `airbnb-typescript` does) with underscore-ignore patterns.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "import/extensions": "off",
      "import/no-extraneous-dependencies": "off",
      "import/prefer-default-export": "off",
      "react/function-component-definition": "off",
      "react/jsx-props-no-spreading": "off",
      "react/require-default-props": "off",
      "react/react-in-jsx-scope": "off",
      // Next.js components live in `.tsx`; Airbnb's `.jsx`-only default is
      // incompatible with the App Router convention.
      "react/jsx-filename-extension": [
        "error",
        { allow: "as-needed", extensions: [".js", ".jsx", ".tsx"] },
      ],
      // Barrel default export (`export { default }`) is a standard Next pattern.
      "no-restricted-exports": "off",
      // The codebase deliberately reads props via `props.x`.
      "react/destructuring-assignment": "off",
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          pathGroups: [{ pattern: "@/**", group: "internal" }],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local tooling / agent scratch — not app code.
    ".agent/**",
    ".claude/**",
    ".hermes/**",
  ]),
]);

export default eslintConfig;
