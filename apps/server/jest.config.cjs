/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@openrouter/sdk$': '<rootDir>/test/mocks/openrouter-sdk.cjs',
    '^common/impact$': '<rootDir>/test/mocks/common-impact.cjs',
    '^common/(.*)$': '<rootDir>/../../packages/common/src/$1.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/generated/**',
    '!src/main.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  reporters: ['default', '<rootDir>/jest.sonar-reporter.cjs'],
  clearMocks: true,
};
