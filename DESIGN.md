# Design System: agentic-screen-context (CLI & Payload)

## 1. Terminal UX Design System
- **Paleta de Colores (`picocolors`):**
  - Brand / Primary: Cyan (`pc.cyan`) para títulos y prefijos CLI.
  - Success: Verde (`pc.green`) para ticks de éxito y confirmación de copiado.
  - Warning: Amarillo (`pc.yellow`) para avisos de fallback a clipboard.
  - Error: Rojo (`pc.red`) para errores controlados de entorno.
  - Dim: Gris tenue (`pc.dim`) para rutas secundarias, duraciones en ms y metadata.
- **Spinners y Estados de Progreso (`ora`):**
  - Spinner estilo `dots` con mensajes contextuales según fase activa:
    1. "Capturing active screen/window..."
    2. "Parsing visual context via [WASM / Gemini]..."
    3. "Enriching with local repository code..."
    4. "✔ Context copied to clipboard in Xms! (Matches found in: ...)"
- **Salida de Resumen en Consola:**
  - Banner limpio sin ruido innecesario, indicando el archivo enriquecido principal y tiempo transcurrido.

---

## 2. Markdown Payload Design System (Clipboard Output)

El Markdown generado para el portapapeles se estructura de la siguiente manera:

```markdown
### 🖥️ Screen Context
- **Window:** [Window Title]
- **Timestamp:** [ISO Date]
- **Processing Time:** [Xms] | **Estimated Tokens:** [~N]

### 👁️ Detected Visual Snippets & Errors
[Snippets extraídos por OCR / Gemini]

### 📁 Local Enriched Context: `[path/to/file.ext]`
**Relevant Imports:**
\`\`\`typescript
import ...
\`\`\`

**Code Context (Lines [start]-[end]):**
\`\`\`typescript
[Líneas de código circundantes +/- 15 líneas con indicador]
\`\`\`

---
> **Agent Directive:** Utilize the visual context and local code above to diagnose the issue and propose a solution.
```
