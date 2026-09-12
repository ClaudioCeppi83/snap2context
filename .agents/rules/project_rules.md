# Project Rules: agentic-screen-context

1. **Aislamiento de Entorno & Multiplataforma**:
   - Residir e instalarse exclusivamente en espacio de usuario.
   - Prohibido codificar rutas fijas de sistema operativo (usar `os.tmpdir()` y `path.join()`).
   - Todo comando de captura del sistema operativo debe estar envuelto en manejo de excepciones con fallback transparente.

2. **Código Limpio y Mantenibilidad**:
   - Funciones atómicas de máximo 25–30 líneas.
   - Máximo 5–7 variables por función.
   - Máximo 4–5 argumentos (agrupar en objetos de configuración si requiere más).
   - Indentación con tabuladores (ancho visual de 4 espacios).
   - Máximo 80 caracteres de ancho de línea.
   - Tipado TypeScript estricto.

3. **Loop Prompting Obligatorio**:
   - Ningún módulo se entrega sin pruebas unitarias verificadas.
   - Ante cualquier fallo en los tests, corregir de raíz en bucle hasta lograr el 100% de éxito.
   - Prohibido silenciar errores con `try/catch` vacíos o mock data que esconda fallos.
