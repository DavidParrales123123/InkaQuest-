// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

interface IntentoFila {
  id: string;
  estudiante_id: string;
  nivel_id: string;
  estado: string;
  hordas_completadas: number;
  puntaje: number;
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
  imports: [DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Seguimiento del Videojuego" descripcion="Progreso de tus estudiantes en Guardianes del Conocimiento. Consulta intentos, XP y niveles completados. No puedes modificar ni falsificar resultados." />

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <app-stat-card etiqueta="Estudiantes con avance" [valor]="estudiantesConAvance()" tono="brand" />
        <app-stat-card etiqueta="Niveles completados" [valor]="nivelesCompletados()" tono="gold" />
        <app-stat-card etiqueta="Intentos total" [valor]="intentos().length" tono="info" />
        <app-stat-card etiqueta="Victorias registradas" [valor]="victoriasContadas()" tono="success" />
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="intentos().length === 0" tituloVacio="Aún no hay intentos jugados" descripcionVacia="Cuando un estudiante empiece a jugar, sus partidas aparecerán aquí." (alReintentar)="cargar()">
        <div contenido class="space-y-3">
          <h2 class="text-base font-semibold text-marine-800">Detalle por estudiante · nivel</h2>
          <div class="table-wrap overflow-x-auto rounded-xl border border-surface-200">
            <table class="table">
              <thead>
                <tr><th scope="col">Estudiante</th><th scope="col">Nivel</th><th scope="col">Estado</th><th scope="col">Hordas</th><th scope="col">Puntaje</th><th scope="col">Tiempo</th><th scope="col">XP ganada</th></tr>
              </thead>
              <tbody>
                @for (fila of intentosOrdenados(); track fila.id) {
                  <tr>
                    <td class="font-medium text-marine-800">{{ estudianteNombre(fila.estudiante_id) }}</td>
                    <td><span class="font-mono">{{ nivelNumero(fila.nivel_id) }}</span></td>
                    <td><span class="badge" [class.badge-success]="fila.estado === 'completado'" [class.badge-neutral]="fila.estado !== 'completado'">{{ fila.estado }}</span></td>
                    <td class="tabular-nums">{{ fila.hordas_completadas }}</td>
                    <td class="tabular-nums">{{ fila.puntaje }}</td>
                    <td class="tabular-nums">{{ formatearDuracion(fila.tiempo_segundos) }}</td>
                    <td class="tabular-nums font-semibold text-gold-700">+{{ fila.xp_recibido }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <p class="text-xs text-marine-500">Sólo se muestran intentos de estudiantes matriculados en los cursos que tienes asignados a tu cargo. Los datos son de solo lectura.</p>
        </div>
      </app-data-panel>
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

  protected readonly intentosOrdenados = () => [...this.intentos()].sort((a, b) => a.iniciado_en < b.iniciado_en ? 1 : -1);
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

  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const user = this.auth.usuario();
      if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
      const { data, error } = await this.supabase.client
        .from('guardianes_intento')
        .select('*')
        .order('iniciado_en', { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      this.intentos.set((data ?? []) as IntentoFila[]);
      // Cargar perfiles
      const ids = Array.from(new Set((data ?? []).map((i: any) => i.estudiante_id)));
      if (ids.length) {
        const { data: perfs } = await this.supabase.client.from('perfil').select('id, nombre, email').in('id', ids);
        const map: Record<string, { nombre: string; email: string }> = {};
        (perfs ?? []).forEach((p: any) => { map[p.id] = { nombre: p.nombre ?? '', email: p.email ?? '' }; });
        this.perfiles.set(map);
      }
      // Cargar numers de nivel
      const nivelIds = Array.from(new Set((data ?? []).map((i: any) => i.nivel_id)));
      if (nivelIds.length) {
        const { data: nvl } = await this.supabase.client.from('guardianes_nivel').select('id, numero').in('id', nivelIds);
        const map: Record<string, number> = {};
        (nvl ?? []).forEach((n: any) => { map[n.id] = n.numero; });
        this.nivelNombres.set(map);
      }
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los datos.'); }
    finally { this.cargando.set(false); }
  }
}
