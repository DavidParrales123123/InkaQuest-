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
    <section class="space-y-10">
      <app-page-header titulo="Gamificación" descripcion="Tu XP, nivel, racha, monedas y reglas de progresión registradas por el sistema." />

      <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <app-stat-card etiqueta="XP total" [valor]="auth.perfil()?.xp ?? 0" [icono]="true" tono="gold"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Nivel" [valor]="auth.perfil()?.nivel ?? 1" [icono]="true" tono="brand"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Racha actual" [valor]="racha()?.racha_actual ?? 0" detalle="días" [icono]="true" tono="danger"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Monedas" [valor]="monedero()?.saldo ?? 0" [icono]="true" tono="surface"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6"/><path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/></svg></span></app-stat-card>
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="false" (alReintentar)="cargar()">
        <div contenido class="grid gap-8 lg:grid-cols-2">
          <div class="card card-body">
            <h2 class="text-lg font-semibold text-marine-800">Historial de XP</h2>
            @if (xp().length === 0) {
              <p class="mt-3 text-sm text-marine-500">Aún no hay transacciones de XP registradas.</p>
            } @else {
              <ul class="mt-3 space-y-2 text-sm">
                @for (t of xp(); track t.id) {
                  <li class="flex items-center justify-between gap-3 border-b border-surface-100 py-2 last:border-0">
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
              <ul class="mt-3 space-y-2 text-sm">
                @for (t of monedas(); track t.id) {
                  <li class="flex items-center justify-between gap-3 border-b border-surface-100 py-2 last:border-0">
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
                <div><dt class="text-marine-400">Ultima actividad</dt><dd class="text-marine-700">{{ racha()!.ultima_actividad | date: 'mediumDate' }}</dd></div>
              </dl>
            } @else {
              <p class="mt-3 text-sm text-marine-500">Aún no tienes una racha registrada. Completa actividades para iniciarla.</p>
            }
          </div>

          <div class="card card-body">
            <h2 class="text-lg font-semibold text-marine-800">Eventos activos</h2>
            @if (eventos().length === 0) {
              <p class="mt-3 text-sm text-marine-500">No hay eventos de gamificación activos en este momento.</p>
            } @else {
              <ul class="mt-3 space-y-2 text-sm">
                @for (e of eventos(); track e.id) {
                  <li class="rounded-button bg-surface-50 p-3">
                    <p class="font-medium text-marine-800">{{ e.nombre }}</p>
                    @if (e.descripcion) { <p class="text-marine-500">{{ e.descripcion }}</p> }
                    @if (e.fecha_inicio || e.fecha_fin) {
                      <p class="mt-1 text-xs text-marine-400">{{ e.fecha_inicio | date: 'shortDate' }} – {{ e.fecha_fin | date: 'shortDate' }}</p>
                    }
                  </li>
                }
              </ul>
            }
          </div>

          <div class="card card-body lg:col-span-2">
            <h2 class="text-lg font-semibold text-marine-800">Reglas de progresión (niveles)</h2>
            @if (reglas().length === 0) {
              <p class="mt-3 text-sm text-marine-500">No hay reglas de progresión configuradas.</p>
            } @else {
              <div class="mt-3 table-wrap">
                <table class="table">
                  <thead><tr><th>Nombre</th><th>Tipo</th><th>XP requerido</th><th>Valor</th></tr></thead>
                  <tbody>
                    @for (r of reglas(); track r.id) {
                      <tr><td>{{ r.nombre }}</td><td>{{ r.tipo }}</td><td>{{ r.xp_requerido }}</td><td>{{ r.valor }}</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            }
            <p class="mt-3 text-xs text-marine-400">El XP y las recompensas son otorgados por el sistema (funciones/RPC del backend y base de datos), no por el cliente.</p>
          </div>
        </div>
      </app-data-panel>
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
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      const [xp, monedas, racha, monedero, eventos, reglas] = await Promise.all([
        this.gamification.listarHistorialXp(user.id),
        this.gamification.listarHistorialMonedas(user.id),
        this.gamification.obtenerRacha(user.id),
        this.gamification.obtenerMonedero(user.id),
        this.gamification.listarEventos(),
        this.gamification.listarReglasProgresion(),
      ]);
      this.xp.set(xp); this.monedas.set(monedas); this.racha.set(racha); this.monedero.set(monedero); this.eventos.set(eventos); this.reglas.set(reglas);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar la gamificación.');
    } finally { this.cargando.set(false); }
  }
}
