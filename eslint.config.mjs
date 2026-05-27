import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Apostrophes and quotes read fine as raw characters in JSX.
      "react/no-unescaped-entities": "off",
      // Hydrating from localStorage / subscribing to external stores legitimately
      // calls setState inside useEffect. The new strict rule misfires on these.
      "react-hooks/set-state-in-effect": "off",
      // Date.now() is intentional for "relative to now" calculations.
      "react-hooks/purity": "off",
    },
  },
]);

export default eslintConfig;
