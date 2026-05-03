import { parse } from './parser/index.js';
import { applyHighlighting } from './highlight/index.js';
import { buildTOC, clearTOC } from './toc.js';
import { initTheme, toggleTheme } from './theme.js';
import { initFileLoader } from './fileloader.js';
import { initSearch } from './search.js';
import { processMedia } from './media.js';
import { renderFrontmatter } from './extensions/frontmatter.js';

const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const themeToggle = document.getElementById('theme-toggle');
const markdownOutput = document.getElementById('markdown-output');
const emptyState = document.getElementById('empty-state');
const filenameDisplay = document.getElementById('filename-display');
const loadDemoBtn = document.getElementById('load-demo');
const searchTrigger = document.getElementById('search-trigger');
const contentArea = document.getElementById('content-area');

initTheme();

themeToggle.addEventListener('click', toggleTheme);

sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('visible');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('visible');
});

searchTrigger.addEventListener('click', () => {
    document.getElementById('search-bar').classList.add('open');
    document.getElementById('search-input').focus();
});

function render(markdown, filename) {
    filenameDisplay.textContent = filename || '';
    document.title = filename ? `${filename} — MD Reader` : 'MD Reader';

    const { html, meta } = parse(markdown);

    const frontmatterHtml = meta ? renderFrontmatter(meta) : '';

    markdownOutput.innerHTML = frontmatterHtml + html;

    applyHighlighting(markdownOutput);
    processMedia(markdownOutput);
    buildTOC(markdownOutput, sidebar);

    emptyState.style.display = 'none';
    markdownOutput.style.display = 'block';

    contentArea.scrollTo({ top: 0, behavior: 'instant' });

    if (window.innerWidth <= 900) {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('visible');
    }
}

function resetView() {
    markdownOutput.innerHTML = '';
    markdownOutput.style.display = 'none';
    emptyState.style.display = 'flex';
    filenameDisplay.textContent = '';
    document.title = 'MD Reader';
    clearTOC(sidebar);
}

initFileLoader(render);
initSearch(markdownOutput);

loadDemoBtn.addEventListener('click', async () => {
    try {
        const res = await fetch('content/demo.md');
        if (!res.ok) throw new Error('not found');
        const text = await res.text();
        render(text, 'demo.md');
    } catch {
        render(FALLBACK_DEMO, 'demo.md');
    }
});

window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

const FALLBACK_DEMO = `---
title: MD Reader Demo
author: You
date: 2024-01-01
---

# MD Reader — Full Feature Demo

Welcome to **MD Reader**, a zero-dependency markdown renderer built from scratch with pure HTML, CSS and JavaScript.

## Text Formatting

Regular paragraph text with **bold**, *italic*, ***bold italic***, ~~strikethrough~~, ==highlighted==, \`inline code\`, and a [link](https://example.com).

Superscript: E = mc^2^. Subscript: H~2~O. Keyboard shortcut: <kbd>Ctrl</kbd>+<kbd>K</kbd>.

Emoji shortcodes: :rocket: :fire: :thumbsup: :heart: :star:

## Headings

# H1 Heading
## H2 Heading
### H3 Heading
#### H4 Heading
##### H5 Heading
###### H6 Heading

## Lists

### Unordered List

- First item
- Second item
  - Nested item A
  - Nested item B
    - Deeply nested
- Third item

### Ordered List

1. Step one
2. Step two
   1. Sub-step A
   2. Sub-step B
3. Step three

### Task List

- [x] Design the folder structure
- [x] Build the Markdown parser
- [x] Add syntax highlighting
- [ ] Add Mermaid diagram support
- [ ] Publish to GitHub Pages

## Blockquotes

> This is a simple blockquote. It can contain **bold**, *italic*, and other inline elements.

> Nested blockquotes work too.
>
> > This is a nested blockquote inside the outer one.

## Admonitions (Callouts)

> [!NOTE]
> This is a note callout. Use it for supplemental information.

> [!TIP]
> This is a tip. Great for helpful suggestions.

> [!WARNING]
> This is a warning. Be careful!

> [!DANGER]
> This is a danger callout. Something could break!

> [!IMPORTANT]
> This is an important notice.

## Code Blocks

### JavaScript

\`\`\`javascript
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(\`HTTP error: \${response.status}\`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch failed:', error);
    return null;
  }
}

const result = await fetchData('https://api.example.com/data');
console.log(result);
\`\`\`

### Python

\`\`\`python
from typing import Optional
import asyncio

class MarkdownParser:
    def __init__(self, config: Optional[dict] = None):
        self.config = config or {}
        self.extensions = []

    def parse(self, text: str) -> str:
        lines = text.split('\\n')
        return '\\n'.join(self._process_line(l) for l in lines)

    def _process_line(self, line: str) -> str:
        if line.startswith('#'):
            level = len(line) - len(line.lstrip('#'))
            return f'<h{level}>{line[level:].strip()}</h{level}>'
        return f'<p>{line}</p>'

parser = MarkdownParser()
print(parser.parse('# Hello World'))
\`\`\`

### Bash

\`\`\`bash
#!/bin/bash
# Build and deploy script

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$PROJECT_DIR/dist"

echo "Building project..."
mkdir -p "$BUILD_DIR"
cp -r "$PROJECT_DIR/src/"* "$BUILD_DIR/"

if [[ "$1" == "--deploy" ]]; then
  echo "Deploying to server..."
  rsync -avz --delete "$BUILD_DIR/" user@server:/var/www/html/
  echo "Deploy complete!"
fi
\`\`\`

### JSON

\`\`\`json
{
  "name": "md-reader",
  "version": "1.0.0",
  "description": "Zero-dependency markdown renderer",
  "scripts": {
    "start": "npx serve .",
    "test": "echo \\"No tests yet\\" && exit 0"
  },
  "features": {
    "parser": true,
    "highlight": true,
    "toc": true,
    "search": true,
    "darkMode": true
  },
  "dependencies": {}
}
\`\`\`

### HTML

\`\`\`html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My App</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="container" id="app">
    <h1 class="title">Hello World</h1>
    <button onclick="handleClick()" aria-label="Click me">Click me</button>
  </div>
  <script type="module" src="main.js"></script>
</body>
</html>
\`\`\`

### CSS

\`\`\`css
:root {
  --color-primary: #1a73e8;
  --color-text: #0d0d0d;
  --font-sans: system-ui, sans-serif;
  --radius: 8px;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  max-width: 780px;
  margin: 0 auto;
}

@media (max-width: 600px) {
  .container {
    padding: 1rem;
  }
}
\`\`\`

## Tables

| Feature | Status | Priority | Notes |
|---|:---:|---:|---|
| Block parser | ✅ Done | High | Handles all GFM blocks |
| Inline parser | ✅ Done | High | Bold, italic, code, links |
| Syntax highlight | ✅ Done | Medium | JS, Python, HTML, CSS, Bash, JSON |
| Table of Contents | ✅ Done | Medium | With scroll-spy |
| Dark mode | ✅ Done | High | Persisted to localStorage |
| Search | ✅ Done | Medium | Ctrl+F in-page search |
| File drag & drop | ✅ Done | Low | Any .md file |
| Math blocks | 🔄 Partial | Low | Passthrough display |
| Mermaid diagrams | 🔄 Partial | Low | Placeholder only |

## Images

![Placeholder image](https://picsum.photos/seed/md-reader/800/400)

## Horizontal Rule

---

## Math Blocks

Inline math: $E = mc^2$ and $a^2 + b^2 = c^2$

Block math:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

## Mermaid Diagram

\`\`\`mermaid
graph TD
    A[Open File] --> B{Parse Markdown}
    B --> C[Block Parser]
    B --> D[Inline Parser]
    C --> E[Render HTML]
    D --> E
    E --> F[Apply Highlighting]
    F --> G[Build TOC]
    G --> H[Display]
\`\`\`

## Footnotes

The Markdown spec[^1] was originally designed by John Gruber.[^2]

[^1]: See the original Markdown specification at daringfireball.net.
[^2]: John Gruber created Markdown in 2004 with help from Aaron Swartz.

## Definition Lists

Markdown
: A lightweight markup language for creating formatted text using a plain-text editor.

HTML
: HyperText Markup Language, the standard markup language for creating web pages.

Parser
: A program that interprets a sequence of tokens and builds a data structure from them.

## Details / Summary (Collapsible)

<details>
<summary>Click to expand — advanced configuration options</summary>

You can configure the renderer with these options:

- **theme** — \`light\` or \`dark\` (default: system preference)
- **lineNumbers** — show line numbers in code blocks (default: true for files > 3 lines)
- **tocDepth** — maximum heading depth in TOC (default: h3)
- **sanitize** — enable HTML sanitization (default: true)

</details>

## Raw HTML Passthrough

<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; border-radius: 12px; color: white; text-align: center; margin: 1.5rem 0;">
  <strong style="font-size: 1.5rem;">Custom HTML Block</strong><br>
  <span style="opacity: 0.85;">Raw HTML passes through the sanitizer and renders inline.</span>
</div>

## Video Embed

Paste a YouTube URL on its own line and it auto-embeds:

https://www.youtube.com/watch?v=dQw4w9WgXcQ

---

*End of demo. Open your own* \`.md\` *file using the button above.*
`;

if (location.hash) {
    const id = location.hash.slice(1);
    setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}