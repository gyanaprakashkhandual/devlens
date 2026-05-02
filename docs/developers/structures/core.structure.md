# DevLens — Technical Specification

**Version:** 1.0.0  
**Type:** Offline Browser-Based Developer Tool  
**Stack:** Raw HTML, CSS, Vanilla JavaScript (ES2022+)  
**No frameworks. No libraries. No build tools required.**

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
