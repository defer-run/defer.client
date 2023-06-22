module.exports = {
  root: true,
  reportUnusedDisableDirectives: true,
  env: {
    node: true,
  },
  overrides: [
    {
      files: "*.{js,ts,jsx,tsx,cjs,cts,mjs,mts,cjsx,ctsx,mjsx,mtsx}",
      parser: "@typescript-eslint/parser",
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
      ],
      rules: {
        "@typescript-eslint/ban-types": 1,
        "@typescript-eslint/no-explicit-any": 0,
      },
    },
  ],
};
