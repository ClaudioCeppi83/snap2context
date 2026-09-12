# Technical Specification: snap2context (agentic-screen-context)

## 1. Metadata y Visión del Producto
- **Proyecto:** snap2context (CLI package: `snap2context` / alias: `agentic-screen`)
- **Versión Inicial:** v0.1.0
- **Licencia:** MIT
- **Propósito:** Herramienta de línea de comandos (CLI) zero-friction que captura la pantalla o ventana activa, analiza el código o errores visuales mediante OCR/Visión, los correlaciona con los archivos locales del repositorio y genera un payload Markdown estructurado en el portapapeles optimizado para asistentes de IA.

---

## 2. Arquitectura de Módulos (Pipeline Pattern)

```
+-------------------+      +-----------------------+      +-----------------------+      +----------------------+
|  Capture Engine   | ---> | Visual Context Parser | ---> | Local Code Enricher   | ---> | Payload Formatter    |
| (OS Native Exec)  |      |  (OCR / Vision API)   |      |  (Fuzzy/AST Search)   |      | (Clipboard / Output) |
+-------------------+      +-----------------------+      +-----------------------+      +----------------------+
```

### Módulo 1: `core/capture` (`src/modules/capture.ts`)
- **Objetivo:** Capturar la ventana activa o pantalla completa sin dependencias pesadas compiladas (evitando Puppeteer/Electron).
- **Implementación por SO:**
  - **Linux:** Detectar si la sesión es Wayland o X11:
    - Wayland: ejecutar `grim` en archivo temporal.
    - X11: ejecutar `maim -i` con ventana obtenida vía `xdotool getactivewindow`, o fallback a captura completa con `maim`/`import`.
  - **macOS:** Ejecutar `/usr/sbin/screencapture -l<window_id>` o `-x` en archivo temporal.
  - **Windows:** Ejecutar script inline PowerShell invocando `System.Drawing` y `System.Windows.Forms` para capturar `GetForegroundWindow`.
- **Salida:** `CaptureResult { imageBuffer: Buffer, windowTitle: string, timestamp: number }`.

### Módulo 2: `core/parser` (`src/modules/parser.ts`)
- **Objetivo:** Extraer texto relevante, rutas de archivo y errores de la captura.
- **Estrategias:**
  - **Primaria (Local/Offline):** `tesseract.js` en modo WASM. Aislamiento con regex:
    - Rutas: `/(?:\/[\w.-]+)+|(?:[A-Z]:\\[\w.-]+)+/g`
    - Funciones/Clases: `/(?:class|function|const|let|var)\s+([A-Za-z0-9_]+)/g`
    - Errores: `/(?:Error|Exception|TypeError|Uncaught|FAILED):.*/gi`
  - **Secundaria (API Multimodal):** Si existe `GEMINI_API_KEY`, invocar endpoint de Gemini 1.5 Flash enviando la imagen en Base64 con prompt para salida estructurada en JSON.
- **Salida:** `DetectedVisualContext { rawText, detectedFiles, detectedErrors, codeSnippets }`.

### Módulo 3: `core/enricher` (`src/modules/enricher.ts`)
- **Objetivo:** Enlazar texto visual con los archivos reales del proyecto local.
- **Lógica:**
  - Verificar si las rutas detectadas existen bajo `process.cwd()`.
  - Si solo hay firmas de código o errores, realizar búsqueda fuzzy con `fuzzysort` en los archivos fuente del proyecto.
  - Extraer bloque de código circundante: 15 líneas hacia arriba y 15 hacia abajo del punto de coincidencia.
  - Extraer imports superiores del archivo encontrado.
- **Salida:** `MatchedLocalContext { filePath, matchedLines, startLine, endLine, relatedImports }`.

### Módulo 4: `core/formatter` (`src/modules/formatter.ts`)
- **Objetivo:** Construir el Markdown estructurado y colocarlo en el portapapeles.
- **Lógica:**
  - Ensamblar Markdown con metadatos, snippets, bloque de código enriquecido y directiva para IA.
  - Copiar al portapapeles usando `clipboardy`.
  - Presentar resumen en consola con `picocolors`.
- **Salida:** `EngineOutput { markdownPayload, tokensEstimated, processingTimeMs }`.

---

## 3. Resiliencia y Manejo de Errores
- Si la captura de pantalla o el OCR no detectan código o fallan, capturar el texto presente en el portapapeles actual y enriquecerlo con el árbol de archivos local como fallback.
- Toda llamada al SO debe capturar errores y degradarse suavemente sin interrumpir abruptamente el proceso.

---

## 4. Definition of Done (Criterios de Aceptación)
1. **Invocación:** Al ejecutar `npx .`, la terminal muestra spinner, captura y reporta:
   `✔ Context copied to clipboard in Xms! (Matches found in: ...)`
2. **Cero fallos de plataforma:** Manejo seguro en Linux, macOS y Windows.
3. **Resiliencia:** Fallback a clipboard en ausencia de código visual.
4. **Desempeño:** Tiempo total < 1.8s en modo local WASM.
5. **Testing:** 100% de tests unitarios y de integración pasando con Vitest.
