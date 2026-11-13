#!/usr/bin/env node

/**
 * DEPRECATED (2026-11-13).
 *
 * Este script agregaba `// @ts-nocheck` a TODOS los archivos .ts del proyecto,
 * desactivando la verificación de tipos en tiempo de compilación. Dejaba de ser
 * necesario y contradecía el objetivo de TypeScript estricto.
 *
 * Se mantiene solo como marcador para evitar reintroducir este atajo.
 * NO lo ejecutes. Si necesitas relajar tipos en un archivo concreto, hazlo de
 * forma local y justificada (`@ts-expect-error` con comentario).
 */

console.warn('[disable-ts-checks] Script obsoleto: NO se realizaron cambios.');
console.warn('[disable-ts-checks] El panel admin ya compila sin @ts-nocheck; los demás módulos se migrarán de forma progresiva.');
process.exit(0);
