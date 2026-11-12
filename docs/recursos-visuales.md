# Recursos visuales de InkaQuest

Inventario completo de los recursos graficos oficiales utilizados por el
frontend, su origen, su destino y las interfaces donde se usan.

- **Carpeta de origen (solo lectura):** `C:\Users\david\Desktop\proyecto mejorado\imagen`
- **Destino en el frontend:** `frontend/inkaquest-web/src/assets/images/`
- **Generado por:** `scripts/jpa/copiar-recursos.mjs` (copia) y
  `frontend/inkaquest-web/optimizar-recursos.mjs` (optimizacion con `sharp`)
- **Maqueta de referencia:** `src/assets/images/inventario.json`
- **Auditoría Fase 1:** `docs/auditoria-inicial-fase-1.md` (estado general del proyecto y brechas)

> **Los archivos originales no se modifican, no se mueven y no se eliminan.**
> El script copia el binario tal cual y, sobre la copia, genera la version
> optimizada. La carpeta de origen queda intacta.

## 0. Estructura actual en frontend

Carpetas bajo `src/assets/images/`:

| Carpeta | Estado | Contenido |
|---|---|---|
| `brand/` | Poblada | `logo.png`, `logo.webp` |
| `courses/` | Poblada | 12 portadas de curso en `.png` y `.webp` (24 archivos) |
| `icons/` | Creada (vacía) | Reservada para iconografía propia/recursos UI si se requieren |
| `illustrations/` | Creada (vacía) | Reservada para ilustraciones si se requieren |
| `other/` | Creada (vacía) | Reservada para otros recursos clasificados |
| (raíz) | Poblada | `inventario.json` |

> Nota: la cobertura de uso del logo/portadas en **todas** las vistas exigidas por el prompt maestro debe verificarse y completarse de forma continua (Fase 3/14). Las páginas de autenticación (`/login`, `/registro`, `/recuperar-password`, `/auth/restablecer-contrasena`) y el `PanelLayoutComponent` (paneles estudiante/docente/admin) ya referencian el logo/brand según inspección.

---

## 1. Resumen

| Concepto | Valor |
|---|---|
| Archivos en el origen | 13 |
| Recursos identified | 13 (1 logotipo + 12 portadas de curso) |
| Peso original | 22.89 MB |
| Peso en el frontend | 6.09 MB (PNG + WebP) |
| Peso en WebP (formato servido) | ~1.66 MB |
| Reduccion WebP frente al PNG original | ~93 % |

No se encontro ningun recurso sin clasificar: los 13 archivos tienen una
funcion clara dentro de la identidad de InkaQuest.

---

## 2. Logotipo oficial

| Campo | Valor |
|---|---|
| Ruta original | `C:\Users\david\Desktop\proyecto mejorado\imagen\logo.png` |
| Nombre exacto | `logo.png` |
| Tipo de recurso | Logotipo oficial de la plataforma |
| Dimensiones originales | 1254 x 1254 px (cuadrado) |
| Peso original | 1.74 MB |
| Ubicacion final | `src/assets/images/brand/logo.png` (91 KB) |
| | `src/assets/images/brand/logo.webp` (73 KB) |
| Formato servido | WebP con respaldo PNG |

**Interfaces donde se usa (verificado/parcial):**

- Navbar público (`layouts/public-layout/navbar`, `app-logo`)
- Footer institucional (`layouts/public-layout/footer`, `app-logo`)
- Página de inicio/hero y secciones visuales (`features/public/home`, `assets/images/brand/logo.*`)
- Autenticación: login, registro, recuperar contraseña y restablecer contraseña (`features/auth/*`, `assets/images/brand/logo.*`); layout `layouts/auth-layout` como contenedor
- Detalle de curso (`features/public/course-detail`)
- Paneles estudiante/docente/administrador: barra lateral y cabecera común (`layouts/panel-layout`, `app-logo`)
- Página 404 (`features/public/not-found`)

> Pendiente de verificación exhaustiva en Fase 3/14: presencia consistente del logo en cualquier otra interfaz institucional añadida o específica por rol que lo requiera según el prompt.

**Implementacion:** `src/app/shared/components/logo/logo.component.ts`
(sin SVG, emojis ni texto como sustituto). La variante `sobre-oscuro`
aplica `brightness-0 invert` para mantener el contraste sobre fondos oscuros.

---

## 3. Portadas de curso

Cada curso tiene **su propia** portada original. No se reutiliza una imagen
para varios cursos ni se sustituye por ilustraciones generadas.

| # | Nombre exacto del original | Ruta original completa | Tipo | Ubicacion final | Peso PNG | Peso WebP | Slug del curso |
|---|---|---|---|---|---|---|---|
| 1 | `Algoritmos y Estructuras de Datos Neón.png` | `...\imagen\Algoritmos y Estructuras de Datos Neón.png` | Portada de curso | `src/assets/images/courses/algoritmos-estructuras-datos.png` / `.webp` | 359 KB | 110 KB | `algoritmos-estructuras-datos` |
| 2 | `Análisis y Diseño de Algoritmos.png` | `...\imagen\Análisis y Diseño de Algoritmos.png` | Portada de curso | `src/assets/images/courses/analisis-diseno-algoritmos.png` / `.webp` | 311 KB | 81 KB | `analisis-diseno-algoritmos` |
| 3 | `Base de Datos 1_ SQL y Esquemas.png` | `...\imagen\Base de Datos 1_ SQL y Esquemas.png` | Portada de curso | `src/assets/images/courses/base-de-datos-1.png` / `.webp` | 312 KB | 105 KB | `base-de-datos-1` |
| 4 | `Base de Datos 2_ Futuro SQL.png` | `...\imagen\Base de Datos 2_ Futuro SQL.png` | Portada de curso | `src/assets/images/courses/base-de-datos-2.png` / `.webp` | 354 KB | 112 KB | `base-de-datos-2` |
| 5 | `Diseño de patrones_ guía visual de software.png` | `...\imagen\Diseño de patrones_ guía visual de software.png` | Portada de curso | `src/assets/images/courses/diseno-patrones.png` / `.webp` | 340 KB | 112 KB | `diseno-patrones` |
| 6 | `Introducción a las TIC en neón.png` | `...\imagen\Introducción a las TIC en neón.png` | Portada de curso | `src/assets/images/courses/introduccion-tic.png` / `.webp` | 347 KB | 116 KB | `introduccion-tic` |
| 7 | `Principios de Algoritmos_ Guía Visual.png` | `...\imagen\Principios de Algoritmos_ Guía Visual.png` | Portada de curso | `src/assets/images/courses/principios-algoritmos.png` / `.webp` | 358 KB | 124 KB | `principios-algoritmos` |
| 8 | `Programación Orientada a Objetos.png` | `...\imagen\Programación Orientada a Objetos.png` | Portada de curso | `src/assets/images/courses/poo.png` / `.webp` | 338 KB | 142 KB | `poo` |
| 9 | `Redes y comunicación de datos 1.png` | `...\imagen\Redes y comunicación de datos 1.png` | Portada de curso | `src/assets/images/courses/redes-comunicacion-datos.png` / `.webp` | 445 KB | 162 KB | `redes-comunicacion-datos` |
| 10 | `Sistemas Operativos_ Guía Visual Futurista.png` | `...\imagen\Sistemas Operativos_ Guía Visual Futurista.png` | Portada de curso | `src/assets/images/courses/sistemas-operativos.png` / `.webp` | 417 KB | 153 KB | `sistemas-operativos` |
| 11 | `Taller de Programación Java.png` | `...\imagen\Taller de Programación Java.png` | Portada de curso | `src/assets/images/courses/taller-programacion-java.png` / `.webp` | 452 KB | 177 KB | `taller-programacion-java` |
| 12 | `Taller de Programación Web Neon.png` | `...\imagen\Taller de Programación Web Neon.png` | Portada de curso | `src/assets/images/courses/taller-programacion-web.png` / `.webp` | 455 KB | 191 KB | `taller-programacion-web` |

### Interfaces donde se usan las portadas

| Interfaz | Componente |
|---|---|
| Catalogo publico (tarjetas) | `shared/components/course-card` |
| Detalle publico del curso (cabecera) | `features/public/course-detail` |
| Portada de la pagina de inicio (cursos destacados) | `features/public/home` |
| Mis cursos (estudiante) | `features/student/my-courses` |
| Panel del docente (gestion de cursos) | `features/teacher/courses` |
| Panel del administrador (gestion de cursos) | `features/admin/courses` |
| Aula virtual | `features/student/classroom` |

---

## 4. Como se relacionan curso e imagen

La correspondencia se declara en un unico lugar:

`src/app/shared/utilities/curso-imagen.util.ts`

```ts
export const CURSO_A_IMAGEN: Record<string, string> = {
  'principios-algoritmos': 'assets/images/courses/principios-algoritmos.webp',
  'algoritmos-estructuras-datos': 'assets/images/courses/algoritmos-estructuras-datos.webp',
  // ... una entrada por cada curso
};

export function imagenDeCurso(slug: string | null | undefined): string { ... }
```

La clave es el **`slug` de la fila en `public.curso`**. Al cargar el catalogo
en la base de datos, los `slug` deben coincidir con estas claves; de lo
contrario el catalogo mostraria la portada generica.

`IMAGEN_POR_DEFECTO` cubre el caso de un curso recien creado todavia sin
portada asignada. Es la unica imagen que actua como genérica y solo se usa
cuando el slug no esta en el mapa.

---

## 5. Optimizacion aplicada

Los originales son PNG de 1.7-2.0 MB (1944x809, 2075x758, 1254x1254...) muy
pesados para web. El proceso (`optimizar-recursos.mjs`, con `sharp`):

1. Redimensiona al ancho maximo de 1600 px (512 px para el logo).
2. Exporta **WebP** con calidad 86 (formato servido).
3. Reescribe el **PNG** con paleta y compresion maxima (respaldo y logo con
   transparencia).
4. Mantiene los dos formatos en disco: WebP es el que se referencia en el
   codigo; el PNG queda como respaldo.

Resultado medio: **1.9 MB -> 110 KB** por portada.

---

## 6. Recursos faltantes

| Recurso | Estado | Impacto | Decision |
|---|---|---|---|
| Portadas de los cursos que se carguen en la BD con un `slug` distinto a los 12 anteriores | Faltante | La ficha usaria la portada generica | Se resuelve al cargar el catalogo: alinear los `slug` con `CURSO_A_IMAGEN` o ampliar el mapa |
| Iconos de insignia / misiones / insignias | Faltante | La insignia se muestra con su codigo y un marcador SVG, no con arte propio | Se generaran cuando se defina el set de insignia (dependencia del diseno) |
| Fotos del equipo docente | Faltante | La pagina de docentes no muestra retratos | Las fotos se gestionan en `perfil.avatar_url` (Supabase Storage) |
| Ilustraciones de la pagina de error / estados vacios | No necesarias | Ninguno | Se usan formas y SVG del sistema de diseno |
| Favicon / icono de app | Faltante | Icono por defecto del navegador | Se generara al definir la identidad del producto en tienda |
| Capturas de los minijuegos | Faltante | La ficha de un juego no muestra imagen | Las capturas se asocian por `juego.imagen_url` cuando exista |

**No se sustituyo ningun recurso oficial por material inventado.** Cuando
falta un recurso, la interfaz lo reconoce con un estado vacio honesto en
lugar de mostrar una imagen ajena.

---

## 7. Recursos no identificados

Ninguno. Los 13 archivos tienen correspondencia inequivoca con el logotipo o
con una portada de curso, segun el nombre del propio archivo.

---

## 8. Verificacion de carga

- Las rutas referenciadas en el codigo existen todas en disco (comprobado con
  `Get-ChildItem src/assets/images -Recurse`).
- `npm run build` incluye `src/assets/**` en el presupuesto de la aplicacion
  (`angular.json`, seccion `assets`).
- Las imagenes se sirven como `/assets/images/...` (ruta relativa a la raiz de
  la aplicacion), por lo que funcionan igual en desarrollo y en produccion.
- Los `<img>` llevan siempre `alt` descriptivo y `loading="lazy"` cuando no
  son Above The Fold; el logo usa `loading="eager"` y `decoding="async"`.

---

## 9. Reproducir el proceso

```powershell
# Copia los recursos y genera el inventario
node "scripts\jpa\copiar-recursos.mjs" `
     "C:\Users\david\Desktop\proyecto mejorado\imagen" `
     "C:\Users\david\Desktop\Proyecto inkaquest desde cero\frontend\inkaquest-web"

# Optimiza las copias (WebP + PNG comprimido)
cd "frontend\inkaquest-web"
node optimizar-recursos.mjs "C:\Users\david\Desktop\Proyecto inkaquest desde cero\frontend\inkaquest-web"
```

El primer script **borra y recrea** `src/assets/images/` para no dejar copias
de ejecuciones anteriores con nombres distintos.
