<div align="center">

# snap2context

> Fast, zero-overhead visual context extraction and local code enricher for AI coding agents.

[![npm version](https://img.shields.io/badge/npm-v0.1.0-blue.svg?style=flat-square)](https://www.npmjs.com/package/snap2context)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/ClaudioCeppi83/snap2context/pulls)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/tested%20with-vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#workflow-latency-benchmark">Benchmark</a> •
  <a href="#architecture--pipeline">Architecture</a> •
  <a href="#output-specification">Output Spec</a> •
  <a href="#supported-platforms">Platforms</a>
</p>

---

![snap2context demo](https://raw.githubusercontent.com/ClaudioCeppi83/snap2context/main/docs/demo.gif)

</div>

## Overview

When debugging with AI coding assistants, conveying on-screen runtime errors, stack traces, and terminal logs requires significant manual effort: capturing screenshots, transcribing text, locating matching source files, and extracting surrounding code.

**`snap2context`** automates this entire sequence into a single command:
1. **Captures** the active window or screen using native operating system binaries.
2. **Parses** visible text, paths, and stack traces via local WebAssembly OCR (`tesseract.js`) or optional Gemini multimodal vision.
3. **Correlates** extracted visual tokens with local repository files (`process.cwd()`), slicing +/-15 lines around the match epicenter and pulling top-level imports.
4. **Formats** a structured Markdown prompt and injects it directly into the system clipboard.

---

## Quick Start

Execute directly via `npx` within any project root:

```bash
npx snap2context
```

Once execution completes, paste (`Ctrl+V` / `Cmd+V`) into your AI interface (Claude, Cursor, ChatGPT, Antigravity, GitHub Copilot).

### Global Installation

```bash
npm install -g snap2context
snap2context
```

---

## Workflow Latency Benchmark

| Operation | Manual Execution | `snap2context` |
| :--- | :---: | :---: |
| Screen / window capture | ~20s | < 5ms (Native OS call) |
| OCR / Text transcription | ~30s | Automated (WASM / Gemini) |
| Local file identification | ~25s | Automated (Fuzzy search) |
| Context slicing (+/-15 lines & imports) | ~35s | Automated AST/text slice |
| Markdown prompt assembly | ~25s | Automated standard formatting |
| **Total Prompt Assembly Latency** | **~2.5 min** | **~0.04s – 1.8s** |

---

## CLI Options

```bash
snap2context [options]

Options:
  -V, --version        Output version number
  -c, --copy           Copy output to clipboard (default: true)
  --no-copy            Do not copy output to clipboard
  -o, --out <path>     Write output markdown payload to a local file
  -a, --api-key <key>  Gemini API key for multimodal vision extraction
  -d, --dry-run        Execute pipeline without modifying clipboard or disk
  -h, --help           Display help information
```

---

## Architecture & Pipeline

The system is organized around four decoupled modules following a sequential pipeline pattern:

```
+-------------------+      +-----------------------+      +-----------------------+      +----------------------+
|  Capture Engine   | ---> | Visual Context Parser | ---> | Local Code Enricher   | ---> | Payload Formatter    |
| (OS Native Exec)  |      |  (WASM / Gemini API)  |      |  (Fuzzy File Search)  |      | (Clipboard / Output) |
+-------------------+      +-----------------------+      +-----------------------+      +----------------------+
```

- **`core/capture` (`src/modules/capture.ts`):** Lightweight native invocations without browser or Electron overhead (`screencapture` on macOS, Win32 `System.Drawing` on Windows, `grim`/`maim` on Linux).
- **`core/parser` (`src/modules/parser.ts`):** Offline OCR using `tesseract.js` WASM. Automatically routes to `gemini-1.5-flash` if `GEMINI_API_KEY` is set in the environment.
- **`core/enricher` (`src/modules/enricher.ts`):** Scans the current working directory, correlates symbols using `fuzzysort`, and extracts relevant imports and surrounding lines.
- **`core/formatter` (`src/modules/formatter.ts`):** Builds the structured Markdown output and writes to the system clipboard via `clipboardy`.

---

## Output Specification

The generated clipboard payload follows this standardized structure:

```markdown
### 🖥️ Screen Context
- **Window:** VSCode - Header.tsx
- **Timestamp:** 2026-09-13T00:32:45.695Z
- **Processing Time:** 38ms

### 👁️ Detected Visual Snippets & Errors
**Errors:**
```
TypeError: Cannot read properties of undefined (reading 'map')
```
**Code Tokens:** function Header, const navLinks

### 📁 Local Enriched Context: `src/components/Header.tsx`
**Relevant Imports:**
```typescript
import React, { useState } from 'react';
import { NavItem } from '../types';
```

**Code Context (Lines 15-45):**
```typescript
    18 | export function Header({ user }: HeaderProps) {
    19 |   const [isOpen, setIsOpen] = useState(false);
  > 20 |   const items = user.navLinks.map((item) => (
    21 |     <NavItem key={item.id} {...item} />
    22 |   ));
```

---
> **Agent Directive:** Utilize the visual context and local code above to diagnose the issue and propose a solution.
```

---

## Agent & Automation Integration

- **Subagent Invocations:** Autonomous coding agents and CLI scripts can execute `snap2context --out .context.md` during failure recovery loops.
- **Resilient Fallback:** If OCR detects no on-screen code or the display backend is unavailable (e.g. headless CI), the engine captures the current clipboard buffer and correlates it with the local repository structure.

---

## Supported Platforms

| Platform | Capture Backend | Fallback |
| :--- | :--- | :--- |
| **Linux (Wayland)** | `grim` | Clipboard Buffer Fallback |
| **Linux (X11)** | `maim` / `xdotool` | Whole-Screen / Clipboard Fallback |
| **macOS** | `/usr/sbin/screencapture` | Active Display Fallback |
| **Windows** | PowerShell Win32 `GetForegroundWindow` | Clipboard Buffer Fallback |

---

## Development & Verification

```bash
# Run unit & integration test suite (Vitest)
npm test

# Build TypeScript
npm run build
```

---

## Contributing

Contributions, bug reports, and pull requests are welcome. Please open an issue first to discuss substantial architectural changes.

---

## License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "snap2context",
  "operatingSystem": "Linux, macOS, Windows",
  "applicationCategory": "DeveloperApplication",
  "description": "Fast, zero-overhead visual context extraction and local code enricher for AI coding agents.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "author": {
    "@type": "Person",
    "name": "Claudio Ceppi",
    "url": "https://github.com/ClaudioCeppi83"
  }
}
</script>
