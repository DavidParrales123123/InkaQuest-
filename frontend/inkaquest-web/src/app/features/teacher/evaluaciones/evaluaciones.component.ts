import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { EvaluationService } from '../../../core/services/evaluation.service';
import { TeacherService } from '../../../core/services/teacher.service';
import {
  Actividad,
  Curso,
  Evaluacion,
  Opcion,
  Pregunta,
} from '../../../core/models/domain.models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

type TipoPreguntaNuevo = 'opcion_unica' | 'verdadero_falso';
type TipoEvaluacion = 'quiz' | 'examen';

/**
 * Evaluaciones del docente.
 *
 * <p>Crea y gestiona cuestionarios y exámenes de opción múltiple para una
 * lección: preguntas con opciones y una respuesta correcta, intentos, tiempo
 * límite, % de aprobación, publicación y borradores.</p>
 *
 * <p>Persiste directamente en {@code public.actividad} / {@code evaluacion} /
 * {@code pregunta} / {@code opcion}; la autorización la garantiza la RLS
 * (solo docente del curso o admin).</p>
 */
@Component({
  selector: 'app-teacher-evaluaciones',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent],
  styles: [`
    .opcion-row { display:flex; gap:.5rem; align-items:center; }
    .correcta-mark { flex: 0 0 auto; accent-color: var(--color-brand-500, #12736b); width:1.1rem; height:1.1rem; cursor:pointer; }
  `],
  template: `
    <section class="space-y-6">

      <app-page-header titulo="Evaluaciones" descripcion="Crea y gestiona cuestionarios y exámenes con preguntas de opción múltiple." />

      @if (mensaje(); as msg) {
        <p class="rounded-lg border p-3 text-sm font-medium"
          [class]="msg.ok ? 'border-success-200 bg-success-50 text-success-700' : 'border-danger-200 bg-danger-50 text-danger-700'"
          role="status">{{ msg.texto }}</p>
      }

      <!-- ════════════════ EVALUACIONES ════════════════ -->
      @if (cargando()) {
          <p class="text-sm text-marine-500">Cargando tus cursos…</p>
        } @else if (cursos().length === 0) {
          <div class="card card-body text-center">
            <p class="text-sm text-marine-600">No tienes cursos asignados todavía, por lo tanto no puedes crear evaluaciones.</p>
          </div>
        } @else {
          <!-- Selector de curso y lección -->
          <div class="card card-body grid gap-3 sm:grid-cols-2">
            <div>
              <label class="label" for="sel-curso">Curso</label>
              <select id="sel-curso" class="select" [value]="cursoSel()" (change)="cambiarCurso($any($event.target).value)">
                @for (c of cursos(); track c.curso.id) {
                  <option [value]="c.curso.id">{{ c.curso.titulo }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label" for="sel-lecs">Lección</label>
              <select id="sel-lecs" class="select" [value]="leccionIdSel()" (change)="leccionIdSel.set($any($event.target).value)">
                <option value="">— Sin lección (evaluaciones se guardan ligadas a una lección) —</option>
                @for (l of lecciones(); track l.id) {
                  <option [value]="l.id">U{{ l.unidadNumero }} · {{ l.titulo }}</option>
                }
              </select>
              @if (lecciones().length === 0) {
                <p class="mt-1 text-xs text-warning-700">Este curso aún no tiene lecciones. Crea lecciones en <a class="underline" [routerLink]="['/docente/cursos']">gestión del curso</a> primero.</p>
              }
            </div>
          </div>

          <div class="grid gap-6 xl:grid-cols-5">
            <!-- ════ CREAR EVALUACIÓN ════ -->
            <form class="card card-body space-y-3 xl:col-span-2" [formGroup]="formCrear" (ngSubmit)="crearEvaluacion()" aria-label="Nueva evaluación">
              <h2 class="text-base font-extrabold text-marine-800">Nueva evaluación</h2>

              <div>
                <label class="label" for="titulo">Título</label>
                <input id="titulo" class="input" formControlName="titulo" placeholder="Ej. Examen parcial: Estructuras de control" />
                @if (formCrear.controls.titulo.invalid && formCrear.controls.titulo.touched) {
                  <p class="mt-1 text-xs text-danger-600">El título debe tener entre 3 y 140 caracteres.</p>
                }
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label" for="tipo">Tipo</label>
                  <select id="tipo" class="select" formControlName="tipo">
                    <option value="quiz">Cuestionario</option>
                    <option value="examen">Examen</option>
                  </select>
                </div>
                <div>
                  <label class="label" for="xp">XP otorgado</label>
                  <input id="xp" type="number" min="0" class="input" formControlName="xp" />
                </div>
                <div>
                  <label class="label" for="tiempo">Tiempo límite (min)</label>
                  <input id="tiempo" type="number" min="0" class="input" formControlName="tiempoMin" placeholder="0 = sin límite" />
                </div>
                <div>
                  <label class="label" for="intentos">Intentos</label>
                  <input id="intentos" type="number" min="1" max="20" class="input" formControlName="intentos" />
                </div>
                <div>
                  <label class="label" for="aprob">% para aprobar</label>
                  <input id="aprob" type="number" min="0" max="100" class="input" formControlName="aprobacion" />
                </div>
                <div class="flex items-end">
                  <label class="flex h-full cursor-pointer select-none items-center gap-2 rounded-lg border border-surface-200 px-3 py-2 text-sm font-medium text-marine-700">
                    <input type="checkbox" class="h-4 w-4 accent-[#12736b]" formControlName="publicado" />
                    Publicada
                  </label>
                </div>
              </div>

              <div>
                <label class="label" for="instr">Instrucciones (opcional)</label>
                <textarea id="instr" class="textarea" rows="2" formControlName="instrucciones" placeholder="Qué verán los estudiantes justo antes de empezar."></textarea>
              </div>

              <div class="flex items-center justify-between gap-3 border-t border-surface-100 pt-3">
                <p class="text-[0.7rem] text-marine-400">Una vez creada, agrega las preguntas en el panel de la derecha.</p>
                <button type="submit" class="btn btn-primary" [disabled]="formCrear.invalid || creando()">{{ creando() ? 'Creando…' : 'Crear evaluación' }}</button>
              </div>
            </form>

            <!-- ════ MIS EVALUACIONES ════ -->
            <div class="space-y-4 xl:col-span-3">
              <div class="flex items-center justify-between gap-2">
                <h2 class="text-base font-extrabold text-marine-800">Evaluaciones de este curso</h2>
                <span class="badge badge-default">{{ evaluaciones().length }}</span>
              </div>

              @if (evaluaciones().length === 0) {
                <div class="card card-body">
                  <p class="text-sm text-marine-500">Aún no has creado ninguna evaluación. Completa el formulario de la izquierda.</p>
                </div>
              } @else {
                <ul class="space-y-2">
                  @for (e of evaluaciones(); track e.id) {
                    <li class="card card-body">
                      <div class="flex flex-wrap items-start justify-between gap-3">
                        <div class="min-w-0">
                          <div class="flex flex-wrap items-center gap-2">
                            <span class="rounded-full bg-marine-800 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-gold-400">{{ e.actividad.tipo }}</span>
                            <p class="font-semibold text-marine-800">{{ e.actividad.titulo }}</p>
                            @if (e.actividad.publicado) {
                              <span class="rounded-full bg-success-100 px-2 py-0.5 text-[0.65rem] font-bold text-success-700">PUBLICADA</span>
                            } @else {
                              <span class="rounded-full bg-surface-100 px-2 py-0.5 text-[0.65rem] font-bold text-marine-600">BORRADOR</span>
                            }
                          </div>
                          <p class="mt-1 text-xs text-marine-500">{{ e.intentos_permitidos }} intento(s) · {{ e.porcentaje_aprobacion }}% para aprobar · {{ e.duracion_minutos ?? 'sin' }} min · {{ e.nota_maxima }} pts máx.</p>
                        </div>
                        <div class="flex flex-wrap gap-1.5">
                          <button type="button" class="btn btn-outline btn-sm" [class.ring-2]="evaluacionSel()?.id === e.id" (click)="abrirEditorDePreguntas(e)">Preguntas</button>
                          <button type="button" class="btn btn-outline btn-sm" (click)="togglePublicada(e)">{{ e.actividad.publicado ? 'Ocultar' : 'Publicar' }}</button>
                          <button type="button" class="btn btn-outline btn-sm text-danger-700" (click)="eliminarEvaluacion(e)">Eliminar</button>
                        </div>
                      </div>
                    </li>
                  }
                </ul>
              }

              <!-- ════ EDITOR DE PREGUNTAS ════ -->
              @if (evaluacionSel(); as sel) {
                <div class="card card-body space-y-4">
                  <div class="flex flex-wrap items-center justify-between gap-2 border-b border-surface-100 pb-3">
                    <div>
                      <p class="text-[0.7rem] font-bold uppercase tracking-wider text-marine-400">Editando preguntas</p>
                      <h3 class="text-base font-extrabold text-marine-800">{{ sel.actividad.titulo }}</h3>
                    </div>
                    <button type="button" class="btn btn-outline btn-sm" (click)="cerrarEditor()">Cerrar ✕</button>
                  </div>

                  <!-- Preguntas existentes -->
                  <div>
                    <p class="text-xs font-bold uppercase tracking-wider text-marine-400">{{ preguntas().length }} pregunta(s)</p>
                    <ol class="mt-2 space-y-2">
                      @for (p of preguntas(); track p.id) {
                        <li class="rounded-xl border border-surface-200 p-3">
                          <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0">
                              <p class="text-sm font-semibold text-marine-800"><span class="mr-1 text-marine-400">{{ p.orden }}.</span>{{ p.enunciado }}</p>
                              <ul class="mt-2 space-y-1 text-sm">
                                @for (o of p.opciones; track o.id; let i = $index) {
                                  <li class="flex items-center gap-2"
                                    [class.font-semibold]="o.es_correcta"
                                    [class.text-brand-700]="o.es_correcta">
                                    <span class="flex h-6 w-6 items-center justify-center rounded-full border border-surface-200 text-[0.65rem] font-extrabold">{{ 'ABCDEF'[i] }}</span>
                                    <span class="min-w-0 break-words">{{ o.texto }}</span>
                                    @if (o.es_correcta) { <span class="text-xs font-bold text-success-700">✓ correcta</span> }
                                  </li>
                                }
                              </ul>
                            </div>
                            <button type="button" class="btn btn-outline btn-sm text-danger-700" [disabled]="p.id.startsWith('local-')" (click)="eliminarPregunta(p)" [title]="p.id.startsWith('local-') ? 'Guardando…' : 'Eliminar la pregunta'">Eliminar</button>
                          </div>
                        </li>
                      } @empty {
                        <p class="text-sm text-marine-500">Aún no hay preguntas. Agrega la primera.</p>
                      }
                    </ol>
                  </div>

                  <!-- Agregar pregunta (opción única / V·F) -->
                  <div class="rounded-xl border border-brand-200 bg-brand-50/40 p-4 space-y-3">
                    <p class="text-sm font-extrabold text-marine-800">Nueva pregunta</p>
                    <div>
                      <label class="label" for="preg-enunciado">Enunciado</label>
                      <input id="preg-enunciado" class="input" [value]="enunciado()" (input)="enunciado.set($any($event.target).value)" placeholder="Escribe la pregunta…" />
                    </div>
                    <div class="grid gap-2 sm:grid-cols-4">
                      <div class="sm:col-span-1">
                        <label class="label" for="tipo-preg">Tipo</label>
                        <select id="tipo-preg" class="select" [value]="tipoPregunta()" (change)="cambiarTipoPregunta($any($event.target).value)">
                          <option value="opcion_unica">Opción única</option>
                          <option value="verdadero_falso">Verdadero / Falso</option>
                        </select>
                      </div>
                      <div class="sm:col-span-3">
                        <label class="label" for="retro-preg">Explicación (opcional)</label>
                        <input id="retro-preg" class="input" [value]="retroalimentacion()" (input)="retroalimentacion.set($any($event.target).value)" placeholder="Se muestra al estudiante después de responder." />
                      </div>
                    </div>
                    @if (tipoPregunta() === 'opcion_unica') {
                      <div>
                        <span class="label text-xs uppercase tracking-wider text-marine-600">Opciones (marca la correcta)</span>
                        <div class="mt-1 grid gap-2 sm:grid-cols-2">
                          @for (op of opciones(); track $index; let i = $index) {
                            <div class="opcion-row">
                              <input type="radio" class="correcta-mark" [name]="'correcta-' + $index" [checked]="respuestaCorrecta() === i" (change)="respuestaCorrecta.set(i)" [attr.aria-label]="'Opción ' + (i + 1) + ' correcta'" />
                              <input class="input" [value]="op" (input)="setOpcionTexto(i, $any($event.target).value)" [placeholder]="'Opción ' + (i + 1)" />
                            </div>
                          }
                        </div>
                      </div>
                    } @else {
                      <div>
                        <span class="label">La respuesta correcta es</span>
                        <div class="mt-1 flex gap-2">
                          <button type="button" class="btn btn-outline" [class.ring-2]="respuestaCorrecta() === 0" [class.bg-brand-50]="respuestaCorrecta() === 0" (click)="respuestaCorrecta.set(0)">Verdadero</button>
                          <button type="button" class="btn btn-outline" [class.ring-2]="respuestaCorrecta() === 1" [class.bg-brand-50]="respuestaCorrecta() === 1" (click)="respuestaCorrecta.set(1)">Falso</button>
                        </div>
                      </div>
                    }
                    <div class="flex items-center justify-end gap-2 border-t border-brand-100 pt-3">
                      <button type="button" class="btn btn-primary" (click)="agregarPregunta()">Agregar pregunta</button>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
          <p class="text-xs text-marine-400">Las evaluaciones se guardan como actividades de lección de tipo cuestionario o examen; sus preguntas y opciones quedan archivadas y marcadas la correcta. La publicación controla si tus estudiantes las ven.</p>
      }
    </section>
  `,
})
export class EvaluationsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly courseService = inject(CourseService);
  private readonly evaluationService = inject(EvaluationService);
  private readonly fb = inject(FormBuilder);

  protected readonly cursos = signal<{ curso: Curso }[]>([]);
  protected readonly cargando = signal(true);
  protected readonly creando = signal(false);
  protected readonly mensaje = signal<{ ok: boolean; texto: string } | null>(null);

  protected readonly cursoSel = signal('');
  protected readonly leccionIdSel = signal('');
  protected readonly lecciones = signal<{ id: string; titulo: string; unidadNumero: number }[]>([]);
  protected readonly evaluaciones = signal<(Evaluacion & { actividad: Actividad })[]>([]);

  // Editor de preguntas
  protected readonly evaluacionSel = signal<(Evaluacion & { actividad: Actividad }) | null>(null);
  protected readonly preguntas = signal<(Pregunta & { opciones: Opcion[] })[]>([]);
  protected readonly enunciado = signal('');
  protected readonly retroalimentacion = signal('');
  protected readonly tipoPregunta = signal<TipoPreguntaNuevo>('opcion_unica');
  protected readonly opciones = signal<string[]>(['', '', '', '']);
  protected readonly respuestaCorrecta = signal(0);

  protected readonly formCrear = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(140)]],
    tipo: ['quiz' as TipoEvaluacion, Validators.required],
    instrucciones: [''],
    tiempoMin: [0, [Validators.min(0), Validators.max(600)]],
    intentos: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
    aprobacion: [60, [Validators.required, Validators.min(0), Validators.max(100)]],
    xp: [50, [Validators.required, Validators.min(0)]],
    publicado: [true],
  });

  ngOnInit(): void { void this.cargar(); }

  private async cargar(): Promise<void> {
    this.cargando.set(true);
    this.mensaje.set(null);
    try {
      const user = this.auth.usuario();
      if (!user) { this.cargando.set(false); return; }
      const cursos = await this.teacherService.listarMisCursos(user.id);
      this.cursos.set(cursos);
      if (cursos.length) {
        this.cursoSel.set(cursos[0].curso.id);
        await this.cargarEstructuraYEvaluaciones(cursos[0].curso.id);
      }
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudieron cargar los cursos.' });
    } finally {
      this.cargando.set(false);
    }
  }

  protected async cambiarCurso(cursoId: string): Promise<void> {
    if (cursoId === this.cursoSel()) return;
    this.cursoSel.set(cursoId);
    this.leccionIdSel.set('');
    this.evaluacionSel.set(null);
    this.preguntas.set([]);
    await this.cargarEstructuraYEvaluaciones(cursoId);
  }

  private async cargarEstructuraYEvaluaciones(cursoId: string): Promise<void> {
    try {
      const est = await this.courseService.obtenerEstructuraGestion(cursoId);
      const ls: { id: string; titulo: string; unidadNumero: number }[] = [];
      for (const u of est.unidades)
        for (const m of u.modulos)
          for (const l of m.lecciones) {
            ls.push({ id: l.id, titulo: l.titulo, unidadNumero: u.numero });
          }
      this.lecciones.set(ls);

      const items = await this.evaluationService.listarEvaluacionesGestion(cursoId);
      this.evaluaciones.set(items);
    } catch (e) {
      this.lecciones.set([]);
      this.evaluaciones.set([]);
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo cargar el contenido del curso.' });
    }
  }

  protected async crearEvaluacion(): Promise<void> {
    if (this.formCrear.invalid) { this.formCrear.markAllAsTouched(); return; }
    const leccionId = this.leccionIdSel();
    const cursoId = this.cursoSel();
    if (!leccionId) { this.mensaje.set({ ok: false, texto: 'Selecciona una lección para asociar la evaluación.' }); return; }

    const v = this.formCrear.getRawValue();
    this.creando.set(true);
    this.mensaje.set(null);
    try {
      const creada = await this.evaluationService.crearEvaluacion({
        cursoId,
        leccionId,
        titulo: v.titulo,
        tipo: v.tipo,
        instrucciones: v.instrucciones || null,
        tiempoLimiteMinutos: v.tiempoMin || null,
        intentosPermitidos: v.intentos,
        porcentajeAprobacion: v.aprobacion,
        xpOtorgado: v.xp,
        publicado: v.publicado,
      });
      this.evaluaciones.update((arr) => [creada, ...arr]);
      await this.abrirEditorDePreguntas(creada);
      this.formCrear.reset({ tipo: v.tipo, tiempoMin: 0, intentos: 1, aprobacion: 60, xp: v.xp, publicado: true, instrucciones: '', titulo: '' });
      this.mensaje.set({ ok: true, texto: 'Evaluación creada. Ahora agrega sus preguntas.' });
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo crear la evaluación.' });
    } finally {
      this.creando.set(false);
    }
  }

  protected async abrirEditorDePreguntas(e: Evaluacion & { actividad: Actividad }): Promise<void> {
    this.evaluacionSel.set(e);
    this.enunciado.set('');
    this.retroalimentacion.set('');
    this.tipoPregunta.set('opcion_unica');
    this.opciones.set(['', '', '', '']);
    this.respuestaCorrecta.set(0);
    this.preguntas.set(await this.evaluationService.listarPreguntasConOpciones(e.id).catch(() => []));
  }

  protected cerrarEditor(): void {
    this.evaluacionSel.set(null);
    this.preguntas.set([]);
  }

  protected async togglePublicada(e: Evaluacion & { actividad: Actividad }): Promise<void> {
    const nuevo = !e.actividad.publicado;
    try {
      await this.evaluationService.togglePublicada(e.actividad.id, nuevo);
      this.evaluaciones.update((arr) =>
        arr.map((x) => x.id === e.id ? { ...x, actividad: { ...x.actividad, publicado: nuevo } } : x),
      );
      if (this.evaluacionSel()?.id === e.id) {
        this.evaluacionSel.update((sel) => sel ? { ...sel, actividad: { ...sel.actividad, publicado: nuevo } } : sel);
      }
    } catch (err) {
      this.mensaje.set({ ok: false, texto: err instanceof Error ? err.message : 'No se pudo cambiar el estado de publicación.' });
    }
  }

  protected cambiarTipoPregunta(v: string): void {
    if (v !== 'opcion_unica' && v !== 'verdadero_falso') return;
    this.tipoPregunta.set(v);
    this.respuestaCorrecta.set(0);
    if (v === 'verdadero_falso') {
      this.opciones.set(['Verdadero', 'Falso']);
    } else if (this.opciones().length !== 4) {
      this.opciones.set(['', '', '', '']);
    }
  }

  protected setOpcionTexto(i: number, valor: string): void {
    this.opciones.update((arr) => arr.map((o, idx) => (idx === i ? valor : o)));
  }

  protected async agregarPregunta(): Promise<void> {
    const sel = this.evaluacionSel();
    if (!sel) {
      this.mensaje.set({ ok: false, texto: 'Selecciona una evaluación primero.' });
      return;
    }
    if (!this.enunciado().trim()) {
      this.mensaje.set({ ok: false, texto: 'Escribe el enunciado de la pregunta.' });
      return;
    }
    const tipo = this.tipoPregunta();
    const opcionesTodas = tipo === 'verdadero_falso'
      ? ['Verdadero', 'Falso']
      : this.opciones().map((o) => o.trim());
    if (tipo === 'opcion_unica' && opcionesTodas.some((o) => !o)) {
      this.mensaje.set({ ok: false, texto: 'Todas las opciones deben tener texto.' });
      return;
    }
    if (this.respuestaCorrecta() < 0 || this.respuestaCorrecta() >= opcionesTodas.length) {
      this.mensaje.set({ ok: false, texto: 'Marca cuál de las opciones es la correcta.' });
      return;
    }
    try {
      // Igual que el servidor: el siguiente orden es max+1 (nunca length+1,
      // porque borrar crea huecos que rompen el UNIQUE(evaluacion_id, orden)).
      const orden = this.preguntas().reduce((m, p) => Math.max(m, p.orden ?? 0), 0) + 1;
      // Optimista: la lista se actualiza en pantalla aunque el refresco
      // desde el servidor falle después.
      const nuevaPregunta: Pregunta & { opciones: Opcion[] } = {
        id: `local-${Date.now()}-${Math.round(Math.random() * 10000)}`,
        evaluacion_id: sel.id,
        orden,
        tipo,
        enunciado: this.enunciado().trim(),
        descripcion: null,
        puntos: 1,
        es_privada: false,
        requiere_revision: false,
        retroalimentacion: this.retroalimentacion().trim() || null,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
        opciones: opcionesTodas.map((texto, i) => ({
          id: `local-opc-${Date.now()}-${i}`,
          pregunta_id: sel.id,
          orden: i + 1,
          texto,
          es_correcta: i === this.respuestaCorrecta(),
          valor: null,
          created_en: new Date().toISOString(),
        })),
      };
      await this.evaluationService.agregarPregunta({
        evaluacionId: sel.id,
        orden,
        tipo,
        enunciado: nuevaPregunta.enunciado,
        retroalimentacion: nuevaPregunta.retroalimentacion,
        opciones: opcionesTodas,
        respuestaCorrecta: this.respuestaCorrecta(),
      });
      // Limpia el editor para el siguiente enunciado.
      this.enunciado.set('');
      this.retroalimentacion.set('');
      this.opciones.set(tipo === 'verdadero_falso' ? ['Verdadero', 'Falso'] : ['', '', '', '']);
      this.respuestaCorrecta.set(0);
      // Optimista primero; servidor después (reemplaza los ids locales por los reales).
      this.preguntas.update((arr) => [...arr, nuevaPregunta]);
      const reales = await this.evaluationService.listarPreguntasConOpciones(sel.id).catch(() => null);
      if (reales) {
        this.preguntas.set(reales);
      } else {
        this.mensaje.set({ ok: true, texto: 'Pregunta agregada. (No se pudo refrescar la lista desde el servidor; aparecerá completa al recargar.)' });
      }
      this.mensaje.set({ ok: true, texto: 'Pregunta agregada correctamente.' });
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo agregar la pregunta.' });
    }
  }

  protected async eliminarPregunta(p: Pregunta & { opciones: Opcion[] }): Promise<void> {
    const sel = this.evaluacionSel();
    if (!sel) return;
    const confirmado = confirm(
      `¿Eliminar la pregunta "${p.enunciado.substring(0, 80)}"? Se borrarán también sus opciones y respuestas registradas.`,
    );
    if (!confirmado) return;
    try {
      await this.evaluationService.eliminarPregunta(p.id);
      this.preguntas.set(await this.evaluationService.listarPreguntasConOpciones(sel.id));
      this.mensaje.set({ ok: true, texto: 'Pregunta eliminada.' });
    } catch (e) {
      this.mensaje.set({ ok: false, texto: e instanceof Error ? e.message : 'No se pudo eliminar la pregunta.' });
    }
  }

  protected async eliminarEvaluacion(e: Evaluacion & { actividad: Actividad }): Promise<void> {
    const confirmado = confirm(
      `¿Eliminar la evaluación "${e.actividad.titulo}"? Esta acción no se puede deshacer y borra sus preguntas.`,
    );
    if (!confirmado) return;
    try {
      await this.evaluationService.eliminarEvaluacion(e.actividad.id, e.id);
      this.evaluaciones.update((arr) => arr.filter((x) => x.id !== e.id));
      if (this.evaluacionSel()?.id === e.id) this.cerrarEditor();
      this.mensaje.set({ ok: true, texto: 'Evaluación eliminada.' });
    } catch (err) {
      this.mensaje.set({ ok: false, texto: err instanceof Error ? err.message : 'No se pudo eliminar la evaluación.' });
    }
  }
}
