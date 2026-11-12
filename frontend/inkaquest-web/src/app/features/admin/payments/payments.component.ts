import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { SupabaseService } from '../../../core/services/supabase.service';
import { Transaccion } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-payments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Pagos" descripcion="Transacciones registradas en la plataforma." />
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="transacciones().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>ID</th><th>Pedido</th><th>Usuario</th><th>Estado</th><th>Monto</th><th>Fecha</th></tr></thead>
            <tbody>
              @for (t of transacciones(); track t.id) {
                <tr>
                  <td class="font-mono text-xs">{{ t.id.slice(0,8) }}…</td>
                  <td>{{ t.pedido_id }}</td>
                  <td>{{ t.usuario_id }}</td>
                  <td><app-status-badge [estado]="t.estado" /></td>
                  <td>{{ t.monto }} {{ t.moneda }}</td>
                  <td>{{ t.creado_en | date: 'medium' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">La conciliación, captura y verificación de pagos con pasarela se realizan en backend. La visibilidad depende de permisos de administrador/RLS.</p>
    </section>
  `,
})
export class PaymentsComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly transacciones = signal<Transaccion[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const { data, error } = await this.supabase.client.from(this.supabase.tabla.transaccion).select('*').order('creado_en', { ascending: false }).limit(200);
      if (error) throw new Error(error.message);
      this.transacciones.set((data ?? []) as Transaccion[]);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las transacciones.'); }
    finally { this.cargando.set(false); }
  }
}
