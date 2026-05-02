# DevLens — Technical Specification

**Version:** 1.0.0  
**Type:** Offline Browser-Based Developer Tool  
**Stack:** Raw HTML, CSS, Vanilla JavaScript (ES2022+)  
**No frameworks. No libraries. No build tools required.**

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
