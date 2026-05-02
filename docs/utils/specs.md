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

---

### 4.4 Runtime Performance Profiler

**Description:** Executes user JavaScript inside a sandboxed iframe and instruments it using the Performance API to measure real execution characteristics.

**Metrics collected:**

- Total script parse and compile time (using `performance.mark` and the Navigation Timing API)
- Long tasks — any task exceeding 50ms on the main thread (via `PerformanceObserver` observing `longtask`)
- Layout and style recalculation counts triggered by the script (via `PerformanceObserver` observing `layout-shift`)
- Frame rate during animated code (via `requestAnimationFrame` delta tracking)
- Individual function call durations using `performance.measure` wrapping via Proxy instrumentation

**Sandbox isolation:** The iframe uses `sandbox="allow-scripts"` with no `allow-same-origin`. The user's code runs in a completely isolated browsing context. It cannot access the parent window, make network requests, or read cookies or storage from the DevLens origin.

**Proxy instrumentation:** Before the user's code runs, all top-level function declarations are wrapped in a Proxy that records entry time, exit time, and call count. This produces a flat profile of every function call without modifying the user's source text.

**Output:** A flame chart rendered on Canvas showing call durations on a time axis, a sortable table of function call counts and total time spent, and a long-task timeline with markers at each task boundary.

---

### 4.5 Accessibility Auditor

**Description:** Renders user HTML inside a sandboxed iframe and walks the live DOM tree to evaluate WCAG 2.1 Level AA conformance.

**Rules evaluated:**

- Every image element must have an `alt` attribute. Empty alt is acceptable for decorative images only when `role="presentation"` is present.
- Form inputs must have an associated label — either via `for`/`id` pairing, `aria-label`, or `aria-labelledby`
- Interactive elements (buttons, links) must have accessible names that are not empty
- Heading levels must not skip (h1 to h3 without h2 is a violation)
- Color contrast of all text against its background must meet the 4.5:1 ratio for normal text and 3:1 for large text
- All `iframe` elements must have a `title` attribute
- `tabindex` values greater than 0 are flagged as a ordering concern
- `autoplay` on media elements is flagged
- Language attribute must be present on the root `html` element
- ARIA roles must be used on elements that are permitted to carry them (role validity check)
- ARIA required attributes must be present for each role that has them (e.g., `aria-valuenow` on `role="slider"`)

**Contrast calculation:** The WCAG contrast ratio algorithm is implemented from scratch in raw JavaScript. It computes relative luminance from sRGB values using the exact gamma correction formula specified in the WCAG 2.1 success criterion 1.4.3. Computed CSS colors are extracted using `getComputedStyle` on each text element in the live DOM.

**Output:** A findings panel grouped by WCAG success criterion, each finding linked to the specific DOM element. Clicking a finding highlights the element in a visual preview panel.

---

### 4.6 Memory Leak Detector

**Description:** Instruments user code running in a sandboxed iframe to detect common memory leak patterns using modern JavaScript memory management APIs.

**Leak patterns detected:**

- Detached DOM nodes — elements that have been removed from the document but are still referenced by JavaScript variables or closures
- Event listener accumulation — `addEventListener` called on the same target with the same event type more than a configurable threshold without corresponding `removeEventListener`
- Closure retention of large objects — closures that capture arrays or objects exceeding 1MB that remain reachable after the enclosing function returns
- Interval and timeout accumulation — `setInterval` calls without corresponding `clearInterval`
- Growing collections — arrays or maps that are appended to on every event or timer tick without any removal, growing unboundedly

**Detection mechanism:**

- `WeakRef` and `FinalizationRegistry` are used to track object lifetimes without preventing garbage collection
- `Proxy` wraps the DOM API (`document.createElement`, `node.addEventListener`, `node.removeEventListener`, `setInterval`, `clearInterval`) inside the sandboxed context to intercept and count operations
- A GC-pressure routine forces the runtime to perform collection by allocating and discarding large typed arrays, then checks which `WeakRef` targets have been collected

**Output:** A timeline view showing object counts over time, a table of suspected leak sites with the source location where the retention originates, and a severity score for each leak pattern.

---

### 4.7 Dependency Graph Visualizer

**Description:** Parses all import and require statements from the ingested JavaScript files to build a module dependency graph, then renders it as an interactive force-directed graph on a raw Canvas element.

**Import forms recognized:**

- ES module static import: `import x from './x.js'`
- ES module named import: `import { a, b } from './module'`
- ES module namespace import: `import * as ns from './ns'`
- Dynamic import: `import('./lazy')`
- CommonJS require: `require('./dep')`
- Re-exports: `export { x } from './x'`

**Graph layout algorithm:** Barnes-Hut simulation implemented from scratch.

- Each node exerts a repulsive force on every other node, approximated using a quadtree for O(n log n) performance
- Each edge exerts an attractive spring force between connected nodes
- Gravity pulls all nodes toward the center to prevent the graph from drifting
- The simulation runs until kinetic energy drops below a threshold, then stops. The canvas is updated via `requestAnimationFrame` during the simulation

**Cycle detection:** Depth-first search with a recursion stack to detect cycles. Cycles are highlighted with a distinct edge color and a warning panel lists all circular dependency chains.

**Interaction:**

- Nodes can be dragged to manually position them. Dragging suspends the simulation for that node
- Scrolling zooms the canvas viewport using a transform matrix
- Clicking a node opens the source file for that module in the code editor
- Hovering an edge shows the import statement that created it

---

### 4.8 Live Sandbox

**Description:** A two-pane environment where the user can write and execute JavaScript with real-time visibility into the state of every variable, the call stack, and the event queue at each step.

**Editor pane:**

- Syntax-highlighted code editor built from a `contenteditable` div with a custom tokenizer running on every keystroke to apply span-based highlighting
- Line numbers rendered in a synchronized scroll container
- Tab key inserts two spaces
- Bracket and quote auto-closing
- Find and replace powered by a custom Boyer-Moore-Horspool string search implementation

**Execution modes:**

- Run all: executes the entire script and shows final state
- Step mode: executes one statement at a time. Between each step the inspector panel updates with current variable values
- Breakpoint mode: the user can click any line number to set a breakpoint. Execution pauses at that line

**Step execution implementation:** The AST is used to insert `debugger`-equivalent pause points between each statement. The sandboxed iframe communicates with the parent via `postMessage` at each pause, transmitting a serialized snapshot of the current scope chain and variable values.

**Output panel:** Shows `console.log`, `console.warn`, `console.error`, and `console.table` output from the sandboxed execution, with each entry timestamped and linked to the source line.

---

### 4.9 Session Persistence

**Description:** All ingested files, analysis results, and user settings are persisted to IndexedDB so that closing and reopening the browser tab restores the full session state.

**What is persisted:**

- All ingested source files (stored as text)
- The last analysis result for each file
- Editor content and cursor position
- Panel layout and open/closed state of each panel
- User-configured thresholds (complexity limit, file size limit, contrast ratio threshold)
- Sandbox execution history (last 50 runs)

**Storage schema:**

- Object store `files`: key is filename, value is `{ name, content, type, ingestedAt, size }`
- Object store `results`: key is filename, value is the full serialized analysis output
- Object store `settings`: key-value pairs for all user preferences
- Object store `history`: array of sandbox execution records ordered by timestamp

**Session restore:** On application load, the ingestion system checks IndexedDB for an existing session. If one exists, it restores all files and renders the last analysis result without requiring the user to re-upload.

**Export:** The user can export the full session as a single JSON file, and import a previously exported session on any device.

---

### 4.10 Report Generator

**Description:** Produces a standalone, self-contained HTML report of all analysis findings for a given session that can be saved, emailed, or printed.

**Report contents:**

- Summary table: file names, lines of code, finding counts by severity, overall health score
- Full findings list from the static analyzer, grouped by file and rule
- Accessibility audit results with pass/fail per WCAG criterion
- Dependency graph as an embedded SVG (static snapshot of the interactive canvas)
- Memory leak findings summary
- Performance profiling summary with the worst-performing functions

**Output format:** A single `.html` file with all styles and data embedded inline using a `<style>` block and a `<script type="application/json">` block. No external resources. The report renders correctly offline.

**Generation mechanism:** The report template is a JavaScript string template. The application serializes all findings into a plain JavaScript object, JSON-stringifies it, embeds it into the template, and offers the result as a `Blob` download using `URL.createObjectURL`.

---

## 5. Use Cases

### Use Case 1: Reviewing a colleague's submitted JavaScript snippet

A developer receives a paste of 300 lines of JavaScript code. They open DevLens, paste the code into the paste zone, and within two seconds see: 3 unused variables, 2 functions with cyclomatic complexity above 10, a missing error handler on a promise chain, and a var declaration inside a for loop block. They share the generated report URL with the colleague via the export feature.

### Use Case 2: Verifying accessibility of a landing page before launch

A frontend developer copies the HTML of a landing page and drops it into DevLens. The accessibility auditor renders the page, walks the DOM, and reports: 4 images missing alt attributes, 2 form inputs without labels, and 3 color combinations that fail the 4.5:1 contrast ratio requirement. Each finding links to the exact element. The developer fixes the issues in the editor panel and re-runs the audit without leaving the tool.

### Use Case 3: Investigating a suspected memory leak in a widget

A developer has a JavaScript carousel widget that slows the page down after running for 10 minutes. They paste the widget's JS into DevLens and run the memory leak detector. The tool reports that `addEventListener('resize', handler)` is called on every carousel initialization without a corresponding `removeEventListener`, and that each call captures a reference to a 200KB image array. The source line is highlighted in the editor.

### Use Case 4: Teaching scope and closures to a class

An instructor pastes a JavaScript function containing a classic closure problem — a loop creating functions that all capture the same var variable. They project DevLens in the classroom and open the scope visualizer. Students can see the single var binding in the outer scope, the arrow connecting all inner functions to that binding, and immediately understand why all functions return the same value.

### Use Case 5: Auditing a multi-file project before code review

A team lead drops 12 JavaScript files from a pull request into DevLens simultaneously. The dependency graph loads and reveals a circular dependency between `userStore.js` and `authService.js` that was not visible from reading files individually. The cycle is highlighted in red on the graph. The team lead includes a screenshot in the review comment.

### Use Case 6: Working on an air-gapped government development machine

A developer on a secure government network has no internet access and cannot install tools. They copy the DevLens folder to a USB drive and open it on the secure machine. It functions completely — all six analysis modules work with no network requests.

### Use Case 7: Profiling a canvas animation for frame rate drops

A developer has a game loop written in JavaScript that drops frames on low-end hardware. They paste the animation code into the sandbox and run the performance profiler. The flame chart shows that one collision detection function is taking 34ms on each frame, accounting for 68% of the frame budget. They refactor the function in the editor, re-run, and confirm the frame time dropped to 8ms.

### Use Case 8: Generating a written audit report for a client

A freelance developer has audited a client's codebase. They load all files into DevLens, run all six analysis modules, then click Generate Report. DevLens produces a single self-contained HTML file with summary tables, all findings, and a health score. The developer emails this file directly to the client.

---

## 6. Technical Architecture

### Application layers

```
Presentation Layer
  index.html
  src/ui/

  Responsible for rendering panels, editor, tabs, and navigation.
  Contains no business logic. Responds to events emitted by the application core.

Application Core
  src/core/

  The event bus, state machine, and session manager.
  Coordinates between the ingestion system, analysis engines, and UI.
  All inter-module communication goes through the event bus.

Analysis Engines
  src/engines/

  Six independent engines, each in its own subdirectory.
  Each engine exposes a single async function: analyze(input) => result.
  Engines run in Web Workers and communicate via postMessage.

Sandbox Runtime
  src/sandbox/

  The iframe sandbox host and the injected runtime shim.
  Manages lifecycle of sandbox iframes, message passing, and proxy instrumentation.

Storage Layer
  src/storage/

  IndexedDB abstraction. Exposes a Promise-based CRUD API.
  No engine or UI layer accesses IndexedDB directly.
```

### Communication between layers

All communication uses a central event bus (`src/core/EventBus.js`) implemented as a plain JavaScript class with a Map of event names to arrays of subscriber callbacks. No global variables are used. The bus instance is created once in `main.js` and passed by reference to every module that needs it.

Web Workers communicate with the main thread exclusively via `postMessage` and `onmessage`. Transferable objects (ArrayBuffer) are used for large payloads to avoid copying.

The sandbox iframe communicates with the parent window via `postMessage` with a strict origin check. The parent only processes messages from iframes it created. The iframe sandbox runtime does not know the parent origin at construction time — it uses `event.source.postMessage` to reply, avoiding origin hardcoding.

### State management

Application state is a single plain JavaScript object held in `src/core/StateStore.js`. The store exposes three methods: `get(path)`, `set(path, value)`, and `subscribe(path, callback)`. Path is a dot-separated string like `'session.files.main.findings'`. Subscribers are notified synchronously after every set. There is no batching or diffing — each set triggers all matching subscribers immediately. This keeps the state system simple and predictable.

---

## 7. Folder Structure

```
devlens/
  index.html
  SPECS.md
  README.md
  LICENSE

  src/
    main.js
    core/
      EventBus.js
      StateStore.js
      SessionManager.js
      Router.js

    ingestion/
      FileReader.js
      EncodingDetector.js
      FileSizeValidator.js
      BatchIngestionController.js

    engines/
      ast/
        Tokenizer.js
        Parser.js
        ASTWalker.js
        ScopeAnalyzer.js
        Rules.js
        RuleRunner.js
        ast.worker.js

      profiler/
        SandboxProfiler.js
        PerformanceCollector.js
        FlameChartBuilder.js
        profiler.worker.js

      accessibility/
        DOMWalker.js
        ContrastCalculator.js
        ARIAValidator.js
        WCAGRules.js
        accessibility.worker.js

      memory/
        LeakDetector.js
        WeakRefTracker.js
        ProxyInstrumentation.js
        GCPressure.js
        memory.worker.js

      dependency/
        ImportParser.js
        GraphBuilder.js
        CycleDetector.js
        ForceSimulation.js
        Quadtree.js
        dependency.worker.js

      sandbox/
        SandboxHost.js
        SandboxRuntime.js
        StepExecutor.js
        ProxyWrapper.js
        OutputCollector.js

    storage/
      IDBAdapter.js
      SessionStore.js
      FileStore.js
      HistoryStore.js
      SettingsStore.js

    ui/
      panels/
        EditorPanel.js
        AnalysisPanel.js
        ScopePanel.js
        ProfilerPanel.js
        AccessibilityPanel.js
        MemoryPanel.js
        DependencyPanel.js
        SandboxPanel.js
        ReportPanel.js
      components/
        CodeEditor.js
        SyntaxHighlighter.js
        Canvas.js
        FlameChart.js
        FindingCard.js
        FileTab.js
        Toolbar.js
        Modal.js
        Toast.js
        ProgressBar.js
      layout/
        PanelManager.js
        SplitView.js
        TabBar.js
      theme/
        ThemeController.js
        variables.css

    report/
      ReportGenerator.js
      ReportTemplate.js

    utils/
      ByteUtils.js
      ColorUtils.js
      StringSearch.js
      Serializer.js
      Debounce.js
      Logger.js

  sandbox/
    sandbox.html
    sandbox-runtime.js

  styles/
    reset.css
    layout.css
    panels.css
    editor.css
    canvas.css
    components.css
    theme-light.css
    theme-dark.css

  assets/
    fonts/
      (self-hosted monospace font files for the code editor)
```

### Key structural decisions

`src/engines/` contains one subdirectory per analysis engine. Each engine directory contains everything needed for that engine to operate — parser, rules, and the worker entry point. No engine imports from another engine's directory. This enforces strict engine independence.

`sandbox/` is at the root level, not inside `src/`. The sandbox iframe loads `sandbox/sandbox.html` as its document. This file is intentionally minimal — it loads only `sandbox-runtime.js`. The runtime script sets up the Proxy instrumentation and message listener before yielding to user code. Keeping it at the root avoids any path resolution ambiguity when the parent creates the iframe via `URL.createObjectURL`.

`styles/` is a flat directory of pure CSS files. No CSS preprocessor is used. Custom properties defined in `variables.css` are imported by all other stylesheets using `@import`. Cascade layers (`@layer reset, base, layout, component, panel`) control specificity without any naming convention hacks.

`assets/fonts/` contains self-hosted monospace font files (woff2 format) so the code editor renders consistently with no network request. The font is loaded via a `@font-face` declaration in `variables.css`.

---

## 8. JavaScript Concepts and APIs Used

### Language features (ES2022+)

- Classes with private fields (`#field`) and private methods
- Optional chaining and nullish coalescing
- Top-level await in module entry points
- Logical assignment operators (`||=`, `&&=`, `??=`)
- Array methods: `at()`, `findLast()`, `findLastIndex()`
- Object methods: `Object.hasOwn()`
- `Error.cause` for chained errors
- Async generators for streaming analysis results
- Async iterators for processing token streams
- `WeakRef` and `FinalizationRegistry` for memory tracking
- `Proxy` and `Reflect` for instrumentation and sandboxing
- BigInt for precise byte-level offset tracking in the tokenizer
- Regular expression named capture groups and the `d` flag for match indices

### Browser APIs

- Web Workers (`new Worker(url, { type: 'module' })`) for parallel off-thread analysis
- `postMessage` with Transferable objects for zero-copy data passing to workers
- IndexedDB via raw IDBRequest API (no wrapper library)
- `PerformanceObserver` observing `longtask`, `layout-shift`, `paint`, and `resource`
- `performance.mark`, `performance.measure`, `performance.now`
- Navigation Timing API Level 2 via `performance.getEntriesByType('navigation')`
- `WeakRef` and `FinalizationRegistry`
- `ResizeObserver` for responsive canvas sizing
- `MutationObserver` for DOM change tracking in the sandbox
- `IntersectionObserver` for virtualizing long findings lists
- Canvas 2D API for the force-directed graph and flame chart
- `requestAnimationFrame` for smooth canvas animation
- `Blob` and `URL.createObjectURL` for file downloads and iframe srcdoc generation
- `File`, `FileReader`, `FileList`, and the Drag and Drop API
- `TextDecoder` with multiple encoding labels for file ingestion
- `crypto.randomUUID()` for generating node IDs in the dependency graph
- `structuredClone()` for deep-copying state snapshots

---

## 9. Module-Level Technical Detail

### 9.1 Tokenizer (src/engines/ast/Tokenizer.js)

The tokenizer is implemented as a class that holds a string input, a current position index, and the current line and column numbers. It exposes a `nextToken()` method that advances through the input and returns the next token, and a `tokenize()` method that returns the full token array.

Disambiguation of `/` as division operator vs regex literal start is resolved by tracking the last non-whitespace, non-comment token and applying the ECMAScript rule: a `/` is a regex start if the previous token is an operator, keyword, punctuator that could end an expression start, or the beginning of the input.

Template literals are handled with a mode stack. When a `\`` is encountered the mode is pushed to `template`. When `${`is encountered inside a template, a counter increments to track nesting depth so that the closing`}` of the interpolation is correctly identified versus an object literal closing brace.

### 9.2 Parser (src/engines/ast/Parser.js)

The parser uses the Pratt parsing technique for expressions. Each token type has a binding power (precedence level) and optionally a null denotation function (nud, for tokens that appear at the start of an expression) and a left denotation function (led, for tokens that appear in the middle of an expression). The `parseExpression(rbp)` function calls the current token's nud, then loops consuming tokens whose binding power exceeds rbp via their led handlers.

Statements are parsed by a separate `parseStatement()` function that dispatches based on the current token type. This keeps expression and statement parsing cleanly separated.

Error recovery uses a panic-mode strategy: on a syntax error, the parser records the error and advances tokens until it finds a synchronization point (a semicolon, a closing brace, or the keyword `function`, `class`, `if`, `for`, `while`, `return`, `const`, `let`, `var`). Parsing resumes from the synchronization point. This allows the parser to report multiple errors in a single pass.

### 9.3 Force-Directed Graph (src/engines/dependency/ForceSimulation.js and Quadtree.js)

The simulation maintains an array of node objects, each with position (`x`, `y`), velocity (`vx`, `vy`), and mass proportional to the number of imports. Each simulation tick:

1. Builds a quadtree from current node positions using the Barnes-Hut algorithm (threshold theta = 0.9)
2. For each node, traverses the quadtree to compute the net repulsive force from all other nodes, approximating distant clusters as single bodies
3. Applies attractive spring forces along each edge (Hooke's law with rest length proportional to the sum of the two node radii)
4. Applies a weak centering force toward the canvas center
5. Updates velocities using Euler integration with a cooling factor that decreases each tick
6. Updates positions by adding velocity
7. Clamps positions to keep nodes within the canvas bounds

The simulation runs in a Web Worker. Each completed tick, the worker sends the updated node position array to the main thread via `postMessage` with a transferred Float64Array. The main thread renders the positions on the Canvas in its `requestAnimationFrame` loop.

### 9.4 Contrast Calculator (src/engines/accessibility/ContrastCalculator.js)

Implements the WCAG 2.1 relative luminance formula exactly. For each sRGB component value (0–255):

1. Normalize to 0.0–1.0 by dividing by 255
2. If the normalized value is <= 0.04045, divide by 12.92
3. Otherwise, compute `((value + 0.055) / 1.055) ^ 2.4`
4. Combine: `L = 0.2126 * R + 0.7152 * G + 0.0722 * B`
5. Contrast ratio: `(L1 + 0.05) / (L2 + 0.05)` where L1 is the lighter luminance

Computed color values from `getComputedStyle` arrive as `rgb(r, g, b)` or `rgba(r, g, b, a)` strings. A regex parses the values. For semi-transparent foreground colors, the calculator blends the foreground with the background using the Porter-Duff over operation before computing luminance.

### 9.5 Step Executor (src/engines/sandbox/StepExecutor.js)

The step executor uses the AST to identify the position of each statement in the source text. It generates a modified version of the source code by inserting an `await __step__()` call before each statement. The `__step__` function is defined in the sandbox runtime as an async function that sends a `postMessage` to the parent window and then awaits a reply before returning. This suspends the user's code at each statement boundary while the parent inspects and displays the current scope state.

The scope snapshot is produced by wrapping the user's code in an async function and inserting `postMessage({ type: 'scope', data: { /* all local variables */ } })` at each step point. Variable names and values are extracted from the local scope by embedding them as an object literal — a technique that requires knowing all variable names at parse time, which the AST provides.

---

## 10. Data Flow and State Management

```
User Action
  -> FileIngestion.ingest(files)
  -> StateStore.set('session.files', files)
  -> EventBus.emit('files:ingested', files)

  -> EngineCoordinator.runAll(files)
    -> ast.worker: postMessage(sourceText)
      <- postMessage(ASTResult)
    -> accessibility.worker: postMessage(htmlText)
      <- postMessage(A11yResult)
    -> memory.worker: postMessage(sourceText)
      <- postMessage(LeakResult)
    -> dependency.worker: postMessage(files)
      <- postMessage(GraphResult)

  -> StateStore.set('results', allResults)
  -> EventBus.emit('results:ready', allResults)

  -> Each Panel subscribes to 'results:ready'
  -> Panel.render(results[panelType])
  -> Canvas / DOM updated
```

State is never mutated directly outside `StateStore`. All engines communicate results back through `postMessage` to the engine coordinator in the main thread. The coordinator writes to the state store. Panels are pure renderers — they read from state and emit user interaction events, never write to state directly.

---

## 11. Performance Constraints and Budgets

- The application must reach interactive state (first panel rendered, file drop zone active) within 300ms of opening `index.html` on a mid-range laptop
- File ingestion of a 100KB JavaScript file must complete within 100ms
- AST tokenization of a 100KB file must complete within 200ms (in a worker, so main thread is unblocked)
- AST parsing of a 100KB file must complete within 400ms (in a worker)
- The dependency graph force simulation must reach equilibrium and stop within 3 seconds for a graph of up to 50 nodes
- The Canvas frame rate for the graph simulation must not drop below 30fps during simulation
- The accessibility DOM walk must complete within 500ms for an HTML document with up to 500 elements
- Memory leak detection must complete within 2 seconds for a script file up to 50KB
- The total JavaScript payload of the application (all `src/` files combined) must not exceed 120KB unminified. There is no minification step, so this is a hard author constraint, not a build constraint

---

## 12. Accessibility Requirements

DevLens itself must meet WCAG 2.1 Level AA. The tool that audits accessibility must itself be accessible.

- All interactive controls must be keyboard operable
- All panels must be navigable via Tab and Shift+Tab
- All Canvas elements must have an associated `<div role="img" aria-label="...">` with a text description of the current visualization for screen reader users
- All findings must be readable as a list via screen reader without requiring interaction with the Canvas
- The color theme must include a high-contrast mode that passes WCAG AAA contrast ratios
- No time limits are imposed on user interactions
- All error messages must be announced to screen readers via `aria-live="polite"` regions
- The code editor must support screen reader cursor navigation using standard ARIA grid roles

---

## 13. Browser Compatibility

DevLens targets the following browsers:

- Chrome / Chromium 105 and later
- Firefox 105 and later
- Safari 16 and later
- Edge 105 and later

All ES2022 features used are available in these versions. `WeakRef` and `FinalizationRegistry` have been available since Chrome 84, Firefox 79, and Safari 14.5.

`PerformanceObserver` with `longtask` type is currently only supported in Chromium-based browsers. On Firefox and Safari, the profiler module falls back to `performance.mark`/`performance.measure` based instrumentation with a note to the user that long task detection requires a Chromium browser.

Mobile browsers are not a target for the initial version. The application is designed for desktop viewport widths of 1024px and above.

---

## 14. Deployment

### Option 1: Static file server (recommended for team use)

Any static file server can serve DevLens. No server-side code is required.

Using Python (built into macOS and Linux):

```
cd devlens
python3 -m http.server 8080
```

Then open `http://localhost:8080` in a browser.

Using Node.js with the `serve` package if available:

```
npx serve devlens
```

### Option 2: Direct file open (for individual offline use)

Open `index.html` directly in the browser:

```
open devlens/index.html        (macOS)
start devlens/index.html       (Windows)
xdg-open devlens/index.html    (Linux)
```

Note: When opened via `file://` protocol, Web Workers will be blocked by the browser's same-origin policy in Chrome and some other browsers. Use Option 1 (a local HTTP server) for full functionality. Firefox allows Web Workers on `file://` URLs by default.

### Option 3: Deploy to any static hosting service

The entire `devlens/` folder can be deployed to GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any CDN. No build step is required. Upload the folder as-is.

For GitHub Pages:

1. Push the `devlens/` folder to a GitHub repository
2. Go to Settings > Pages
3. Set the source to the branch and folder containing `index.html`
4. GitHub Pages will serve it at `https://yourusername.github.io/devlens`

### Option 4: USB / air-gapped distribution

Copy the entire `devlens/` folder to a USB drive. Open `index.html` via a local server on the target machine. No internet connection is required after copying. All fonts, styles, and scripts are local.

---

## 15. How to Run Locally

### Prerequisites

- A modern browser (see section 13)
- Python 3 (for local server) or any other static file server
- No Node.js, no npm, no build tools required

### Steps

Clone or download the repository:

```
git clone https://github.com/yourname/devlens.git
cd devlens
```

Start a local server from the root of the `devlens/` folder:

```
python3 -m http.server 8080
```

Open the browser and navigate to:

```
http://localhost:8080
```

The application loads immediately. No installation step, no compilation, no dependency installation.

To run on a different port:

```
python3 -m http.server 3000
```

---

## 16. How to Use DevLens

### Step 1: Ingest files

When DevLens opens, you see a centered drop zone. Do one of the following:

- Drag one or more `.js`, `.html`, `.css`, or `.json` files from your filesystem onto the drop zone
- Click the drop zone to open a native file picker and select files
- Click the "Paste code" tab, paste raw source code into the text area, give it a filename, and click Ingest

Files appear as tabs in the tab bar at the top of the workspace. Click any tab to make it the active file.

### Step 2: Choose an analysis module

The left sidebar contains six module buttons: Analyze, Scope, Profile, Accessibility, Memory, and Dependencies. Click any button to activate that module for the active file.

### Step 3: Read findings

Findings appear in the right panel. Each finding shows:

- The rule or check that triggered it
- Severity (Error, Warning, or Info)
- The line and column number in the source file
- A short code snippet showing the relevant line
- A plain-English explanation

Click any finding to jump the editor to that line.

### Step 4: Fix and re-analyze

Edit the code directly in the editor panel. Press the Re-analyze button (or the keyboard shortcut `Ctrl+Shift+Enter` / `Cmd+Shift+Enter`) to run the active module again on the updated code. Results refresh in place.

### Step 5: Use the Live Sandbox

Switch to the Sandbox module. Your code appears in the left pane. Click Run to execute it. Output appears in the output pane below. Click Step to execute one statement at a time. Click any line number to set a breakpoint.

### Step 6: Generate a report

Click the Report button in the top toolbar. Choose which modules to include in the report, then click Generate. The browser downloads a single `.html` file. Open this file in any browser to view the full formatted report. It works offline.

### Keyboard shortcuts

| Action                         | Shortcut                           |
| ------------------------------ | ---------------------------------- |
| Ingest files                   | Ctrl+O / Cmd+O                     |
| Re-analyze active file         | Ctrl+Shift+Enter / Cmd+Shift+Enter |
| Switch to Analyze module       | Ctrl+1 / Cmd+1                     |
| Switch to Scope module         | Ctrl+2 / Cmd+2                     |
| Switch to Profiler module      | Ctrl+3 / Cmd+3                     |
| Switch to Accessibility module | Ctrl+4 / Cmd+4                     |
| Switch to Memory module        | Ctrl+5 / Cmd+5                     |
| Switch to Dependencies module  | Ctrl+6 / Cmd+6                     |
| Switch to Sandbox              | Ctrl+7 / Cmd+7                     |
| Toggle dark mode               | Ctrl+Shift+D / Cmd+Shift+D         |
| Generate report                | Ctrl+Shift+R / Cmd+Shift+R         |
| Find in editor                 | Ctrl+F / Cmd+F                     |
| Close active file tab          | Ctrl+W / Cmd+W                     |

---

## 17. Roadmap and Future Scope

### Version 1.1

- TypeScript support in the AST engine — parse `.ts` files by extending the tokenizer and parser with TypeScript-specific token types and grammar rules
- CSS analysis module — parse CSS files and report specificity conflicts, unused selectors (when HTML is also loaded), and invalid property values
- JSON schema validator — validate JSON files against a user-supplied JSON Schema draft-07 schema, implemented from scratch

### Version 1.2

- Diff mode — ingest two versions of the same file and see analysis findings side by side with a visual diff of the source
- Custom rule authoring — a rule editor that lets users write their own AST traversal rules using a simple JavaScript API
- Shareable session links — encode the full session state as a compressed base64 URL fragment so a session can be shared without a server

### Version 1.3

- WebAssembly acceleration for the tokenizer — a hand-written tokenizer compiled to WebAssembly to process files up to 10x faster, used as a progressive enhancement when `WebAssembly` is available
- Network panel simulation — simulate fetch calls in the sandbox with configurable latency and failure rates to test error handling code paths
- Multi-file refactor assistant — suggest import path corrections after a file rename, computed from the dependency graph

---

**End of specification.**

**Document maintained by:** DevLens project  
**Last updated:** 2026-05-02  
**License:** MIT
