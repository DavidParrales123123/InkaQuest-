// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ActivityService } from '../../../core/services/activity.service';
import { CourseService } from '../../../core/services/course.service';
import { TeacherService } from '../../../core/services/teacher.service';
import {
  Actividad,
  Curso,
  Entrega,
  EntregaArchivo,
  Tarea,
  TareaArchivo,
} from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

type TareaConActividad = Tarea & { actividad: Actividad };

/**
 * Gestión de tareas del docente, al estilo universidad:
 *
 * <ul>
 *   <li><b>Nueva tarea</b>: título, instrucciones, apertura/cierre, nota sobre 20
 *       y publicación. No se acepta entrega tardía (la tarea no deja registrar
 *       nada una vez vencida).</li>
 *   <li><b>Adjuntos</b>: el docente adjunta materiales (Word, PDF, Excel,
 *       PowerPoint, ZIP) como complemento de la tarea — los estudiantes los
 *       ven y los descargan en /estudiante/tareas.</li>
 *   <li><b>Calificar</b>: entregas pendientes en la bandeja, con archivos del
 *       estudiante listos para abrir/descargar.</li>
 * </ul>
 */
@Component({
  selector: 'app-teacher-assignments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, ReactiveFormsModule, RouterLink, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Tareas" descripcion="Crea tareas con instrucciones y archivos adjuntos; el plazo no permite entregas tardías. Revisa y califica con los archivos recibidos adjuntos." />

      @if (mensaje(); as msg) {
        <p class="rounded-lg border p-3 text-sm font-medium"
          [class]="msg.ok ? 'border-success-200 bg-success-50 text-success-700' : 'border-danger-200 bg-danger-50 text-danger-700'"
          role="status">{{ msg.texto }}</p>
      }

      <!-- Selector curso / lección -->
      <div class="card card-body grid gap-3 sm:grid-cols-2">
        <div>
          <label class="label" for="tarea-curso">Curso</label>
          <select id="tarea-curso" class="select" [value]="cursoSel()" (change)="cambiarCurso($any($event.target).value)">
            @for (c of cursos(); track c.curso.id) {
              <option [value]="c.curso.id">{{ c.curso.titulo }}</option>
            }
          </select>
        </div>
        <div>
          <label class="label" for="tarea-leccion">Lección</label>
          <select id="tarea-leccion" class="select" [value]="leccionIdSel()" (change)="leccionIdSel.set($any($event.target).value)">
            <option value="">— Selecciona una lección —</option>
            @for (l of lecciones(); track l.id) {
              <option [value]="l.id">U{{ l.unidadNumero }} · {{ l.titulo }}</option>
            }
          </select>
          @if (lecciones().length === 0) {
            <p class="mt-1 text-xs text-warning-700">Este curso aún no tiene lecciones. Crea lecciones en <a class="underline" routerLink="/docente/cursos">gestión del curso</a> primero.</p>
          }
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-5">
        <!-- ════ CREAR TAREA ════ -->
        <form class="card card-body space-y-3 xl:col-span-2" [formGroup]="form" (ngSubmit)="crearTarea()" aria-label="Nueva tarea">
          <h2 class="text-base font-extrabold text-marine-800">Nueva tarea</h2>
          <div>
            <label class="label" for="titulo">Título</label>
            <input id="titulo" class="input" formControlName="titulo" placeholder="Ej. Práctico calificado: analizador de expresiones" />
            @if (form.controls.titulo.invalid && form.controls.titulo.touched) {
              <p class="mt-1 text-xs text-danger-600">El título debe tener entre 3 y 140 caracteres.</p>
            }
          </div>
          <div>
            <label class="label" for="instr">Instrucciones</label>
            <textarea id="instr" class="textarea" rows="4" formControlName="instrucciones" placeholder="Qué deben entregar, formato (PDF/Word/carpeta .zip), criterios de evaluación e indicaciones de procedimiento…"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2 sm:col-span-1">
              <label class="label" for="apertura">Apertura (opcional)</label>
              <input id="apertura" type="datetime-local" class="input" formControlName="fechaApertura" />
            </div>
            <div class="col-span-2 sm:col-span-1">
              <label class="label" for="entrega">Fecha límite de entrega</label>
              <input id="entrega" type="datetime-local" class="input" formControlName="fechaEntrega" />
            </div>
            <div>
              <label class="label" for="nota">Nota de (sobre 20)</label>
              <input id="nota" type="number" min="0" max="20" step="0.5" class="input" formControlName="notaMaxima" />
            </div>
            <div class="flex items-end">
              <label class="flex h-full cursor-pointer select-none items-center gap-2 rounded-lg border border-surface-200 px-3 py-2 text-sm font-medium text-marine-700">
                <input type="checkbox" class="h-4 w-4 accent-[#12736b]" formControlName="publicado" />
                Publicada
              </label>
            </div>
          </div>
          <div class="rounded-lg bg-surface-50 p-3 text-xs text-marine-600">
            <strong class="text-marine-800">Al estilo universidad:</strong> nota 0 a 20; si el plazo vence la tarea rechaza cualquier entrega. Si la institución entrega con Word, adjunta aquí el archivo con todas las indicaciones específicas — se sube junto con la tarea.
          </div>
          <div class="rounded-lg border border-brand-200 bg-brand-50/40 p-3 space-y-2">
            <label class="label" for="adjuntos-crear">Adjuntos de esta tarea (Word con indicaciones, PDF, PPT, Excel)</label>
            <input id="adjuntos-crear" type="file" multiple accept=".pdf,.zip,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx" class="hidden" #fileCrear (change)="encolarArchivosCrear(fileCrear)" />
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" class="btn btn-outline btn-sm" (click)="fileCrear.click()">+ Adjuntar (varios, hasta 25 MB c/u)</button>
              @if (archivosCrear().length > 0) {
                <span class="text-xs font-semibold text-brand-700">{{ archivosCrear().length }} archivo(s) listo(s) para subir al crear</span>
              }
            </div>
            @if (archivosCrear().length > 0) {
              <ul class="flex flex-wrap gap-1.5">
                @for (f of archivosCrear(); track $index; let i = $index) {
                  <li class="flex items-center gap-1 rounded-lg border border-brand-200 bg-white px-2 py-1 text-xs">
                    <span class="max-w-56 truncate font-medium text-marine-800" [title]="f.name">{{ f.name }}</span>
                    <span class="text-marine-400">{{ tamanoKb(f.size) }}</span>
                    <button type="button" class="ml-1 text-danger-600 hover:text-danger-800" title="Quitar" aria-label="Quitar archivo" (click)="quitarArchivoCrear(i)">✕</button>
                  </li>
                }
              </ul>
              <p class="text-[0.7rem] text-marine-500">Estos archivos se suben solos cuando pulses «Crear tarea».</p>
            }
          </div>
          <div class="flex items-center justify-between gap-3 border-t border-surface-100 pt-3">
            <p class="text-[0.7rem] text-marine-400">Tus adjuntos quedan asociados a la tarea publicándola sola.</p>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || !leccionIdSel() || creando()">{{ creando() ? 'Creando…' : 'Crear tarea' }}</button>
          </div>
        </form>

        <!-- ════ TAREAS DEL CURSO ════ -->
        <div class="space-y-4 xl:col-span-3">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-base font-extrabold text-marine-800">Tareas de este curso</h2>
            <span class="badge badge-neutral">{{ tareas().length }}</span>
          </div>

          @if (tareas().length === 0) {
            <div class="card card-body">
              <p class="text-sm text-marine-500">Aún no has creado ninguna tarea en este curso. Selecciona una lección a la izquierda y completa el formulario.</p>
            </div>
          } @else {
            <ul class="space-y-2">
              @for (t of tareas(); track t.id) {
                <li class="card card-body space-y-3">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-2">
                        <p class="font-semibold text-marine-800">{{ t.actividad.titulo }}</p>
                        @if (t.actividad.publicado) {
                          <span class="rounded-full bg-success-100 px-2 py-0.5 text-[0.65rem] font-bold text-success-700">PUBLICADA</span>
                        } @else {
                          <span class="rounded-full bg-surface-100 px-2 py-0.5 text-[0.65rem] font-bold text-marine-600">BORRADOR</span>
                        }
                      </div>
                      <p class="mt-1 text-xs text-marine-500">
                        Creada: {{ t.creado_en | date:'short' }}
                        · Límite: <strong>{{ t.fecha_entrega ? (t.fecha_entrega | date:'short') : 'sin fecha' }}</strong>
                        · Nota sobre 20
                      </p>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                      <button type="button" class="btn btn-outline btn-sm" (click)="togglePublicada(t)">{{ t.actividad.publicado ? 'Ocultar' : 'Publicar' }}</button>
                      <button type="button" class="btn btn-outline btn-sm text-danger-700" (click)="eliminarTarea(t)">Eliminar</button>
                    </div>
                  </div>

                  <!-- Adjuntos complementarios -->
                  <div class="border-t border-surface-100 pt-2">
                    <input #adjInput type="file" accept=".pdf,.zip,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx" class="hidden" (change)="subirAdjunto(t, adjInput)" />
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <p class="text-xs font-semibold uppercase tracking-wide text-marine-500">Archivos adjuntos</p>
                      <button type="button" class="btn btn-outline btn-sm" [disabled]="subiendoAdjuntos() === t.id" (click)="adjInput.click()">
                        {{ subiendoAdjuntos() === t.id ? 'Subiendo…' : '+ Adjuntar (PDF/Word/Excel/PPT/ZIP)' }}
                      </button>
                    </div>
                    @if ((adjuntos()[t.id] ?? []).length > 0) {
                      <ul class="mt-2 flex flex-wrap gap-1.5">
                        @for (a of adjuntos()[t.id] ?? []; track a.id) {
                          <li class="flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-2 py-1 text-xs">
                            <button type="button" class="font-medium text-marine-800 hover:text-brand-600 hover:underline" title="Abrir/descargar" (click)="descargarAdjunto(a)">{{ a.nombre }}</button>
                            <span class="text-marine-400">{{ tamanoKb(a.tamano_bytes) }}</span>
                            <button type="button" class="ml-1 text-danger-600 hover:text-danger-800" title="Quitar adjunto" aria-label="Quitar adjunto" (click)="eliminarAdjunto(t, a)">✕</button>
                          </li>
                        }
                      </ul>
                    }
                  </div>
                </li>
              }
            </ul>
          }
        </div>
      </div>

      <!-- ════ ENTREGAS PENDIENTES ════ -->
      <h2 class="text-lg font-extrabold text-marine-800">Entregas por calificar</h2>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="entregas().length === 0" tituloVacio="Aún no hay entregas por calificar" descripcionVacia="Aquí aparecerán las entregas que tus estudiantes envíen en las tareas publicadas." (alReintentar)="cargar()">
        <div contenido class="space-y-4">
          @for (e of entregas(); track e.id) {
            <article class="card card-body space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="font-semibold text-marine-800">{{ e.actividad.titulo }}</p>
                  <p class="text-sm text-marine-500">Entrega: {{ e.id.slice(0,8) }}… · Enviada: {{ e.enviada_en ? (e.enviada_en | date:'medium') : '—' }}</p>
                </div>
                <app-status-badge [estado]="e.estado" />
              </div>
              @if (e.contenido) {
                <div class="rounded-lg bg-surface-50 p-3 text-sm text-marine-700">
                  <p class="font-medium text-marine-800 mb-1">Descripción de la entrega del estudiante</p>
                  <p class="whitespace-pre-wrap break-words">{{ e.contenido }}</p>
                </div>
              } @else {
                <p class="text-sm text-marine-500">Sin descripción; revisa los archivos adjuntos.</p>
              }

              @if ((archivosDeEntrega()[e.id] ?? []).length > 0) {
                <div class="rounded-lg border border-brand-200 bg-brand-50/50 p-3">
                  <p class="text-xs font-bold uppercase tracking-wider text-brand-700">Archivos del estudiante</p>
                  <ul class="mt-2 flex flex-wrap gap-2">
                    @for (a of archivosDeEntrega()[e.id] ?? []; track a.id) {
                      <li>
                        <button type="button" class="btn btn-outline btn-sm" (click)="descargarArchivoEntrega(a)">
                          ↓ {{ a.nombre }} <span class="ml-1 text-marine-400">{{ tamanoKb(a.tamano_bytes) }}</span>
                        </button>
                      </li>
                    }
                  </ul>
                </div>
              }

              <div class="grid gap-3 md:grid-cols-[110px_110px_1fr_auto] items-end border-t border-surface-200 pt-3">
                <div>
                  <label class="label" [attr.for]="'nota-'+e.id">Nota (0–20)</label>
                  <input [id]="'nota-'+e.id" type="number" min="0" max="20" step="0.5" class="input" [ngModel]="nota(e.id)" (ngModelChange)="setNota(e.id, $event)" />
                </div>
                <div>
                  <label class="label" [attr.for]="'max-'+e.id">Nota máx.</label>
                  <input [id]="'max-'+e.id" type="number" min="0" max="20" step="0.5" disabled class="input bg-surface-50 text-marine-500" [value]="20" />
                </div>
                <div>
                  <label class="label" [attr.for]="'com-'+e.id">Comentario / retroalimentación</label>
                  <input [id]="'com-'+e.id" type="text" class="input" [ngModel]="comentario(e.id)" (ngModelChange)="setComentario(e.id, $event)" placeholder="Opcional" />
                </div>
                <button class="btn btn-primary" type="button" (click)="calificar(e)" [disabled]="calificando() === e.id">
                  {{ calificando() === e.id ? 'Guardando…' : 'Calificar' }}
                </button>
              </div>
              @if (msg(e.id)) {
                <p class="text-sm" [class.text-success-600]="ok(e.id)" [class.text-danger-600]="!ok(e.id)">{{ msg(e.id) }}</p>
              }
            </article>
          }
        </div>
      </app-data-panel>
    </section>
  `,
})
export class AssignmentsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly activityService = inject(ActivityService);
  private readonly courseService = inject(CourseService);
  private readonly fb = inject(FormBuilder);

  protected readonly cargando = signal(true);
  protected readonly creando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly mensaje = signal<{ ok: boolean; texto: string } | null>(null);

  protected readonly cursos = signal<{ curso: Curso }[]>([]);
  protected readonly cursoSel = signal('');
  protected readonly leccionIdSel = signal('');
  protected readonly lecciones = signal<{ id: string; titulo: string; unidadNumero: number }[]>([]);
  protected readonly tareas = signal<TareaConActividad[]>([]);
  protected readonly adjuntos = signal<Record<string, TareaArchivo[]>>({});
  protected readonly archivosDeEntrega = signal<Record<string, EntregaArchivo[]>>({});
  protected readonly subiendoAdjuntos = signal<string | null>(null);
  /** Cola de archivos a subir inmediatamente después de crear la tarea. */
  protected readonly archivosCrear = signal<File[]>([]);

  protected readonly entregas = signal<(Entrega & { tarea: Tarea; actividad: Actividad })[]>([]);
  protected readonly calificando = signal<string | null>(null);
  private readonly notas = signal<Record<string, number>>({});
  private readonly comentarios = signal<Record<string, string>>({});
  private readonly msgs = signal<Record<string, string>>({});
  private readonly oks = signal<Record<string, boolean>>({});

  protected readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(140)]],
    instrucciones: [''],
    fechaApertura: [''],
    fechaEntrega: [''],
    notaMaxima: [20, [Validators.required, Validators.min(0), Validators.max(20)]],
    publicado: [true],
  });

  ngOnInit(): void { void this.cargar(); }

  protected nota(id: string): number { return this.notas()[id] ?? 0; }
  protected comentario(id: string): string { return this.comentarios()[id] ?? ''; }
  protected msg(id: string): string { return this.msgs()[id] ?? ''; }
  protected ok(id: string): boolean { return !!this.oks()[id]; }
  protected setNota(id: string, v: unknown): void { this.notas.update((m) => ({ ...m, [id]: Number(v) })); }
  protected setComentario(id: string, v: unknown): void { this.comentarios.update((m) => ({ ...m, [id]: String(v ?? '') })); }

  protected tamanoKb(bytes: number | null | undefined): string {
    const n = Number(bytes ?? 0);
    if (!Number.isFinite(n) || n <= 0) return '—';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null); this.mensaje.set(null);
    try {
      const cursos = await this.teacherService.listarMisCursos(user.id);
      this.cursos.set(cursos);
      if (cursos.length) {
        if (!this.cursoSel()) this.cursoSel.set(cursos[0].curso.id);
        await this.cargarEstructuraYTareas(this.cursoSel());
      } else {
        this.tareas.set([]);
      }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los cursos.');
    }

    try {
      const entregas = await this.teacherService.listarEntregasPendientes(user.id);
      this.entregas.set(entregas);
      const ids = entregas.map((e) => e.id);
      const archivos = await this.activityService.listarEntregaArchivosDeVarias(ids).catch(() => []);
      const mapa: Record<string, EntregaArchivo[]> = {};
      for (const a of archivos) (mapa[a.entrega_id] ??= []).push(a);
      this.archivosDeEntrega.set(mapa);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las entregas.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async cambiarCurso(cursoId: string): Promise<void> {
    if (cursoId === this.cursoSel()) return;
    this.cursoSel.set(cursoId);
    this.leccionIdSel.set('');
    await this.cargarEstructuraYTareas(cursoId);
  }

  private async cargarEstructuraYTareas(cursoId: string): Promise<void> {
    try {
      const est = await this.courseService.obtenerEstructuraGestion(cursoId);
      const ls: { id: string; titulo: string; unidadNumero: number }[] = [];
      for (const u of est.unidades) for (const m of u.modulos) for (const l of m.lecciones) {
        ls.push({ id: l.id, titulo: l.titulo, unidadNumero: u.numero });
      }
      this.lecciones.set(ls);
      const tareas = await this.activityService.listarTareasGestion(cursoId);
      this.tareas.set(tareas);
      const adjuntos: Record<string, TareaArchivo[]> = {};
      for (const t of tareas) {
        adjuntos[t.id] = await this.activityService.listarAdjuntosTarea(t.id).catch(() => []);
      }
      this.adjuntos.set(adjuntos);
    } catch (e) {
      this.lecciones.set([]);
      this.tareas.set([]);
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo cargar el curso.' });
    }
  }

  protected encolarArchivosCrear(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) return;
    const validos: File[] = [];
    for (const f of files) {
      if (f.size > 25 * 1024 * 1024) {
        this.mensaje.set({ ok: false, texto: `"${f.name}" supera los 25 MB y no se adjuntará.` });
        continue;
      }
      validos.push(f);
    }
    if (validos.length) {
      this.archivosCrear.update((arr) => [...arr, ...validos]);
      this.mensaje.set(null);
    }
  }

  protected quitarArchivoCrear(i: number): void {
    this.archivosCrear.update((arr) => arr.filter((_, idx) => idx !== i));
  }

  protected async crearTarea(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const leccionId = this.leccionIdSel();
    if (!leccionId) { this.mensaje.set({ ok: false, texto: 'Selecciona una lección para la tarea.' }); return; }

    const v = this.form.getRawValue();
    this.creando.set(true); this.mensaje.set(null);
    try {
      const act = await this.activityService.crearActividad({
        leccion_id: leccionId,
        curso_id: this.cursoSel(),
        tipo: 'tarea',
        titulo: v.titulo.trim(),
        descripcion: null,
        instrucciones: v.instrucciones.trim() || null,
        publicado: v.publicado,
        creado_por: user.id,
        puntos: 0,
        xp_otorgado: 0,
      });
      await this.activityService.guardarTarea(act.id, {
        fecha_entrega: v.fechaEntrega ? new Date(v.fechaEntrega).toISOString() : null,
        fecha_apertura: v.fechaApertura ? new Date(v.fechaApertura).toISOString() : null,
        permite_entrega_tardia: false, // política universidad: sin entregas tardías
        penalizacion_tardia: 0,
        nota_maxima: Math.max(0, Math.min(20, v.notaMaxima || 0)),
      });
      // Sube los archivos encolados del formulario (Word con indicaciones, PDF, etc.).
      const cursoId = this.cursoSel();
      let subidos = 0;
      for (const f of this.archivosCrear()) {
        try {
          await this.activityService.subirAdjuntoTarea(act.id, cursoId, f);
          subidos += 1;
        } catch {
          // Continúa con el resto; el resultado total se reporta al final.
        }
      }
      this.archivosCrear.set([]);
      this.form.reset({ notaMaxima: 20, publicado: true, instrucciones: '', titulo: '', fechaApertura: '', fechaEntrega: '' });
      await this.cargarEstructuraYTareas(cursoId);
      this.mensaje.set({
        ok: true,
        texto: subidos > 0
          ? `Tarea creada con ${subidos} archivo(s) adjunto(s). Los estudiantes los descargarán en su panel.`
          : 'Tarea creada. Si tenías adjuntos y falló la subida, vuelve a adjuntarlos en la lista.',
      });
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo crear la tarea.' });
    } finally {
      this.creando.set(false);
    }
  }

  protected async togglePublicada(t: TareaConActividad): Promise<void> {
    const nuevo = !t.actividad.publicado;
    try {
      await this.activityService.actualizarActividad(t.actividad.id, { publicado: nuevo });
      this.tareas.update((arr) => arr.map((x) => x.id === t.id ? { ...x, actividad: { ...x.actividad, publicado: nuevo } } : x));
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo cambiar el estado de publicación.' });
    }
  }

  protected async eliminarTarea(t: TareaConActividad): Promise<void> {
    const confirmado = confirm(`¿Eliminar la tarea "${t.actividad.titulo}"? Se eliminarán sus adjuntos y los registros de entrega ligados en cascada.`);
    if (!confirmado) return;
    try {
      await this.activityService.eliminarActividad(t.actividad.id);
      this.tareas.update((arr) => arr.filter((x) => x.id !== t.id));
      this.mensaje.set({ ok: true, texto: 'Tarea eliminada.' });
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo eliminar la tarea.' });
    }
  }

  protected async subirAdjunto(t: TareaConActividad, input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      this.mensaje.set({ ok: false, texto: 'El archivo supera los 25 MB permitidos.' });
      return;
    }
    this.subiendoAdjuntos.set(t.id);
    try {
      const cursoId = this.cursoSel();
      const creado = await this.activityService.subirAdjuntoTarea(t.id, cursoId, file);
      this.adjuntos.update((m) => ({ ...m, [t.id]: [...(m[t.id] ?? []), creado] }));
      this.mensaje.set({ ok: true, texto: 'Adjunto agregado.' });
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo subir el adjunto.' });
    } finally {
      this.subiendoAdjuntos.set(null);
    }
  }

  protected async eliminarAdjunto(t: TareaConActividad, a: TareaArchivo): Promise<void> {
    try {
      await this.activityService.eliminarAdjuntoTarea(a.id, a.ruta_storage);
      this.adjuntos.update((m) => ({ ...m, [t.id]: (m[t.id] ?? []).filter((x) => x.id !== a.id) }));
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo eliminar el adjunto.' });
    }
  }

  protected async descargarAdjunto(a: TareaArchivo): Promise<void> {
    const url = await this.activityService.descargarUrlAdjuntoTarea(a.ruta_storage);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else this.mensaje.set({ ok: false, texto: 'No se pudo generar el enlace de descarga.' });
  }

  protected async descargarArchivoEntrega(a: EntregaArchivo): Promise<void> {
    const url = await this.activityService.descargarUrlEntregaArchivo(a.ruta_storage);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else this.mensaje.set({ ok: false, texto: 'No se pudo generar el enlace de descarga.' });
  }

  protected async calificar(e: Entrega & { tarea: Tarea; actividad: Actividad }): Promise<void> {
    const user = this.auth.usuario(); if (!user) return;
    this.calificando.set(e.id);
    try {
      const res = await this.activityService.calificarEntrega(e.id, this.nota(e.id), this.comentario(e.id), 20);
      this.msgs.update((m) => ({ ...m, [e.id]: res.mensaje }));
      this.oks.update((m) => ({ ...m, [e.id]: res.ok }));
      if (res.ok) {
        const entregas = await this.teacherService.listarEntregasPendientes(user.id).catch(() => this.entregas());
        this.entregas.set(entregas);
        const ids = entregas.map((x) => x.id);
        const archivos = await this.activityService.listarEntregaArchivosDeVarias(ids).catch(() => []);
        const mapa: Record<string, EntregaArchivo[]> = {};
        for (const a of archivos) (mapa[a.entrega_id] ??= []).push(a);
        this.archivosDeEntrega.set(mapa);
      }
    } finally {
      this.calificando.set(null);
    }
  }
}
