/**
 * Test the syntax highlighting module
 */

import hljs from 'highlight.js/lib/core';

// Import only the languages we use
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import typescript from 'highlight.js/lib/languages/typescript';

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('typescript', typescript);

console.log('=== Syntax Highlighting Test ===\n');

// Test JavaScript highlighting
const jsCode = `function hello(name) {
  const message = \`Hello, \${name}!\`;
  return message;
}`;

console.log('Test 1: JavaScript code highlighting');
const jsResult = hljs.highlight(jsCode, { language: 'javascript' });
if (jsResult.value.includes('hljs-keyword') && jsResult.value.includes('hljs-string')) {
  console.log('  ✓ JavaScript highlighting works');
  console.log(`    - Detected language: ${jsResult.language || 'javascript (explicit)'}`);
} else {
  console.log('  ✗ JavaScript highlighting failed');
  process.exit(1);
}

// Test Python highlighting
const pyCode = `def greet(name):
    """Return a greeting."""
    return f"Hello, {name}!"`;

console.log('\nTest 2: Python code highlighting');
const pyResult = hljs.highlight(pyCode, { language: 'python' });
if (pyResult.value.includes('hljs-keyword') || pyResult.value.includes('hljs-function')) {
  console.log('  ✓ Python highlighting works');
} else {
  console.log('  ✗ Python highlighting failed');
  process.exit(1);
}

// Test auto-detection
console.log('\nTest 3: Auto language detection');
const autoResult = hljs.highlightAuto(jsCode);
if (autoResult.language && autoResult.relevance > 0) {
  console.log(`  ✓ Auto-detection works: detected "${autoResult.language}" with relevance ${autoResult.relevance}`);
} else {
  console.log('  ✗ Auto-detection failed');
  process.exit(1);
}

console.log('\n=== All syntax highlighting tests passed! ===\n');
