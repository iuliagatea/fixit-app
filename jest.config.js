/** @type {import('jest').Config} */
module.exports = {
  roots: ['<rootDir>/app/frontend'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/app/frontend/test/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
}
