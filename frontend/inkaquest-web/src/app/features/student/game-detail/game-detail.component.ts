// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { GameService } from '../../../core/services/game.service';
import { ConfiguracionJuego, Juego, Motor } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-student-game-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header [titulo]="juego()?.nombre || 'Minijuego'" descripcion="Información del juego/motor y configuración visible. Si el juego está asignado a tu aula, puedes jugarlo desde Minijuegos." [acciones]="true">
        <div acciones><a routerLink="/estudiante/minijuegos" class="btn btn-outline btn-sm">Volver a minijuegos</a></div>
      </app-page-header>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="!juego()" tituloVacio="Juego no disponible" descripcionVacia="No se encontró el juego o no tienes acceso." (alReintentar)="cargar()">
        <div contenido class="space-y-6">
          @if (juego(); as j) {
            <div class="card card-body space-y-2">
              <div class="flex flex-wrap gap-2 text-sm"><span class="badge badge-default">Dificultad: {{ j.dificultad }}</span><span class="badge badge-default">{{ j.xp_otorgado }} XP</span><span class="badge badge-default">{{ j.monedas_otorgadas }} monedas</span><span class="badge badge-default">Estado: {{ j.estado }}</span></div>
              <p class="text-marine-700">{{ j.descripcion || 'Sin descripción.' }}</p>
              <p class="text-sm text-marine-600">Motor: {{ j.motor?.nombre || '—' }} @if (j.motor?.descripcion) { · {{ j.motor!.descripcion }} }</p>
            </div>
            <div class="card card-body space-y-2">
              <h2 class="font-semibold text-marine-800">Configuración del juego (lectura)</h2>
              @if (config().length === 0) { <p class="text-sm text-marine-500">Sin configuraciones visibles.</p> }
              @else { <ul class="space-y-2 text-sm">@for (c of config(); track c.id) { <li class="rounded border border-surface-200 p-2"><p class="font-medium">{{ c.clave }}</p><p class="text-marine-600 break-words">{{ valor(c.valor) }}</p></li> }</ul> }
            </div>
            <div class="rounded-xl border border-gold-200 bg-gold-50 p-4 text-sm text-marine-700">Para jugar, tu docente debe asignar este juego a una de tus lecciones (sección Minijuegos/Actividades del aula). Al abrirlo desde “▶ Jugar” se crea un intento, se ejecuta el juego y el servidor registra tu puntaje, XP y recompensas de forma segura.</div>
          }
        </div>
      </app-data-panel>
    </section>
  `,
})
export class GameDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly gameService = inject(GameService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly juego = signal<(Juego & { motor?: Motor | null }) | null>(null);
  protected readonly config = signal<ConfiguracionJuego[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected valor(v: any): string { try { return typeof v === 'string' ? v : JSON.stringify(v); } catch { return String(v); } }
  protected async cargar(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set('Juego no especificado.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      const [j, c] = await Promise.all([this.gameService.obtenerJuego(id), this.gameService.listarConfiguracionJuego(id).catch(() => [] as ConfiguracionJuego[])]);
      this.juego.set(j); this.config.set(c);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el juego.'); }
    finally { this.cargando.set(false); }
  }
}
