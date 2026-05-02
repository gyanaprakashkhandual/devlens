# DevLens — Technical Specification

**Version:** 1.0.0  
**Type:** Offline Browser-Based Developer Tool  
**Stack:** Raw HTML, CSS, Vanilla JavaScript (ES2022+)  
**No frameworks. No libraries. No build tools required.**

---

## 4. Feature Specification (continued)

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
