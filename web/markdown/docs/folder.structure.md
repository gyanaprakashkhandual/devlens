md-renderer/
│
├── index.html ← Shell HTML, loads all modules
│
├── css/
│ ├── reset.css ← Normalize & box-sizing
│ ├── tokens.css ← ALL CSS variables (colors, type, spacing)
│ ├── theme.css ← [data-theme="light"] & [data-theme="dark"] overrides
│ ├── layout.css ← App shell: topbar, sidebar, content area
│ ├── topbar.css ← Header bar specific styles
│ ├── sidebar.css ← TOC sidebar styles + scroll-spy
│ ├── markdown/
│ │ ├── base.css ← Paragraphs, HR, links, images
│ │ ├── headings.css ← H1–H6 styles + anchor links
│ │ ├── lists.css ← ul, ol, task lists, nested, definition lists
│ │ ├── blockquote.css ← Blockquotes + admonition callouts
│ │ ├── table.css ← Tables with alignment + zebra rows
│ │ ├── code.css ← Inline code + fenced code blocks
│ │ ├── media.css ← Images, video, audio, iframe embeds
│ │ ├── footnotes.css ← Footnote refs and definitions
│ │ └── misc.css ← Highlight, kbd, sub, sup, emoji, math
│ ├── highlight/
│ │ ├── highlight-base.css ← Code token base styles
│ │ ├── highlight-light.css ← Light theme token colors
│ │ └── highlight-dark.css ← Dark theme token colors
│ └── components/
│ ├── buttons.css ← btn, btn--ghost, btn--icon
│ ├── toolbar.css ← Code block toolbar (copy, lang badge, line nums)
│ ├── frontmatter.css ← YAML front matter display card
│ ├── scrollbar.css ← Custom scrollbar for both themes
│ └── animations.css ← Fade-in, transitions, scroll-spy highlights
│
├── js/
│ ├── main.js ← App bootstrap, wires all modules together
│ │
│ ├── parser/
│ │ ├── index.js ← Orchestrator: runs block then inline passes
│ │ ├── block.js ← Block-level parser (headings, lists, tables…)
│ │ ├── inline.js ← Inline parser (bold, italic, code, links…)
│ │ ├── sanitizer.js ← Strip dangerous HTML (XSS prevention)
│ │ └── utils.js ← Shared regex helpers, escape fns, slugify
│ │
│ ├── extensions/
│ │ ├── frontmatter.js ← Parse & strip YAML front matter block
│ │ ├── footnotes.js ← Collect [^ref] defs, inject numbered links
│ │ ├── tasklist.js ← Convert - [ ] / - [x] to checkbox HTML
│ │ ├── table.js ← Table parser with alignment detection
│ │ ├── admonition.js ← > [!NOTE/WARNING/TIP/DANGER] callout blocks
│ │ ├── emoji.js ← :shortcode: → Unicode emoji map
│ │ ├── math.js ← $inline$ and $$block$$ math passthrough
│ │ └── mermaid.js ← ```mermaid block detection & placeholder
│ │
│ ├── highlight/
│ │ ├── index.js ← Entry: detect language, run highlighter
│ │ ├── tokenizer.js ← Split code into token stream
│ │ └── languages/
│ │ ├── javascript.js ← JS/TS keyword/string/comment rules
│ │ ├── python.js ← Python rules
│ │ ├── html.js ← HTML tag/attr rules
│ │ ├── css.js ← CSS property/value/selector rules
│ │ ├── bash.js ← Shell/bash rules
│ │ ├── json.js ← JSON key/value/type rules
│ │ └── generic.js ← Fallback: strings + comments only
│ │
│ ├── toc.js ← Scan H1–H3, build sidebar TOC, scroll-spy
│ ├── theme.js ← Toggle data-theme, persist to localStorage
│ ├── fileloader.js ← File input + drag-and-drop .md loader
│ ├── clipboard.js ← Copy-to-clipboard for code blocks
│ ├── search.js ← In-page find/highlight across rendered content
│ └── media.js ← YouTube/Vimeo URL → iframe, video/audio detect
│
└── content/
├── demo.md ← Full kitchen-sink demo (every syntax shown)
└── assets/
└── sample.jpg ← Sample image for demo
