// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ActivityService } from '../../../core/services/activity.service';
import { CourseService } from '../../../core/services/course.service';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

interface CalItem {
  id: string;
  titulo: string;
  curso: string;
  tipo: 'Tarea' | 'Evaluación' | 'Examen';
  estado: string;
  fecha: string | null;
  fechaISO: string | null;
  fechaTexto: string;
  enlace: string[];
}

interface DiaEvento { titulo: string; curso: string; tipo: string; }

interface CeldaDia {
  dia: number | null;
  fechaISO: string | null;
  esHoy: boolean;
  eventos: DiaEvento[];
}

/** Calendario del estudiante: vista mensual de sus actividades pendientes. */
@Component({
  selector: 'app-student-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header
        titulo="Calendario"
        descripcion="Tareas y evaluaciones que tienes pendientes, con sus fechas límite."
        [acciones]="true"
      >
        <div acciones class="flex flex-wrap gap-2">
          <a routerLink="/estudiante/tareas" class="btn btn-outline btn-sm">Ver tareas</a>
          <a routerLink="/estudiante/evaluaciones" class="btn btn-outline btn-sm">Evaluaciones</a>
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
          <span class="inline-flex items-center gap-1.5"><span class="size-3 rounded-full bg-danger-500"></span> Vencida</span>
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
                  @for (e of c.eventos.slice(0, 2); track e.titulo + e.curso) {
                    <span class="mt-1 block truncate rounded-md px-1 py-0.5 text-[0.62rem] font-semibold leading-tight"
                      [class.bg-danger-50]="esVencida(c.fechaISO)" [class.text-danger-600]="esVencida(c.fechaISO)"
                      [class.bg-gold-50]="esHoy(c.fechaISO)" [class.text-gold-700]="esHoy(c.fechaISO)"
                      [class.bg-surface-100]="!esVencida(c.fechaISO) && !esHoy(c.fechaISO)" [class.text-marine-600]="!esVencida(c.fechaISO) && !esHoy(c.fechaISO)"
                      [title]="e.titulo + ' · ' + e.curso + ' · ' + e.tipo"
                    >{{ e.titulo }}</span>
                  }
                  @if (c.eventos.length > 2) {
                    <span class="mt-0.5 block text-[0.62rem] font-bold text-marine-400">+{{ c.eventos.length - 2 }} más</span>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Próximas fechas -->
          <div class="card card-body lg:col-span-5">
            <h3 class="text-sm font-bold uppercase tracking-[0.14em] text-marine-400">Próximas fechas</h3>
            @if (proximas().length === 0) {
              <p class="mt-3 text-sm text-marine-500">No tienes fechas límite próximas.</p>
            } @else {
              <ul class="mt-3 space-y-2 text-sm">
                @for (e of proximas(); track e.fechaISO + e.id) {
                  <li class="rounded-xl border border-surface-200 p-3">
                    <p class="font-semibold text-marine-800">{{ e.titulo }}</p>
                    <p class="mt-0.5 text-xs text-marine-500">{{ e.curso }} · {{ e.tipo }} · {{ e.fechaTexto }}</p>
                  </li>
                }
              </ul>
            }

            <div class="mt-4 border-t border-surface-200 pt-4">
              <h3 class="text-sm font-bold uppercase tracking-[0.14em] text-marine-400">Disponibles sin fecha</h3>
              <ul class="mt-2 space-y-2 text-sm">
                @for (t of sinFecha(); track t.id) {
                  <li class="rounded-xl border border-dashed border-surface-300 p-3 text-marine-600">
                    {{ t.titulo }} <span class="block text-xs text-marine-400">{{ t.curso }} · {{ t.tipo }}</span>
                  </li>
                } @empty {
                  <li class="text-xs text-marine-400">Ninguna: todas tus actividades tienen fecha.</li>
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
  private readonly courseService = inject(CourseService);
  private readonly activityService = inject(ActivityService);
  private readonly evaluationService = inject(EvaluationService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly items = signal<CalItem[]>([]);
  protected readonly mesOffset = signal(0);

  protected readonly ahora = new Date();

  protected readonly tituloMes = computed(() => {
    const d = new Date(this.ahora.getFullYear(), this.ahora.getMonth() + this.mesOffset(), 1);
    return new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(d);
  });

  private readonly eventosPorFecha = computed(() => {
    const map = new Map<string, DiaEvento[]>();
    for (const i of this.items()) {
      if (!i.fechaISO) continue;
      const lista = map.get(i.fechaISO) ?? [];
      lista.push({ titulo: i.titulo, curso: i.curso, tipo: i.tipo });
      map.set(i.fechaISO, lista);
    }
    return map;
  });

  protected readonly celdas = computed<CeldaDia[]>(() => {
    const base = new Date(this.ahora.getFullYear(), this.ahora.getMonth() + this.mesOffset(), 1);
    const año = base.getFullYear();
    const mes = base.getMonth();
    const primer = new Date(año, mes, 1);
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
    return this.items()
      .filter((i) => !!i.fechaISO && i.fechaISO >= hoy)
      .sort((a, b) => (a.fechaISO ?? '').localeCompare(b.fechaISO ?? ''))
      .slice(0, 6)
      .map((i) => ({ id: i.id, titulo: i.titulo, curso: i.curso, tipo: i.tipo, fechaISO: i.fechaISO!, fechaTexto: i.fechaTexto }));
  });

  protected readonly sinFecha = computed(() =>
    this.items().filter((i) => !i.fechaISO).map((i) => ({ id: i.id, titulo: i.titulo, curso: i.curso, tipo: i.tipo })),
  );

  ngOnInit(): void { void this.cargar(); }

  protected mesAnterior(): void { this.mesOffset.update((v) => v - 1); }
  protected mesSiguiente(): void { this.mesOffset.update((v) => v + 1); }

  protected esHoy(iso: string | null): boolean { return iso === this.toISODate(new Date()); }
  protected esVencida(iso: string | null): boolean { return !!iso && iso < this.toISODate(new Date()); }

  private toISODate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private fechaTexto(fecha: string): string {
    return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(fecha));
  }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true);
    this.error.set(null);
    const ahora = Date.now();
    try {
      const cursos = await this.courseService.listarCursosDeEstudiante(user.id);
      const items: CalItem[] = [];
      await Promise.all(cursos.map(async (c) => {
        const [tareas, evaluaciones] = await Promise.all([
          this.activityService.listarTareasCurso(c.id, user.id).catch(() => []),
          this.evaluationService.listarEvaluacionesCurso(c.id).catch(() => []),
        ]);

        for (const t of tareas) {
          const estado = t.entrega?.estado;
          if (estado && ['enviado', 'en_revision', 'revisada'].includes(estado)) continue;
          if (t.fecha_entrega && new Date(t.fecha_entrega).getTime() < ahora) continue;
          items.push({
            id: t.id,
            titulo: t.actividad.titulo,
            curso: c.titulo,
            tipo: 'Tarea',
            estado: estado === 'devuelta' ? 'devuelta' : 'pendiente',
            fecha: t.fecha_entrega ?? null,
            fechaISO: t.fecha_entrega ? this.toISODate(new Date(t.fecha_entrega)) : null,
            fechaTexto: t.fecha_entrega ? this.fechaTexto(t.fecha_entrega) : '',
            enlace: ['/estudiante/tareas'],
          });
        }

        for (const e of evaluaciones) {
          const limite = e.fecha_limite_acceso ? new Date(e.fecha_limite_acceso).getTime() : null;
          if (limite !== null && limite < ahora) continue;
          const intentos = await this.evaluationService.listarIntentos(e.id, user.id).catch(() => []);
          if (intentos.some((i) => i.estado === 'entregado' || i.estado === 'expirado')) continue;
          const permitidos = Math.max(1, Number(e.intentos_permitidos ?? 1));
          if (intentos.length >= permitidos) continue;
          const fecha = e.fecha_limite_acceso ?? e.fecha_inicio ?? null;
          items.push({
            id: e.id,
            titulo: e.actividad.titulo,
            curso: c.titulo,
            tipo: e.actividad.tipo === 'examen' ? 'Examen' : 'Evaluación',
            estado: intentos.length ? 'en_curso' : 'pendiente',
            fecha,
            fechaISO: fecha ? this.toISODate(new Date(fecha)) : null,
            fechaTexto: fecha ? this.fechaTexto(fecha) : '',
            enlace: ['/estudiante/evaluaciones'],
          });
        }
      }));
      this.items.set(items);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el calendario.');
    } finally {
      this.cargando.set(false);
    }
  }
}
