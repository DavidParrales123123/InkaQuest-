// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { EventoGamificacion, Monedero, Racha, ReglaProgresion, TransaccionMoneda, TransaccionXp } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-student-gamification',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Gamificación" descripcion="Tu XP, nivel, racha, monedas y reglas de progresión registradas por el sistema." [acciones]="true">
        <div acciones class="flex items-center gap-2 text-xs text-marine-400"><span>XP asignado automáticamente</span></div>
      </app-page-header>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <app-stat-card etiqueta="XP total" [valor]="auth.perfil()?.xp ?? 0" tono="gold" />
        <app-stat-card etiqueta="Nivel" [valor]="auth.perfil()?.nivel ?? 1" tono="brand" />
        <app-stat-card etiqueta="Racha actual" [valor]="racha()?.racha_actual ?? 0" detalle="días" tono="danger" />
        <app-stat-card etiqueta="Monedas" [valor]="monedero()?.saldo ?? 0" detalle="en tu monedero" tono="surface" />
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="false" (alReintentar)="cargar()">
        <div contenido class="grid gap-6 lg:grid-cols-2">
          <div class="card card-body">
            <h2 class="text-lg font-semibold text-marine-800">Historial de XP</h2>
            @if (xp().length === 0) {
              <p class="mt-3 text-sm text-marine-500">Aún no hay transacciones de XP registradas.</p>
            } @else {
              <ul class="mt-3 divide-y divide-surface-100 text-sm">
                @for (t of xp(); track t.id) {
                  <li class="flex items-center justify-between gap-3 py-2">
                    <span class="text-marine-700">{{ t.concepto }}</span>
                    <span class="font-semibold" [class.text-success-600]="t.xp > 0" [class.text-danger-600]="t.xp < 0">{{ t.xp > 0 ? '+' : '' }}{{ t.xp }}</span>
                  </li>
                }
              </ul>
            }
          </div>

          <div class="card card-body">
            <h2 class="text-lg font-semibold text-marine-800">Movimientos de monedas</h2>
            @if (monedas().length === 0) {
              <p class="mt-3 text-sm text-marine-500">No hay movimientos de monedas.</p>
            } @else {
              <ul class="mt-3 divide-y divide-surface-100 text-sm">
                @for (t of monedas(); track t.id) {
                  <li class="flex items-center justify-between gap-3 py-2">
                    <span class="text-marine-700">{{ t.concepto }}</span>
                    <span class="font-semibold" [class.text-success-600]="t.monedas > 0" [class.text-danger-600]="t.monedas < 0">{{ t.monedas > 0 ? '+' : '' }}{{ t.monedas }}</span>
                  </li>
                }
              </ul>
            }
          </div>

          <div class="card card-body">
            <h2 class="text-lg font-semibold text-marine-800">Racha</h2>
            @if (racha()) {
              <dl class="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><dt class="text-marine-400">Actual</dt><dd class="font-semibold text-marine-800">{{ racha()!.racha_actual }} días</dd></div>
                <div><dt class="text-marine-400">Mejor</dt><dd class="font-semibold text-marine-800">{{ racha()!.mejor_racha }} días</dd></div>
                <div><dt class="text-marine-400">Última actividad</dt><dd class="text-marine-700">{{ racha()!.ultima_actividad ? (racha()!.ultima_actividad | date: 'mediumDate') : 'Sin actividad' }}</dd></div>
              </dl>
            } @else {
              <p class="mt-3 text-sm text-marine-500">Aún no tienes una racha registrada. Completa actividades para iniciarla.</p>
            }
          </div>

          <div class="card card-body">
            <h2 class="text-lg font-semibold text-marine-800">Eventos activos</h2>
            @if (eventos().length === 0) {
              <p class="mt-3 text-sm text-marine-500">No hay eventos activos en este momento.</p>
            } @else {
              <ul class="mt-3 space-y-2 text-sm">
                @for (e of eventos(); track e.id) {
                  <li class="rounded-xl border border-surface-200 p-3">
                    <p class="font-medium text-marine-800">{{ e.nombre }}</p>
                    @if (e.descripcion) { <p class="text-marine-500">{{ e.descripcion }}</p> }
                    <p class="mt-1 text-xs text-marine-400">{{ e.fecha_inicio || 'Sin inicio' }} – {{ e.fecha_fin || 'Sin cierre' }}</p>
                  </li>
                }
              </ul>
            }
          </div>

          <div class="card card-body lg:col-span-2">
            <h2 class="text-lg font-semibold text-marine-800">Reglas de progresión</h2>
            @if (reglas().length === 0) {
              <p class="mt-3 text-sm text-marine-500">No hay reglas de progresión configuradas.</p>
            } @else {
              <div class="mt-3 table-wrap">
                <table class="table">
                  <thead><tr><th scope="col">Nombre</th><th scope="col">Tipo</th><th scope="col">XP requerido</th><th scope="col">Valor</th></tr></thead>
                  <tbody>
                    @for (r of reglas(); track r.id) {
                      <tr><td>{{ r.nombre }}</td><td>{{ r.tipo }}</td><td>{{ r.xp_requerido }}</td><td>{{ r.valor }}</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            }
            <p class="mt-3 text-xs text-marine-400">El XP y las recompensas los otorga el sistema, no este cliente. Fuente de verdad: PostgreSQL (RPC) y Spring Boot.</p>
          </div>
        </div>
      </app-data-panel>

      @if (error()) {
        <p class="rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700" role="alert">{{ error() }}</p>
      }
    </section>
  `,
})
export class GamificationComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly gamification = inject(GamificationService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly xp = signal<TransaccionXp[]>([]);
  protected readonly monedas = signal<TransaccionMoneda[]>([]);
  protected readonly racha = signal<Racha | null>(null);
  protected readonly monedero = signal<Monedero | null>(null);
  protected readonly eventos = signal<EventoGamificacion[]>([]);
  protected readonly reglas = signal<ReglaProgresion[]>([]);

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) {
      this.error.set('Debes iniciar sesión.');
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    try {
      const [xp, monedas, racha, monedero, eventos, reglas] = await Promise.all([
        this.gamification.listarHistorialXp(user.id).catch((e: unknown) => { console.warn('[InkaQuest] XP fallo:', e); return [] as TransaccionXp[]; }),
        this.gamification.listarHistorialMonedas(user.id).catch((e: unknown) => { console.warn('[InkaQuest] Monedas fallo:', e); return [] as TransaccionMoneda[]; }),
        this.gamification.obtenerRacha(user.id).catch((e: unknown) => { console.warn('[InkaQuest] Racha fallo:', e); return null; }),
        this.gamification.obtenerMonedero(user.id).catch((e: unknown) => { console.warn('[InkaQuest] Monedero fallo:', e); return null; }),
        this.gamification.listarEventos().catch((e: unknown) => { console.warn('[InkaQuest] Eventos fallo:', e); return [] as EventoGamificacion[]; }),
        this.gamification.listarReglasProgresion().catch((e: unknown) => { console.warn('[InkaQuest] Reglas fallo:', e); return [] as ReglaProgresion[]; }),
      ]);
      this.xp.set(xp);
      this.monedas.set(monedas);
      this.racha.set(racha);
      this.monedero.set(monedero);
      this.eventos.set(eventos);
      this.reglas.set(reglas);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar la gamificación.');
    } finally {
      this.cargando.set(false);
    }
  }
}
