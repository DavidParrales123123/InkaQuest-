# Pendientes y estado de verificación — InkaQuest Web

Última verificación: 2026-11-12 (tras la pasada de corrección tipográfica/consistencia).

## Verificado y correcto

- **Tipografía unificada**: una única familia en todo el `src/`: `Inter` (cargada en `src/index.html`). `--font-sans` y `--font-display` apuntan a Inter; fallback `system-ui`/`Segoe UI`. `--font-mono` apunta a `ui-monospace, Cascadia Code, Consolas, monospace` para código/IDs.
- **Sin mojibake**: escaneo byte-level por src (TS/HTML/CSS/SCSS/JSON/MD) — 0 apariciones de bytes nulos, caracteres de reemplazo U+FFFD, secuencias doble-codificadas UTF-8 o BOM rotos. Los dos archivos que estaban dañados por restauraciones (`register.component.ts`, `teacher-request.component.ts`) fueron reparados carácter por carácter (0 U+FFFD restantes).
- **Títulos de documento**: todos usan el separador `· InkaQuest` (consistente con el resto del UI).
- **`tsc --noEmit`** (tsconfig.app.json): **exit 0**.
- **`npm run build`**: exit 0 (solo las advertencias preexistentes de presupuesto de estilos en `home`/`course-detail` e imports sin usar — ninguna relacionada con texto).
- **ESLint** (`npm run lint`): 54 problemas (37 errores / 17 advertencias), todos preexistentes, ninguno introducido por la pasada de texto (36 errores en la línea base).
- **Acento del español restaurado** en todo texto visible: `sesión`, `Matrícula`, `contraseña`, `política`, `verificación`, `configuración`, `catálogo`, `categorías`, `información`, `módulos`, `lección`, `código`, `Evaluación`, etc.
- **Signos de apertura `¿`** en las 21 preguntas de FAQ y en los `confirm()` de `course-editor`.
- **Elipsis** unificada en texto visible a `…` (U+2026).
- **Separadores de fecha**: en dash `–` en rangos (`1 – 99 PEN`, `valido_desde – valido_hasta`).
- **Referencias internas eliminadas del texto visible**: `docs/frontend-integracion-backend.md`, `fn_registrar_resultado_juego`, `portadas-curso` (ya en lenguaje neutro), `<code>` con internas removidos.
- **“” y ‘’ eliminados**: comillas rectas en todo texto de UI.
- **Metadatos/nombres de archivo**: PNGs restaurados y verificados (`logo.png` 1254×1254, firma `89504e47…`, `analisis-diseno-algoritmos.png` válido).
- **Rutas**: signos `· InkaQuest` en títulos, sin `—` restantes en rutas.

## Pendientes reales (requieren backend)

- Pasarela Culqi: checkout, webhooks, activación de matrícula por pago, cupones verificados.
- Judge/sandbox para retos de programación (hoy los entregados quedan en BD sin ejecución).
- Chatbot IA (`/api/v1/chatbot/*`), Aula virtual IA.
- Emisión de certificados (revisión de requisitos, revocación, descarga verificada).
- Notificaciones masivas / transacciones.

## Restricciones de entorno

- El backend REST (`backend/inkaquest-api`) no existe todavía: las operaciones sensibles dependen de RLS de Supabase. Los guards del frontend son solo UX; la autorización real está en la BD/RLS.
