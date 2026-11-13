// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AdminService } from '../../../core/services/admin.service';
import { Ranking, Temporada } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-rankings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ButtonComponent, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-8">
      <app-page-header titulo="Rankings" descripcion="Consulta de temporadas y posiciones registradas. Gestión avanzada y recalculaciones deben realizarse por backend/procesos autorizados." [acciones]="true">
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="temporadas().length === 0 && rankings().length === 0" (alReintentar)="cargar()">
        <div contenido class="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 class="mb-3 text-lg font-semibold text-marine-800">Temporadas</h2>
            <div class="table-wrap">
              <table class="table">
                <thead><tr><th>Nombre</th><th>Estado</th><th>Inicio</th><th>Fin</th></tr></thead>
                <tbody>
                  @for (t of temporadas(); track t.id) {
                    <tr>
                      <td class="font-medium text-marine-800">{{ t.nombre }}</td>
                      <td><app-status-badge [estado]="t.estado" /></td>
                      <td>{{ t.fecha_inicio | date: 'mediumDate' }}</td>
                      <td>{{ t.fecha_fin ? (t.fecha_fin | date: 'mediumDate') : '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h2 class="mb-3 text-lg font-semibold text-marine-800">Posiciones (top registros)</h2>
            <div class="table-wrap">
              <table class="table">
                <thead><tr><th>Temporada</th><th>Usuario</th><th>Puntos</th><th>Posición</th></tr></thead>
                <tbody>
                  @for (r of rankings(); track r.id) {
                    <tr>
                      <td class="font-mono text-xs">{{ r.temporada_id.slice(0,8) }}…</td>
                      <td class="font-mono text-xs">{{ r.usuario_id.slice(0,8) }}…</td>
                      <td>{{ r.puntos }}</td>
                      <td>{{ r.posicion ?? '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">Datos sujetos a RLS/privacidad. Resolución de nombres y gestión de temporadas/rankings puede requerir endpoints adicionales.</p>
    </section>
  `,
})
export class RankingsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly temporadas = signal<Temporada[]>([]);
  protected readonly rankings = signal<Ranking[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const [t, r] = await Promise.all([this.adminService.listarTemporadasAdmin(), this.adminService.listarRankingsAdmin()]);
      this.temporadas.set(t); this.rankings.set(r);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar rankings/temporadas.'); }
    finally { this.cargando.set(false); }
  }
}
