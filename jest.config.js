module.exports = {
  preset: 'ts-jest',
  testMatch: ["**/test/**/*.[jt]s?(x)"],
  testEnvironment: 'node',
  collectCoverage: true,
  coveragePathIgnorePatterns: ['node_modules'],
  testTimeout: 4 * 60 * 1000, // 4 minutes
};
