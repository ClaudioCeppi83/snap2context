# Workflow: Loop Prompting & TDD

Este workflow define el ciclo continuo de desarrollo y verificación para cada módulo:

```
+----------------+      +----------------+      +------------------+      +----------------+
|  Escribir Test | ---> |  Ejecutar Test | ---> | ¿Fallo en Test?  | ---> | Corregir Causa |
|   (Vitest)     |      |  (npm test)    |      | (Analizar Error) |      |    de Raíz     |
+----------------+      +----------------+      +------------------+      +----------------+
                                                         |                        |
                                                  (Si es Verde)                   |
                                                         v                        |
                                                +------------------+              |
                                                | Siguiente Módulo | <------------+
                                                +------------------+  (Re-ejecutar)
```

1. **Definir Contrato**: Especificar la interfaz en `src/types/index.ts`.
2. **Escribir Test**: Crear la suite en `tests/<modulo>.test.ts`.
3. **Ejecutar Test**: Correr `npm run test -- <modulo>`.
4. **Ciclo de Corrección**: Si hay error de compilación o aserción, corregir el código y re-ejecutar sin alterar los criterios del test.
5. **Aprobación de Módulo**: Solo cuando el 100% de los tests pasan, se avanza al siguiente módulo.
