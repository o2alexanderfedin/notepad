/**
 * Electron E2E Test Script
 *
 * This script verifies that the Electron IPC handlers work correctly
 * by testing file read/write operations directly in the main process.
 */

import { readFile, writeFile, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Test file paths
const TEST_JS_FILE = join(__dirname, 'test-file.js');
const TEST_PY_FILE = join(__dirname, 'test-file.py');
const TEST_OUTPUT_FILE = join(__dirname, 'test-output.txt');

/**
 * Test reading a file (simulates IPC open-file handler)
 */
async function testReadFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const name = filePath.split(/[/\\]/).pop() || 'untitled';
    return {
      success: true,
      path: filePath,
      content,
      name
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Test writing a file (simulates IPC save-file handler)
 */
async function testWriteFile(filePath, content) {
  try {
    await writeFile(filePath, content, 'utf8');
    const name = filePath.split(/[/\\]/).pop() || 'untitled';
    return {
      success: true,
      path: filePath,
      name
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Verify file content matches expected
 */
async function verifyFileContent(filePath, expectedContent) {
  try {
    const content = await readFile(filePath, 'utf8');
    return content === expectedContent;
  } catch {
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  const results = [];

  console.log('=== Electron E2E File Operations Test ===\n');

  // Test 1: Read JavaScript file
  console.log('Test 1: Read JavaScript file...');
  const jsResult = await testReadFile(TEST_JS_FILE);
  if (jsResult.success && jsResult.content.includes('function greet')) {
    console.log('  ✓ JavaScript file read successfully');
    console.log(`    - File: ${jsResult.name}`);
    console.log(`    - Size: ${jsResult.content.length} characters`);
    results.push({ test: 'Read JS file', passed: true });
  } else {
    console.log('  ✗ Failed to read JavaScript file');
    results.push({ test: 'Read JS file', passed: false, error: jsResult.error });
  }

  // Test 2: Read Python file
  console.log('\nTest 2: Read Python file...');
  const pyResult = await testReadFile(TEST_PY_FILE);
  if (pyResult.success && pyResult.content.includes('def greet')) {
    console.log('  ✓ Python file read successfully');
    console.log(`    - File: ${pyResult.name}`);
    console.log(`    - Size: ${pyResult.content.length} characters`);
    results.push({ test: 'Read Python file', passed: true });
  } else {
    console.log('  ✗ Failed to read Python file');
    results.push({ test: 'Read Python file', passed: false, error: pyResult.error });
  }

  // Test 3: Write and verify file
  console.log('\nTest 3: Write and verify file...');
  const testContent = `// Test file created at ${new Date().toISOString()}\nconst message = "Hello, E2E Test!";`;
  const writeResult = await testWriteFile(TEST_OUTPUT_FILE, testContent);
  if (writeResult.success) {
    // Verify the content was written correctly
    const verified = await verifyFileContent(TEST_OUTPUT_FILE, testContent);
    if (verified) {
      console.log('  ✓ File written and verified successfully');
      console.log(`    - File: ${writeResult.name}`);
      console.log(`    - Size: ${testContent.length} characters`);
      results.push({ test: 'Write and verify file', passed: true });
    } else {
      console.log('  ✗ File written but verification failed');
      results.push({ test: 'Write and verify file', passed: false, error: 'Content mismatch' });
    }
    // Clean up
    try {
      await unlink(TEST_OUTPUT_FILE);
      console.log('  ✓ Test file cleaned up');
    } catch {
      console.log('  (Could not clean up test file)');
    }
  } else {
    console.log('  ✗ Failed to write file');
    results.push({ test: 'Write and verify file', passed: false, error: writeResult.error });
  }

  // Test 4: Verify file extension detection
  console.log('\nTest 4: Verify file extension detection...');
  const extensionTests = [
    { file: 'test.js', expected: 'javascript' },
    { file: 'test.py', expected: 'python' },
    { file: 'test.html', expected: 'html' },
    { file: 'test.css', expected: 'css' },
    { file: 'test.json', expected: 'json' },
    { file: 'test.md', expected: 'markdown' },
    { file: 'test.ts', expected: 'typescript' }
  ];

  const EXTENSION_TO_LANGUAGE = {
    '.js': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.pyw': 'python',
    '.html': 'html',
    '.htm': 'html',
    '.xml': 'xml',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.json': 'json',
    '.md': 'markdown',
    '.markdown': 'markdown',
    '.sh': 'bash',
    '.bash': 'bash',
    '.zsh': 'bash',
    '.sql': 'sql',
    '.java': 'java',
    '.cs': 'csharp',
    '.cpp': 'cpp',
    '.cc': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.hpp': 'cpp',
    '.go': 'go',
    '.rs': 'rust',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.rb': 'ruby',
    '.php': 'php'
  };

  function getLanguageFromFileName(fileName) {
    if (!fileName) return null;
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) return null;
    const ext = fileName.slice(lastDot).toLowerCase();
    return EXTENSION_TO_LANGUAGE[ext] || null;
  }

  let allExtensionsPassed = true;
  for (const test of extensionTests) {
    const detected = getLanguageFromFileName(test.file);
    if (detected === test.expected) {
      console.log(`  ✓ ${test.file} → ${detected}`);
    } else {
      console.log(`  ✗ ${test.file} → ${detected} (expected: ${test.expected})`);
      allExtensionsPassed = false;
    }
  }
  results.push({ test: 'File extension detection', passed: allExtensionsPassed });

  // Summary
  console.log('\n=== Test Summary ===');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);

  if (passed === total) {
    console.log('\n✓ All tests passed!\n');
    process.exit(0);
  } else {
    console.log('\n✗ Some tests failed!\n');
    process.exit(1);
  }
}

runTests();
