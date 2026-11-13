// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { ActivityService } from '../../../core/services/activity.service';
import { CourseService } from '../../../core/services/course.service';
import {
  Actividad,
  Calificacion,
  Entrega,
  EntregaArchivo,
  Tarea,
  TareaArchivo,
} from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

/**
 * Tareas del estudiante (al estilo universidad).
 *
 * <ul>
 *   <li>Se muestran encabezado y adjuntos del docente (PDF/Word/Excel/PPT/ZIP).</li>
 *   <li>Describe la entrega y adjunta tus archivos — NO se aceptan envíos fuera
 *       del plazo aunque tu docente haya escrito una fecha de límite.</li>
 *   <li>Verás tus notas registradas abajo.</li>
 * </ul>
 */
@Component({
  selector: 'app-student-assignments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Tareas" descripcion="Consulta tus tareas pendientes y entrégalas con descripción y archivo. No se aceptan entregas después de la fecha límite." [acciones]="true">
        <div acciones><button class="btn btn-outline btn-sm" type="button" (click)="cargar()" [disabled]="cargando()">Actualizar</button></div>
      </app-page-header>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="tareas().length === 0 && calificaciones().length === 0" tituloVacio="Aún no hay tareas" descripcionVacia="Todavía no hay tareas publicadas en tus cursos. Cuando tu docente publique una tarea, aparecerá aquí para que la entregues. Mientras tanto, revisa «Unidades» y «Actividades» para tu contenido y tus pendientes." (alReintentar)="cargar()">
        <div contenido class="space-y-6">
          <!-- ════ Filtros: curso y estado ════ -->
          @let misCursos = cursosDeTareas();
          @if (misCursos.length > 1) {
            <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-surface-100 bg-surface-50 p-3">
              <div class="flex flex-wrap gap-2" role="tablist" aria-label="Curso">
                <button type="button" class="shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-all" [class.border-brand-500]="filtroCurso() === null" [class.bg-brand-500]="filtroCurso() === null" [class.text-white]="filtroCurso() === null" [class.border-surface-200]="filtroCurso() !== null" [class.bg-white]="filtroCurso() !== null" [class.text-marine-700]="filtroCurso() !== null" (click)="filtroCurso.set(null)">Todos ({{ tareas().length }})</button>
                @for (c of misCursos; track c.id) {
                  <button type="button" class="shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-all" [class.border-brand-500]="filtroCurso() === c.id" [class.bg-brand-500]="filtroCurso() === c.id" [class.text-white]="filtroCurso() === c.id" [class.border-surface-200]="filtroCurso() !== c.id" [class.bg-white]="filtroCurso() !== c.id" [class.text-marine-700]="filtroCurso() !== c.id" (click)="filtroCurso.set(c.id)">{{ c.titulo }} ({{ contarPorCurso(c.id) }})</button>
                }
              </div>
              @if (filtroCurso()) { <button type="button" class="btn btn-outline btn-sm" (click)="filtroCurso.set(null)">Limpiar</button> }
            </div>
          }
          <div class="flex flex-wrap gap-2 border-b border-surface-200 pb-3 text-sm font-bold" role="tablist" aria-label="Estado de entrega">
            <button type="button" class="rounded-lg px-3 py-1.5" [class.bg-marine-800]="tab() === 'todas'" [class.text-white]="tab() === 'todas'" [class.text-marine-600]="tab() !== 'todas'" (click)="tab.set('todas')">Todas ({{ tareasVisibles().length }})</button>
            <button type="button" class="rounded-lg px-3 py-1.5" [class.bg-marine-800]="tab() === 'pendientes'" [class.text-white]="tab() === 'pendientes'" [class.text-marine-600]="tab() !== 'pendientes'" (click)="tab.set('pendientes')">Pendientes ({{ contarTab('pendientes') }})</button>
            <button type="button" class="rounded-lg px-3 py-1.5" [class.bg-marine-800]="tab() === 'entregadas'" [class.text-white]="tab() === 'entregadas'" [class.text-marine-600]="tab() !== 'entregadas'" (click)="tab.set('entregadas')">Entregadas ({{ contarTab('entregadas') }})</button>
            <button type="button" class="rounded-lg px-3 py-1.5" [class.bg-marine-800]="tab() === 'calificadas'" [class.text-white]="tab() === 'calificadas'" [class.text-marine-600]="tab() !== 'calificadas'" (click)="tab.set('calificadas')">Calificadas ({{ contarTab('calificadas') }})</button>
          </div>

          <div>
            <h2 class="text-lg font-semibold text-marine-800">Tareas por curso</h2>
            @if (tareas().length === 0) {
              <p class="mt-2 text-sm text-marine-500">No se encontraron tareas publicadas en tus cursos.</p>
            } @else if (tareasVisibles().length === 0) {
              <p class="mt-2 text-sm text-marine-500">No hay tareas en este filtro. Prueba «Todas» u otro curso.</p>
            } @else {
              <div class="mt-3 space-y-4">                @for (t of tareasVisibles(); track t.id) {
                  <article class="card card-body space-y-3">
                    <div class="flex flex-wrap items-start justify-between gap-2">
                      <div class="min-w-0">
                        <p class="font-semibold text-marine-800">{{ t.actividad.titulo }}</p>
                        <p class="mt-1 text-sm text-marine-500">{{ t.actividad.descripcion || t.actividad.instrucciones || 'Sin instrucciones adicionales.' }}</p>
                        <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-marine-500">
                          <span>Entrega:</span>
                          @if (t.entrega) { <app-status-badge [estado]="t.entrega.estado" /> } @else { <span class="badge badge-neutral">Sin entregar</span> }
                          @if (t.fecha_entrega) { <span>· Fecha límite: {{ t.fecha_entrega | date:'medium' }}</span> }
                          <span>· Nota sobre {{ t.nota_maxima }}</span>
                        </div>
                        <p class="mt-1 text-[0.7rem] text-marine-400">Publicada: {{ t.creado_en | date:'medium' }}</p>
                      </div>
                      @if (t.entrega?.nota !== null && t.entrega?.nota !== undefined) { <span class="badge badge-gold">Nota: {{ t.entrega!.nota }}</span> }
                    </div>

                    @if ((adjuntosDeTarea()[t.id] ?? []).length > 0) {
                      <div class="rounded-lg border border-surface-100 bg-surface-50 p-3">
                        <p class="text-xs font-bold uppercase tracking-wider text-marine-500">Material adjunto del docente</p>
                        <ul class="mt-2 flex flex-wrap gap-2">
                          @for (a of adjuntosDeTarea()[t.id] ?? []; track a.id) {
                            <li>
                              <button type="button" class="btn btn-outline btn-sm" (click)="descargarAdjuntoTarea(a)">↓ {{ a.nombre }} <span class="ml-1 text-marine-400">{{ tamanoKb(a.tamano_bytes) }}</span></button>
                            </li>
                          }
                        </ul>
                      </div>
                    }

                    @if (t.entrega?.contenido) {
                      <div class="rounded-lg bg-surface-50 p-3 text-sm text-marine-700">
                        <p class="font-medium text-marine-800 mb-1">Tu entrega registrada</p>
                        <p class="whitespace-pre-wrap break-words">{{ t.entrega!.contenido }}</p>
                        @if (t.entrega?.enviada_en) { <p class="mt-2 text-xs text-marine-500">Enviada: {{ t.entrega!.enviada_en | date:'medium' }}</p> }
                      </div>
                    }

                    @if ((archivosDeMiEntrega()[t.id] ?? []).length > 0) {
                      <div class="rounded-lg border border-brand-200 bg-brand-50/50 p-3">
                        <p class="text-xs font-bold uppercase tracking-wider text-brand-700">Tus archivos adjuntos</p>
                        <ul class="mt-2 flex flex-wrap gap-2">
                          @for (a of archivosDeMiEntrega()[t.id] ?? []; track a.id) {
                            <li class="flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs">
                              <button type="button" class="font-medium text-marine-800 hover:text-brand-600 hover:underline" (click)="descargarMiArchivo(a)">↓ {{ a.nombre }}</button>
                              <span class="text-marine-400">{{ tamanoKb(a.tamano_bytes) }}</span>
                              @if (!vencida(t)) {
                                <button type="button" class="ml-1 text-danger-600 hover:text-danger-800" title="Quitar archivo" aria-label="Quitar archivo" (click)="eliminarMiArchivo(t, a)">✕</button>
                              }
                            </li>
                          }
                        </ul>
                      </div>
                    }

                    <div class="space-y-2 border-t border-surface-200 pt-3">
                      @if (vencida(t)) {
                        <div class="rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700" role="alert">
                          <strong>Plazo vencido.</strong> Esta tarea no acepta entregas fuera de fecha (política de la institución). Si tu docente considerara regularización, comunícalo por los canales oficiales.
                        </div>
                      } @else {
                        <label class="label" [attr.for]="'ent-'+t.id">{{ t.entrega ? 'Actualizar entrega (descripción)' : 'Descripción de la entrega' }}</label>
                        <textarea [id]="'ent-'+t.id" class="textarea min-h-20" [ngModel]="borrador(t.id)" (ngModelChange)="setBorrador(t.id, $event)" placeholder="Describe tu trabajo, obliga a tu docente a leer esto antes de abrir tus archivos…"></textarea>
                        <div class="flex flex-wrap items-center gap-2">
                          <input type="file" #fileInput accept=".pdf,.zip,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx" class="hidden" (change)="prepararArchivo(t.id, fileInput)" />
                          <button type="button" class="btn btn-outline btn-sm" (click)="fileInput.click()">+ Adjuntar archivo (PDF/Word/Excel/PPT/ZIP)</button>
                          @if (archivoPreparado()[t.id]; as prep) {
                            <span class="text-xs font-medium text-brand-700">📎 {{ prep.name }} ({{ tamanoKb(prep.size) }})</span>
                            <button type="button" class="text-xs font-bold text-danger-600 hover:underline" (click)="quitarArchivoPreparado(t.id)">Quitar</button>
                          }
                        </div>
                        <div class="flex flex-wrap items-center gap-2">
                          <button class="btn btn-primary btn-sm" type="button" (click)="enviar(t)" [disabled]="enviando() === t.id || !puedeEnviar(t.id)">{{ enviando() === t.id ? 'Enviando…' : (t.entrega ? 'Actualizar entrega' : 'Enviar entrega') }}</button>
                          @if (msg(t.id)) { <span class="text-sm" [class.text-success-600]="ok(t.id)" [class.text-danger-600]="!ok(t.id)">{{ msg(t.id) }}</span> }
                        </div>
                        <p class="text-xs text-marine-400">La entrega se guarda según permisos RLS. Se guardan descripción + archivos (máx. 25 MB por archivo). Tras vencer el plazo no puedes enviar ni modificar.</p>
                      }
                    </div>
                  </article>
                }
              </div>
            }
          </div>

          <div>
            <h2 class="text-lg font-semibold text-marine-800">Calificaciones</h2>
            @if (calificaciones().length === 0) {
              <p class="mt-2 text-sm text-marine-500">Aún no tienes calificaciones registradas.</p>
            } @else {
              <div class="mt-3 table-wrap"><table class="table"><thead><tr><th>Nota</th><th>Máximo</th><th>Estado</th><th>Fecha</th><th>Comentario</th></tr></thead><tbody>
                @for (c of calificaciones(); track c.id) { <tr><td>{{ c.nota }}</td><td>{{ c.nota_maxima }}</td><td>{{ c.aprobado ? 'Aprobado' : 'Revisado' }}</td><td>{{ c.calificado_en | date: 'medium' }}</td><td class="text-sm text-marine-600">{{ c.comentario || '—' }}</td></tr> }
              </tbody></table></div>
            }
          </div>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class AssignmentsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly courseService = inject(CourseService);
  private readonly activityService = inject(ActivityService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly tareas = signal<(Tarea & { actividad: Actividad; entrega: Entrega | null })[]>([]);
  protected readonly calificaciones = signal<Calificacion[]>([]);
  protected readonly enviando = signal<string | null>(null);

  protected readonly cursosDeTareas = computed<{ id: string; titulo: string }[]>(() => {
    return this.misCursos().map((c) => ({ id: c.id, titulo: c.titulo }));
  });
  protected readonly tareasFiltradas = computed(() => {
    const f = this.filtroCurso();
    return f ? this.tareas().filter((t) => t.actividad.curso_id === f) : this.tareas();
  });
  protected readonly tareasVisibles = computed(() => {
    const base = this.tareasFiltradas();
    const t = this.tab();
    if (t === 'pendientes') return base.filter((x) => !x.entrega);
    if (t === 'entregadas') return base.filter((x) => !!x.entrega);
    if (t === 'calificadas') return base.filter((x) => x.entrega?.nota !== null && x.entrega?.nota !== undefined);
    return base;
  });
  protected readonly contarTab = (t: 'todas' | 'pendientes' | 'entregadas' | 'calificadas'): number => {
    const base = this.tareasFiltradas();
    if (t === 'pendientes') return base.filter((x) => !x.entrega).length;
    if (t === 'entregadas') return base.filter((x) => !!x.entrega).length;
    if (t === 'calificadas') return base.filter((x) => x.entrega?.nota !== null && x.entrega?.nota !== undefined).length;
    return base.length;
  };
  protected readonly contarPorCurso = (id: string): number => {
    return this.tareas().filter((t) => t.actividad.curso_id === id).length;
  };
  protected readonly filtroCurso = signal<string | null>(null);
  protected readonly tab = signal<'todas' | 'pendientes' | 'entregadas' | 'calificadas'>('todas');
  protected readonly misCursos = signal<import('../../../core/models/domain.models').Curso[]>([]);
  private readonly borradores = signal<Record<string, string>>({});
  private readonly msgs = signal<Record<string, string>>({});
  private readonly oks = signal<Record<string, boolean>>({});

  protected readonly adjuntosDeTarea = signal<Record<string, TareaArchivo[]>>({});
  protected readonly archivosDeMiEntrega = signal<Record<string, EntregaArchivo[]>>({});
  protected readonly archivoPreparado = signal<Record<string, File | null>>({});

  ngOnInit(): void { void this.cargar(); }

  protected borrador(id: string): string { return this.borradores()[id] ?? ''; }
  protected setBorrador(id: string, v: string): void { this.borradores.update((m) => ({ ...m, [id]: v ?? '' })); }
  protected msg(id: string): string { return this.msgs()[id] ?? ''; }
  protected ok(id: string): boolean { return !!this.oks()[id]; }
  protected puedeEnviar(id: string): boolean { return (this.borrador(id) || '').trim().length > 0; }

  protected tamanoKb(bytes: number | null | undefined): string {
    const n = Number(bytes ?? 0);
    if (!Number.isFinite(n) || n <= 0) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected vencida(t: Tarea & { entrega: Entrega | null }): boolean {
    if (t.entrega) return false;           // ya entregó; las ediciones se permiten hasta que el docente cierre
    if (!t.fecha_entrega) return false;
    return new Date(t.fecha_entrega).getTime() < Date.now();
  }

  protected prepararArchivo(tareaId: string, input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      this.msgs.update((m) => ({ ...m, [tareaId]: 'El archivo supera los 25 MB.' }));
      this.oks.update((m) => ({ ...m, [tareaId]: false }));
      return;
    }
    this.archivoPreparado.update((m) => ({ ...m, [tareaId]: file }));
    this.msgs.update((m) => ({ ...m, [tareaId]: '' }));
  }

  protected quitarArchivoPreparado(tareaId: string): void {
    this.archivoPreparado.update((m) => ({ ...m, [tareaId]: null }));
  }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try {
      const cursos = await this.courseService.listarCursosDeEstudiante(user.id);
      this.misCursos.set(cursos);
      const tareas = (await Promise.all(cursos.map((c) => this.activityService.listarTareasCurso(c.id, user.id).catch(() => [])))).flat();
      const calificaciones = await this.activityService.listarCalificaciones(user.id).catch(() => []);

      // Adjuntos publicados por el docente (material complementario).
      const adjuntos: Record<string, TareaArchivo[]> = {};
      // Archivos del estudiante (los que yo adjunté a mis entregas).
      const entregaArchivos: Record<string, EntregaArchivo[]> = {};
      for (const t of tareas) {
        adjuntos[t.id] = await this.activityService.listarAdjuntosTarea(t.id).catch(() => []);
        if (t.entrega) {
          entregaArchivos[t.id] = await this.activityService.listarEntregaArchivos(t.entrega.id).catch(() => []);
        } else {
          entregaArchivos[t.id] = [];
        }
      }

      this.tareas.set(tareas);
      this.calificaciones.set(calificaciones);
      this.adjuntosDeTarea.set(adjuntos);
      this.archivosDeMiEntrega.set(entregaArchivos);

      const bs = { ...this.borradores() };
      for (const t of tareas) if (t.entrega?.contenido && bs[t.id] === undefined) bs[t.id] = t.entrega.contenido;
      this.borradores.set(bs);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las tareas.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async descargarAdjuntoTarea(a: TareaArchivo): Promise<void> {
    const url = await this.activityService.descargarUrlAdjuntoTarea(a.ruta_storage);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  protected async descargarMiArchivo(a: EntregaArchivo): Promise<void> {
    const url = await this.activityService.descargarUrlEntregaArchivo(a.ruta_storage);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  protected async eliminarMiArchivo(t: Tarea & { entrega: Entrega | null }, a: EntregaArchivo): Promise<void> {
    if (!t.entrega || this.vencida(t)) return;
    try {
      await this.activityService.eliminarEntregaArchivo(a.id, a.ruta_storage);
      this.archivosDeMiEntrega.update((m) => ({ ...m, [t.id]: (m[t.id] ?? []).filter((x) => x.id !== a.id) }));
    } catch (e) {
      this.msgs.update((m) => ({ ...m, [t.id]: e instanceof Error ? e.message : 'No se pudo eliminar el archivo.' }));
      this.oks.update((m) => ({ ...m, [t.id]: false }));
    }
  }

  protected async enviar(t: Tarea & { actividad: Actividad; entrega: Entrega | null }): Promise<void> {
    const user = this.auth.usuario();
    const contenido = (this.borrador(t.id) || '').trim();
    if (!user || !contenido) return;
    if (this.vencida(t)) {
      this.msgs.update((m) => ({ ...m, [t.id]: 'El plazo venció. No se aceptan entregas tardías.' }));
      this.oks.update((m) => ({ ...m, [t.id]: false }));
      return;
    }
    this.enviando.set(t.id);
    const archivo = this.archivoPreparado()[t.id];
    try {
      const res = await this.activityService.enviarTarea(t.id, user.id, contenido);
      if (!res.ok) {
        this.msgs.update((m) => ({ ...m, [t.id]: res.mensaje }));
        this.oks.update((m) => ({ ...m, [t.id]: false }));
        return;
      }

      // Tras enviar, adjunta el archivo preparado (si lo hay).
      if (archivo) {
        const entrega = await this.activityService.obtenerEntregaDeEstudiante(t.id, user.id);
        if (entrega) {
          try {
            await this.activityService.subirEntregaArchivo(entrega.id, user.id, archivo);
            this.archivoPreparado.update((m) => ({ ...m, [t.id]: null }));
          } catch (e) {
            this.msgs.update((m) => ({ ...m, [t.id]: e instanceof Error ? e.message : 'La respuesta se guardó pero el archivo no se pudo subir.' }));
            this.oks.update((m) => ({ ...m, [t.id]: false }));
            void this.cargar();
            return;
          }
        }
      }

      this.msgs.update((m) => ({ ...m, [t.id]: res.mensaje }));
      this.oks.update((m) => ({ ...m, [t.id]: true }));
      await this.cargar();
    } finally {
      this.enviando.set(null);
    }
  }
}
