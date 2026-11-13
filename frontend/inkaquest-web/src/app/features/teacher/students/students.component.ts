// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { Perfil } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-teacher-students',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Estudiantes" descripcion="Estudiantes matriculados en tus cursos asignados (segun permisos de acceso)." />
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="estudiantes().length === 0" tituloVacio="Sin estudiantes visibles" descripcionVacia="No se encontraron estudiantes o la política de acceso no permite listar perfiles en este contexto." (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Nombre</th><th>Correo</th><th>XP</th><th>Nivel</th></tr></thead>
            <tbody>
              @for (e of estudiantes(); track e.id) {
                <tr>
                  <td class="font-medium text-marine-800">{{ nombre(e) }}</td>
                  <td>{{ e.email }}</td>
                  <td>{{ e.xp }}</td>
                  <td>{{ e.nivel }}</td>
                </tr>
              }
            </tbody>
          </table>
          <p class="mt-3 text-xs text-marine-400">La visibilidad de datos de perfil depende de las políticas RLS (docente del curso/administrador).</p>
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
  protected readonly estudiantes = signal<Perfil[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected nombre(p: Perfil): string { return [p.nombre, p.apellido].filter(Boolean).join(' ') || p.email; }
  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try { this.estudiantes.set(await this.teacherService.listarEstudiantes(user.id)); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los estudiantes.'); }
    finally { this.cargando.set(false); }
  }
}
