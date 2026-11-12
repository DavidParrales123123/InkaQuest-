import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { RewardService } from '../../../core/services/reward.service';
import { Inventario, TiendaItem } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

type InventarioConItem = Inventario & { item?: TiendaItem; tienda_item?: TiendaItem };

@Component({
  selector: 'app-student-inventory',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-8">
      <app-page-header
        titulo="Mi inventario"
        descripcion="Artículos y recompensas que has obtenido. El inventario se consulta desde la plataforma según tus permisos."
      />

      <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <app-stat-card etiqueta="Artículos en inventario" [valor]="items().length" />
        <app-stat-card etiqueta="Total de unidades" [valor]="totalUnidades()" tono="gold" />
      </div>

      <app-data-panel
        [cargando]="cargando()"
        [error]="error()"
        [vacio]="items().length === 0"
        tituloVacio="Tu inventario está vacío"
        descripcionVacia="Cuando adquieras recompensas o artículos de la tienda, aparecerán aquí."
        (alReintentar)="cargar()"
      >
        <div contenido class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          @for (inv of items(); track inv.id) {
            <article class="card card-body">
              <h3 class="text-lg font-bold text-marine-900">
                {{ inv.item?.nombre || inv.tienda_item?.nombre || 'Artículo' }}
              </h3>
              <p class="mt-1 text-sm text-marine-600">
                {{ inv.item?.descripcion || inv.tienda_item?.descripcion || 'Sin descripción.' }}
              </p>
              <div class="mt-5 flex flex-wrap gap-2 text-sm">
                <span class="badge badge-info">Cantidad: {{ inv.cantidad }}</span>
                @if (inv.item?.tipo || inv.tienda_item?.tipo) {
                  <span class="badge badge-default">{{ inv.item?.tipo || inv.tienda_item?.tipo }}</span>
                }
              </div>
              <p class="mt-5 text-xs text-marine-500">Adquirido: {{ formatearFecha(inv.adquirido_en) }}</p>
            </article>
          }
        </div>
      </app-data-panel>
    </section>
  `,
})
export class InventoryComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly rewards = inject(RewardService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly items = signal<InventarioConItem[]>([]);
  protected readonly totalUnidades = signal(0);

  ngOnInit(): void {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    const usuario = this.auth.usuario();
    if (!usuario) {
      this.error.set('No se pudo identificar tu sesión.');
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    try {
      const inv = await this.rewards.listarInventario(usuario.id);
      this.items.set(inv as InventarioConItem[]);
      this.totalUnidades.set(inv.reduce((a, i) => a + (i.cantidad || 0), 0));
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar tu inventario.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected formatearFecha(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return iso;
    }
  }
}
