// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { Actividad, Curso, Tarea } from '../../../core/models/domain.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

/** Un día con entregas pendientes. */
interface DiaEvento {
  actividadTitulo: string;
  cursoTitulo: string;
  notaMaxima: number;
  estado: string;
}

interface CeldaDia {
  dia: number | null;
  fechaISO: string | null;
  esHoy: boolean;
  eventos: DiaEvento[];
}

/**
 * Calendario del docente.
 *
 * <p>Vista mensual con las fechas límite reales de las tareas de tus cursos
 * (tabla {@code tarea}), resaltando hoy y permitiendo navegar con los cursos
 * para ver eventos próximos.</p>
 */
@Component({
  selector: 'app-teacher-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header
        titulo="Calendario"
        descripcion="Fechas límite reales de las tareas de tus cursos."
        [acciones]="true"
      >
        <div acciones class="flex flex-wrap gap-2">
          <a routerLink="/docente/tareas" class="btn btn-outline btn-sm">Ver tareas</a>
          <a routerLink="/docente/entregas" class="btn btn-outline btn-sm">Ir a entregas</a>
        </div>
      </app-page-header>

      @if (cargando()) {
        <p class="py-16 text-center text-sm font-medium text-marine-500">Cargando calendario…</p>
      } @else if (error()) {
        <div class="card card-body space-y-3">
          <p class="text-sm text-danger-600">{{ error() }}</p>
          <button type="button" class="btn btn-primary btn-sm w-fit" (click)="cargar()">Reintentar</button>
        </div>
      } @else {
        <!-- Selector de mes -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <button type="button" class="btn btn-outline btn-sm" (click)="mesAnterior()" aria-label="Mes anterior"><svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>
          <h2 class="text-xl font-extrabold capitalize text-marine-800">{{ tituloMes() }}</h2>
          <button type="button" class="btn btn-outline btn-sm" (click)="mesSiguiente()" aria-label="Mes siguiente"><svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg></button>
        </div>

        <!-- Leyenda -->
        <div class="flex flex-wrap gap-2 text-xs text-marine-500">
          <span class="inline-flex items-center gap-1.5"><span class="size-3 rounded-full bg-danger-500"></span> Entrega vencida</span>
          <span class="inline-flex items-center gap-1.5"><span class="size-3 rounded-full bg-gold-500"></span> Vence hoy / hoy</span>
          <span class="inline-flex items-center gap-1.5"><span class="size-3 rounded-full bg-surface-100"></span> Próxima entrega</span>
        </div>

        <div class="grid gap-6 lg:grid-cols-12">
          <!-- Rejilla del mes -->
          <div class="card card-body p-3 lg:col-span-7">
            <div class="grid grid-cols-7 gap-1 text-center text-[0.68rem] font-bold uppercase tracking-wider text-marine-400">
              @for (d of [].constructor(7); track $index) {
                <span>{{ ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][$index] }}</span>
              }
            </div>
            <div class="mt-1 grid grid-cols-7 gap-1">
              @for (c of celdas(); track $index) {
                <div
                  class="min-h-20 rounded-xl border p-1.5 text-left text-[0.72rem]"
                  [class.border-surface-100]="!c.esHoy && c.eventos.length === 0"
                  [class.border-gold-400]="c.esHoy"
                  [class.bg-surface-50]="c.esHoy"
                  [class.bg-white]="!c.esHoy"
                  [class.opacity-40]="!c.dia"
                >
                  <span class="block text-right text-xs font-extrabold text-marine-800">{{ c.dia }}</span>
                  @for (e of c.eventos.slice(0, 2); track e.actividadTitulo + e.cursoTitulo) {
                    <span class="mt-1 block truncate rounded-md px-1 py-0.5 text-[0.62rem] font-semibold leading-tight"
                      [class.bg-danger-50]="esVencida(c.fechaISO)" [class.text-danger-600]="esVencida(c.fechaISO)"
                      [class.bg-gold-50]="esHoy(c.fechaISO)" [class.text-gold-700]="esHoy(c.fechaISO)"
                      [class.bg-surface-100]="!esVencida(c.fechaISO) && !esHoy(c.fechaISO)" [class.text-marine-600]="!esVencida(c.fechaISO) && !esHoy(c.fechaISO)"
                      [title]="e.actividadTitulo + ' · ' + e.cursoTitulo"
                    >{{ e.actividadTitulo }}</span>
                  }
                  @if (c.eventos.length > 2) {
                    <span class="mt-0.5 block text-[0.62rem] font-bold text-marine-400">+{{ c.eventos.length - 2 }} más</span>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Próximos eventos -->
          <div class="card card-body lg:col-span-5">
            <h3 class="text-sm font-bold uppercase tracking-[0.14em] text-marine-400">Próximas fechas</h3>
            @if (proximas().length === 0) {
              <p class="mt-3 text-sm text-marine-500">No hay fechas límite próximas.</p>
            } @else {
              <ul class="mt-3 space-y-2 text-sm">
                @for (e of proximas(); track e.fechaISO + e.titulo) {
                  <li class="rounded-xl border border-surface-200 p-3">
                    <p class="font-semibold text-marine-800">{{ e.titulo }}</p>
                    <p class="mt-0.5 text-xs text-marine-500">{{ e.curso }} · {{ e.fechaTexto }}</p>
                  </li>
                }
              </ul>
            }

            <div class="mt-4 border-t border-surface-200 pt-4">
              <h3 class="text-sm font-bold uppercase tracking-[0.14em] text-marine-400">Tareas sin fecha</h3>
              <ul class="mt-2 space-y-2 text-sm">
                @for (t of tareasSinFecha(); track t.id) {
                  <li class="rounded-xl border border-dashed border-surface-300 p-3 text-marine-600">
                    {{ t.titulo }} <span class="block text-xs text-marine-400">{{ t.curso }}</span>
                  </li>
                } @empty {
                  <li class="text-xs text-marine-400">Ninguna: todas tus tareas tienen fecha.</li>
                }
              </ul>
            </div>
          </div>
        </div>
      }
    </section>
  `,
})
export class CalendarComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly tareas = signal<(Tarea & { actividad: Actividad; curso: Curso })[]>([]);
  protected readonly mesOffset = signal(0); // meses hacia el presente

  protected readonly ahora = new Date();

  protected readonly tituloMes = computed(() => {
    const d = new Date(this.ahora.getFullYear(), this.ahora.getMonth() + this.mesOffset(), 1);
    return new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(d);
  });

  /** Mapa fechaISO → eventos. */
  private readonly eventosPorFecha = computed(() => {
    const map = new Map<string, DiaEvento[]>();
    for (const t of this.tareas()) {
      const iso = t.fecha_entrega ? this.toISODate(new Date(t.fecha_entrega)) : null;
      if (!iso) continue;
      const lista = map.get(iso) ?? [];
      lista.push({ actividadTitulo: t.actividad.titulo, cursoTitulo: t.curso.titulo, notaMaxima: t.nota_maxima, estado: 'pendiente' });
      map.set(iso, lista);
    }
    return map;
  });

  protected readonly celdas = computed<CeldaDia[]>(() => {
    const base = new Date(this.ahora.getFullYear(), this.ahora.getMonth() + this.mesOffset(), 1);
    const año = base.getFullYear();
    const mes = base.getMonth();
    const primer = new Date(año, mes, 1);
    // Lunes=1 … Domingo=0 → índice de columna (lunes primero).
    const colInicio = (primer.getDay() + 6) % 7;
    const diasEnMes = new Date(año, mes + 1, 0).getDate();

    const celdas: CeldaDia[] = [];
    for (let i = 0; i < colInicio; i++) {
      celdas.push({ dia: null, fechaISO: null, esHoy: false, eventos: [] });
    }
    const hoyISO = this.toISODate(new Date());
    for (let d = 1; d <= diasEnMes; d++) {
      const fecha = new Date(año, mes, d);
      const iso = this.toISODate(fecha);
      celdas.push({
        dia: d,
        fechaISO: iso,
        esHoy: iso === hoyISO,
        eventos: this.eventosPorFecha().get(iso) ?? [],
      });
    }
    return celdas;
  });

  protected readonly proximas = computed(() => {
    const hoy = this.toISODate(new Date());
    const fechas: { fechaISO: string; titulo: string; curso: string; fechaTexto: string }[] = [];
    for (const t of this.tareas()) {
      if (!t.fecha_entrega) continue;
      const iso = this.toISODate(new Date(t.fecha_entrega));
      if (iso < hoy) continue;
      fechas.push({
        fechaISO: iso,
        titulo: t.actividad.titulo,
        curso: t.curso.titulo,
        fechaTexto: new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(t.fecha_entrega)),
      });
    }
    return fechas.sort((a, b) => a.fechaISO.localeCompare(b.fechaISO)).slice(0, 6);
  });

  protected readonly tareasSinFecha = computed(() =>
    this.tareas()
      .filter((t) => !t.fecha_entrega)
      .map((t) => ({ id: t.id, titulo: t.actividad.titulo, curso: t.curso.titulo })),
  );

  ngOnInit(): void {
    void this.cargar();
  }

  protected mesAnterior(): void {
    this.mesOffset.update((v) => v - 1);
  }

  protected mesSiguiente(): void {
    this.mesOffset.update((v) => v + 1);
  }

  protected esHoy(iso: string | null): boolean {
    return iso === this.toISODate(new Date());
  }

  protected esVencida(iso: string | null): boolean {
    return !!iso && iso < this.toISODate(new Date());
  }

  private toISODate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) {
      this.error.set('Debes iniciar sesión.');
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.tareas.set(await this.teacherService.listarTareasDeMisCursos(user.id));
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las fechas.');
    } finally {
      this.cargando.set(false);
    }
  }
}
