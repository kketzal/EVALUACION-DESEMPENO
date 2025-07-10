const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  setupFilesAfterEnv: ['<rootDir>/jest.server.setup.js'],
  testMatch: [
    '<rootDir>/server/**/*.test.js',
    '<rootDir>/server/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'server/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  testTimeout: 10000,
  // Evitar que el servidor se inicie durante las pruebas
  moduleNameMapper: {
    '^./server$': '<rootDir>/server/server.mock.js'
  }
}; 