// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { Curso, Matricula, Perfil, ProgresoCurso } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-teacher-seguimiento',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Seguimiento de estudiantes" descripcion="Seguimiento del avance de estudiantes matriculados en tus cursos (progreso y estado), según datos y permisos disponibles." [acciones]="true">
        <div acciones><button class="btn btn-outline btn-sm" type="button" (click)="cargar()" [disabled]="cargando()">Actualizar</button></div>
      </app-page-header>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="filas().length === 0" tituloVacio="Sin datos de seguimiento" descripcionVacia="No hay matrículas/progreso visibles para tus cursos o las políticas de acceso no permiten verlos." (alReintentar)="cargar()">
        <div contenido class="space-y-4">
          @for (curso of cursos(); track curso.id) {
            <div class="card card-body">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h2 class="font-semibold text-marine-800">{{ curso.titulo }}</h2>
                <a [routerLink]="['/docente/cursos', curso.id]" class="btn btn-outline btn-sm">Ver curso</a>
              </div>
              @if (filasCurso(curso.id).length === 0) {
                <p class="mt-2 text-sm text-marine-500">Sin matrículas/progreso visibles en este curso.</p>
              } @else {
                <div class="mt-3 table-wrap">
                  <table class="table">
                    <thead><tr><th>Estudiante</th><th>Estado matrícula</th><th>Progreso</th><th>Lecciones</th><th>Última actividad</th></tr></thead>
                    <tbody>
                      @for (f of filasCurso(curso.id); track f.matricula.id) {
                        <tr>
                          <td class="text-sm">{{ f.nombre }}</td>
                          <td><app-status-badge [estado]="f.matricula.estado" /></td>
                          <td class="text-sm">{{ f.progreso?.porcentaje ?? f.matricula.porcentaje_progreso ?? 0 }}% @if (f.progreso) { <span class="text-marine-500">({{ f.progreso.estado }})</span> }</td>
                          <td class="text-sm">{{ f.progreso?.lecciones_completadas ?? 0 }}</td>
                          <td class="text-sm text-marine-500">{{ f.progreso?.ultima_actividad_en || f.progreso?.actualizado_en || '—' }}</td>
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

  ngOnInit(): void { void this.cargar(); }

  protected filasCurso(cursoId: string) { return this.filas().filter((f) => f.cursoId === cursoId); }

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
          const { data: ps } = await this.supabase.client.from(this.supabase.tabla.perfil).select('id,nombre,apellido,email').in('id', estIds);
          perfiles = (ps ?? []) as Perfil[];
        }
        const pMap = new Map(perfiles.map((p) => [p.id, [p.nombre, p.apellido].filter(Boolean).join(' ') || p.email || p.id.slice(0, 8)]));
        const { data: progs } = await this.supabase.client.from(this.supabase.tabla.progresoCurso).select('*').eq('curso_id', curso.id);
        const progMap = new Map(((progs ?? []) as ProgresoCurso[]).map((p) => [p.estudiante_id, p]));
        for (const m of matriculas) {
          filas.push({ cursoId: curso.id, matricula: m, progreso: progMap.get(m.estudiante_id) ?? null, nombre: pMap.get(m.estudiante_id) ?? m.estudiante_id.slice(0, 8) + '…' });
        }
      }
      this.filas.set(filas);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el seguimiento.'); }
    finally { this.cargando.set(false); }
  }
}
