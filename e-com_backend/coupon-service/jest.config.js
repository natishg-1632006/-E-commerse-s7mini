module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/jest.setup.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    'src/utils/cleanProductStock.js'
  ],
  verbose: true
};