import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "../.",
  testRegex: ".test.ts$",
  collectCoverageFrom: ["src/**/*.ts"],
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  resolver: "bob-the-bundler/jest-resolver",
};

export default config;
