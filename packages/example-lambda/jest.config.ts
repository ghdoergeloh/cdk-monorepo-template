import { defaults } from 'jest-config';
import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/lambda'], // or other folders if you want to place the test next to the tested unit
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx|mts)'],
  modulePathIgnorePatterns: ['.*__mocks__.*\\.m?jsx?$'], // to ignore compiled mocks
  moduleFileExtensions: ['mts', 'ts', 'tsx', ...defaults.moduleFileExtensions], // to make sure that ts files are preferred
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.m?[tj]sx?$': '$1', // to fix jest module resolution with TS + ESM
  },
  extensionsToTreatAsEsm: ['.mts'], // to enable ESM for TS (like top level await)
  clearMocks: true,
  restoreMocks: true,
  collectCoverage: true,
  reporters: ['default', 'jest-junit'],
  testResultsProcessor: 'jest-sonar-reporter',
  // setupFiles: ['<rootDir>/jest.env.mts'], // if you want to define env vars for the test
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: false }],
    '^.+\\.mtsx?$': ['ts-jest', { useESM: true }],
  },
  transformIgnorePatterns: ['node_modules/.*'],
};
export default config;
