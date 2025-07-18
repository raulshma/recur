/**
 * This script runs the screen reader accessibility tests
 * 
 * Usage:
 * node run-screen-reader-tests.js
 */

const { execSync } = require('child_process');
const path = require('path');

// Define the test file path
const testFilePath = path.join(__dirname, 'ScreenReaderTests.tsx');

// Run the tests with Vitest
try {
  console.log('Running screen reader accessibility tests...');
  execSync(`npx vitest run ${testFilePath} --run`, { stdio: 'inherit' });
  console.log('Tests completed successfully!');
} catch (error) {
  console.error('Tests failed with error:', error.message);
  process.exit(1);
}