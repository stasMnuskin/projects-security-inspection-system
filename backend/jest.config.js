module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/fixtures/'],
  coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/fixtures/'],
};