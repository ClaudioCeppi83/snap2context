# Project Memory: agentic-screen-context

## Estado Actual del Proyecto
- **Versión:** v0.1.0 (MVP Completado & Verificado)
- **Repositorio:** `https://github.com/ClaudioCeppi83/snap2context`
- **Última Actualización:** 2026-09-13
- **Fase Actual:** Fase 4 (Verificación Integral Completada: 20/20 tests pasando)

---

## Decisiones de Arquitectura Clave (ADRs)

### ADR-001: Captura Nativa de Pantalla Cross-Platform
- **Contexto:** Evitar dependencias masivas como Puppeteer o Electron que requieren cientos de megabytes y compilaciones de binarios pesados.
- **Decisión:** Utilizar ejecutables nativos del SO:
  - Linux: `maim -i` / `xdotool` en X11 y `grim` en Wayland.
  - macOS: `/usr/sbin/screencapture`.
  - Windows: Script PowerShell inline usando `System.Drawing` y `GetForegroundWindow`.

### ADR-002: Motor de OCR Híbrido (Local WASM + Gemini Flash API)
- **Contexto:** Se requiere procesamiento sin costo ni requerimiento de internet por defecto, pero con alta precisión si hay API key.
- **Decisión:** `tesseract.js` en WebAssembly para modo local, con fallback / mejora opcional a `gemini-1.5-flash` si `GEMINI_API_KEY` está configurada en el entorno.

### ADR-003: Enriquecimiento Local con Contexto (+/- 15 líneas)
- **Contexto:** El texto del OCR por sí solo carece de contexto de ejecución para que una IA entienda el bug.
- **Decisión:** Localizar el archivo en el repositorio con `fuzzysort` y extraer +/- 15 líneas alrededor de la línea epicentro junto a los imports superiores.

### ADR-004: Resiliencia de OCR y Fallback a Buffer de Portapapeles
- **Contexto:** En entornos sin display activo o cuando la imagen capturada está vacía / corrupta, Tesseract.js arroja excepciones no controladas.
- **Decisión:** Detección temprana de buffers vacíos y manejo en bloque try/catch en `parser.ts` para retornar un contexto visual vacío controlado, activando de inmediato el fallback al buffer existente del portapapeles y el árbol de archivos local.
