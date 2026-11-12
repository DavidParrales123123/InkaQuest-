import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Curso } from '../../../core/models/domain.models';
import { imagenDeCurso } from '../../utilities/curso-imagen.util';

/**
 * Tarjeta de curso del catalogo.
 *
 * <p>Usa la portada oficial del curso y un enlace al detalle. El precio, la
 * duracion y el nivel se derivan de los datos reales del curso.</p>
 */
@Component({
  selector: 'app-course-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <a
      [routerLink]="enlace()"
      class="card card-hover group flex h-full flex-col overflow-hidden"
    >
      <div class="relative aspect-[16/10] overflow-hidden bg-marine-100">
        <img
          [src]="imagen()"
          [alt]="'Portada del curso ' + curso().titulo"
          class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-marine-900/35 via-transparent to-transparent"></div>
        @if (contexto() === 'aulas') {
          <span class="badge absolute top-3 left-3 shadow-sm" [class.badge-gold]="estado() === 'pendiente_pago'" [class.badge-success]="estado() !== 'pendiente_pago'">
            {{ estado() === 'pendiente_pago' ? 'Pago pendiente' : estado() === 'completada' ? 'Completado' : 'Inscrito' }}
          </span>
        } @else if (esGratis()) {
          <span class="badge badge-gold absolute top-3 left-3 shadow-sm ring-1 ring-gold-300/40">Gratuito</span>
        } @else {
          <span class="absolute top-3 left-3 rounded-full bg-marine-700/90 px-2.5 py-1 text-xs font-extrabold text-white backdrop-blur">{{ precio() }}</span>
        }
        @if (curso().estado !== 'publicado') {
          <span class="badge badge-warning absolute top-3 right-3 shadow-sm">{{
            curso().estado === 'borrador' ? 'Borrador' : 'En revisión'
          }}</span>
        }
      </div>

      <div class="card-body flex flex-1 flex-col gap-3">
        <div class="flex flex-wrap items-center gap-2 text-xs font-semibold text-marine-500">
          @if (duracion()) {
            <span class="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2 py-1">
              <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {{ duracion() }}
            </span>
          }
          @if (numeroUnidades() !== null) {
            <span class="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2 py-1">
              <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M4 5h16v14H4z" stroke-linejoin="round" /><path d="M4 9h16" />
              </svg>
              {{ numeroUnidades() }} unidades
            </span>
          }
        </div>

        <h3 class="text-lg leading-snug font-extrabold text-marine-700 transition-colors group-hover:text-brand-600">
          {{ curso().titulo }}
        </h3>

        @if (curso().descripcion) {
          <p class="line-clamp-2 text-sm leading-relaxed text-marine-500">{{ curso().descripcion }}</p>
        }

        @if (contexto() === 'aulas' && progreso() !== null) {
          <div class="h-1.5 overflow-hidden rounded-full bg-surface-100">
            <div class="h-full rounded-full bg-brand-500 transition-all duration-500" [style.width.%]="progreso()!"></div>
          </div>
        }

        <div class="mt-auto flex items-center justify-between border-t border-surface-100 pt-3">
          @if (contexto() === 'aulas') {
            <span class="text-sm font-extrabold" [class.text-gold-600]="estado() === 'pendiente_pago'" [class.text-brand-600]="estado() !== 'pendiente_pago'">
              {{ pieAula() }}
            </span>
          } @else {
            <span class="text-sm font-extrabold" [class.text-brand-600]="esGratis()" [class.text-marine-700]="!esGratis()">
              {{ esGratis() ? 'Acceso gratuito' : precio() }}
            </span>
          }
          <span class="inline-flex items-center gap-1 text-sm font-extrabold text-brand-600 transition-all group-hover:translate-x-0.5">
            {{ ctaTexto() }}
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </a>
  `,
})
export class CourseCardComponent {
  /** Curso a mostrar. */
  readonly curso = input.required<Curso>();
  /** Numero de unidades (opcional). */
  readonly numeroUnidades = input<number | null>(null);
  /** Contexto de uso: 'catalogo' (enlace al detalle) o 'aulas' (enlace al aula del estudiante). */
  readonly contexto = input<'catalogo' | 'aulas'>('catalogo');
  /** Estado de la matrícula del estudiante (solo contexto 'aulas'). */
  readonly estado = input<string | null>(null);
  /** Avance del curso 0-100 (solo contexto 'aulas'). */
  readonly progreso = input<number | null>(null);

  /** Destino del enlace según el contexto. */
  protected readonly enlace = computed<string[]>(() => {
    if (this.contexto() === 'aulas') {
      return this.estado() === 'pendiente_pago'
        ? ['/estudiante/pagos']
        : ['/estudiante/aula', this.curso().id];
    }
    return ['/cursos', this.curso().slug || this.curso().id];
  });

  /** Texto del CTA según el contexto. */
  protected readonly ctaTexto = computed(() => (this.contexto() === 'aulas'
    ? (this.estado() === 'pendiente_pago' ? 'Completar pago' : 'Ir al aula')
    : 'Ver curso'));

  /** Texto de la izquierda en contexto 'aulas'. */
  protected readonly pieAula = computed(() => {
    if (this.estado() === 'pendiente_pago') return 'Pendiente de pago';
    const p = this.progreso();
    return p !== null ? `${Math.round(p)}% completado` : 'En tu aula';
  });

  /** Portada oficial del curso. */
  protected readonly imagen = computed(() => imagenDeCurso(this.curso().slug, this.curso().portada_url));

  /** Duracion formateada. */
  protected readonly duracion = computed(() => {
    const minutos = this.curso().duracion_minutos;
    if (!minutos) {
      return '';
    }
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    if (horas === 0) {
      return `${resto} min`;
    }
    return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
  });

  /** Precio formateado. */
  protected readonly precio = computed(() => {
    const curso = this.curso();
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: curso.moneda || 'PEN',
      maximumFractionDigits: 0,
    }).format(curso.precio);
  });

  /** Indica si el curso es gratuito. */
  protected readonly esGratis = computed(() => this.curso().precio === 0);
}
