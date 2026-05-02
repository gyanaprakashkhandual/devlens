# Security Policy

## Supported Versions

DevLens is currently in active development. Security fixes are applied to the latest version only.

| Version         | Supported |
| --------------- | --------- |
| Latest (`main`) | Yes       |
| Older commits   | No        |

---

## Scope

DevLens runs entirely in the browser with no backend, no server, and no external network requests. All user code is processed locally.

Key security boundaries:

- **Sandbox isolation** — user code executes inside an iframe with `sandbox="allow-scripts"` and no `allow-same-origin`. It cannot access the parent window, cookies, or storage.
- **No data transmission** — no code, files, or analysis results ever leave your machine.
- **No dependencies** — zero third-party packages means zero supply chain risk.

---

## Reporting a Vulnerability

If you discover a security vulnerability — especially anything that could allow user-submitted code to escape the sandbox or access host page data — **please do not open a public issue.**

Report privately by:

1. Opening a [GitHub Security Advisory](https://github.com/gyanaprakashkhandual/devlens/security/advisories/new) on the repository
2. Or emailing the maintainer directly via the contact on their GitHub profile

**Please include:**

- A clear description of the vulnerability
- Steps to reproduce it
- The potential impact
- Any suggested fix if you have one

You can expect an acknowledgment within **48 hours** and a resolution or update within **7 days** depending on severity.

---

## Out of Scope

The following are not considered security vulnerabilities for this project:

- Bugs in analysis accuracy (false positives / false negatives)
- UI or styling issues
- Browser-specific behavior differences
