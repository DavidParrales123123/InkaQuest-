// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { Curso, Perfil } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-teacher-students',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Estudiantes" descripcion="Distribución y consulta de estudiantes matriculados en tus cursos. Filtra por curso o mira el total global." [acciones]="true">
        <div acciones><button class="btn btn-outline btn-sm" type="button" (click)="cargar()" [disabled]="cargando()">Actualizar</button></div>
      </app-page-header>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="estudiantes().length === 0" tituloVacio="Sin estudiantes visibles" descripcionVacia="No se encontraron estudiantes o la política de acceso no permite listar perfiles en este contexto." (alReintentar)="cargar()">
        <div contenido class="space-y-5">
          <!-- ════ Stats de contexto ════ -->
          <div class="grid gap-3 sm:grid-cols-3">
            <app-stat-card etiqueta="Estudiantes totales" [valor]="estudiantes().length" tono="brand" [icono]="true">
              <span icono><svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
            </app-stat-card>
            <app-stat-card etiqueta="Cursos asignados" [valor]="porCurso().length" tono="info" [icono]="true">
              <span icono><svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>
            </app-stat-card>
            <app-stat-card etiqueta="Con más estudiantes" [valor]="cursoMayor()?.curso?.titulo ?? '—'" tono="gold" [icono]="true">
              <span icono><svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg></span>
            </app-stat-card>
          </div>

          <!-- ════ Distribución por curso (tarjetas) ════ -->
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @for (item of porCurso(); track item.curso.id) {
              <button type="button" class="group card card-body relative overflow-hidden text-left transition duration-150 ring-1 ring-transparent hover:ring-brand-400" [class.ring-2]="filtroCurso() === item.curso.id" [class.ring-brand-500]="filtroCurso() === item.curso.id" (click)="toggleFiltroCurso(item.curso.id)" [attr.aria-pressed]="filtroCurso() === item.curso.id">
                <span class="absolute right-0 top-0 h-full w-1.5 bg-gradient-to-b from-gold-400 to-brand-500" aria-hidden="true"></span>
                <span class="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-marine-400">Curso</span>
                <span class="mt-1 block truncate font-semibold text-marine-800" [title]="item.curso.titulo">{{ item.curso.titulo }}</span>
                <span class="mt-3 flex items-end justify-between gap-2">
                  <span class="text-4xl font-extrabold leading-none text-marine-800">{{ item.estudiantes.length }}</span>
                  <span class="text-[0.7rem] font-semibold text-marine-500">estudiante(s)</span>
                </span>
                <span class="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-surface-100">
                  <span class="block h-full rounded-full bg-brand-500 transition-all" [style.width.%]="item.estudiantes.length === 0 ? 0 : Math.min(100, (item.estudiantes.length / mayor()) * 100)"></span>
                </span>
              </button>
            }
          </div>

          <!-- ════ Filtro + contador ════ -->
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-200 bg-surface-50 p-3">
            <div class="flex flex-wrap items-center gap-2">
              <label class="text-sm font-semibold text-marine-700" for="students-filter">Filtrar por curso</label>
              <select id="students-filter" class="select w-auto" [value]="filtroCurso()" (change)="filtroCurso.set($any($event.target).value)">
                <option value="">Todos los cursos ({{ estudiantes().length }})</option>
                @for (item of porCurso(); track item.curso.id) {
                  <option [value]="item.curso.id">{{ item.curso.titulo }} ({{ item.estudiantes.length }})</option>
                }
              </select>
              @if (filtroCurso()) {
                <button type="button" class="btn btn-outline btn-sm" (click)="filtroCurso.set('')">Limpiar</button>
              }
            </div>
            <p class="text-xs font-medium text-marine-500">{{ visibles().length }} mostrando{{ filtroCurso() ? ' (curso seleccionado)' : ' (todos los cursos)' }}</p>
          </div>

          @if (visibles().length > 0) {
            <div class="table-wrap rounded-xl border border-surface-200 overflow-hidden">
              <table class="table">
                <thead><tr><th>Curso</th><th>Estudiante</th><th>Correo</th><th>XP</th><th>Nivel</th></tr></thead>
                <tbody>
                  @for (v of visibles(); track v.estudiante.id + ':' + v.curso.id) {
                    <tr>
                      <td class="text-xs text-marine-500">{{ v.curso.titulo }}</td>
                      <td>
                        <div class="flex items-center gap-2">
                          <span class="flex size-8 items-center justify-center rounded-full bg-brand-100 text-[0.7rem] font-extrabold text-brand-800">{{ iniciales(nombre(v.estudiante)) }}</span>
                          <span class="font-medium text-marine-800">{{ nombre(v.estudiante) }}</span>
                        </div>
                      </td>
                      <td class="text-sm">{{ v.estudiante.email }}</td>
                      <td>{{ v.estudiante.xp }}</td>
                      <td>{{ v.estudiante.nivel }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="rounded-lg border border-surface-200 bg-surface-50 p-4 text-sm text-marine-600">Ningún estudiante coincide con el filtro.</p>
          }
          <p class="text-xs text-marine-400">Los administradores no se listan como estudiantes · La visibilidad depende de las políticas RLS (docente del curso).</p>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class StudentsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly porCurso = signal<{ curso: Curso; estudiantes: Perfil[] }[]>([]);
  protected readonly filtroCurso = signal<string>('');

  protected readonly Math = Math;
  protected readonly estudiantes = computed(() => {
    const mapa = new Map<string, Perfil>();
    for (const item of this.porCurso()) for (const e of item.estudiantes) mapa.set(e.id, e);
    return [...mapa.values()];
  });
  protected readonly mayor = computed(() => Math.max(1, ...this.porCurso().map((i) => i.estudiantes.length)));

  protected readonly cursoMayor = computed(() => {
    const items = this.porCurso();
    if (!items.length) return null;
    return [...items].sort((a, b) => b.estudiantes.length - a.estudiantes.length)[0];
  });

  protected readonly visibles = computed(() => {
    const filtro = this.filtroCurso();
    const filas: { curso: Curso; estudiante: Perfil }[] = [];
    for (const item of this.porCurso()) {
      if (filtro && item.curso.id !== filtro) continue;
      for (const e of item.estudiantes) filas.push({ curso: item.curso, estudiante: e });
    }
    return filas;
  });

  ngOnInit(): void { void this.cargar(); }
  protected nombre(p: Perfil): string { return [p.nombre, p.apellido].filter(Boolean).join(' ') || p.email; }

  protected iniciales(nombre: string): string {
    return (nombre || '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || 'E';
  }

  protected toggleFiltroCurso(cursoId: string): void {
    this.filtroCurso.update((actual) => (actual === cursoId ? '' : cursoId));
  }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      this.porCurso.set(await this.teacherService.listarEstudiantesPorCurso(user.id));
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los estudiantes.'); }
    finally { this.cargando.set(false); }
  }
}
