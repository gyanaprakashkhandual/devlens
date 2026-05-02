# DevLens

![DevLens](/public//images/utils/readme.core.png)

**A fully offline, zero-dependency code analysis tool that runs entirely in your browser.**

Drop in your JavaScript, HTML, or CSS — get deep static analysis, performance profiling, accessibility auditing, memory leak detection, scope visualization, and dependency graphs. No install. No internet. No build step.

---

## Features

| Module                    | What it does                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Static Analyzer**       | Hand-written AST engine — catches unused vars, complexity issues, promise errors, and 14 other rules |
| **Scope Visualizer**      | Interactive canvas diagram of your full scope chain and closure references                           |
| **Performance Profiler**  | Flame chart + long-task detection via sandboxed iframe execution                                     |
| **Accessibility Auditor** | WCAG 2.1 AA checks — contrast ratios, ARIA, labels, heading order                                    |
| **Memory Leak Detector**  | WeakRef + Proxy instrumentation to catch detached nodes, listener leaks, and growing collections     |
| **Dependency Graph**      | Force-directed module graph with cycle detection                                                     |
| **Live Sandbox**          | Step-through execution with breakpoints and live variable inspection                                 |

---

## Getting Started

**No installation required.** Just clone and open.

```bash
git clone https://github.com/gyanaprakashkhandual/devlens.git
cd devlens
python3 -m http.server 8080
```

Open `http://localhost:8080` in your browser.

> **Note:** Opening `index.html` directly via `file://` will block Web Workers in Chrome. Use the local server above for full functionality. Firefox works fine with `file://`.

---

## Usage

1. **Drop or paste** your `.js`, `.html`, `.css`, or `.json` files onto the drop zone
2. **Pick a module** from the left sidebar
3. **Read findings** — each one links back to the exact line in your code
4. **Edit and re-analyze** without leaving the tool
5. **Export a report** as a standalone `.html` file — works fully offline

### Keyboard Shortcuts

| Action           | Shortcut                   |
| ---------------- | -------------------------- |
| Open files       | `Ctrl/Cmd + O`             |
| Re-analyze       | `Ctrl/Cmd + Shift + Enter` |
| Switch modules   | `Ctrl/Cmd + 1–7`           |
| Find in editor   | `Ctrl/Cmd + F`             |
| Generate report  | `Ctrl/Cmd + Shift + R`     |
| Toggle dark mode | `Ctrl/Cmd + Shift + D`     |

---

## Tech Stack

Pure vanilla — no frameworks, no libraries, no build tools.

- **HTML5 / CSS3** — cascade layers, custom properties, grid, flexbox
- **JavaScript ES2022+** — modules, workers, proxies, async iterators, WeakRef
- **Web Workers** — all heavy analysis runs off the main thread
- **Canvas 2D API** — scope diagrams, flame charts, dependency graphs
- **IndexedDB** — full session persistence across page reloads

Total JS payload: under 120KB unminified.

---

## Browser Support

| Browser       | Version |
| ------------- | ------- |
| Chrome / Edge | 105+    |
| Firefox       | 105+    |
| Safari        | 16+     |

> Long-task detection in the profiler requires a Chromium browser. All other modules work across all supported browsers.

---

## Deployment

Works anywhere static files are served — no server-side code needed.

- **Local:** `python3 -m http.server 8080`
- **GitHub Pages / Netlify / Vercel / Cloudflare Pages:** upload the folder as-is
- **Air-gapped / USB:** copy the folder, run a local server on the target machine

---

## License

MIT — free to use, modify, and distribute.

---

> Built for developers who want professional-grade tooling without the toolchain.
