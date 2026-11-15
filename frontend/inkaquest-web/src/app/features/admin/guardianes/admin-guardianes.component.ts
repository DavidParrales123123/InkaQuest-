// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

interface FilaAdmin {
  id: string;
  estudiante_id: string;
  nivel_id: string;
  estado: string;
  hordas_completadas: number;
  xp_recibido: number;
  monedas_recibidas: number;
  iniciado_en: string;
}

/**
 * Panel admin del videojuego. Sólo consulta; ninguna acción destructiva desde
 * aquí. Estadísticas generales: número de jugadores, intentos, victory rate,
 * monedas entregadas.
 */
@Component({
  selector: 'app-admin-guardianes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Guardianes — Estado global" descripcion="Métricas del videojuego. Sólo lectura. Para deshabilitar o habilitar el juego, usa permisos en configuración del sistema." />

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <app-stat-card etiqueta="Jugadores activos" [valor]="activos()" tono="brand" />
        <app-stat-card etiqueta="Intentos total" [valor]="intentosTotal()" tono="info" />
        <app-stat-card etiqueta="Victorias" [valor]="victorias()" tono="gold" />
        <app-stat-card etiqueta="Monedas repartidas" [valor]="monedasRepartidas()" tono="surface" />
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="intentos().length === 0" tituloVacio="Sin actividad todavía" descripcionVacia="Aún no hay intentos registrados. Cuando los estudiantes empiecen a jugar aparecerán aquí." (alReintentar)="cargar()">
        <div contenido class="space-y-3">
          <h2 class="text-base font-semibold text-marine-800">Últimos intentos (global)</h2>
          <div class="table-wrap overflow-x-auto rounded-xl border border-surface-200">
            <table class="table">
              <thead>
                <tr><th scope="col">Estudiante</th><th scope="col">Nivel</th><th scope="col">Estado</th><th scope="col">Hordas</th><th scope="col">XP</th><th scope="col">Monedas</th><th scope="col">Inicio</th></tr>
              </thead>
              <tbody>
                @for (fila of intentos(); track fila.id) {
                  <tr>
                    <td class="font-mono text-xs">{{ fila.estudiante_id.slice(0, 8) }}…</td>
                    <td><span class="font-mono">{{ nivelNumero(fila.nivel_id) }}</span></td>
                    <td>{{ fila.estado }}</td>
                    <td class="tabular-nums">{{ fila.hordas_completadas }}</td>
                    <td class="tabular-nums">{{ fila.xp_recibido }}</td>
                    <td class="tabular-nums">{{ fila.monedas_recibidas }}</td>
                    <td class="text-xs text-marine-500">{{ fila.iniciado_en.slice(0, 10) }}</td>
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
export class AdminGuardiansComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly intentos = signal<FilaAdmin[]>([]);
  protected readonly nivelMap = signal<Record<string, number>>({});

  protected readonly intentosTotal = () => this.intentos().length;
  protected readonly activos = () => new Set(this.intentos().map((i) => i.estudiante_id)).size;
  protected readonly victorias = () => this.intentos().filter((i) => i.estado === 'completado').length;
  protected readonly monedasRepartidas = () => this.intentos().reduce((s, i) => s + (i.monedas_recibidas ?? 0), 0);

  protected nivelNumero(id: string): string { return String(this.nivelMap()[id] ?? '?'); }

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const sb = this.supabase.client;
      const { data, error } = await sb.from('guardianes_intento').select('*').order('iniciado_en', { ascending: false }).limit(200);
      if (error) throw new Error(error.message);
      this.intentos.set((data ?? []) as FilaAdmin[]);
      const ids = Array.from(new Set((data ?? []).map((i: any) => i.nivel_id)));
      if (ids.length) {
        const { data: nvl } = await sb.from('guardianes_nivel').select('id, numero').in('id', ids);
        const map: Record<string, number> = {};
        (nvl ?? []).forEach((n: any) => { map[n.id] = n.numero; });
        this.nivelMap.set(map);
      }
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las métricas.'); }
    finally { this.cargando.set(false); }
  }
}
