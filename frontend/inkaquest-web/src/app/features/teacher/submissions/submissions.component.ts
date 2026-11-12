import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { ActivityService } from '../../../core/services/activity.service';
import { Actividad, Curso, Entrega, Perfil, Tarea, DocenteCurso } from '../../../core/models/domain.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

type TabEntrega = 'pendientes' | 'calificadas' | 'todas';

/** Entrega con curso y estudiante ya resueltos para pintar. */
interface FilaEntrega {
  id: string;
  cursoId: string;
  curso: string;
  estudianteId: string;
  estudiante: string;
  actividadTitulo: string;
  enviadaEn: string | null;
  creadaEn: string;
  estado: Entrega['estado'];
  nota: number | null;
  notaMaxima: number;
  contenido: string | null;
}

/**
 * Bandeja de entregas del docente (adaptada del proyecto anterior).
 * Filtra por curso y por estado, y permite calificar inline.
 */
@Component({
  selector: 'app-teacher-submissions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header
        titulo="Entregas"
        descripcion="Revisa y califica las entregas de tus estudiantes, por curso y por estado."
        [acciones]="true"
      >
        <div acciones class="flex flex-wrap gap-2">
          <a routerLink="/docente/calificaciones" class="btn btn-outline btn-sm">Ver calificaciones</a>
          <a routerLink="/docente/tareas" class="btn btn-outline btn-sm">Ver tareas</a>
        </div>
      </app-page-header>

      @if (cargando()) {
        <p class="py-16 text-center text-sm font-medium text-marine-500">Cargando entregas…</p>
      } @else if (error()) {
        <div class="card card-body space-y-3">
          <p class="text-sm text-danger-600">{{ error() }}</p>
          <button type="button" class="btn btn-primary btn-sm w-fit" (click)="cargar()">Reintentar</button>
        </div>
      } @else {
        <!-- Selector de curso -->
        <div class="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Cursos asignados">
          <button
            type="button"
            class="shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all"
            [class.border-brand-500]="cursoId() === null"
            [class.bg-brand-500]="cursoId() === null"
            [class.text-white]="cursoId() === null"
            [class.border-surface-200]="cursoId() !== null"
            [class.bg-white]="cursoId() !== null"
            [class.text-marine-700]="cursoId() !== null"
            (click)="seleccionarCurso(null)"
          >Todos</button>
          @for (c of cursos(); track c.curso.id) {
            <button
              type="button"
              class="shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all"
              [class.border-brand-500]="cursoId() === c.curso.id"
              [class.bg-brand-500]="cursoId() === c.curso.id"
              [class.text-white]="cursoId() === c.curso.id"
              [class.border-surface-200]="cursoId() !== c.curso.id"
              [class.bg-white]="cursoId() !== c.curso.id"
              [class.text-marine-700]="cursoId() !== c.curso.id"
              (click)="seleccionarCurso(c.curso.id)"
            >{{ c.curso.titulo }}</button>
          }
        </div>

        <!-- Pestañas por estado -->
        <div class="flex flex-wrap gap-2 border-b border-surface-200 pb-3 text-sm font-bold">
          <button type="button" class="rounded-lg px-3 py-1.5" [class.bg-marine-800]="tab() === 'pendientes'" [class.text-white]="tab() === 'pendientes'" [class.text-marine-600]="tab() !== 'pendientes'" (click)="tab.set('pendientes')">Por calificar ({{ conteos().pendientes }})</button>
          <button type="button" class="rounded-lg px-3 py-1.5" [class.bg-marine-800]="tab() === 'calificadas'" [class.text-white]="tab() === 'calificadas'" [class.text-marine-600]="tab() !== 'calificadas'" (click)="tab.set('calificadas')">Calificadas ({{ conteos().calificadas }})</button>
          <button type="button" class="rounded-lg px-3 py-1.5" [class.bg-marine-800]="tab() === 'todas'" [class.text-white]="tab() === 'todas'" [class.text-marine-600]="tab() !== 'todas'" (click)="tab.set('todas')">Todas ({{ conteos().todas }})</button>
        </div>

        @if (msg()) {
          <p class="text-sm" [class.text-success-600]="ok()" [class.text-danger-600]="!ok()">{{ msg() }}</p>
        }

        <!-- Lista -->
        <div class="space-y-3">
          @for (f of filas(); track f.id) {
            <article class="card card-body">
              <div class="flex flex-wrap items-start gap-3">
                <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-sm font-extrabold text-brand-700">{{ iniciales(f.estudiante) }}</span>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="font-semibold text-marine-800">{{ f.estudiante }}</p>
                    <app-status-badge [estado]="f.estado" />
                  </div>
                  <p class="mt-0.5 text-xs text-marine-500">{{ f.curso }} · {{ f.actividadTitulo }}</p>
                  @if (f.contenido) {
                    <p class="mt-1 line-clamp-2 text-sm text-marine-600">{{ f.contenido }}</p>
                  }
                  @if (f.nota !== null) {
                    <p class="mt-1 text-xs font-semibold text-success-600">Calificada: {{ f.nota }} / {{ f.notaMaxima }}</p>
                  }
                  <p class="mt-1 text-[0.7rem] text-marine-400">Enviada: {{ formatearFecha(f.enviadaEn ?? f.creadaEn) }}</p>
                </div>

                <!-- Calificación inline -->
                @if (f.estado === 'enviado' || f.estado === 'en_revision') {
                  <form class="w-full sm:w-auto sm:min-w-64 space-y-2" (submit)="$event.preventDefault(); calificar(f)">
                    <div class="flex items-center gap-2">
                      <input type="number" min="0" [max]="f.notaMaxima" class="input w-24" [attr.aria-label]="'Nota de ' + f.estudiante" [value]="notas()[f.id] ?? ''" (input)="setNota(f.id, $event)" placeholder="0" />
                      <span class="text-xs font-bold text-marine-500">/ {{ f.notaMaxima }}</span>
                    </div>
                    <input type="text" class="input w-full" [value]="comentarios()[f.id] ?? ''" (input)="setComentario(f.id, $event)" placeholder="Comentario (opcional)" aria-label="Comentario" />
                    <button type="submit" class="btn btn-primary btn-sm w-full" [disabled]="notas()[f.id] === undefined || guardando() === f.id">{{ guardando() === f.id ? 'Guardando…' : 'Calificar' }}</button>
                  </form>
                }
              </div>
            </article>
          } @empty {
            <div class="card state-block">
              <svg class="size-12 text-success-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" /></svg>
              <p class="text-sm font-medium text-marine-600">No hay entregas en esta vista{{ cursoId() ? ' para este curso' : '' }}.</p>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class SubmissionsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly activityService = inject(ActivityService);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly cursos = signal<(DocenteCurso & { curso: Curso })[]>([]);
  protected readonly entregas = signal<(Entrega & { tarea: Tarea; actividad: Actividad })[]>([]);
  protected readonly estudiantes = signal<Perfil[]>([]);
  protected readonly cursoId = signal<string | null>(null);
  protected readonly tab = signal<TabEntrega>('pendientes');
  protected readonly notas = signal<Record<string, number>>({});
  protected readonly comentarios = signal<Record<string, string>>({});
  protected readonly msg = signal('');
  protected readonly ok = signal(false);

  protected readonly conteos = computed(() => {
    const filas = this.filasBase();
    return {
      pendientes: filas.filter((f) => f.estado === 'enviado' || f.estado === 'en_revision').length,
      calificadas: filas.filter((f) => f.estado === 'revisada').length,
      todas: filas.length,
    };
  });

  private readonly filasBase = computed<FilaEntrega[]>(() => {
    const estudiantesPorId = new Map(this.estudiantes().map((e) => [e.id, e]));
    const cursosPorId = new Map(this.cursos().map((c) => [c.curso_id, c.curso]));

    return this.entregas().map((entrega) => {
      const est = estudiantesPorId.get(entrega.estudiante_id);
      const nombre = est ? [est.nombre, est.apellido].filter(Boolean).join(' ').trim() || est.email : 'Estudiante';
      const cursoId = entrega.actividad.curso_id;
      return {
        id: entrega.id,
        cursoId,
        curso: cursosPorId.get(cursoId)?.titulo ?? '',
        estudianteId: entrega.estudiante_id,
        estudiante: nombre,
        actividadTitulo: entrega.actividad.titulo,
        enviadaEn: entrega.enviada_en,
        creadaEn: entrega.creado_en,
        estado: entrega.estado,
        nota: entrega.nota,
        notaMaxima: entrega.tarea.nota_maxima,
        contenido: entrega.contenido,
      };
    });
  });

  protected readonly filas = computed<FilaEntrega[]>(() => {
    const t = this.tab();
    const curso = this.cursoId();
    let filas = this.filasBase();
    if (curso) {
      filas = filas.filter((f) => f.cursoId === curso);
    }
    if (t === 'pendientes') {
      return filas.filter((f) => f.estado === 'enviado' || f.estado === 'en_revision');
    }
    if (t === 'calificadas') {
      return filas.filter((f) => f.estado === 'revisada');
    }
    return filas;
  });

  ngOnInit(): void {
    void this.cargar();
  }

  protected iniciales(nombre: string): string {
    return nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'E';
  }

  protected formatearFecha(fecha: string | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  protected seleccionarCurso(id: string | null): void {
    this.cursoId.set(id);
  }

  protected setNota(id: string, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const n = Number(raw);
    this.notas.update((m) => {
      const next = { ...m };
      if (raw === '' || Number.isNaN(n)) {
        delete next[id];
      } else {
        next[id] = Math.max(0, Math.min(n, 100));
      }
      return next;
    });
  }

  protected setComentario(id: string, event: Event): void {
    this.comentarios.update((m) => ({ ...m, [id]: (event.target as HTMLInputElement).value }));
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
      const [cursos, entregas, estudiantes] = await Promise.all([
        this.teacherService.listarMisCursos(user.id),
        this.teacherService.listarEntregasGestion(user.id),
        this.teacherService.listarEstudiantes(user.id).catch(() => [] as Perfil[]),
      ]);
      this.cursos.set(cursos);
      this.entregas.set(entregas);
      this.estudiantes.set(estudiantes);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las entregas.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async calificar(f: FilaEntrega): Promise<void> {
    const nota = this.notas()[f.id];
    if (nota === undefined) return;
    this.guardando.set(f.id);
    this.msg.set('');
    try {
      const comentario = this.comentarios()[f.id] ?? '';
      const resultado = await this.activityService.calificarEntrega(f.id, this.auth.usuario()!.id, nota, f.notaMaxima, comentario);
      this.msg.set(resultado.mensaje);
      this.ok.set(resultado.ok);
      if (resultado.ok) {
        this.notas.update((m) => { const n = { ...m }; delete n[f.id]; return n; });
        this.comentarios.update((m) => { const n = { ...m }; delete n[f.id]; return n; });
        await this.cargar();
        this.tab.set('calificadas');
      }
    } finally {
      this.guardando.set(null);
    }
  }
}
