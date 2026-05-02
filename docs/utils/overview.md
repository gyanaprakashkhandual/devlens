# DevLens — Technical Specification

**Version:** 1.0.0  
**Type:** Offline Browser-Based Developer Tool  
**Stack:** Raw HTML, CSS, Vanilla JavaScript (ES2022+)  
**No frameworks. No libraries. No build tools required.**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Goals and Philosophy](#2-goals-and-philosophy)
3. [Target Users](#3-target-users)
4. [Feature Specification](#4-feature-specification)
5. [Use Cases](#5-use-cases)
6. [Technical Architecture](#6-technical-architecture)
7. [Folder Structure](#7-folder-structure)
8. [JavaScript Concepts and APIs Used](#8-javascript-concepts-and-apis-used)
9. [Module-Level Technical Detail](#9-module-level-technical-detail)
10. [Data Flow and State Management](#10-data-flow-and-state-management)
11. [Performance Constraints and Budgets](#11-performance-constraints-and-budgets)
12. [Accessibility Requirements](#12-accessibility-requirements)
13. [Browser Compatibility](#13-browser-compatibility)
14. [Deployment](#14-deployment)
15. [How to Run Locally](#15-how-to-run-locally)
16. [How to Use DevLens](#16-how-to-use-devlens)
17. [Roadmap and Future Scope](#17-roadmap-and-future-scope)

---

## 1. Project Overview

DevLens is a fully offline, zero-dependency web developer tool that runs entirely inside a browser tab. It accepts raw HTML, CSS, and JavaScript source files via drag-and-drop or paste, then performs deep static analysis, runtime profiling, accessibility auditing, memory leak detection, and dependency graph visualization — all without contacting any external server.

The entire application ships as a single deployable folder. It can be opened by double-clicking `index.html` with no internet connection, no Node.js, no package manager, and no build step.

DevLens is built using only:

- Raw HTML5
- Raw CSS3 (custom properties, grid, flexbox, cascade layers)
- Vanilla JavaScript ES2022+ (modules, workers, proxies, async iterators)

No React, no Vue, no Webpack, no npm packages, no CDN dependencies.

---

## 2. Goals and Philosophy

### Primary Goal

Provide a professional-grade code analysis and debugging environment that works in any environment — air-gapped machines, restricted corporate environments, Chromebooks, and low-bandwidth regions — with no installation required.

### Design Philosophy

- Every feature must be implementable in raw JavaScript. If a feature requires a library, the feature design must be reconsidered or the underlying algorithm must be hand-implemented.
- The application must be fully functional offline on first open. There must be no network requests after the initial file load.
- All heavy computation must run off the main thread using Web Workers so the UI never blocks.
- The application must treat its own code as a first-class demonstration of the quality it is evaluating in user code.
- No feature bloat. Every panel earns its place by solving a specific developer pain point.

---

## 3. Target Users

### Frontend Developers

Developers who want to quickly inspect a snippet, check for anti-patterns, or understand the dependency structure of a module without opening a full IDE.

### Developers in Restricted Environments

Engineers working on corporate machines, government systems, or air-gapped networks where tool installation requires approval processes. DevLens requires nothing except a modern browser.

### Accessibility Engineers

QA engineers and developers validating WCAG 2.1 AA compliance without requiring browser extensions or external services.

### Educators and Students

Instructors teaching JavaScript internals — closures, scope chains, event loops, memory management — can use DevLens to visualize these concepts live from student-submitted code.

### Code Reviewers

Reviewers who receive raw code snippets (via email, Slack, pastebin) and want a quick structural analysis before reading line by line.

---

## 4. Feature Specification

### 4.1 File Ingestion System

**Description:** Accepts source code into the tool through three input methods.

**Input methods:**

- Drag-and-drop of `.html`, `.css`, `.js`, `.ts`, and `.json` files directly onto the application window
- Paste via a dedicated paste zone that accepts raw text from the clipboard
- Manual entry through an embedded code editor with syntax highlighting

**Accepted file types:** `.js`, `.mjs`, `.ts`, `.html`, `.css`, `.json`

**Batch support:** Up to 20 files can be ingested simultaneously. Files are processed in parallel using a Web Worker pool.

**Encoding detection:** The ingestion layer reads file bytes and attempts to detect UTF-8, UTF-16 LE, UTF-16 BE, and Latin-1 encodings before decoding.

**File size limits:** Individual files up to 2MB. Total session payload up to 10MB. Files exceeding limits trigger a clear error state with the specific limit that was exceeded.

---

### 4.2 Static Code Analyzer (AST Engine)

**Description:** A hand-written JavaScript tokenizer and recursive descent parser that produces a full abstract syntax tree from raw source code. The AST is then traversed by a suite of rule engines that produce annotated findings.

**Tokenizer capabilities:**

- Recognizes all ECMAScript 2022 token types: identifiers, keywords, numeric literals (decimal, hex, octal, binary, bigint), string literals (single, double, template), regular expression literals, punctuators, and comments
- Handles automatic semicolon insertion rules
- Produces a token stream with precise line and column positions for every token

**Parser capabilities:**

- Recursive descent parser implementing the full ECMAScript 2022 grammar
- Builds a standard ESTree-compatible AST node structure
- Handles operator precedence via a Pratt parsing approach for expressions
- Correctly resolves ambiguities (arrow functions vs grouping, async functions vs identifiers, regex vs division)
- Reports syntax errors with precise location and a recovery strategy to continue parsing after errors

**Analysis rules produced from AST traversal:**

- Unused variable declarations (var, let, const)
- Variables declared with var inside block scopes (should be let or const)
- Functions with excessive cyclomatic complexity (configurable threshold, default 10)
- Deep nesting — functions or blocks nested more than 4 levels
- Missing strict mode declaration in non-module scripts
- Console statements left in code
- Assignments inside conditionals
- Use of eval or implied eval (setTimeout with string argument)
- Prototype pollution patterns
- Missing error handling in promise chains (then without catch)
- Async functions without try-catch
- Duplicate object keys
- Comparison using == instead of ===
- Unreachable code after return, throw, break, or continue statements

**Output:** Each finding includes rule ID, severity (error, warning, info), line number, column number, code snippet, and a plain-English explanation of the issue.

---

### 4.3 Scope and Closure Visualizer

**Description:** Uses the AST produced by the static analyzer to extract and visualize the full scope chain of any JavaScript source file. Renders the chain as an interactive diagram on a raw Canvas element.

**Scope types recognized:**

- Global scope
- Module scope
- Function scope (function declarations, function expressions, arrow functions, method shorthand)
- Block scope (if, for, while, switch, plain blocks)
- Catch clause scope
- Class scope

**Visualizer behavior:**

- Each scope is drawn as a nested rectangular region on the Canvas
- Variables are listed inside their declaring scope
- Closure references — where an inner scope captures a variable from an outer scope — are drawn as curved arrows between scope regions
- Hovering over any variable highlights all sites where that variable is read, written, or captured
- Clicking a scope region jumps the code editor to the opening brace of that scope

**Algorithm:** A two-pass AST walk. First pass builds the scope tree and populates each scope's symbol table. Second pass resolves all identifier references to their declaring scope and records closures.
