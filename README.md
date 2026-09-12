<div align="center">

# 📸 snap2context

> **From Screen to LLM Prompt in 1.8 Seconds.**  
> *Stop manually taking screenshots, copying stack traces, and formatting files for your AI agents.*

[![npm version](https://img.shields.io/badge/npm-v0.1.0-blue.svg?style=flat-square)](https://www.npmjs.com/package/snap2context)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/ClaudioCeppi83/snap2context/pulls)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/tested%20with-vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-the-aha-moment-benchmark">Benchmark</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-agentic--webmcp-integration">Agent Integration</a> •
  <a href="#-supported-platforms">Platforms</a>
</p>

---

![snap2context demo](https://raw.githubusercontent.com/ClaudioCeppi83/snap2context/main/docs/demo.gif)

</div>

## 💡 What is `snap2context`?

**`snap2context`** is a zero-friction, cross-platform CLI tool that captures your active window, extracts visible stack traces, code snippets, and file paths using OCR or Multimodal Vision, automatically anchors them into your local repository source code (+/- 15 lines of context + imports), and injects a prompt-ready Markdown payload directly into your clipboard.

**No more:**
- ❌ Opening screenshot utilities, cropping, and saving PNG files.
- ❌ Uploading image files to slow multimodal web chats.
- ❌ Manually hunting down the exact file in your IDE to copy lines 40-70.
- ❌ Pasting unstructured error dumps that leave AI agents guessing.

---

## ⚡ Quick Start

No installation needed. Run it directly in your project root:

```bash
npx snap2context
```

> **Aha! Moment:** The moment it finishes (~30-50ms locally), press `Ctrl + V` (or `Cmd + V`) in your favorite AI chat (Claude, ChatGPT, Antigravity, Cursor, Copilot) and hit Send.

### Global Installation (Optional)

```bash
npm install -g snap2context
snap2context
```

---

## ⚡ The "Aha! Moment" Benchmark

| Workflow Step | Traditional Manual Routine | 📸 `snap2context` |
| :--- | :---: | :---: |
| 1. Capture screen error / UI bug | ~20s (Win+Shift+S / Cmd+Shift+4) | **Instant (< 5ms)** |
| 2. OCR / Copy text from graphic | ~30s (Retyping or manual copy) | **Automated (WASM / Gemini)** |
| 3. Locate file in workspace | ~25s (File tree search) | **Automated (Fuzzy Match)** |
| 4. Copy lines & top imports | ~35s (Manual cursor selection) | **Automated (+/-15 lines + imports)** |
| 5. Assemble Markdown prompt | ~25s (Manual prompt drafting) | **Automated (Standard Prompt Spec)** |
| **Total Latency to First Prompt** | **~2.5 Minutes ⏳** | **~0.04s - 1.8s ⚡** |

---

## 🚀 CLI Flags & Options

```bash
snap2context [options]

Options:
  -V, --version        Output version number
  -c, --copy           Copy output to clipboard (default: true)
  --no-copy            Do not copy output to clipboard
  -o, --out <path>     Save output markdown payload to a local file
  -a, --api-key <key>  Google Gemini API Key for multimodal extraction
  -d, --dry-run        Run pipeline and display summary without modifying clipboard
  -h, --help           Display command options
```

---

## 🧠 How It Works (Pipeline Pattern)

```
+-------------------+      +-----------------------+      +-----------------------+      +----------------------+
|  Capture Engine   | ---> | Visual Context Parser | ---> | Local Code Enricher   | ---> | Payload Formatter    |
| (OS Native Exec)  |      |  (OCR / Gemini API)   |      |  (Fuzzy/AST Search)   |      | (Clipboard / Output) |
+-------------------+      +-----------------------+      +-----------------------+      +----------------------+
```

1. **Native OS Capture (`core/capture`):** Bypasses heavy Chromium/Electron bundles. Invokes native OS tools (`screencapture` on macOS, Win32 `System.Drawing` on Windows, `grim`/`maim` on Linux).
2. **Visual Context Parser (`core/parser`):** 100% offline OCR via `tesseract.js` WASM engine. If `GEMINI_API_KEY` is present in environment, automatically switches to `gemini-1.5-flash` for high-precision vision parsing.
3. **Local Code Enricher (`core/enricher`):** Scans the project root (`process.cwd()`). Uses `fuzzysort` to match error traces or visual symbols, pulling in top module imports and 15 surrounding lines of code.
4. **Payload Formatter (`core/formatter`):** Formats structured Markdown with metadata and directives, injecting it into your clipboard with zero latency.

---

## 📋 Standard Output Payload Example

When you paste (`Ctrl+V`), this is the clean context your AI agent receives:

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

## 🤖 Agentic & WebMCP Integration

`snap2context` is designed from the ground up for agentic workflows:
- **CLI Invocations:** Subagents and terminal tools can invoke `npx snap2context --out context.md` to self-feed screen context during debugging loops.
- **Resilient Fallback:** If OCR fails or the screen has no detectable code, `snap2context` captures existing clipboard data and correlates it with local repository structure.

---

## 🛠️ Supported Platforms

| Platform | Screen Capture Backend | Fallback |
| :--- | :--- | :--- |
| **Linux (Wayland)** | `grim` | Clipboard Buffer Fallback |
| **Linux (X11)** | `maim` / `xdotool` | Whole-Screen / Clipboard Fallback |
| **macOS** | `/usr/sbin/screencapture` | Active Display Fallback |
| **Windows** | PowerShell Win32 `GetForegroundWindow` | Clipboard Buffer Fallback |

---

## 🧪 Testing & Quality

`snap2context` strictly enforces 100% test passing via Vitest across all modules:

```bash
# Run test suite
npm test

# Build TypeScript
npm run build
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/ClaudioCeppi83/snap2context/issues).

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

---

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "snap2context",
  "operatingSystem": "Linux, macOS, Windows",
  "applicationCategory": "DeveloperApplication",
  "description": "Zero-latency visual context engine for AI coding agents. Capture screen, enrich local code, and feed your LLM in 1 second.",
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
