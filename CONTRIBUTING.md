# Contributing to DevLens

Thanks for your interest in contributing. DevLens is fully open source and welcomes contributions of all kinds — bug fixes, new rules, documentation improvements, and more.

---

## Before You Start

- Check [open issues](https://github.com/gyanaprakashkhandual/devlens/issues) to avoid duplicate work
- For large changes, open an issue first to discuss the approach
- Read the `SPECS.md` file — it is the source of truth for how every module is designed

---

## Development Setup

No build tools required.

```bash
git clone https://github.com/gyanaprakashkhandual/devlens.git
cd devlens
python3 -m http.server 8080
```

Open `http://localhost:8080`. Edit files and refresh — that's the entire dev loop.

---

## Project Constraints

These are non-negotiable and apply to all contributions:

- **No frameworks** — no React, Vue, Svelte, or any UI library
- **No npm packages** — no external dependencies of any kind
- **No build step** — the project must run by opening `index.html` via a static server
- **No CDN links** — all assets must be local; the tool must work fully offline
- **JS payload limit** — all files under `src/` combined must stay under **120KB unminified**
- **Engine isolation** — no engine under `src/engines/` may import from another engine's directory

---

## How to Contribute

### Bug Fix

1. Fork the repo and create a branch: `fix/short-description`
2. Make your fix — keep changes focused and minimal
3. Test in Chrome, Firefox, and Safari if possible
4. Open a pull request with a clear description of what was broken and how you fixed it

### New Analysis Rule

1. Rules live in `src/engines/ast/Rules.js`
2. Each rule is a function that receives an AST node and returns a finding or `null`
3. Add the rule, give it a unique ID, severity, and a plain-English explanation
4. Open a PR with an example of code that triggers the rule

### New Feature

1. Open an issue first to discuss it — features must align with the roadmap in `SPECS.md`
2. All heavy computation must run in a Web Worker
3. UI panels go in `src/ui/panels/`, components in `src/ui/components/`
4. Update `SPECS.md` if your feature changes the architecture

---

## Pull Request Guidelines

- Keep PRs small and focused — one concern per PR
- Write a clear title and description
- Reference any related issue with `Closes #123`
- Do not introduce new files outside the established folder structure without discussion

---

## Code Style

No linter is enforced, but please follow the patterns already in the codebase:

- ES2022+ features are welcome
- Private class fields (`#field`) preferred over convention-based privacy
- No global variables — pass dependencies by reference
- Async functions should have `try/catch` — this is also an analysis rule

---

## Questions?

Open a [GitHub Discussion](https://github.com/gyanaprakashkhandual/devlens/discussions) or comment on a relevant issue. Happy to help.
