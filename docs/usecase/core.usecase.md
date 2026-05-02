# DevLens — Technical Specification

**Version:** 1.0.0  
**Type:** Offline Browser-Based Developer Tool  
**Stack:** Raw HTML, CSS, Vanilla JavaScript (ES2022+)  
**No frameworks. No libraries. No build tools required.**

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
