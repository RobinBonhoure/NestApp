import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: { jsx: 'react-jsx' },
      diagnostics: { ignoreCodes: ['TS5011'] },
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/*.test.ts?(x)'],
};

export default config;
