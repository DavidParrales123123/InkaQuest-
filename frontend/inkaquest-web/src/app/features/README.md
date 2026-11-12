/**
 * "features": módulos funcionales de InkaQuest.
 *
 * Cada feature es autónoma y se carga bajo demanda (lazy loading) mediante
 * su propio archivo de rutas (`<feature>.routes.ts`).
 *
 * Estructura sugerida por feature:
 *
 *   features/
 *     home/
 *       home.component.ts|html|scss
 *       home.routes.ts
 *
 * Reglas:
 *  - Un feature no importa de otro feature directamente.
 *  - Lo común se extrae a `shared/`.
 */
