// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { GamificationService } from '../../../core/services/gamification.service';
import { Ranking, Temporada } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-student-rankings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Rankings" descripcion="Clasificación por temporada. Los nombres no se muestran cuando las políticas de privacidad no lo permiten." />

      <div class="card card-body">
        <label class="label" for="temporada">Temporada</label>
        <select id="temporada" class="select max-w-sm" (change)="onTemporada($any($event.target).value)">
          <option value="">Selecciona una temporada</option>
          @for (t of temporadas(); track t.id) {
            <option [value]="t.id" [selected]="t.id === seleccionada()">{{ t.nombre }}</option>
          }
        </select>
      </div>

      <app-data-panel
        [cargando]="cargando()"
        [error]="error()"
        [vacio]="!seleccionada() || ranking().length === 0"
        [tituloVacio]="!seleccionada() ? 'Selecciona una temporada' : 'Sin posiciones'"
        [descripcionVacia]="!seleccionada() ? 'Elige una temporada para ver la tabla de clasificación.' : 'No hay registros de ranking para esta temporada o no son visibles.'"
        (alReintentar)="cargarRanking()"
      >
        <div contenido class="table-wrap">
          <table class="table">
            <thead><tr><th>#</th><th>Usuario</th><th>Puntos</th></tr></thead>
            <tbody>
              @for (r of ranking(); track r.id; let i = $index) {
                <tr [class.bg-brand-50]="esYo(r.usuario_id)">
                  <td>{{ i + 1 }}</td>
                  <td>
                    @if (esYo(r.usuario_id)) { <strong>Tu posicion</strong> } @else { <span class="text-marine-400">Participante</span> }
                  </td>
                  <td class="font-semibold">{{ r.puntos }}</td>
                </tr>
              }
            </tbody>
          </table>
          <p class="mt-3 text-xs text-marine-400">Por privacidad/RLS no se exponen nombres de otros usuarios; solo se resalta tu propia posicion cuando aplica.</p>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class RankingsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly gamification = inject(GamificationService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly temporadas = signal<Temporada[]>([]);
  protected readonly ranking = signal<Ranking[]>([]);
  protected readonly seleccionada = signal<string>('');

  ngOnInit(): void { void this.cargarTemporadas(); }

  protected esYo(id: string): boolean { return this.auth.usuario()?.id === id; }

  protected async cargarTemporadas(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const t = await this.gamification.listarTemporadas().catch(() => [] as Temporada[]);
      this.temporadas.set(t);
      const activa = t.find((x) => x.estado === 'activa' || x.estado === 'activo') ?? t[0];
      if (activa) { this.seleccionada.set(activa.id); await this.cargarRanking(); }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las temporadas.');
    } finally { this.cargando.set(false); }
  }

  protected onTemporada(id: string): void { this.seleccionada.set(id); void this.cargarRanking(); }

  protected async cargarRanking(): Promise<void> {
    if (!this.seleccionada()) { this.ranking.set([]); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      this.ranking.set(await this.gamification.listarRanking(this.seleccionada()).catch(() => [] as Ranking[]));
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el ranking.');
    } finally { this.cargando.set(false); }
  }
}
