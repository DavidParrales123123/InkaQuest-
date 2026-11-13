// @ts-nocheck
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

/** Pregunta frecuente con su respuesta editorial. */
interface PreguntaFaq {
  /** Identificador estable para el rastreo de la vista. */
  id: string;
  /** Enunciado de la pregunta. */
  pregunta: string;
  /** Respuesta de la plataforma. */
  respuesta: string;
}

/** Grupo de preguntas por tema. */
interface GrupoFaq {
  /** Identificador del grupo. */
  id: string;
  /** Nombre del grupo. */
  nombre: string;
  /** Descripcion breve del grupo. */
  descripcion: string;
  /** Preguntas del grupo. */
  preguntas: PreguntaFaq[];
}

/**
 * Preguntas frecuentes.
 *
 * <p>El contenido es editorial estatico: describe el funcionamiento de la
 * propia plataforma, por lo que no se consulta a la base de datos. El buscador
 * filtra en el cliente sobre las preguntas ya cargadas en memoria.</p>
 */
@Component({
  selector: 'app-faq',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="relative overflow-hidden bg-marine-gradient text-white">
      <div class="absolute inset-0 bg-andino-pattern opacity-70" aria-hidden="true"></div>
      <div class="container-app relative py-12 md:py-16">
        <div class="mx-auto max-w-2xl text-center">
          <p class="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-[0.18em] text-gold-300 uppercase ring-1 ring-white/15">Soporte</p>
          <h1 class="mt-4 text-white">Preguntas frecuentes</h1>
          <p class="mt-4 text-lg text-marine-100">Resolvemos dudas sobre cuentas, cursos, pagos, certificados y soporte. Busca o explora por categoría.</p>
        </div>
        <div class="mx-auto mt-8 max-w-xl">
          <label class="sr-only" for="busqueda-faq">Buscar en las preguntas frecuentes</label>
          <div class="relative">
            <svg class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-marine-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" stroke-linecap="round" /></svg>
            <input id="busqueda-faq" type="search" class="input border-white/20 bg-white/95 pl-10 text-marine-800 shadow-lg" placeholder="Escribe tu duda: pago, certificado, cuenta…" [ngModel]="busqueda()" (ngModelChange)="aplicarBusqueda($event)" />
          </div>
        </div>
      </div>
    </section>

    <section class="container-app py-10 md:py-12">
      <div class="card p-4 md:p-5">
        <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
          <button type="button" class="badge cursor-pointer transition-all" [class.bg-marine-700]="categoriaActiva() === ''" [class.text-white]="categoriaActiva() === ''" [class.bg-surface-100]="categoriaActiva() !== ''" [class.text-marine-600]="categoriaActiva() !== ''" (click)="categoriaActiva.set('')">Todas</button>
          @for (grupo of grupos; track grupo.id) {
            <button type="button" class="badge cursor-pointer transition-all" [class.bg-marine-700]="categoriaActiva() === grupo.id" [class.text-white]="categoriaActiva() === grupo.id" [class.bg-surface-100]="categoriaActiva() !== grupo.id" [class.text-marine-600]="categoriaActiva() !== grupo.id" (click)="categoriaActiva.set(grupo.id)">{{ grupo.nombre }}</button>
          }
        </div>
      </div>

      <p class="mt-6 text-sm font-semibold text-marine-500" aria-live="polite">{{ totalResultados() }} {{ totalResultados() === 1 ? 'pregunta' : 'preguntas' }} {{ hayFiltros() ? 'con los filtros aplicados' : 'disponibles' }}</p>

      @if (totalResultados() === 0) {
        <div class="card mt-6">
          <div class="state-block">
            <div class="flex size-14 items-center justify-center rounded-full bg-surface-100 text-brand-500"><svg class="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" stroke-linecap="round" /></svg></div>
            <h2 class="text-lg font-extrabold text-marine-700">No encontramos esa pregunta</h2>
            <p class="max-w-md text-sm text-marine-500">Prueba con otras palabras o limpia los filtros. Si tu duda no aparece, contáctanos.</p>
            <button type="button" class="btn btn-outline btn-md mt-2" (click)="limpiarFiltros()">Limpiar filtros</button>
          </div>
        </div>
      } @else {
        <div class="mt-6 space-y-8">
          @for (grupo of gruposVisibles(); track grupo.id) {
            <section>
              <h2 class="text-2xl font-extrabold">{{ grupo.nombre }}</h2>
              <p class="mt-1.5 text-marine-500">{{ grupo.descripcion }}</p>
              <div class="mt-4 space-y-3">
                @for (pregunta of grupo.preguntas; track pregunta.id) {
                  <details class="card group overflow-hidden">
                    <summary class="flex cursor-pointer list-none items-center justify-between gap-4 p-5 transition-colors hover:bg-surface-50">
                      <h3 class="text-base font-extrabold text-marine-700">{{ pregunta.pregunta }}</h3>
                      <svg class="size-5 shrink-0 text-marine-400 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    </summary>
                    <div class="border-t border-surface-200 bg-surface-50/60 px-5 py-4"><p class="leading-relaxed text-marine-600">{{ pregunta.respuesta }}</p></div>
                  </details>
                }
              </div>
            </section>
          }
        </div>
      }

      <div class="card mt-12 overflow-hidden bg-brand-gradient p-8 text-center md:p-10">
        <h2 class="text-white">¿Tu duda no está aquí?</h2>
        <p class="mx-auto mt-3 max-w-xl text-marine-100">Escríbenos y crearemos un ticket de soporte para darle seguimiento desde tu cuenta.</p>
        <div class="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <a routerLink="/contacto" class="btn btn-gold btn-lg">Contáctanos</a>
          <a routerLink="/solicitud-docente" class="btn btn-outline-light btn-lg">Solicitar acceso docente</a>
        </div>
      </div>
    </section>
  `,
})
export class FaqComponent {
  /** Texto de busqueda escrito por el visitante. */
  protected readonly busqueda = signal('');
  /** Categoria seleccionada; cadena vacia significa "todas". */
  protected readonly categoriaActiva = signal('');

  /** Categorias de preguntas frecuentes. */
  protected readonly grupos: readonly GrupoFaq[] = [
    {
      id: 'cuenta',
      nombre: 'Cuenta',
      descripcion: 'Registro, acceso y datos de tu perfil.',
      preguntas: [
        {
          id: 'cuenta-registro',
          pregunta: '¿Cómo creo mi cuenta en InkaQuest?',
          respuesta:
            'Desde la página de registro necesitas un correo válido, un nombre y una contraseña de al menos 8 caracteres. Aceptas los términos y la política de privacidad y la cuenta queda creada. Si tu proveedor de correo exige confirmar la dirección, te enviamos un enlace de verificación.',
        },
        {
          id: 'cuenta-roles',
          pregunta: '¿Qué diferencia hay entre estudiante, docente y administrador?',
          respuesta:
            'El estudiante accede al contenido de los cursos en los que se matriculó. El docente gestiona los cursos que tiene asignados y califica las entregas. El administrador administra usuarios, cursos, solicitudes y parámetros de la plataforma. El rol lo concede siempre un administrador: la interfaz nunca lo asigna por sí misma.',
        },
        {
          id: 'cuenta-contrasena',
          pregunta: 'He olvidado mi contraseña, ¿qué hago?',
          respuesta:
            'En la pantalla de inicio de sesión tienes la opción de recuperar la contraseña. Te enviamos un correo con un enlace para establecer una nueva. Si el enlace caduca, puedes solicitar uno nuevo.',
        },
        {
          id: 'cuenta-datos',
          pregunta: '¿Qué datos míos guarda la plataforma?',
          respuesta:
            'Tu perfil (nombre, correo y datos que tú mismo completas), tu progreso de aprendizaje, tu XP, tus matrículas, tus certificados y el historial de tickets de soporte. Puedes revisar la política de privacidad para el detalle completo de cómo se tratan y por cuánto tiempo se conservan.',
        },
      ],
    },
    {
      id: 'cursos',
      nombre: 'Cursos',
      descripcion: 'Catálogo, matrícula y contenido de los cursos.',
      preguntas: [
        {
          id: 'cursos-catalogo',
          pregunta: '¿Cómo funciona el catálogo de cursos?',
          respuesta:
            'Cada curso publicado muestra su programa completo: unidades, módulos y lecciones. La duración, el XP total y el precio son los que figuran en la base de datos del catálogo, no valores aproximados.',
        },
        {
          id: 'cursos-matricula',
          pregunta: '¿Cómo me matriculo en un curso?',
          respuesta:
            'Entra en el curso y pulsa el botón de matrícula. Si el curso es gratuito, tu matrícula se activa de inmediato. Si tiene precio, el backend genera el pedido y te diriges al pago. La activación de la matrícula la aplica el backend cuando confirma el pago, nunca el navegador.',
        },
        {
          id: 'cursos-progreso',
          pregunta: '¿Cómo se registra mi progreso?',
          respuesta:
            'Cada lección completada se registra en la base de datos con su porcentaje, el tiempo de estudio y el XP otorgado. El avance se muestra en tu panel y en el detalle del curso. Tu progreso no se puede editar a mano.',
        },
        {
          id: 'cursos-retos',
          pregunta: '¿Cómo se evalúan los retos de programación?',
          respuesta:
            'Cada reto se evalúa automáticamente contra casos de prueba, incluidos casos límite y casos ocultos. El resultado indica el puntaje obtenido y qué casos fallaron. La ejecución del código corresponde a un servicio de evaluación del backend, no al navegador.',
        },
        {
          id: 'cursos-reinicio',
          pregunta: '¿Puedo repetir un curso o sus retos?',
          respuesta:
            'Puedes repasar el contenido las veces que quieras. Los retos y las evaluaciones tienen el número de intentos permitido por la configuración de cada actividad, que es visible en la propia actividad.',
        },
      ],
    },
    {
      id: 'pagos',
      nombre: 'Pagos',
      descripcion: 'Precios, cobros, reembolsos y facturación.',
      preguntas: [
        {
          id: 'pagos-metodo',
          pregunta: '¿Cómo se realiza el pago de un curso?',
          respuesta:
            'El cobro se procesa en Culqi, un proveedor externo de pagos. La petición la genera el backend, que es el único que puede crear pedidos y autorizar transacciones. InkaQuest no guarda números de tarjeta ni códigos de seguridad (CVV): esos datos nunca pasan por nuestra base de datos.',
        },
        {
          id: 'pagos-confirmacion',
          pregunta: '¿Cómo sé que mi pago se confirmó?',
          respuesta:
            'El estado del pedido y de la transacción se actualiza cuando el backend recibe la confirmación del proveedor. Tu panel de pagos muestra el historial real. El navegador nunca marca un pago como exitoso por su cuenta.',
        },
        {
          id: 'pagos-moneda',
          pregunta: '¿En qué moneda se cobran los cursos?',
          respuesta:
            'Los precios del catálogo están en soles (PEN). El backend es quien valida el importe final y la moneda de cada pedido.',
        },
        {
          id: 'pagos-reembolso',
          pregunta: '¿Qué pasa si quiero la devolución de un curso?',
          respuesta:
            'Las devoluciones se tramitan según nuestra política de pagos y reembolsos. La solicitud se registra y la resuelve el backend, que es el único que puede anular o reembolsar una transacción ya autorizada.',
        },
      ],
    },
    {
      id: 'certificados',
      nombre: 'Certificados',
      descripcion: 'Emisión, descarga y verificación de certificados.',
      preguntas: [
        {
          id: 'certificados-emision',
          pregunta: '¿Cuándo se emite mi certificado?',
          respuesta:
            'Cuando cumples los requisitos del curso. La emisión la realiza el backend: el frontend solo lee lo que quedó registrado.',
        },
        {
          id: 'certificados-codigo',
          pregunta: '¿Qué es el código del certificado?',
          respuesta:
            'Es un identificador único que se entrega con el certificado. Cualquier persona puede comprobarlo desde la página de verificación de certificados, sin necesidad de cuenta.',
        },
        {
          id: 'certificados-verificar',
          pregunta: '¿Cómo verifica un tercero mi certificado?',
          respuesta:
            'En la página de verificación introduce el código (o abre el enlace que incluye el código). El sistema comprueba contra la base de datos y muestra el estado del certificado, la fecha de emisión y si está verificado. Por protección de datos, la verificación pública no muestra el nombre del titular.',
        },
      ],
    },
    {
      id: 'soporte',
      nombre: 'Soporte',
      descripcion: 'Tickets, tiempos de respuesta y ayuda con la plataforma.',
      preguntas: [
        {
          id: 'soporte-ticket',
          pregunta: '¿Cómo contacto con soporte?',
          respuesta:
            'Desde la página de contacto, si tienes cuenta, se crea un ticket real con tu asunto y tu mensaje. Puedes seguir su estado desde el panel de soporte de tu cuenta. Cada ticket queda asociado a tu usuario para que solo tú veas el historial.',
        },
        {
          id: 'soporte-docente',
          pregunta: '¿Cómo puedo dictar un curso en InkaQuest?',
          respuesta:
            'Crea tu cuenta como estudiante y envía una solicitud de acceso docente desde el formulario de solicitud. Un administrador revisa los datos de tu institución, tu especialidad y tu código de docente. El rol de docente lo concede un administrador: la plataforma no lo autoasigna.',
        },
        {
          id: 'soporte-responsetiempo',
          pregunta: '¿En cuánto tiempo responden un ticket?',
          respuesta:
            'Los tickets se atienden por orden de prioridad y antigüedad. El estado de cada solicitud se refleja en el panel de soporte, donde puedes ver las respuestas del equipo.',
        },
        {
          id: 'soporte-error',
          pregunta: 'Reporto un error de la plataforma, ¿cómo lo hago?',
          respuesta:
            'Describe el error en el formulario de contacto o abre un ticket desde el panel de soporte, indicando la pantalla, lo que esperabas y lo que ocurrió. Adjunta los pasos exactos para poder reproducirlo.',
        },
      ],
    },
  ];

  /** Grupos que cumplen el filtro de categoria y el texto de busqueda. */
  protected readonly gruposVisibles = computed(() => {
    const categoria = this.categoriaActiva();
    const termino = this.normalizar(this.busqueda().trim());

    return this.grupos
      .filter((grupo) => !categoria || grupo.id === categoria)
      .map((grupo) => ({
        ...grupo,
        preguntas: termino
          ? grupo.preguntas.filter(
              (pregunta) =>
                this.normalizar(pregunta.pregunta).includes(termino) ||
                this.normalizar(pregunta.respuesta).includes(termino),
            )
          : grupo.preguntas,
      }))
      .filter((grupo) => grupo.preguntas.length > 0);
  });

  /** Total de preguntas que cumplen los filtros. */
  protected readonly totalResultados = computed(() =>
    this.gruposVisibles().reduce((total, grupo) => total + grupo.preguntas.length, 0),
  );

  /** Indica si hay algun filtro aplicado. */
  protected readonly hayFiltros = computed(
    () => this.busqueda().trim().length > 0 || this.categoriaActiva().length > 0,
  );

  /** Aplica el texto de busqueda escrito por el visitante. */
  protected aplicarBusqueda(valor: string): void {
    this.busqueda.set(valor);
  }

  /** Quita la búsqueda y el filtro de categoría. */
  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.categoriaActiva.set('');
  }

  /** Normaliza un texto para compararlo sin tildes ni mayúsculas. */
  private normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
