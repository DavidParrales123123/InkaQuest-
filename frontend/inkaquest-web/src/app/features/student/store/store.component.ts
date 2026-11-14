// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { RewardService } from '../../../core/services/reward.service';
import { Monedero, TiendaItem } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-student-store',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-8">
      <app-page-header titulo="Tienda de recompensas" descripcion="Gasta tus monedas en artículos y recompensas. Las compras se validan y registran en el backend; usa el botón Comprar para hacerlo." [acciones]="true">
        <div acciones>
          <a routerLink="/estudiante/inventario" class="btn btn-outline btn-sm">Mi inventario</a>
        </div>
      </app-page-header>

      <div class="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <app-stat-card etiqueta="Saldo de monedas" [valor]="monedero()?.saldo ?? 0" tono="brand" />
        <app-stat-card etiqueta="Artículos disponibles" [valor]="items().length" />
        <app-stat-card etiqueta="Restante tras compra" [valor]="ultimoSaldo() ?? '—'" detalle="saldo actualizado" tono="gold" />
      </div>

      @if (mensaje()) {
        <p class="rounded-lg border p-3 text-sm" [class.border-success-500/40]="exito()" [class.bg-success-50]="exito()" [class.text-success-600]="exito()" [class.border-danger-200]="!exito()" [class.bg-danger-50]="!exito()" [class.text-danger-700]="!exito()" role="alert">{{ mensaje() }}</p>
      }

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
            <article class="card card-body flex h-full flex-col">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-lg font-bold text-marine-900">{{ item.nombre }}</h3>
                  <p class="mt-1 text-sm text-marine-600">{{ item.descripcion || 'Sin descripción disponible.' }}</p>
                </div>
                <span class="badge badge-info">{{ item.tipo }}</span>
              </div>
              <div class="mt-5 space-y-1 text-sm text-marine-700">
                <p>Precio: <strong>{{ item.precio_monedas }}</strong> monedas{{ item.precio_xp > 0 ? ' + ' + item.precio_xp + ' XP' : '' }}</p>
                @if (item.stock !== null) { <p>Stock: {{ item.stock }}</p> }
                @if (item.limite_por_usuario !== null) { <p>Límite por usuario: {{ item.limite_por_usuario }}</p> }
              </div>
              <div class="mt-auto pt-5">
                <button
                  type="button"
                  class="btn btn-gold btn-sm w-full"
                  [disabled]="comprando() === item.id || !puedeComprar(item)"
                  (click)="comprar(item)"
                  [attr.aria-label]="'Comprar ' + item.nombre"
                >
                  @if (comprando() === item.id) {
                    Comprando…
                  } @else if (!puedeComprar(item)) {
                    Sin saldo suficiente
                  } @else {
                    Comprar por {{ item.precio_monedas }} monedas{{ item.precio_xp > 0 ? ' + ' + item.precio_xp + ' XP' : '' }}
                  }
                </button>
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
  private readonly confirm = inject(ConfirmService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly items = signal<TiendaItem[]>([]);
  protected readonly monedero = signal<Monedero | null>(null);
  protected readonly comprando = signal<string | null>(null);
  protected readonly ultimoSaldo = signal<number | null>(null);
  protected readonly mensaje = signal('');
  protected readonly exito = signal(false);

  ngOnInit(): void {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    const usuario = this.auth.usuario();
    this.cargando.set(true);
    this.error.set(null);
    this.mensaje.set('');
    try {
      const [items, monedero] = await Promise.all([
        this.rewards.listarTienda().catch(() => [] as TiendaItem[]),
        usuario ? this.gamification.obtenerMonedero(usuario.id).catch(() => null) : Promise.resolve(null),
      ]);
      this.items.set(items);
      this.monedero.set(monedero);
      this.ultimoSaldo.set(monedero?.saldo ?? null);

      // Sincroniza XP en el perfil para la alerta "No tienes saldo".
      void this.auth.cargarPerfil().catch(() => undefined);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar la tienda.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected puedeComprar(item: TiendaItem): boolean {
    const saldo = this.monedero()?.saldo ?? 0;
    const xp = this.auth.perfil()?.xp ?? 0;
    if (item.precio_monedas > 0 && saldo < item.precio_monedas) return false;
    if (item.precio_xp > 0 && xp < item.precio_xp) return false;
    return true;
  }

  protected async comprar(item: TiendaItem): Promise<void> {
    if (this.comprando() === item.id) return;
    const confirmar = await this.confirm.ask({
      title: `Comprar «${item.nombre}»`,
      mensaje: `Confirmas tu compra por ${item.precio_monedas} monedas${item.precio_xp > 0 ? ` y ${item.precio_xp} XP` : ''}. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Confirmar compra',
      variante: 'primario',
    });
    if (!confirmar) return;

    this.comprando.set(item.id);
    this.mensaje.set('');
    this.exito.set(false);
    const res = await this.rewards.comprar(item.id, 1);
    this.exito.set(res.ok);
    this.mensaje.set(res.mensaje);
    this.comprando.set(null);

    if (res.ok) {
      await this.cargar();
    }
  }
}
