const { defaults } = require('jest-config');

/**
 * @type {import('ts-jest/dist/types').InitialOptionsTsJest}
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/lambda'], // or other folders if you want to place the test next to the tested unit
  testMatch: ['**/?(*.)+(spec|test).+(ts|tsx)'],
  modulePathIgnorePatterns: ['.*__mocks__.*\\.(js|jsx)$'],
  moduleFileExtensions: ['ts', 'tsx', ...defaults.moduleFileExtensions],
  clearMocks: true,
  restoreMocks: true,
  collectCoverage: true,
  reporters: ['default', 'jest-junit'],
  testResultsProcessor: 'jest-sonar-reporter',
  // setupFiles: ['<rootDir>/jest.env.js'], // if you want to define env vars for the test
};
