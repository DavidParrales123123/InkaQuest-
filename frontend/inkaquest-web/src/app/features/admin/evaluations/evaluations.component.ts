import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AdminService } from '../../../core/services/admin.service';
import { Evaluacion } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-evaluations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-8">
      <app-page-header titulo="Gestión de evaluaciones" descripcion="Consulta administrativa de evaluaciones (metadatos). Las respuestas/correcciones se gestionan de forma segura por backend/RLS." [acciones]="true">
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="evaluaciones().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Evaluación</th><th>Actividad</th><th>Duración</th><th>Intentos</th><th>Nota máx.</th></tr></thead>
            <tbody>
              @for (e of evaluaciones(); track e.id) {
                <tr>
                  <td class="font-medium text-marine-800">{{ e.titulo }}</td>
                  <td class="font-mono text-xs">{{ e.actividad_id.slice(0,8) }}…</td>
                  <td>{{ e.duracion_minutos ?? '—' }} min</td>
                  <td>{{ e.intentos_permitidos }}</td>
                  <td>{{ e.nota_maxima }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">No se exponen soluciones/correcciones en el cliente. Configuración detallada requiere endpoints autorizados.</p>
    </section>
  `,
})
export class EvaluationsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly evaluaciones = signal<Evaluacion[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.evaluaciones.set(await this.adminService.listarEvaluacionesAdmin()); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las evaluaciones.'); }
    finally { this.cargando.set(false); }
  }
}
