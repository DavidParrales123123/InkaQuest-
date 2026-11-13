// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { RewardService } from '../../../core/services/reward.service';
import { CompraVirtual, Insignia, InsigniaUsuario, Monedero, TransaccionMoneda } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-student-rewards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-8">
      <app-page-header
        titulo="Recompensas"
        descripcion="Resumen de tus monedas, insignias obtenidas e historial de recompensas registradas por la plataforma."
      />

      <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <app-stat-card etiqueta="Saldo de monedas" [valor]="monedero()?.saldo ?? 0" tono="brand" />
        <app-stat-card etiqueta="Insignias obtenidas" [valor]="insignias().length" tono="gold" />
        <app-stat-card etiqueta="Compras virtuales" [valor]="compras().length" />
        <app-stat-card etiqueta="Movimientos" [valor]="movimientos().length" tono="surface" />
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <app-data-panel
          [cargando]="cargando()"
          [error]="error()"
          [vacio]="insignias().length === 0"
          tituloVacio="Sin insignias registradas"
          descripcionVacia="Las insignias que obtengas aparecerán aquí."
          (alReintentar)="cargar()"
        >
          <div contenido class="card card-body">
            <div class="mb-6 flex items-center justify-between">
              <h3 class="text-lg font-bold text-marine-900">Insignias recientes</h3>
              <a routerLink="/estudiante/insignias" class="text-sm font-medium text-brand-700 hover:underline">Ver todas</a>
            </div>
            <ul class="space-y-3">
              @for (iu of insignias().slice(0, 6); track iu.id) {
                <li class="flex items-center justify-between gap-5 rounded-lg border border-surface-200 p-3">
                  <div>
                    <p class="font-medium text-marine-900">{{ iu.insignia.nombre || 'Insignia' }}</p>
                    <p class="text-xs text-marine-500">{{ iu.insignia.rareza || '—' }} · {{ iu.insignia.xp_otorgado || 0 }} XP</p>
                  </div>
                  <span class="badge badge-success">Obtenida</span>
                </li>
              }
            </ul>
          </div>
        </app-data-panel>

        <app-data-panel
          [cargando]="cargando()"
          [error]="error()"
          [vacio]="movimientos().length === 0"
          tituloVacio="Sin movimientos de monedas"
          descripcionVacia="Los movimientos de tu monedero se mostrarán aquí cuando existan."
          (alReintentar)="cargar()"
        >
          <div contenido class="card card-body">
            <div class="mb-6 flex items-center justify-between">
              <h3 class="text-lg font-bold text-marine-900">Historial de monedas</h3>
              <a routerLink="/estudiante/tienda" class="text-sm font-medium text-brand-700 hover:underline">Ir a tienda</a>
            </div>
            <ul class="space-y-2">
              @for (m of movimientos().slice(0, 8); track m.id) {
                <li class="flex items-center justify-between text-sm border-b border-surface-100 pb-2 last:border-0">
                  <span class="text-marine-700">{{ m.concepto }}</span>
                  <span class="font-semibold" [class.text-green-700]="m.monedas > 0" [class.text-red-700]="m.monedas < 0">
                    {{ m.monedas > 0 ? '+' : '' }}{{ m.monedas }}
                  </span>
                </li>
              }
            </ul>
          </div>
        </app-data-panel>
      </div>

      <app-data-panel
        [cargando]="cargando()"
        [error]="error()"
        [vacio]="compras().length === 0"
        tituloVacio="Sin compras virtuales"
        descripcionVacia="El historial de compras de la tienda aparecerá aquí."
        (alReintentar)="cargar()"
      >
        <div contenido class="card card-body">
          <div class="mb-6 flex items-center justify-between">
            <h3 class="text-lg font-bold text-marine-900">Compras virtuales</h3>
            <a routerLink="/estudiante/inventario" class="text-sm font-medium text-brand-700 hover:underline">Ver inventario</a>
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead><tr><th>Fecha</th><th>Cantidad</th><th>Monedas</th><th>XP</th></tr></thead>
              <tbody>
                @for (c of compras(); track c.id) {
                  <tr>
                    <td>{{ formatearFecha(c.creado_en) }}</td>
                    <td>{{ c.cantidad }}</td>
                    <td>{{ c.monedas_gastadas }}</td>
                    <td>{{ c.xp_gastado }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class RewardsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly gamification = inject(GamificationService);
  private readonly rewards = inject(RewardService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly monedero = signal<Monedero | null>(null);
  protected readonly insignias = signal<(InsigniaUsuario & { insignia: Insignia })[]>([]);
  protected readonly movimientos = signal<TransaccionMoneda[]>([]);
  protected readonly compras = signal<CompraVirtual[]>([]);

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
      const [monedero, insignias, movimientos, compras] = await Promise.all([
        this.gamification.obtenerMonedero(usuario.id),
        this.gamification.listarInsignias(usuario.id),
        this.gamification.listarHistorialMonedas(usuario.id, 20),
        this.rewards.listarCompras(usuario.id),
      ]);
      this.monedero.set(monedero);
      this.insignias.set(insignias);
      this.movimientos.set(movimientos);
      this.compras.set(compras);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar tus recompensas.');
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
