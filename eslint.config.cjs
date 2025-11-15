const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");
const simpleImportSort = require("eslint-plugin-simple-import-sort");
const unusedImports = require("eslint-plugin-unused-imports");
const globals = require("globals");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

const tsProjectGlobs = ["./tsconfig.base.json", "./apps/*/tsconfig.json"];

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "**/dist/**",
      "**/build/**",
      ".turbo/**",
      "coverage/**",
      "apps/backend/convex/_generated/**",
      "apps/web/.react-router/**",
    ],
  },
  js.configs.recommended,
  ...compat.extends(
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier",
  ),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
    settings: {
      react: { version: "detect" },
      "import/resolver": {
        typescript: {
          project: tsProjectGlobs,
        },
      },
    },
    plugins: {
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "import/order": "off",
      "import/no-duplicates": "off",
      "simple-import-sort/imports": "off",
      "unused-imports/no-unused-imports": "error",
      "@typescript-eslint/consistent-type-imports": "off",
      "import/default": "off",
    },
  },
  {
    files: ["apps/worker/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ["apps/backend/**/*"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.config.{js,ts,cjs,mjs}", "**/vite.config.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];
