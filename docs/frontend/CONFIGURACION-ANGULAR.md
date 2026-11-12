# Configuración de Angular — InkaQuest Web

Configuración del frontend `frontend/inkaquest-web`.

## 1. Stack

| Elemento | Versión | Motivo |
|---|---|---|
| Angular | 22.2.x | Última estable con componentes standalone por defecto |
| TypeScript | 6.0.x | Modo estricto; errores en compilación, no en producción |
| Tailwind CSS | 4.3.x | Utilidades CSS sin configuración previa (`@tailwindcss/postcss`) |
| ESLint | 9 + `angular-eslint` 22.6.x | Reglas de Angular y plantillas HTML |
| Vitest | 5.x | Runner de pruebas integrado en el builder de Angular |
| Node.js | `^22.22.3 || ^24.15.0 || >=26.0.0` | Rango requerido por Angular CLI 22.2.x |

## 2. Componentes standalone

Angular 22 genera componentes **standalone** por defecto: cada componente
declara sus dependencias en `imports` y se registra en un template, sin
`NgModule`.

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1>InkaQuest</h1>`,
})
export class HomeComponent {}
```

Buenas prácticas ya fijadas en la configuración:

- `ChangeDetectionStrategy.OnPush` en todos los componentes.
- `@if` / `@for` (nuevas sintaxis de control de flujo) en las plantillas.
- Señales (`signal`, `computed`) en lugar de campos mutables cuando aplique.

## 3. TypeScript estricto

`tsconfig.json` activa el modo estricto completo:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true
  },
  "angularCompilerOptions": {
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true,
    "typeCheckHostBindings": true
  }
}
```

`strictTemplates` es clave: valida las expresiones de las plantillas HTML en
tiempo de compilación.

### Alias de rutas

```jsonc
"paths": {
  "@core/*": ["./src/app/core/*"],
  "@shared/*": ["./src/app/shared/*"],
  "@layout/*": ["./src/app/layout/*"],
  "@features/*": ["./src/app/features/*"],
  "@env/*": ["./src/environments/*"]
}
```

> En TypeScript 6 `baseUrl` está deprecado, por lo que las rutas deben
> empezar por `./`.

## 4. Router y lazy loading

`src/app/app.routes.ts` declara las rutas raíz. Cada feature se carga bajo
demanda con `loadComponent`:

```ts
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    title: 'Inicio',
  },
  { path: '**', redirectTo: 'home' },
];
```

Verificado en el build de producción: el componente `home` se genera como
*lazy chunk* independiente, separado de `main`.

`app.config.ts` enhance el router con:

- `withComponentInputBinding()` — los parámetros de ruta alimentan las entradas
  del componente.
- `withInMemoryScrolling()` — restaura la posición del scroll al navegar.

Para features con varias rutas, se usa `loadChildren` con un archivo
`<feature>.routes.ts` propio.

## 5. Estructura escalable

```
src/app/
├── core/       # Singletons: HTTP, Supabase, auth, tokens de inyección
├── shared/     # Componentes y utilidades reutilizables
├── layout/     # Shell visual: header, sidebar, footer
├── features/   # Módulos funcionales (lazy loading)
```

Reglas de dependencia (se verifican en la revisión de código):

```
core  →  (no depende de features)
shared  →  (no depende de features)
features  →  core + shared      (nunca entre sí)
layout  →  core + shared
```

## 6. Entornos

```
src/environments/
├── environment.ts       # Desarrollo (ng serve)
└── environment.prod.ts  # Producción (build de Vercel)
```

El cambio entre ambos lo hace `angular.json` mediante `fileReplacements` en la
configuración `production`:

```jsonc
"production": {
  "fileReplacements": [
    {
      "replace": "src/environments/environment.ts",
      "with": "src/environments/environment.prod.ts"
    }
  ]
}
```

Los valores sensibles llegan como variables `VITE_*` en el build. **Nunca** se
guardan secretos en estos archivos: la clave `service_role` de Supabase jamás
debe estar en el bundle del navegador.

## 7. Tailwind CSS v4

Tailwind v4 no necesita `tailwind.config.js`: su motor está en PostCSS.

`.postcssrc.json`:

```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

`src/tailwind.css`:

```css
@import 'tailwindcss';
```

Y `angular.json` carga ambas hojas, con Tailwind primero:

```jsonc
"styles": ["src/tailwind.css", "src/styles.scss"]
```

> Tailwind se importa desde un archivo **CSS plano**, no desde SCSS: la regla
> `@import` de Sass está deprecada y emitiría avisos en cada compilación.

Ejemplo de uso:

```html
<main class="p-8">
  <h1 class="text-2xl font-semibold">InkaQuest</h1>
</main>
```

## 8. ESLint

Configuración flat (`eslint.config.js`) con `angular-eslint`:

- `tsRecommended` para TypeScript y Angular.
- `templateRecommended` + `templateAccessibility` para las plantillas HTML.
- `prefer-signals` y `prefer-inject` para alentar la arquitectura moderna.

```bash
npm run lint        # solo informe
npm run lint:fix    # corrige lo corregible
```

Estado verificado: **"All files pass linting."**

## 9. Scripts

| Script | Descripción |
|---|---|
| `npm start` | Servidor de desarrollo en `http://localhost:4200` |
| `npm run build` | Build de producción (carpeta `dist/`) |
| `npm run build:prod` | Build de producción explícito |
| `npm run build:dev` | Build sin optimizaciones |
| `npm run watch` | Build en modo watch |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint con correcciones |
| `npm run format` | Prettier |
| `npm test` | Pruebas unitarias (vitest) |
| `npm run test:ci` | Pruebas en modo no interactivo |

## 10. Salida del build

Verificada con un build real:

```
dist/inkaquest-web/
├── 3rdpartylicenses.txt
└── browser/                 <- carpeta que publica Vercel
    ├── index.html
    ├── main-<hash>.js
    ├── chunk-<hash>.js
    ├── styles-<hash>.css
    └── favicon.ico
```

La carpeta publicada es **`frontend/inkaquest-web/dist/inkaquest-web/browser`**,
y es la que figura en `vercel.json` como `outputDirectory`.

## 11. Budgets

```jsonc
"budgets": [
  { "type": "initial", "maximumWarning": "800kB", "maximumError": "1.5MB" },
  { "type": "anyComponentStyle", "maximumWarning": "8kB", "maximumError": "16kB" }
]
```

El build falla si se superan los límites: es una defensa temprana contra
crecimiento no controlado del bundle.

## 12. Checklist antes de un PR

- [ ] `npm run lint` sin errores.
- [ ] `npm run build` correcto y dentro de los budgets.
- [ ] Sin secretos en el código (solo claves públicas de Supabase).
- [ ] Las rutas nuevas usan lazy loading.
- [ ] Los cambios de modelo de datos se replican en `environment.ts` y
      `environment.prod.ts`.
