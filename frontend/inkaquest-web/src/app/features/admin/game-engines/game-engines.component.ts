import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { GameService } from '../../../core/services/game.service';
import { Juego, Motor } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-game-engines',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Motores y juegos" descripcion="Motores registrados y catálogo de juegos de la plataforma." />
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="motores().length === 0 && juegos().length === 0" (alReintentar)="cargar()">
        <div contenido class="grid gap-6 lg:grid-cols-2">
          <div class="card card-body">
            <h2 class="text-lg font-semibold text-marine-800">Motores</h2>
            @if (motores().length === 0) { <p class="mt-2 text-sm text-marine-500">Sin motores registrados.</p> }
            @else { <ul class="mt-3 space-y-2 text-sm">@for (m of motores(); track m.id) { <li class="rounded bg-surface-50 p-3"><p class="font-medium">{{ m.nombre }}</p><p class="text-marine-500">{{ m.descripcion || 'Sin descripción.' }}</p></li> }</ul> }
          </div>
          <div class="card card-body">
            <h2 class="text-lg font-semibold text-marine-800">Juegos</h2>
            @if (juegos().length === 0) { <p class="mt-2 text-sm text-marine-500">Sin juegos registrados.</p> }
            @else { <ul class="mt-3 space-y-2 text-sm">@for (j of juegos(); track j.id) { <li class="rounded bg-surface-50 p-3"><p class="font-medium">{{ j.nombre }}</p><p class="text-marine-500">{{ j.descripcion || 'Sin descripción.' }}</p></li> }</ul> }
          </div>
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">Los motores de juego mantienen su lógica propia; la administración avanzada de versiones/configuración puede requerir herramientas backend.</p>
    </section>
  `,
})
export class GameEnginesComponent implements OnInit {
  private readonly gameService = inject(GameService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly motores = signal<Motor[]>([]);
  protected readonly juegos = signal<Juego[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const [m, j] = await Promise.all([this.gameService.listarMotores().catch(() => []), this.gameService.listarJuegos().catch(() => [])]);
      this.motores.set(m); this.juegos.set(j);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar motores/juegos.'); }
    finally { this.cargando.set(false); }
  }
}
