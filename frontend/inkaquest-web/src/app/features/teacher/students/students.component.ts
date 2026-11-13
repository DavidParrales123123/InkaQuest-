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
      <app-page-header titulo="Estudiantes" descripcion="Estudiantes matriculados en tus cursos asignados. Filtra por curso para ver cuántos hay en cada uno." />
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="estudiantes().length === 0" tituloVacio="Sin estudiantes visibles" descripcionVacia="No se encontraron estudiantes o la política de acceso no permite listar perfiles en este contexto." (alReintentar)="cargar()">
        <div contenido class="space-y-4">
          <!-- ════ Distribución por curso: tarjetas con conteo + filtro ════ -->
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @for (item of porCurso(); track item.curso.id) {
              <button type="button" class="card card-body flex items-center justify-between gap-3 text-left transition hover:ring-2 hover:ring-brand-400" [class.ring-2]="filtroCurso() === item.curso.id" [class.ring-brand-500]="filtroCurso() === item.curso.id" (click)="toggleFiltroCurso(item.curso.id)" [attr.aria-pressed]="filtroCurso() === item.curso.id">
                <span class="min-w-0">
                  <span class="block text-xs font-semibold uppercase tracking-wide text-marine-400">Curso</span>
                  <span class="mt-0.5 block truncate font-semibold text-marine-800" [title]="item.curso.titulo">{{ item.curso.titulo }}</span>
                  <span class="mt-1 block text-xs text-marine-500">{{ item.estudiantes.length }} estudiante(s)</span>
                </span>
                <span class="text-2xl font-extrabold text-marine-800">{{ item.estudiantes.length }}</span>
              </button>
            }
          </div>

          <!-- ════ Filtro + tabla ════ -->
          <div class="flex flex-wrap items-center justify-between gap-3">
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
            <p class="text-xs text-marine-500">{{ visibles().length }} estudiante(s) mostrando{{ filtroCurso() ? ' en el curso seleccionado' : ' en todos los cursos' }}</p>
          </div>

          @if (visibles().length > 0) {
            <div class="table-wrap">
              <table class="table">
                <thead><tr><th>Curso</th><th>Nombre</th><th>Correo</th><th>XP</th><th>Nivel</th></tr></thead>
                <tbody>
                  @for (v of visibles(); track v.estudiante.id + ':' + v.curso.id) {
                    <tr>
                      <td class="text-xs text-marine-500">{{ v.curso.titulo }}</td>
                      <td class="font-medium text-marine-800">{{ nombre(v.estudiante) }}</td>
                      <td>{{ v.estudiante.email }}</td>
                      <td>{{ v.estudiante.xp }}</td>
                      <td>{{ v.estudiante.nivel }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="rounded-lg bg-surface-50 p-4 text-sm text-marine-500">Ningún estudiante coincide con el filtro elegido.</p>
          }
          <p class="mt-3 text-xs text-marine-400">Los administradores no se listan como estudiantes · La visibilidad de datos de perfil depende de las políticas RLS.</p>
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

  protected readonly estudiantes = computed(() => {
    // Únicos por id para el conteo global (mismo estudiante puede estar en varios de tus cursos).
    const mapa = new Map<string, Perfil>();
    for (const item of this.porCurso()) {
      for (const e of item.estudiantes) mapa.set(e.id, e);
    }
    return [...mapa.values()];
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
