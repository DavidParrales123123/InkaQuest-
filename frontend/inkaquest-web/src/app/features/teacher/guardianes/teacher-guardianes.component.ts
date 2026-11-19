// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';
import { GuardianesRankingComponent } from '../../guardianes/ranking-guardianes.component';

interface IntentoFila {
  id: string;
  estudiante_id: string;
  nivel_id: string;
  estado: string;
  hordas_completadas: number;
  puntaje: number;
  precision: number;
  tiempo_segundos: number;
  xp_recibido: number;
  monedas_recibidas: number;
  iniciado_en: string;
}

/**
 * Seguimiento de progreso del videojuego para el docente (READONLY).
 *
 * Solo puede ver a estudiantes de sus cursos asignados. No puede tocar ni
 * falsificar resultados, partidas, ni preguntas.
 */
@Component({
  selector: 'app-teacher-guardianes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataPanelComponent, PageHeaderComponent, StatCardComponent, GuardianesRankingComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Seguimiento del Videojuego" descripcion="Progreso de tus estudiantes en Guardianes del Conocimiento. Consulta intentos, XP y niveles completados. No puedes modificar ni falsificar resultados." />

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <app-stat-card etiqueta="Estudiantes con avance" [valor]="estudiantesConAvance()" tono="brand" />
        <app-stat-card etiqueta="Niveles completados" [valor]="nivelesCompletados()" tono="gold" />
        <app-stat-card etiqueta="Intentos total" [valor]="intentos().length" tono="info" />
        <app-stat-card etiqueta="Victorias registradas" [valor]="victoriasContadas()" tono="success" />
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="intentosFiltrados().length === 0" tituloVacio="Aún no hay intentos jugados" descripcionVacio="Cuando un estudiante empiece a jugar, sus partidas aparecerán aquí." (alReintentar)="cargar()">
        <div contenido class="space-y-3">
          <h2 class="text-base font-semibold text-marine-800">Detalle por estudiante · nivel</h2>
          <input
            type="search"
            class="w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm text-marine-800 placeholder:text-marine-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            [value]="filtroIntentos()"
            (input)="onFiltroChange($event)"
            placeholder="Filtra por estudiante, nivel, estado o puntaje…"
          />
          <div class="table-wrap overflow-x-auto rounded-xl border border-surface-200">
            <table class="table">
              <thead>
                <tr><th scope="col">Estudiante</th><th scope="col">Nivel</th><th scope="col">Estado</th><th scope="col">Hordas</th><th scope="col">Puntaje</th><th scope="col">Tiempo</th><th scope="col">Precisión</th><th scope="col">XP ganada</th></tr>
              </thead>
              <tbody>
                @for (fila of intentosFiltrados(); track fila.id) {
                  <tr>
                    <td class="font-medium text-marine-800">{{ estudianteNombre(fila.estudiante_id) }}</td>
                    <td><span class="font-mono">{{ nivelNumero(fila.nivel_id) }}</span></td>
                    <td><span class="badge" [class.badge-success]="fila.estado === 'completado'" [class.badge-neutral]="fila.estado !== 'completado'">{{ fila.estado }}</span></td>
                    <td class="tabular-nums">{{ fila.hordas_completadas }}</td>
                    <td class="tabular-nums">{{ fila.puntaje }}</td>
                    <td class="tabular-nums">{{ formatearDuracion(fila.tiempo_segundos) }}</td>
                    <td class="tabular-nums">{{ formatearPrecision(fila.precision) }}</td>
                    <td class="tabular-nums font-semibold text-gold-700">+{{ fila.xp_recibido }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (hayMasIntentos()) {
            <button type="button" class="w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-semibold text-marine-800 transition hover:bg-surface-50" (click)="verMas()">
              Ver más
            </button>
          }
          <p class="text-xs text-marine-500">Sólo se muestran intentos de estudiantes matriculados en los cursos que tienes asignados a tu cargo. Los datos son de solo lectura.</p>
        </div>
      </app-data-panel>

      <!-- Ranking del curso: quién está en el nivel más alto + mejores tiempos -->
      <app-ranking-guardianes />
    </section>
  `,
})
export class TeacherGuardiansComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly supabase = inject(SupabaseService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly intentos = signal<IntentoFila[]>([]);
  protected readonly perfiles = signal<Record<string, { nombre: string; email: string }>>({});
  protected readonly nivelNombres = signal<Record<string, number>>({});

  protected readonly limiteIntentos = signal(20);
  protected readonly hayMasIntentos = signal(false);
  protected readonly offsetIntentos = signal(0);
  protected readonly filtroIntentos = signal('');

  protected readonly intentosOrdenados = () => [...this.intentos()].sort((a, b) => a.iniciado_en < b.iniciado_en ? 1 : -1);

  protected readonly intentosFiltrados = computed(() => {
    const f = this.filtroIntentos().trim().toLowerCase();
    const lista = this.intentosOrdenados();
    if (!f) return lista;
    return lista.filter((i) => {
      const p = this.perfiles()[i.estudiante_id];
      const nombre = `${p?.nombre ?? ''} ${p?.email ?? ''}`.toLowerCase();
      const nivel = String(this.nivelNombres()[i.nivel_id] ?? '');
      const estado = (i.estado ?? '').toLowerCase();
      const num = String(i.puntaje ?? '');
      const hordas = String(i.hordas_completadas ?? '');
      return nombre.includes(f) || estado.includes(f) || nivel.includes(f) || num.includes(f) || hordas.includes(f);
    });
  });
  protected readonly estudiantesConAvance = () => new Set(this.intentos().map((i) => i.estudiante_id)).size;
  protected readonly nivelesCompletados = () => this.intentos().filter((i) => i.estado === 'completado').length;
  protected readonly victoriasContadas = () => this.nivelesCompletados();

  ngOnInit(): void { void this.cargar(); }

  protected estudianteNombre(id: string): string {
    const p = this.perfiles()[id];
    return p ? (p.nombre || p.email?.split('@')[0] || id.slice(0, 8)) : id.slice(0, 8);
  }

  protected nivelNumero(id: string): string { return String(this.nivelNombres()[id] ?? '?'); }

  protected formatearDuracion(seg: number): string {
    if (!seg || !Number.isFinite(seg)) return '—';
    const m = Math.floor(seg / 60);
    const s = Math.max(0, Math.trunc(seg % 60));
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  protected formatearPrecision(p: number): string {
    const v = Number(p);
    if (!Number.isFinite(v)) return '—';
    return `${Math.round(v)}%`;
  }

  protected async cargar(off: number = 0): Promise<void> {
    this.offsetIntentos.set(off);
    this.cargando.set(true); this.error.set(null);
    try {
      const user = this.auth.usuario();
      if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
      const { data, error } = await this.supabase.client
        .from('guardianes_intento')
        .select('*')
        .order('iniciado_en', { ascending: false })
        .range(off, off + this.limiteIntentos() - 1);
      if (error) throw new Error(error.message);
      let filas = (data ?? []) as IntentoFila[];
      const cursos = await this.teacherService.listarMisCursos(user.id);
      if (cursos.length > 0) {
        const estudiantesPorCurso = await this.teacherService.listarEstudiantesPorCurso(user.id);
        const ids = new Set<string>();
        for (const { estudiantes } of estudiantesPorCurso) {
          for (const est of estudiantes) {
            if (est && est.id) ids.add(est.id);
          }
        }
        filas = filas.filter((f) => ids.has(f.estudiante_id));
      }
      this.intentos.set(filas);
      this.hayMasIntentos.set((data?.length ?? 0) >= this.limiteIntentos());
      const ids = Array.from(new Set(filas.map((i) => i.estudiante_id)));
      if (ids.length) {
        const { data: perfs } = await this.supabase.client.from('perfil').select('id, nombre, email').in('id', ids);
        const map: Record<string, { nombre: string; email: string }> = {};
        (perfs ?? []).forEach((p) => { map[p.id] = { nombre: p.nombre ?? '', email: p.email ?? '' }; });
        this.perfiles.set(map);
      }
      const nivelIds = Array.from(new Set(filas.map((i) => i.nivel_id)));
      if (nivelIds.length) {
        const { data: nvl } = await this.supabase.client.from('guardianes_nivel').select('id, numero').in('id', nivelIds);
        const map: Record<string, number> = {};
        (nvl ?? []).forEach((n) => { map[n.id] = n.numero; });
        this.nivelNombres.set(map);
      }
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los datos.'); }
    finally { this.cargando.set(false); }
  }

  protected async verMas(): Promise<void> {
    await this.cargar(this.offsetIntentos() + this.limiteIntentos());
  }

  protected onFiltroChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filtroIntentos.set(input.value);
  }
}
