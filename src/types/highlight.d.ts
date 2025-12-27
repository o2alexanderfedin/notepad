/**
 * TypeScript type definitions for Highlight.js
 * Custom definitions for the highlight.js library used in this project.
 * Based on the API usage in src/shared/editor.js
 */

declare module 'highlight.js/lib/core' {
  /**
   * Result returned by highlight() and highlightAuto() functions.
   */
  export interface HighlightResult {
    /** The highlighted HTML string */
    value: string;
    /** The detected or specified language name */
    language?: string;
    /** Relevance score (used by auto-detection) */
    relevance?: number;
    /** Second best language match (highlightAuto only) */
    secondBest?: HighlightResult;
    /** Whether the result contains illegal syntax */
    illegal?: boolean;
    /** Top-level scope */
    top?: CompiledMode;
    /** Error message if highlighting failed */
    errorRaised?: Error;
  }

  /**
   * Options for the highlight() function.
   */
  export interface HighlightOptions {
    /** The language to use for highlighting */
    language: string;
    /** Whether to ignore illegal syntax (default: false) */
    ignoreIllegals?: boolean;
  }

  /**
   * A compiled mode used internally by highlight.js.
   */
  export interface CompiledMode {
    /** Mode name */
    name?: string;
    /** CSS class name */
    className?: string;
    /** Begin pattern */
    begin?: string | RegExp;
    /** End pattern */
    end?: string | RegExp;
    /** Sub-modes */
    contains?: CompiledMode[];
    /** Keywords */
    keywords?: Record<string, string | number>;
  }

  /**
   * Language definition function type.
   * Each language module exports a function that returns a Language object.
   */
  export type LanguageDefinition = (hljs: HLJSApi) => Language;

  /**
   * Language configuration object.
   */
  export interface Language {
    /** Language name */
    name?: string;
    /** Alternate names for the language */
    aliases?: string[];
    /** Whether the language is case-insensitive */
    case_insensitive?: boolean;
    /** Keywords for the language */
    keywords?: string | Record<string, string | string[]>;
    /** Illegal patterns */
    illegal?: string | RegExp;
    /** Language modes/patterns */
    contains?: Mode[];
    /** Starting mode */
    starts?: Mode;
    /** Sub-language to use */
    subLanguage?: string | string[];
    /** Relevance score */
    relevance?: number;
  }

  /**
   * Mode definition for language patterns.
   */
  export interface Mode {
    /** CSS class name */
    className?: string;
    /** Begin pattern */
    begin?: string | RegExp;
    /** End pattern */
    end?: string | RegExp;
    /** Begin keywords */
    beginKeywords?: string;
    /** Whether to exclude begin from match */
    excludeBegin?: boolean;
    /** Whether to exclude end from match */
    excludeEnd?: boolean;
    /** Whether the end pattern is optional */
    endsWithParent?: boolean;
    /** Whether the end pattern is shared with parent */
    endsParent?: boolean;
    /** Keywords */
    keywords?: string | Record<string, string | string[]>;
    /** Illegal patterns */
    illegal?: string | RegExp;
    /** Sub-modes */
    contains?: (Mode | string)[];
    /** Relevance score */
    relevance?: number;
    /** Sub-language */
    subLanguage?: string | string[];
    /** Variants of this mode */
    variants?: Mode[];
    /** Starting mode */
    starts?: Mode;
  }

  /**
   * The main Highlight.js API interface.
   */
  export interface HLJSApi {
    /**
     * Highlights code with a specified language.
     * @param code - The code string to highlight
     * @param options - Highlighting options including the language
     * @returns HighlightResult with the highlighted HTML
     */
    highlight(code: string, options: HighlightOptions): HighlightResult;

    /**
     * Highlights code with automatic language detection.
     * @param code - The code string to highlight
     * @param languageSubset - Optional array of languages to consider
     * @returns HighlightResult with the highlighted HTML and detected language
     */
    highlightAuto(code: string, languageSubset?: string[]): HighlightResult;

    /**
     * Registers a language definition.
     * @param name - The language name to register
     * @param language - The language definition function
     */
    registerLanguage(name: string, language: LanguageDefinition): void;

    /**
     * Gets a registered language definition.
     * @param name - The language name to retrieve
     * @returns The language object or undefined if not registered
     */
    getLanguage(name: string): Language | undefined;

    /**
     * Lists all registered language names.
     * @returns Array of registered language names
     */
    listLanguages(): string[];

    /**
     * Highlights all code blocks on a page.
     * Only available in browser environment.
     */
    highlightAll?(): void;

    /**
     * Highlights a single DOM element.
     * @param element - The element to highlight
     */
    highlightElement?(element: HTMLElement): void;

    /**
     * Configures highlight.js options.
     * @param options - Configuration options
     */
    configure?(options: Partial<HLJSOptions>): void;
  }

  /**
   * Configuration options for highlight.js.
   */
  export interface HLJSOptions {
    /** CSS selector for code blocks */
    cssSelector?: string;
    /** Languages to ignore during auto-detection */
    ignoreUnescapedHTML?: boolean;
    /** Whether to throw on errors */
    throwUnescapedHTML?: boolean;
    /** Languages to use for auto-detection */
    languages?: string[];
  }

  /** The main highlight.js instance */
  const hljs: HLJSApi;
  export default hljs;
}

/**
 * Language module declarations.
 * Each language module exports a LanguageDefinition function.
 */
declare module 'highlight.js/lib/languages/javascript' {
  import type { LanguageDefinition } from 'highlight.js/lib/core';
  const language: LanguageDefinition;
  export default language;
}

declare module 'highlight.js/lib/languages/typescript' {
  import type { LanguageDefinition } from 'highlight.js/lib/core';
  const language: LanguageDefinition;
  export default language;
}

declare module 'highlight.js/lib/languages/python' {
  import type { LanguageDefinition } from 'highlight.js/lib/core';
  const language: LanguageDefinition;
  export default language;
}

declare module 'highlight.js/lib/languages/xml' {
  import type { LanguageDefinition } from 'highlight.js/lib/core';
  const language: LanguageDefinition;
  export default language;
}

declare module 'highlight.js/lib/languages/css' {
  import type { LanguageDefinition } from 'highlight.js/lib/core';
  const language: LanguageDefinition;
  export default language;
}

declare module 'highlight.js/lib/languages/json' {
  import type { LanguageDefinition } from 'highlight.js/lib/core';
  const language: LanguageDefinition;
  export default language;
}

declare module 'highlight.js/lib/languages/markdown' {
  import type { LanguageDefinition } from 'highlight.js/lib/core';
  const language: LanguageDefinition;
  export default language;
}

declare module 'highlight.js/lib/languages/bash' {
  import type { LanguageDefinition } from 'highlight.js/lib/core';
  const language: LanguageDefinition;
  export default language;
}

declare module 'highlight.js/lib/languages/sql' {
  import type { LanguageDefinition } from 'highlight.js/lib/core';
  const language: LanguageDefinition;
  export default language;
}

declare module 'highlight.js/lib/languages/java' {
  import type { LanguageDefinition } from 'highlight.js/lib/core';
  const language: LanguageDefinition;
  export default language;
}

declare module 'highlight.js/lib/languages/csharp' {
  import type { LanguageDefinition } from 'highlight.js/lib/core';
  const language: LanguageDefinition;
  export default language;
}

declare module 'highlight.js/lib/languages/cpp' {
  import type { LanguageDefinition } from 'highlight.js/lib/core';
  const language: LanguageDefinition;
  export default language;
}

declare module 'highlight.js/lib/languages/go' {
  import type { LanguageDefinition } from 'highlight.js/lib/core';
  const language: LanguageDefinition;
  export default language;
}

declare module 'highlight.js/lib/languages/rust' {
  import type { LanguageDefinition } from 'highlight.js/lib/core';
  const language: LanguageDefinition;
  export default language;
}

declare module 'highlight.js/lib/languages/yaml' {
  import type { LanguageDefinition } from 'highlight.js/lib/core';
  const language: LanguageDefinition;
  export default language;
}

declare module 'highlight.js/lib/languages/ruby' {
  import type { LanguageDefinition } from 'highlight.js/lib/core';
  const language: LanguageDefinition;
  export default language;
}

declare module 'highlight.js/lib/languages/php' {
  import type { LanguageDefinition } from 'highlight.js/lib/core';
  const language: LanguageDefinition;
  export default language;
}
