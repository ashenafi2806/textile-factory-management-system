import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    files: ["**/*.ts"],
    ignores: ["dist/**", "node_modules/**", "prisma/**"],

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: process.cwd(),
      },
    },

    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },

    rules: {
      // ✅ FIXES YOUR CURRENT ERRORS PERMANENTLY
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-explicit-any": "warn",

      // optional safety rules
      "@typescript-eslint/await-thenable": "error",
    },
  }
);