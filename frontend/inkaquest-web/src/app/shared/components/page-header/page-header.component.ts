// @ts-nocheck
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/** Etiquetas legibles para los segmentos de ruta más comunes. */
const SEGMENTOS: Record<string, string> = {
  admin: 'Administración',
  docente: 'Docente',
  estudiante: 'Estudiante',
  dashboard: 'Panel',
  reportes: 'Reportes',
  auditoria: 'Auditoría',
  usuarios: 'Usuarios',
  estudiantes: 'Estudiantes',
  docentes: 'Docentes',
  solicitudes: 'Solicitudes docentes',
  roles: 'Roles',
  permisos: 'Permisos',
  cursos: 'Cursos',
  categorias: 'Categorías',
  unidades: 'Unidades',
  lecciones: 'Lecciones',
  recursos: 'Recursos y archivos',
  matriculas: 'Matrículas',
  actividades: 'Actividades',
  evaluaciones: 'Evaluaciones',
  tareas: 'Tareas',
  calificaciones: 'Calificaciones',
  guardianes: 'Guardianes',
  rankings: 'Rankings',
  notificaciones: 'Notificaciones',
  mensajes: 'Mensajes',
  soporte: 'Soporte',
  perfil: 'Mi perfil',
  pagos: 'Pagos',
  config: 'Configuración',
  configuracion: 'Configuración',
  ayuda: 'Ayuda',
  aula: 'Aula',
  jugar: 'Jugar',
};

/**
 * Encabezado de pagina de panel.
 *
 * <p>Unifica el titulo, la descripcion y las acciones principales de cada
 * pantalla interna. Muestra ademas una ruta de navegacion automatica para que
 * el usuario siempre sepa donde esta dentro del panel.</p>
 */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-surface-200 bg-white/70 p-4 shadow-[0_4px_16px_rgba(27,42,74,0.04)] backdrop-blur-sm sm:p-5 md:mb-10 md:p-6">
      <div class="min-w-0">
        <nav aria-label="Ruta de navegación" class="mb-2 flex flex-wrap items-center gap-1 text-[0.68rem] font-semibold text-marine-400">
          @for (miga of migas(); track $index; let ultima = $last) {
            <span [class.text-brand-600]="ultima">{{ miga }}</span>
            @if (!ultima) { <span class="text-marine-300" aria-hidden="true">/</span> }
          }
        </nav>
        @if (eyebrow()) {
          <p class="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-[0.68rem] font-extrabold tracking-[0.18em] text-brand-700 uppercase">
            {{ eyebrow() }}
          </p>
        }
        <h1 class="mt-2 text-xl font-extrabold tracking-tight text-marine-700 sm:text-2xl md:text-3xl">{{ titulo() }}</h1>
        @if (descripcion()) {
          <p class="mt-1.5 max-w-2xl text-sm leading-relaxed text-marine-500">{{ descripcion() }}</p>
        }
      </div>
      @if (acciones()) {
        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <ng-content select="[acciones]" />
        </div>
      }
    </header>
  `,
})
export class PageHeaderComponent {
  private readonly router = inject(Router);

  /** Antetitulo contextual (por ejemplo, el nombre del curso). */
  readonly eyebrow = input<string | null>(null);
  /** Titulo de la pagina. */
  readonly titulo = input.required<string>();
  /** Descripcion opcional bajo el titulo. */
  readonly descripcion = input<string | null>(null);
  /** Indica si hay acciones a la derecha. */
  readonly acciones = input(false);

  /** Ruta legible calculada a partir de la URL actual. */
  protected readonly migas = signal<string[]>([]);

  constructor() {
    this.actualizarMigas();
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.actualizarMigas());
  }

  private actualizarMigas(): void {
    const ruta = this.router.url.split('?')[0].split('#')[0];
    const migas = ['InkaQuest'];
    for (const segmento of ruta.split('/').filter(Boolean)) {
      // Identificadores UUID y numéricos no aportan orientación al usuario.
      if (/^[0-9a-f]{8}-[0-9a-f-]{20,}$/i.test(segmento) || /^[0-9a-f]{32}$/i.test(segmento)) continue;
      if (/^\d+$/.test(segmento)) {
        migas.push(`Nivel ${segmento}`);
        continue;
      }
      migas.push(SEGMENTOS[segmento] ?? segmento.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()));
    }
    this.migas.set(migas.slice(-4));
  }
}
