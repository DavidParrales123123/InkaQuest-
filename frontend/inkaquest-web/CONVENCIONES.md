# Convenciones de codigo del frontend InkaQuest

Este documento es la referencia **obligatoria** para cualquier componente nuevo
del frontend. Permite que varias personas (o agentes) escriban pantallas
coherentes sin duplicar trabajo.

Ruta del frontend: `C:\Users\david\Desktop\Proyecto inkaquest desde cero\frontend\inkaquest-web`

---

## 1. Estructura de un componente

Un componente por archivo, en una carpeta con el nombre del componente:

```
src/app/features/<ambito>/<pantalla>/<pantalla>.component.ts
```

Clase exportada: `NombrePantallaComponent`. Selector: `app-nombre-pantalla`.

### Plantilla base

```ts
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CourseService } from '../../../core/services/course.service';
import { Curso } from '../../../core/models/domain.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';

@Component({
  selector: 'app-mi-pantalla',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent, DataPanelComponent],
  template: `...`,
})
export class MiPantallaComponent implements OnInit {
  private readonly service = inject(MiServicio);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly datos = signal<MiTipo[]>([]);

  ngOnInit(): void {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.datos.set(await this.service.obtener());
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Error inesperado.');
    } finally {
      this.cargando.set(false);
    }
  }
}
```

### Reglas obligatorias

- `ChangeDetectionStrategy.OnPush` **siempre**.
- Signals para todo el estado (`signal`, `computed`). Sin campos mutables.
- `protected` en los miembros usados por la plantilla; `private` en la logica.
- Los metodos de plantilla deben ser `protected` y rapidos (sin `await`).
- Nunca uses `any`. Si un dato no esta tipado, declaralo en
  `core/models/domain.models.ts`.
- Comentarios en espanol, explicando el *por que*, no el *que*.

---

## 2. Sistema de diseno (Tailwind v4 + `src/styles/theme.css`)

El archivo `src/styles/theme.css` define el tema. Usa **solo** estas clases de
utilidad; no inventes colores sueltos.

### Paleta (tokens generados)

| Token | Uso |
|---|---|
| `marine-50..900` | texto, encabezados, fondos oscuros (navy `#1B2A4A`) |
| `brand-50..900` | acciones primarias (teal `#12736B`) |
| `gold-50..900` | recompensas, logros (dorado `#F2A541`) |
| `surface-50..400` | fondos suaves (`#EAF3F2`) |
| `danger-50..700` | errores, acciones destructivas (rojo `#B3002D`) |
| `success-50/500/600` | confirmaciones |
| `warning-50/500` | avisos |
| `info-50/500` | informacion |

### Clases de componente disponibles

```
btn  btn-primary  btn-secondary  btn-outline  btn-outline-light  btn-ghost
btn-danger  btn-gold
btn-sm  btn-md  btn-lg

card  card-hover  card-body
label  input  input-error  select  textarea  field-error  checkbox
badge  badge-success  badge-warning  badge-danger  badge-info  badge-neutral
badge-gold  badge-brand
progress-track  progress-bar
table-wrap  table
state-block  skeleton
link  container-app  section
```

### Utilidades

```
bg-brand-gradient  bg-marine-gradient  bg-gold-gradient  text-gradient-brand
bg-andino-pattern  scrollbar-thin  line-clamp-2
```

### Tipografia

Los titulos usan las clases base del tema (`h1`..`h4`). Para jerarquia dentro
de tarjetas: `text-lg font-semibold`, `text-sm text-marine-500`.

---

## 3. Componentes compartidos disponibles

Importalos desde `src/app/shared/components/...`:

| Componente | Selector | Para que sirve |
|---|---|---|
| `PageHeaderComponent` | `app-page-header` | Encabezado de pagina interna. Inputs: `titulo` (requerido), `descripcion`, `eyebrow`, `acciones`. Slot `[acciones]` a la derecha. |
| `DataPanelComponent` | `app-data-panel` | Estados de carga / error / vacio. Inputs: `cargando`, `error`, `vacio`, `tituloVacio`, `descripcionVacia`, `accionVacia`, `reintentable`, `placeholders`, `columnas`. Slot `[contenido]` para los datos, `[icono-vacio]` para el icono del estado vacio. Outputs: `alReintentar`, `alAccionVacia`. |
| `StatCardComponent` | `app-stat-card` | Indicador KPI. Inputs: `etiqueta`, `valor`, `detalle`, `icono` (bool), `tono` (`brand`/`gold`/`danger`/`info`/`surface`). Slot `[icono]`. |
| `CourseCardComponent` | `app-course-card` | Tarjeta de curso del catalogo. Input: `curso` (requerido), `numeroUnidades`. |
| `StatusBadgeComponent` | `app-status-badge` | Etiqueta de estado. Input: `estado`. |
| `ButtonComponent` | `app-button` | Boton con estados. Inputs: `variante` (`primario`/`secundario`/`contorno`/`fantasma`/`peligro`/`oro`), `tamano` (`sm`/`md`/`lg`), `tipo`, `cargando`, `deshabilitado`, `textoCargando`. Output: `alPulsar`. |
| `EmptyStateComponent` | `app-empty-state` | Estado vacio. Inputs: `titulo`, `descripcion`, `accion`, `icono`. |
| `SkeletonComponent` | `app-skeleton` | Bloque de carga. Inputs: `ancho`, `alto`, `radio`, `clase`. |
| `LogoComponent` | `app-logo` | Logo oficial. Inputs: `alto`, `textoAlternativo`, `variante` (`normal`/`sobre-oscuro`). |

### Utilidad de imagenes de curso

```ts
import { imagenDeCurso } from '../../../shared/utilities/curso-imagen.util';
protected imagen = computed(() => imagenDeCurso(this.curso()?.slug));
```

El mapa `CURSO_A_IMAGEN` asigna a cada curso **su** portada original. No
sustituyas una imagen por otra ni reutilices la misma para varios cursos.

---

## 4. Servicios disponibles (`src/app/core/services/`)

| Servicio | Metodos principales |
|---|---|
| `AuthService` | `usuario()`, `perfil()`, `rol()`, `autenticado()`, `cargando()`, `esDocente()`, `esAdmin()`, `esEstudiante()`, `cargarPerfil()`, `registrar()`, `iniciarSesion()`, `cerrarSesion()`, `recuperarContrasena()`, `actualizarContrasena()` |
| `CourseService` | `listarPublicos()`, `contarPublicos()`, `obtenerPorId()`, `obtenerPorSlug()`, `listarCategorias()`, `obtenerEstructura()`, `listarUnidades()`, `listarModulos()`, `listarLecciones()`, `listarContenido()`, `listarRecursos()`, `listarActividades()`, `listarCursosDeEstudiante()` |
| `EnrollmentService` | `listarMisMatriculas()`, `listarMiProgreso()`, `estaMatriculado()`, `solicitarMatricula()`, `cancelarMatricula()` |
| `ProgressService` | `listarMiProgreso()`, `obtenerProgresoCurso()`, `listarProgresoLecciones()`, `listarProgresoUnidades()`, `registrarLeccionCompletada()` |
| `ActivityService` | `listarActividadesCurso()`, `listarActividadesLeccion()`, `listarTareasCurso()`, `listarEntregasTarea()`, `enviarTarea()`, `listarCalificaciones()`, `calificarEntrega()` |
| `EvaluationService` | `listarEvaluacionesCurso()`, `obtenerEvaluacion()`, `listarPreguntas()`, `listarOpciones()`, `listarIntentos()`, `listarIntentosEvaluacion()`, `iniciarIntento()`, `responder()`, `finalizarIntento()` |
| `GameService` | `listarMotores()`, `listarVersiones()`, `listarMotoresCurso()`, `listarJuegosPorMotor()`, `listarJuegos()`, `obtenerJuego()`, `listarActividadesJuego()`, `listarConfiguracionJuego()`, `listarMisIntentos()`, `iniciarIntento()`, `registrarResultado()`, `obtenerResultado()`, `obtenerPuntuacion()` |
| `ChallengeService` | `listarRetosCurso()`, `obtenerReto()`, `listarCasosPrueba()`, `listarRestricciones()`, `listarLenguajes()`, `listarMisEnvios()`, `enviarSolucion()` |
| `GamificationService` | `listarHistorialXp()`, `listarInsignias()`, `listarCatalogoInsignias()`, `obtenerRacha()`, `listarTemporadas()`, `listarRanking()`, `listarMisiones()`, `listarMisionesUsuario()`, `obtenerMonedero()`, `listarHistorialMonedas()`, `listarEventos()`, `listarReglasProgresion()` |
| `RewardService` | `listarTienda()`, `obtenerItem()`, `listarInventario()`, `listarCompras()` |
| `CertificateService` | `listarCertificados()`, `listarTitulares()`, `obtenerCursoCertificado()`, `verificarPorCodigo()`, `listarCursosCertificado()` |
| `PaymentService` | `listarPedidos()`, `obtenerPedido()`, `listarDetallePedido()`, `listarTransacciones()`, `listarTransaccionesPedido()`, `listarReembolsos()`, `listarCupones()`, `validarCupon()` |
| `NotificationService` | `listarNotificaciones()`, `contarNoLeidas()`, `marcarLeida()`, `marcarTodasLeidas()` |
| `SupportService` | `listarMisTickets()`, `listarTicketsAsignados()`, `obtenerTicket()`, `listarRespuestas()`, `crearTicket()`, `responder()`, `cerrarTicket()` |
| `TeacherService` | `solicitarAccesoDocente()`, `obtenerMiSolicitud()`, `listarMisCursos()`, `listarEstudiantes()`, `listarEntregasPendientes()`, `listarCalificaciones()` |
| `AdminService` | `listarUsuarios()`, `obtenerUsuario()`, `cambiarEstadoCuenta()`, `listarSolicitudesDocente()`, `aprobarSolicitud()`, `rechazarSolicitud()`, `listarTodosLosCursos()`, `cambiarEstadoCurso()`, `listarAuditoria()`, `listarAccesos()`, `listarParametros()`, `listarConfiguracion()` |
| `ApiClientService` | Cliente HTTP del backend Spring Boot. `baseUrl`, `get/post/put/patch/delete`. |

---

## 5. Reglas de seguridad (no negociables)

1. **Nunca** inventes endpoints ni datos. Si una accion necesita el backend y
   este no lo expone, muestra un estado honesto ("pendiente de integracion") y
   documentalo en `docs/frontend-pendientes.md`.
2. **Nunca** simules autenticacion, pagos ni recompensas.
3. El frontend **no** calcula XP, insignias, niveles ni recompensas: solo lee
   lo que la base de datos registro (o invoca la funcion RPC autorizada).
4. No incluyas claves `service_role`, secretos de Culqi ni de IA.
5. Los guards son solo UX: la autorizacion real es Spring Security + RLS.
6. No marques un pago como exitoso por lo que indique el navegador.
7. No ejecutes codigo de usuario en el navegador ni en el backend: la
   ejecucion de retos corresponde a un servicio backend aislado (pendiente).

---

## 6. Estados obligatorios en cada pantalla

- **Carga**: `app-data-panel [cargando]="cargando()"`.
- **Error**: `app-data-panel [error]="error()"` con reintento.
- **Vacio**: `app-data-panel [vacio]="sinDatos()"` con texto que explique por
  que esta vacio (no un "no hay datos" generico).
- **Exito**: mensaje con `role="status"` y clases `bg-success-50 text-success-600`.

---

## 7. Accesibilidad

- Todo control tiene `<label for>` o `aria-label`.
- Los iconos decorativos llevan `aria-hidden="true"`.
- Los botones de solo icono llevan `aria-label` descriptivo.
- Usa `<button type="button">` salvo en formularios de envio (`type="submit"`).
- Los estados de carga de boton usan `app-button [cargando]` (ya gestiona
  `aria-busy`).
- Jerarquia de encabezados correcta (`h1` en el encabezado de pagina, `h2` en
  secciones, `h3` en tarjetas).

---

## 8. Responsive

- Contenedor: `container-app`.
- Grillas: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`.
- Tablas: envueltas en `table-wrap` (desplazamiento horizontal).
- Formularios: `grid gap-4 md:grid-cols-2`.

---

## 9. Iconos

Se usa SVG inline con `stroke="currentColor"` (no se requiere la libreria de
iconos para estas pantallas). Patrones usados en el proyecto:

```html
<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
  <path d="m5 13 4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
</svg>
```

Si necesitas un icono nuevo, usa un SVG de trazo de 24x24 con
`stroke-linecap="round"` y `stroke-linejoin="round"`.
