// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { SupabaseService } from '../../../core/services/supabase.service';
import { Reembolso } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-refunds',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Reembolsos" descripcion="Solicitudes y estados de reembolso." />
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="reembolsos().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>ID</th><th>Usuario</th><th>Transacción</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead>
            <tbody>
              @for (r of reembolsos(); track r.id) {
                <tr>
                  <td class="font-mono text-xs">{{ r.id.slice(0,8) }}…</td>
                  <td>{{ r.usuario_id }}</td>
                  <td>{{ r.transaccion_id }}</td>
                  <td>{{ r.monto }}</td>
                  <td><app-status-badge [estado]="r.estado" /></td>
                  <td>{{ r.creado_en | date: 'medium' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">La aprobación/procesamiento de reembolsos se ejecuta en backend con la pasarela y reglas de negocio.</p>
    </section>
  `,
})
export class RefundsComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly reembolsos = signal<Reembolso[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const { data, error } = await this.supabase.client.from(this.supabase.tabla.reembolso).select('*').order('creado_en', { ascending: false }).limit(200);
      if (error) throw new Error(error.message);
      this.reembolsos.set((data ?? []) as Reembolso[]);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los reembolsos.'); }
    finally { this.cargando.set(false); }
  }
}
