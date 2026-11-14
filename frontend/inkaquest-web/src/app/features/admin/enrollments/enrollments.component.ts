import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { AdminService } from '../../../core/services/admin.service';
import { Curso, Matricula, Perfil } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-enrollments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule, ButtonComponent, DataPanelComponent, PageHeaderComponent, StatCardComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-8">
      <app-page-header
        titulo="Matrículas"
        descripcion="Consulta de matrículas registradas. La activación tras pago confirmado debe realizarse por backend/proceso autorizado; el frontend no activa matrículas."
        [acciones]="true"
      >
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <app-stat-card etiqueta="Activas" [valor]="conteo('activa')" tono="info" />
        <app-stat-card etiqueta="Pendientes de pago" [valor]="conteo('pendiente_pago')" tono="gold" />
        <app-stat-card etiqueta="Completadas" [valor]="conteo('completada')" tono="brand" />
        <app-stat-card etiqueta="Otras" [valor]="otras()" tono="surface" />
      </div>

      <div class="card card-body">
        <form class="grid gap-4 md:grid-cols-4" [formGroup]="filtros">
          <div class="md:col-span-2"><label class="label" for="busqueda">Búsqueda</label><input id="busqueda" class="input" formControlName="busqueda" placeholder="Estudiante o curso" /></div>
          <div><label class="label" for="estado">Estado</label>
            <select id="estado" class="select" formControlName="estado">
              <option value="">Todos</option>
              <option value="pendiente_pago">Pendiente de pago</option>
              <option value="activa">Activa</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
              <option value="reembolsada">Reembolsada</option>
              <option value="vencida">Vencida</option>
            </select>
          </div>
          <div class="flex items-end justify-between gap-3">
            <span class="text-sm text-marine-500">{{ filtradas().length }} resultado(s)</span>
            <button type="button" class="btn btn-outline btn-sm" (click)="limpiarFiltros()">Limpiar</button>
          </div>
        </form>
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="filtradas().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Estudiante</th><th>Curso</th><th>Estado</th><th>Progreso</th><th>XP ganado</th><th>Creado</th></tr></thead>
            <tbody>
              @for (m of filtradas(); track m.id) {
                <tr>
                  <td class="font-medium text-marine-800">{{ nombreEstudiante(m.estudiante_id) }}</td>
                  <td>{{ nombreCurso(m.curso_id) }}</td>
                  <td><app-status-badge [estado]="m.estado" /></td>
                  <td>{{ m.porcentaje_progreso }}%</td>
                  <td>{{ m.xp_ganado }}</td>
                  <td>{{ m.creado_en | date: 'medium' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">Listado sujeto a permisos/RLS de administrador. Acciones de cambio de estado/activación deben pasar por backend autorizado.</p>
    </section>
  `,
})
export class EnrollmentsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly matriculas = signal<Matricula[]>([]);
  protected readonly usuarios = signal<Perfil[]>([]);
  protected readonly cursos = signal<Curso[]>([]);
  protected readonly filtros = this.fb.nonNullable.group({ busqueda: [''], estado: [''] });
  private readonly cambiosFiltros = toSignal(this.filtros.valueChanges, {
    initialValue: this.filtros.getRawValue(),
  });

  protected readonly filtradas = computed(() => {
    const { busqueda, estado } = this.cambiosFiltros();
    const b = (busqueda ?? '').toLowerCase().trim();
    const e = estado ?? '';
    return this.matriculas().filter((m) => {
      if (e && m.estado !== e) return false;
      if (!b) return true;
      const texto = `${this.nombreEstudiante(m.estudiante_id)} ${this.nombreCurso(m.curso_id)}`.toLowerCase();
      return texto.includes(b);
    });
  });

  protected conteo(estado: string): number { return this.matriculas().filter((m) => m.estado === estado).length; }
  protected otras(): number { return this.matriculas().filter((m) => !['activa', 'pendiente_pago', 'completada'].includes(m.estado)).length; }
  protected nombreEstudiante(id: string): string {
    const p = this.usuarios().find((u) => u.id === id);
    return p ? ([p.nombre, p.apellido].filter(Boolean).join(' ') || p.email) : id.slice(0, 8) + '…';
  }
  protected nombreCurso(id: string): string { return this.cursos().find((c) => c.id === id)?.titulo ?? id.slice(0, 8) + '…'; }
  protected limpiarFiltros(): void { this.filtros.reset({ busqueda: '', estado: '' }); }

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const [matriculas, usuarios, cursos] = await Promise.all([
        this.adminService.listarMatriculasAdmin(),
        this.adminService.listarUsuarios({ limite: 500 }),
        this.adminService.listarTodosLosCursos(),
      ]);
      this.matriculas.set(matriculas.slice(0, 500));
      this.usuarios.set(usuarios);
      this.cursos.set(cursos);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las matrículas.'); }
    finally { this.cargando.set(false); }
  }
}
