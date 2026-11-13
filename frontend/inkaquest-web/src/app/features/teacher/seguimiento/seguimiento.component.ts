// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { Curso, Matricula, Perfil, ProgresoCurso } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-teacher-seguimiento',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent, StatCardComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Seguimiento de estudiantes" descripcion="Avance y estado de tus estudiantes matriculados en tus cursos. Progreso visual por matrícula." [acciones]="true">
        <div acciones><button class="btn btn-outline btn-sm" type="button" (click)="cargar()" [disabled]="cargando()">Actualizar</button></div>
      </app-page-header>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="filas().length === 0" tituloVacio="Sin datos de seguimiento" descripcionVacia="No hay matrículas/progreso visibles para tus cursos o las políticas de acceso no permiten verlos." (alReintentar)="cargar()">
        <div contenido class="space-y-5">
          <!-- ════ Stats global ════ -->
          <div class="grid gap-3 sm:grid-cols-3">
            <app-stat-card etiqueta="Matriculados" [valor]="filas().length" tono="brand" [icono]="true">
              <span icono><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
            </app-stat-card>
            <app-stat-card etiqueta="Avance medio" [valor]="avanceMedio() + '%'" tono="info" [icono]="true">
              <span icono><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-6 6"/></svg></span>
            </app-stat-card>
            <app-stat-card etiqueta="Lecciones completadas" [valor]="totalLecciones()" tono="gold" [icono]="true">
              <span icono><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>
            </app-stat-card>
          </div>

          <!-- ════ Filtro por curso ════ -->
          <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-surface-200 bg-surface-50 p-3">
            <div class="flex flex-wrap items-center gap-2">
              <label class="text-sm font-semibold text-marine-700" for="seg-filter">Filtrar por curso</label>
              <select id="seg-filter" class="select w-auto" [value]="filtroCurso()" (change)="filtroCurso.set($any($event.target).value)">
                <option value="">Todos los cursos ({{ filas().length }})</option>
                @for (curso of cursos(); track curso.id) { <option [value]="curso.id">{{ curso.titulo }}</option> }
              </select>
              @if (filtroCurso()) { <button type="button" class="btn btn-outline btn-sm" (click)="filtroCurso.set('')">Limpiar</button> }
            </div>
            <p class="text-xs font-medium text-marine-500">{{ filtrados().length }} estudiante(s) mostrando</p>
          </div>

          @for (curso of cursosFiltrados(); track curso.id) {
            <div class="card card-body">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h2 class="font-semibold text-marine-800">{{ curso.titulo }}</h2>
                <a [routerLink]="['/docente/cursos', curso.id]" class="btn btn-outline btn-sm">Ver curso</a>
              </div>
              @if (filasCurso(curso.id).length === 0) {
                <p class="mt-2 text-sm text-marine-500">Sin matrículas/progreso visibles en este curso.</p>
              } @else {
                <div class="mt-3 table-wrap rounded-xl border border-surface-200 overflow-hidden">
                  <table class="table">
                    <thead><tr><th>Estudiante</th><th>Estado</th><th>Progreso</th><th>Lecciones</th><th>Última actividad</th></tr></thead>
                    <tbody>
                      @for (f of filasCurso(curso.id); track f.matricula.id) {
                        <tr>
                          <td>
                            <div class="flex items-center gap-2">
                              <span class="flex size-8 items-center justify-center rounded-full bg-brand-100 text-[0.7rem] font-extrabold text-brand-800">{{ iniciales(f.nombre) }}</span>
                              <span class="text-sm font-medium text-marine-800">{{ f.nombre }}</span>
                            </div>
                          </td>
                          <td><app-status-badge [estado]="f.matricula.estado" /></td>
                          <td>
                            <div class="flex items-center gap-2">
                              <div class="h-2.5 w-28 overflow-hidden rounded-full bg-surface-100">
                                <div class="h-full rounded-full transition-all" [class]="(f.progreso?.porcentaje ?? 0) >= 70 ? 'bg-success-500' : (f.progreso?.porcentaje ?? 0) >= 30 ? 'bg-brand-500' : 'bg-warning-500'" [style.width.%]="progresoDe(f)"></div>
                              </div>
                              <span class="text-sm font-semibold text-marine-800">{{ progresoDe(f) }}%</span>
                            </div>
                          </td>
                          <td class="text-sm">{{ f.progreso?.lecciones_completadas ?? 0 }}</td>
                          <td class="text-xs text-marine-500">{{ formatearFecha(f.progreso?.ultima_actividad_en || f.progreso?.actualizado_en) }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }
          <p class="text-xs text-marine-500">La visibilidad depende de RLS (docente asignado al curso). Métricas avanzadas y reportes detallados pueden requerir agregaciones/backend.</p>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class SeguimientoComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly supabase = inject(SupabaseService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly cursos = signal<Curso[]>([]);
  protected readonly filas = signal<{ cursoId: string; matricula: Matricula; progreso: ProgresoCurso | null; nombre: string }[]>([]);
  protected readonly filtroCurso = signal<string>('');

  protected readonly filtrados = computed(() => {
    const filtro = this.filtroCurso();
    const all = this.filas();
    return filtro ? all.filter((f) => f.cursoId === filtro) : all;
  });

  protected readonly cursosFiltrados = computed(() => {
    const filtro = this.filtroCurso();
    const all = this.cursos();
    return filtro ? all.filter((c) => c.id === filtro) : all;
  });

  protected readonly avanceMedio = computed(() => {
    const f = this.filtrados();
    if (!f.length) return 0;
    return Math.round(f.reduce((acc, x) => acc + this.progresoDe(x), 0) / f.length);
  });

  protected readonly totalLecciones = computed(() => this.filtrados().reduce((acc, f) => acc + (f.progreso?.lecciones_completadas ?? 0), 0));

  ngOnInit(): void { void this.cargar(); }

  protected filasCurso(cursoId: string) {
    return this.filtrados().filter((f) => f.cursoId === cursoId);
  }

  protected progresoDe(f: { progreso: ProgresoCurso | null; matricula: Matricula }): number {
    const v = f.progreso?.porcentaje ?? f.matricula?.porcentaje_progreso ?? 0;
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
  }

  protected iniciales(nombre: string): string {
    return (nombre || '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || 'E';
  }

  protected formatearFecha(fecha?: string | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      const cursos = await this.teacherService.listarMisCursos(user.id);
      const listaCursos = cursos.map((c) => c.curso);
      this.cursos.set(listaCursos);
      const filas: { cursoId: string; matricula: Matricula; progreso: ProgresoCurso | null; nombre: string }[] = [];
      for (const curso of listaCursos) {
        const { data: mats } = await this.supabase.client.from(this.supabase.tabla.matricula).select('*').eq('curso_id', curso.id).in('estado', ['activa']);
        const matriculas = (mats ?? []) as Matricula[];
        const estIds = [...new Set(matriculas.map((m) => m.estudiante_id))];
        let perfiles: Perfil[] = [];
        if (estIds.length) {
          // Excluir admins: no aparecen en apartados del docente ni del estudiante.
          const { data: ps } = await this.supabase.client.from(this.supabase.tabla.perfil).select('id,nombre,apellido,email,rol').in('id', estIds);
          perfiles = ((ps ?? []) as Perfil[]).filter((p) => p.rol !== 'administrador');
        }
        const pMap = new Map(perfiles.map((p) => [p.id, [p.nombre, p.apellido].filter(Boolean).join(' ') || p.email || p.id.slice(0, 8)]));
        const visibles = perfiles.length ? matriculas.filter((m) => pMap.has(m.estudiante_id)) : [];
        const { data: progs } = await this.supabase.client.from(this.supabase.tabla.progresoCurso).select('*').eq('curso_id', curso.id);
        const progMap = new Map(((progs ?? []) as ProgresoCurso[]).map((p) => [p.estudiante_id, p]));
        for (const m of visibles) {
          filas.push({ cursoId: curso.id, matricula: m, progreso: progMap.get(m.estudiante_id) ?? null, nombre: pMap.get(m.estudiante_id) ?? m.estudiante_id.slice(0, 8) + '…' });
        }
      }
      this.filas.set(filas);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el seguimiento.'); }
    finally { this.cargando.set(false); }
  }
}
