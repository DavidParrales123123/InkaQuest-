import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AdminService } from '../../../core/services/admin.service';
import { Cupon } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-coupons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ButtonComponent, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Cupones" descripcion="Cupones de descuento registrados (activos e inactivos)." [acciones]="true">
        <div acciones><app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button></div>
      </app-page-header>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="cupones().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Código</th><th>Tipo</th><th>Valor</th><th>Usos</th><th>Vigencia</th><th>Activo</th></tr></thead>
            <tbody>
              @for (c of cupones(); track c.id) {
                <tr>
                  <td class="font-medium">{{ c.codigo }}</td>
                  <td>{{ c.tipo }}</td>
                  <td>{{ c.valor }}</td>
                  <td>{{ c.usos_actuales }} / {{ c.usos_maximos ?? 'sin límite' }}</td>
                  <td>{{ c.valido_desde | date: 'shortDate' }} – {{ c.valido_hasta | date: 'shortDate' }}</td>
                  <td>{{ c.activo ? 'Sí' : 'No' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">La creación/edición de cupones y su aplicación en checkout se gestionan mediante backend y reglas de negocio.</p>
    </section>
  `,
})
export class CouponsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly cupones = signal<Cupon[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.cupones.set(await this.adminService.listarCuponesAdmin()); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los cupones.'); }
    finally { this.cargando.set(false); }
  }
}
