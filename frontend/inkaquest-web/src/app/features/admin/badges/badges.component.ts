// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { GamificationService } from '../../../core/services/gamification.service';
import { Insignia } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-badges',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Insignias" descripcion="Catálogo de insignias configuradas en el sistema." />
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="insignias().length === 0" (alReintentar)="cargar()">
        <div contenido class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (b of insignias(); track b.id) {
            <article class="card card-body">
              <div class="flex items-center justify-between gap-2">
                <h2 class="font-semibold text-marine-800">{{ b.nombre }}</h2>
                <span class="badge" [class.badge-success]="b.activa" [class.badge-neutral]="!b.activa">{{ b.activa ? 'Activa' : 'Inactiva' }}</span>
              </div>
              <p class="mt-1 text-sm text-marine-500">{{ b.descripcion || 'Sin descripción.' }}</p>
              <p class="mt-2 text-xs text-marine-400">Código: {{ b.codigo || '-' }}</p>
            </article>
          }
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">La creación/edición de insignias y reglas de otorgamiento se gestiona mediante administración backend y reglas en base de datos.</p>
    </section>
  `,
})
export class BadgesComponent implements OnInit {
  private readonly gamification = inject(GamificationService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly insignias = signal<Insignia[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.insignias.set(await this.gamification.listarCatalogoInsignias()); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las insignias.'); }
    finally { this.cargando.set(false); }
  }
}
