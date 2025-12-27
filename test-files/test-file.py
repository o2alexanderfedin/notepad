#!/usr/bin/env python3
"""
Test Python file for E2E verification
This file tests syntax highlighting and file operations
"""

import os
from typing import List, Optional


def greet(name: str) -> str:
    """Return a greeting message."""
    message = f"Hello, {name}!"
    return message


class Calculator:
    """A simple calculator class."""

    def __init__(self):
        self.result = 0

    def add(self, a: int, b: int) -> 'Calculator':
        """Add two numbers."""
        self.result = a + b
        return self

    def subtract(self, a: int, b: int) -> 'Calculator':
        """Subtract two numbers."""
        self.result = a - b
        return self


# Lambda function
multiply = lambda a, b: a * b


async def fetch_data(url: str) -> dict:
    """Fetch data from a URL."""
    import aiohttp

    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.json()


if __name__ == "__main__":
    calc = Calculator()
    print(greet("World"))
    print(calc.add(5, 3).result)
