import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { Calificacion, Perfil } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

/**
 * Calificaciones registradas por el docente.
 *
 * <p>Muestra nota, estudiante (nombre real), resultado y comentario.
 * Las calificaciones se escriben desde la bandeja de entregas; aquí se
 * consultan.</p>
 */
@Component({
  selector: 'app-teacher-grades',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Calificaciones" descripcion="Calificaciones registradas en entregas/tareas de tus cursos (según permisos y visibilidad)." [acciones]="true">
        <div acciones><button class="btn btn-outline btn-sm" type="button" (click)="cargar()" [disabled]="cargando()">Actualizar</button></div>
      </app-page-header>

      <div class="grid gap-4 sm:grid-cols-3">
        <div class="card card-body"><p class="text-sm text-marine-500">Registros visibles</p><p class="mt-1 text-2xl font-bold text-marine-900">{{ calificaciones().length }}</p></div>
        <div class="card card-body"><p class="text-sm text-marine-500">Aprobadas</p><p class="mt-1 text-2xl font-bold text-marine-900">{{ aprobadas() }}</p></div>
        <div class="card card-body"><p class="text-sm text-marine-500">Entregas por revisar</p><p class="mt-1 text-2xl font-bold text-marine-900">{{ pendientes() }}</p></div>
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="calificaciones().length === 0" tituloVacio="Sin calificaciones visibles" descripcionVacia="Aún no hay calificaciones registradas o no tienes permisos. Califica desde Entregas." (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead>
              <tr><th>Fecha</th><th>Estudiante</th><th>Nota</th><th>Estado</th><th>Comentario</th></tr>
            </thead>
            <tbody>
              @for (c of calificaciones(); track c.id) {
                <tr>
                  <td class="text-sm">{{ c.calificado_en | date:'medium' }}</td>
                  <td class="text-sm font-medium">{{ nombreEstudiante(c.estudiante_id) }}</td>
                  <td class="font-medium">{{ c.nota }} / {{ c.nota_maxima }}</td>
                  <td><span class="badge" [class.badge-success]="c.aprobado === true" [class.badge-danger]="c.aprobado !== true">{{ c.aprobado ? 'Aprobado' : 'Reprobado' }}</span></td>
                  <td class="text-sm text-marine-600">{{ c.comentario || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>

      <div class="flex flex-wrap gap-2">
        <a routerLink="/docente/entregas" class="btn btn-primary btn-sm">Ir a entregas</a>
        <a routerLink="/docente/tareas" class="btn btn-outline btn-sm">Ver tareas</a>
      </div>
      <p class="text-xs text-marine-400">El listado depende de las políticas RLS y de los permisos del docente sobre los cursos/entregas.</p>
    </section>
  `,
})
export class GradesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly supabase = inject(SupabaseService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly pendientes = signal(0);
  protected readonly calificaciones = signal<Calificacion[]>([]);
  protected readonly estudiantes = signal<Perfil[]>([]);
  protected readonly aprobadas = signal(0);

  ngOnInit(): void {
    void this.cargar();
  }

  protected nombreEstudiante(id: string): string {
    const p = this.estudiantes().find((p) => p.id === id);
    return p ? [p.nombre, p.apellido].filter(Boolean).join(' ').trim() || p.email : `${id.slice(0, 8)}…`;
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
      const [pend, estudiantes] = await Promise.all([
        this.teacherService.listarEntregasPendientes(user.id).catch(() => [] as Awaited<ReturnType<TeacherService['listarEntregasPendientes']>>),
        this.teacherService.listarEstudiantes(user.id).catch(() => [] as Perfil[]),
      ]);

      const { data, error } = await this.supabase.client
        .from(this.supabase.tabla.calificacion)
        .select('id, entrega_id, estudiante_id, nota, nota_maxima, aprobado, comentario, calificado_en, docente_id')
        .eq('docente_id', user.id)
        .order('calificado_en', { ascending: false });

      if (error) {
        throw new Error(`No se pudieron cargar las calificaciones: ${error.message}`);
      }

      const cals = (data ?? []) as Calificacion[];
      this.pendientes.set(pend.length);
      this.estudiantes.set(estudiantes);
      this.calificaciones.set(cals);
      this.aprobadas.set(cals.filter((c) => c.aprobado).length);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las calificaciones.');
    } finally {
      this.cargando.set(false);
    }
  }
}
