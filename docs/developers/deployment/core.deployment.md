# DevLens — Technical Specification

**Version:** 1.0.0  
**Type:** Offline Browser-Based Developer Tool  
**Stack:** Raw HTML, CSS, Vanilla JavaScript (ES2022+)  
**No frameworks. No libraries. No build tools required.**

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
