// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { GamificationService } from '../../../core/services/gamification.service';
import { EventoGamificacion, Mision, ReglaProgresion, Temporada } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-gamification',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Gamificación" descripcion="Reglas, temporadas, misiones y eventos del sistema." />
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="reglas().length === 0 && temporadas().length === 0 && misiones().length === 0 && eventos().length === 0" (alReintentar)="cargar()">
        <div contenido class="grid gap-6 lg:grid-cols-2">
          <div class="card card-body"><h2 class="text-lg font-semibold">Reglas de progresión</h2>
            @if (reglas().length === 0) { <p class="mt-2 text-sm text-marine-500">Sin reglas.</p> } @else { <ul class="mt-3 space-y-2 text-sm">@for (r of reglas(); track r.id) { <li class="rounded bg-surface-50 p-2">{{ r.nombre }} ({{ r.tipo }}): {{ r.xp_requerido }} XP</li> }</ul> }
          </div>
          <div class="card card-body"><h2 class="text-lg font-semibold">Temporadas</h2>
            @if (temporadas().length === 0) { <p class="mt-2 text-sm text-marine-500">Sin temporadas.</p> } @else { <ul class="mt-3 space-y-2 text-sm">@for (t of temporadas(); track t.id) { <li class="rounded bg-surface-50 p-2">{{ t.nombre }} ({{ t.estado }})</li> }</ul> }
          </div>
          <div class="card card-body"><h2 class="text-lg font-semibold">Misiones</h2>
            @if (misiones().length === 0) { <p class="mt-2 text-sm text-marine-500">Sin misiones activas.</p> } @else { <ul class="mt-3 space-y-2 text-sm">@for (m of misiones(); track m.id) { <li class="rounded bg-surface-50 p-2">{{ m.nombre }}</li> }</ul> }
          </div>
          <div class="card card-body"><h2 class="text-lg font-semibold">Eventos</h2>
            @if (eventos().length === 0) { <p class="mt-2 text-sm text-marine-500">Sin eventos activos.</p> } @else { <ul class="mt-3 space-y-2 text-sm">@for (e of eventos(); track e.id) { <li class="rounded bg-surface-50 p-2">{{ e.nombre }} @if (e.fecha_inicio || e.fecha_fin) { <span class="text-marine-500">({{ e.fecha_inicio || 'sin fecha' }} · {{ e.fecha_fin || 'sin fecha' }})</span> }</li> }</ul> }
          </div>
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">La configuración y otorgamiento de recompensas se ejecutan de forma autoritativa en base de datos/backend.</p>
    </section>
  `,
})
export class GamificationComponent implements OnInit {
  private readonly gamification = inject(GamificationService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly reglas = signal<ReglaProgresion[]>([]);
  protected readonly temporadas = signal<Temporada[]>([]);
  protected readonly misiones = signal<Mision[]>([]);
  protected readonly eventos = signal<EventoGamificacion[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const [r, t, m, e] = await Promise.all([
        this.gamification.listarReglasProgresion().catch(() => []),
        this.gamification.listarTemporadas().catch(() => []),
        this.gamification.listarMisiones().catch(() => []),
        this.gamification.listarEventos().catch(() => []),
      ]);
      this.reglas.set(r); this.temporadas.set(t); this.misiones.set(m); this.eventos.set(e);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo cargar la gamificación.'); }
    finally { this.cargando.set(false); }
  }
}
