import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { RewardService } from '../../../core/services/reward.service';
import { Monedero, TiendaItem } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-student-store',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-8">
      <app-page-header
        titulo="Tienda de recompensas"
        descripcion="Explora los artículos disponibles. Las compras se validan y registran por el backend para garantizar saldo y reglas; desde aquí puedes consultar el catálogo."
      />

      <div class="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <app-stat-card etiqueta="Saldo de monedas" [valor]="monedero()?.saldo ?? 0" tono="brand" />
        <app-stat-card etiqueta="Artículos disponibles" [valor]="items().length" />
        <app-stat-card etiqueta="Compras" valor="Pendiente" detalle="Integración backend" tono="surface" />
      </div>

      <app-data-panel
        [cargando]="cargando()"
        [error]="error()"
        [vacio]="items().length === 0"
        tituloVacio="No hay artículos en la tienda"
        descripcionVacia="Cuando el catálogo de la tienda tenga artículos activos, aparecerán en esta sección."
        (alReintentar)="cargar()"
      >
        <div contenido class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          @for (item of items(); track item.id) {
            <article class="card card-body flex flex-col">
              <div class="flex items-start justify-between gap-5">
                <div>
                  <h3 class="text-lg font-bold text-marine-900">{{ item.nombre }}</h3>
                  <p class="mt-1 text-sm text-marine-600">{{ item.descripcion || 'Sin descripción disponible.' }}</p>
                </div>
                <span class="badge badge-info">{{ item.tipo }}</span>
              </div>
              <div class="mt-5 space-y-1 text-sm text-marine-700">
                <p>Precio: <strong>{{ item.precio_monedas }}</strong> monedas</p>
                @if (item.precio_xp > 0) { <p>XP requerido: <strong>{{ item.precio_xp }}</strong></p> }
                @if (item.stock !== null) { <p>Stock: {{ item.stock }}</p> }
                @if (item.limite_por_usuario !== null) { <p>Límite por usuario: {{ item.limite_por_usuario }}</p> }
              </div>
              <div class="mt-auto pt-5">
                <button type="button" class="btn btn-primary btn-sm w-full" disabled title="La compra requiere endpoint backend pendiente">
                  Comprar (requiere backend)
                </button>
                <p class="mt-2 line-clamp-2 text-xs text-marine-500">
                  Integración pendiente: el endpoint de compra debe validar saldo, stock e idempotencia en el backend.
                </p>
              </div>
            </article>
          }
        </div>
      </app-data-panel>
    </section>
  `,
})
export class StoreComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly rewards = inject(RewardService);
  private readonly gamification = inject(GamificationService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly items = signal<TiendaItem[]>([]);
  protected readonly monedero = signal<Monedero | null>(null);

  ngOnInit(): void {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    const usuario = this.auth.usuario();
    this.cargando.set(true);
    this.error.set(null);
    try {
      const [items, monedero] = await Promise.all([
        this.rewards.listarTienda(),
        usuario ? this.gamification.obtenerMonedero(usuario.id) : Promise.resolve(null),
      ]);
      this.items.set(items);
      this.monedero.set(monedero);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar la tienda.');
    } finally {
      this.cargando.set(false);
    }
  }
}
