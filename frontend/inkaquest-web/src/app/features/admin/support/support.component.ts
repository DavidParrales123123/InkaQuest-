// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { SupabaseService } from '../../../core/services/supabase.service';
import { Ticket } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-support',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Soporte" descripcion="Tickets de soporte registrados en la plataforma." />
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="tickets().length === 0" (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>Asunto</th><th>Categoría</th><th>Prioridad</th><th>Estado</th><th>Creado</th></tr></thead>
            <tbody>
              @for (t of tickets(); track t.id) {
                <tr>
                  <td class="font-medium">{{ t.asunto }}</td>
                  <td>{{ t.categoria }}</td>
                  <td>{{ t.prioridad }}</td>
                  <td><app-status-badge [estado]="t.estado" /></td>
                  <td>{{ t.creado_en | date: 'medium' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">La asignación, respuestas internas y flujos avanzados de atención pueden requerir permisos/acciones adicionales de backend.</p>
    </section>
  `,
})
export class SupportComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly tickets = signal<Ticket[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const { data, error } = await this.supabase.client.from(this.supabase.tabla.ticket).select('*').order('creado_en', { ascending: false }).limit(200);
      if (error) throw new Error(error.message);
      this.tickets.set((data ?? []) as Ticket[]);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los tickets.'); }
    finally { this.cargando.set(false); }
  }
}
