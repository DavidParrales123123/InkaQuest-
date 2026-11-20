// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';

import { SupabaseService } from '../../core/services/supabase.service';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';

interface RankingFila {
  estudiante_id: string;
  nombre: string | null;
  apellido: string | null;
  avatar_url: string | null;
  nivel_max: number;
  victorias: number;
  xp_total: number;
  es_yo: boolean;
}
interface MejorTiempoFila {
  nivel_numero: number;
  nombre: string | null;
  apellido: string | null;
  tiempo_segundos: number;
  es_yo: boolean;
}

/**
 * Ranking de Guardianes del Conocimiento para el curso Principios de Algoritmos.
 *
 * <p>Muestra, visible solo para participantes del curso:
 * <ul>
 *   <li>El nivel máximo superado por cada estudiante (y sus victorias/XP totales).</li>
 *   <li>El mejor tiempo registrado con victoria por nivel.</li>
 * </ul>
 * Quién encabeza siempre es seguro: los datos salen de guardianes_ranking() y
 * guardianes_mejores_tiempos() (security definer), que validan la matrícula/asignación del curso.</p>
 */
@Component({
  selector: 'app-ranking-guardianes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatCardComponent],
  template: `
    <section class="card card-body space-y-4">
      <header class="flex flex-wrap items-end justify-between gap-2">
        <div>
          <span class="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-gold-600">
            <svg viewBox="0 0 24 24" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a1 1 0 0 0-1 1c0 2.2 1.3 4 4 4M17 6h3a1 1 0 0 1 1 1c0 2.2-1.3 4-4 4"/></svg>
            Ranking de Guardianes
          </span>
          <h2 class="mt-2 text-lg font-extrabold text-marine-800">La tabla del curso</h2>
          <p class="text-sm text-marine-500">Nivel máximo superado y mejor tiempo por nivel. Se actualiza con cada victoria.</p>
        </div>
      </header>

      @if (cargando()) {
        <p class="py-6 text-center text-sm text-marine-400">Cargando ranking…</p>
      } @else if (error()) {
        <p class="rounded-xl border border-warning-300 bg-warning-50 px-4 py-3 text-sm text-warning-800" role="alert">{{ error() }}</p>
      } @else {
        <div class="grid gap-6 xl:grid-cols-12">
          <!-- Mayor nivel superado -->
          <div class="xl:col-span-7">
            <p class="text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-marine-400">Mayor nivel superado</p>
            @if (ranking().length === 0) {
              <p class="mt-2 text-sm text-marine-500">Aún nadie ha vencido la horda 9. Sé el primero en aparecer aquí.</p>
            } @else {
              <div class="mt-2 overflow-x-auto">
                <table class="table table-responsive text-sm">
                  <thead>
                    <tr><th>#</th><th>Jugador</th><th>Nivel más alto</th><th>Victorias</th><th>XP juego</th></tr>
                  </thead>
                  <tbody>
                    @for (r of ranking(); track r.estudiante_id; let i = $index) {
                      <tr [class.bg-gold-50]="r.es_yo">
                        <td class="font-extrabold" data-label="#">{{ i + 1 }}</td>
                        <td data-label="Jugador"><span class="flex items-center gap-2">
                            <span class="grid size-8 shrink-0 place-items-center rounded-full bg-marine-800 text-[0.62rem] font-extrabold uppercase text-gold-300">{{ iniciales(r) }}</span>
                            <span class="font-semibold text-marine-800">{{ nombre(r) }}</span>
                            @if (r.es_yo) { <span class="rounded-full bg-gold-500 px-2 py-0.5 text-[0.55rem] font-extrabold uppercase tracking-wider text-marine-900">Tú</span> }
                          </span>
                        </td>
                        <td class="font-bold text-marine-800" data-label="Nivel">Nv. {{ r.nivel_max }}</td>
                        <td data-label="Victorias">{{ r.victorias }}</td>
                        <td data-label="XP">{{ r.xp_total }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <!-- Mejores tiempos por nivel -->
          <div class="xl:col-span-5">
            <p class="text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-marine-400">Mejor tiempo por nivel</p>
            <p class="mt-0.5 text-[0.7rem] text-marine-500">El estudiante que completó cada nivel más rápido (victoria).</p>
            @if (mejores().length === 0) {
              <p class="mt-2 text-sm text-marine-500">Aún no hay tiempos registrados.</p>
            } @else {
              <ul class="mt-2 space-y-1.5">
                @for (t of mejores(); track t.nivel_numero) {
                  <li class="flex items-center justify-between gap-2 rounded-xl border border-surface-200 px-3 py-2 text-sm" [class.border-gold-400]="t.es_yo">
                    <span class="flex items-center gap-2">
                      <span class="grid size-7 shrink-0 place-items-center rounded-lg bg-marine-900 text-[0.65rem] font-extrabold text-gold-300">Nv.{{ t.nivel_numero }}</span>
                      <span class="font-semibold text-marine-800">{{ nombre(t) }}</span>
                    </span>
                    <span class="font-mono font-bold text-marine-800">{{ fmt(t.tiempo_segundos) }}</span>
                  </li>
                }
              </ul>
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class GuardianesRankingComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly filas = signal<RankingFila[]>([]);
  protected readonly tiempos = signal<MejorTiempoFila[]>([]);

  protected readonly ranking = computed(() =>
    [...this.filas()]
      .filter((f) => f.victorias > 0 || f.nivel_max > 0)
      .sort((a, b) => (b.nivel_max - a.nivel_max) || (b.victorias - a.victorias) || (b.xp_total - a.xp_total)),
  );
  protected readonly mejores = computed(() =>
    [...this.tiempos()].sort((a, b) => a.nivel_numero - b.nivel_numero),
  );

  ngOnInit(): void { void this.cargar(); }

  protected iniciales(r: { nombre: string | null; apellido: string | null }): string {
    const n = (r.nombre ?? '').trim();
    const a = (r.apellido ?? '').trim();
    const i1 = n ? n[0] : '?';
    const i2 = a ? a[0] : n.length > 1 ? n[1] : '';
    return (i1 + i2).toUpperCase();
  }

  protected nombre(r: { nombre: string | null; apellido: string | null }): string {
    const n = (r.nombre ?? '').trim();
    const a = (r.apellido ?? '').trim();
    return [n, a].filter(Boolean).join(' ') || 'Estudiante';
  }

  protected fmt(segundos: number): string {
    const m = Math.floor(segundos / 60);
    const s = Math.max(0, Math.trunc(segundos % 60));
    return `${m}:${String(s).padStart(2, '0')} min`;
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const sb = this.supabase.client;
      const [{ data: rank, error: e1 }, { data: tiempos, error: e2 }] = await Promise.all([
        sb.rpc('guardianes_ranking'),
        sb.rpc('guardianes_mejores_tiempos'),
      ]);
      if (e1) throw new Error(e1.message);
      if (e2) throw new Error(e2.message);
      this.filas.set((rank ?? []) as RankingFila[]);
      this.tiempos.set((tiempos ?? []) as MejorTiempoFila[]);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el ranking.');
    } finally {
      this.cargando.set(false);
    }
  }
}
