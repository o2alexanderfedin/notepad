/**
 * Test JavaScript file for E2E verification
 * This file tests syntax highlighting and file operations
 */

function greet(name) {
  const message = `Hello, ${name}!`;
  return message;
}

class Calculator {
  constructor() {
    this.result = 0;
  }

  add(a, b) {
    this.result = a + b;
    return this;
  }

  subtract(a, b) {
    this.result = a - b;
    return this;
  }
}

// Arrow functions
const multiply = (a, b) => a * b;

// Async/await example
async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

// Export for testing
export { greet, Calculator, multiply, fetchData };
