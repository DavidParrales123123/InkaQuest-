// @ts-nocheck
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { CourseService } from '../../../core/services/course.service';
import { Curso } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';

/** Rango de precio en soles (PEN) usado para agrupar los cursos del catalogo. */
interface RangoPrecio {
  /** Identificador estable del rango. */
  id: string;
  /** Nombre comercial del nivel de acceso. */
  nombre: string;
  /** Descripcion del nivel de acceso. */
  descripcion: string;
  /** Etiqueta legible del rango (ejemplo: "1 - 99 PEN"). */
  etiqueta: string;
  /** Precio minimo del rango (PEN). */
  minimo: number;
  /** Precio maximo del rango (PEN); null si no tiene tope. */
  maximo: number | null;
}

/**
 * Pagina de planes y precios.
 *
 * <p>Los precios <b>no son inventados</b>: se leen de la tabla
 * {@code curso} a traves de {@link CourseService.listarPublicos()} y se
 * agrupan en rangos. El precio final de cada curso lo valida el backend
 * cuando se crea el pedido, por eso la pagina lo indica de forma expresa.</p>
 */
@Component({
  selector: 'app-pricing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DataPanelComponent],
  template: `
    <section class="relative overflow-hidden bg-marine-gradient text-white">
      <div class="absolute inset-0 bg-andino-pattern opacity-70" aria-hidden="true"></div>
      <div class="container-app relative py-12 md:py-16">
        <p class="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-[0.18em] text-gold-300 uppercase ring-1 ring-white/15">Planes y precios</p>
        <h1 class="mt-4 max-w-3xl text-white">Precios basados en el catálogo real</h1>
        <p class="mt-4 max-w-2xl text-lg leading-relaxed text-marine-100">
          Cada curso publicado define su precio en la base de datos. Aquí los agrupamos por niveles de acceso para que compares con claridad.
        </p>
      </div>
    </section>

    <section class="container-app py-10 md:py-12">
      <div class="card border-l-4 border-l-info-500 bg-info-50/70 p-5">
        <div class="flex items-start gap-3">
          <svg class="mt-0.5 size-5 shrink-0 text-info-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" stroke-linecap="round" /></svg>
          <div>
            <p class="text-sm font-extrabold text-marine-700">El precio final lo valida el backend</p>
            <p class="mt-1 text-sm leading-relaxed text-marine-600">
              Los importes mostrados provienen del catálogo publicado. El backend crea el pedido y calcula/valida el total a pagar; los pagos se procesan mediante proveedor externo desde backend. Esta vista no autoriza cobros.
            </p>
          </div>
        </div>
      </div>

      @if (!cargando() && cursos().length > 0) {
        <dl class="mt-8 grid gap-4 sm:grid-cols-3">
          <div class="card card-body"><dt class="text-xs font-extrabold tracking-wide text-marine-400 uppercase">Cursos publicados</dt><dd class="mt-1 text-3xl font-extrabold text-marine-700">{{ cursos().length }}</dd></div>
          <div class="card card-body"><dt class="text-xs font-extrabold tracking-wide text-marine-400 uppercase">Cursos gratuitos</dt><dd class="mt-1 text-3xl font-extrabold text-brand-600">{{ gratuitos() }}</dd></div>
          <div class="card card-body"><dt class="text-xs font-extrabold tracking-wide text-marine-400 uppercase">Precio más alto</dt><dd class="mt-1 text-3xl font-extrabold text-gold-600">{{ precioMaximo() }}</dd></div>
        </dl>
      }

      <div class="mt-10">
        <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="cursos().length === 0" tituloVacio="Todavía no hay cursos con precio publicado" descripcionVacia="Cuando existan cursos publicados en la base de datos, sus niveles de acceso aparecerán aquí automáticamente." [reintentable]="true" (alReintentar)="reintentar()">
          <div contenido class="space-y-8">
            @for (grupo of grupos(); track grupo.rango.id) {
              <section class="card overflow-hidden">
                <header class="flex flex-wrap items-center justify-between gap-3 border-b border-surface-200 bg-gradient-to-r from-surface-50 to-white px-6 py-4">
                  <div>
                    <h2 class="text-lg font-extrabold text-marine-700">{{ grupo.rango.nombre }}</h2>
                    <p class="mt-0.5 text-sm text-marine-500">{{ grupo.rango.descripcion }}</p>
                  </div>
                  <span class="badge badge-brand">{{ grupo.rango.etiqueta }}</span>
                </header>
                @if (grupo.cursos.length === 0) {
                  <p class="px-6 py-6 text-sm text-marine-400">Todavía no hay cursos publicados en este rango de precio.</p>
                } @else {
                  <ul class="divide-y divide-surface-100">
                    @for (curso of grupo.cursos; track curso.id) {
                      <li class="flex flex-wrap items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-surface-50/70">
                        <div class="min-w-0 flex-1">
                          <a [routerLink]="['/cursos', curso.slug]" class="font-extrabold text-marine-700 transition-colors hover:text-brand-600">{{ curso.titulo }}</a>
                          @if (curso.descripcion) { <p class="mt-1 line-clamp-2 text-sm text-marine-500">{{ curso.descripcion }}</p> }
                        </div>
                        <div class="flex items-center gap-4">
                          <span class="badge badge-gold">{{ curso.xp_total }} XP</span>
                          <span class="text-lg font-extrabold" [class.text-brand-600]="curso.precio === 0" [class.text-marine-700]="curso.precio !== 0">{{ precio(curso) }}</span>
                        </div>
                      </li>
                    }
                  </ul>
                }
              </section>
            }
          </div>
        </app-data-panel>
      </div>

      <div class="card mt-10 p-6">
        <h2 class="text-lg font-extrabold">Sobre los pagos</h2>
        <ul class="mt-3 space-y-2 text-sm leading-relaxed text-marine-600">
          <li>Los cursos gratuitos se activan al matricularte, sin trámite de pago.</li>
          <li>Para cursos de pago, el backend genera el pedido y el cobro se realiza mediante proveedor externo. InkaQuest no almacena datos sensibles de tarjeta.</li>
          <li>Las devoluciones siguen la <a routerLink="/pagos" class="link">política de pagos y reembolsos</a>.</li>
        </ul>
      </div>
    </section>
  `,
})
export class PricingComponent implements OnInit {
  private readonly courseService = inject(CourseService);

  /** Cursos publicados con su precio real. */
  protected readonly cursos = signal<Curso[]>([]);
  /** Estado de carga. */
  protected readonly cargando = signal(true);
  /** Mensaje de error de la carga. */
  protected readonly error = signal<string | null>(null);

  /**
   * Rangos de precio en PEN. El ultimo rango no tiene tope superior.
   */
  protected readonly rangos: readonly RangoPrecio[] = [
    {
      id: 'gratuito',
      nombre: 'Acceso gratuito',
      descripcion:
        'Cursos que puedes tomar sin costo. Ideal para empezar y conocer la plataforma.',
      etiqueta: '0 PEN',
      minimo: 0,
      maximo: 0,
    },
    {
      id: 'inicial',
      nombre: 'Nivel inicial',
      descripcion:
        'Cursos de especialización en un área concreta, con retos y evaluación final.',
      etiqueta: '1 – 99 PEN',
      minimo: 1,
      maximo: 99,
    },
    {
      id: 'intermedio',
      nombre: 'Nivel intermedio',
      descripcion:
        'Programas más extensos, con mayor carga de práctica y proyecto final.',
      etiqueta: '100 – 249 PEN',
      minimo: 100,
      maximo: 249,
    },
    {
      id: 'avanzado',
      nombre: 'Nivel avanzado',
      descripcion:
        'Cursos completos de grado, con el mayor número de horas y créditos XP.',
      etiqueta: 'Desde 250 PEN',
      minimo: 250,
      maximo: null,
    },
  ];

  /** Cursos agrupados por rango de precio, en el orden de los rangos. */
  protected readonly grupos = computed(() =>
    this.rangos.map((rango) => ({
      rango,
      cursos: this.cursos()
        .filter((curso) => this.enRango(curso.precio, rango))
        .sort((a, b) => a.precio - b.precio),
    })),
  );

  /** Cantidad de cursos gratuitos del catalogo. */
  protected readonly gratuitos = computed(
    () => this.cursos().filter((curso) => curso.precio === 0).length,
  );

  /** Precio mas alto del catalogo, formateado. */
  protected readonly precioMaximo = computed(() => {
    const precios = this.cursos().map((curso) => curso.precio);
    if (precios.length === 0) {
      return '-';
    }
    return this.formatear(Math.max(...precios), 'PEN');
  });

  ngOnInit(): void {
    void this.cargar();
  }

  /** Vuelve a consultar el catalogo publicado. */
  protected reintentar(): void {
    void this.cargar();
  }

  /** Carga los cursos publicados con su precio. */
  private async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const cursos = await this.courseService.listarPublicos({ limite: 60 });
      this.cursos.set(cursos);
    } catch (e) {
      this.cursos.set([]);
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el catálogo.');
    } finally {
      this.cargando.set(false);
    }
  }

  /** Indica si un precio cae dentro del rango. */
  private enRango(precio: number, rango: RangoPrecio): boolean {
    if (rango.maximo === null) {
      return precio >= rango.minimo;
    }
    return precio >= rango.minimo && precio <= rango.maximo;
  }

  /** Formatea un importe con la moneda del curso. */
  protected precio(curso: Curso): string {
    if (curso.precio === 0) {
      return 'Gratuito';
    }
    return this.formatear(curso.precio, curso.moneda || 'PEN');
  }

  /** Formatea un importe en la moneda indicada. */
  private formatear(monto: number, moneda: string): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: moneda,
      maximumFractionDigits: 0,
    }).format(monto);
  }
}
