// @ts-nocheck
﻿import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { GameService } from '../../../core/services/game.service';
import { CourseService } from '../../../core/services/course.service';
import { Motor } from '../../../core/models/domain.models';
import { INSTRUCCIONES_MOTOR } from '../../../core/data/engine-instructions';

type Paso = 'motor' | 'basico' | 'contenido';

interface PreguntaQuiz {
  pregunta: string;
  opciones: string[];
  respuestaCorrecta: number;
  explicacion: string;
  tiempoSeg?: number;
}

interface ParItem {
  concepto: string;
  definicion: string;
}

/**
 * Modal que replica el flujo del proyecto anterior para crear un minijuego sobre
 * uno de los 96 motores sembrados en la BD.
 *
 *   Paso 1 — Elige el motor (matriz filtrable con búsqueda y familia).
 *   Paso 2 — Información básica (nombre, dificultad, XP, duración, instrucciones, fecha límite).
 *   Paso 3 — Contenido (solo juegos que lo necesitan: quiz/memoria/emparejamiento).
 *
 * Para 'publicar' llama a la RPC {@code fn_crear_juego_docente}.
 */
@Component({
  selector: 'app-crear-minijuego-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  styles: [`
    .paso { display:flex; align-items:center; gap:.5rem; color: inherit; text-decoration:none; }
    .paso-num { display:flex; align-items:center; justify-content:center; width:2rem; height:2rem; border-radius:9999px; font-weight:800; font-size:.85rem; background: var(--color-surface-100, #eaf3f2); color: var(--color-marine-500, #3b5080); }
    .paso-num.active { background: var(--color-marine-700, #1b2a4a); color: var(--color-gold-400, #f5b43c); }
    .paso-num.done   { background: var(--color-brand-500, #12736b); color: #fff; }
    .paso-divider { width: 2rem; height:2px; background: var(--color-surface-200, #d5e6e4); }
    .paso-divider.done { background: var(--color-brand-500, #12736b); }
    .pregunta-card { border: 1px solid var(--color-surface-200, #d5e6e4); border-radius: 1rem; background: #fff; padding: .9rem 1rem; }
    .pregunta-num { display:flex; align-items:center; justify-content:center; width:1.75rem; height:1.75rem; border-radius:9999px; background: var(--color-brand-50, #e8f6f4); color: var(--color-brand-600, #0f5d57); font-weight:800; font-size:.8rem; }
  `],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-marine-900/70 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Crear minijuego">
      <div class="relative w-full max-w-4xl rounded-2xl bg-white p-4 shadow-2xl sm:p-6 max-h-[95vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-surface-200 pb-3">
          <div class="min-w-0">
            <p class="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-marine-400">Configura tu minijuego</p>
            <h2 class="mt-0.5 truncate text-lg font-extrabold text-marine-800">{{ tituloCabecera() }}</h2>
          </div>
          <button type="button" class="rounded-lg p-2 text-marine-400 hover:bg-surface-100" (click)="cerrado.emit()" aria-label="Cerrar">✕</button>
        </div>

        <!-- Stepper -->
        <ol class="mt-4 grid grid-cols-3 gap-2 sm:gap-0" aria-label="Progreso">
          <li class="paso justify-start">
            <span class="paso-num" [class.active]="estaActivo('motor')" [class.done]="estaDone('motor')">
              @if (estaDone('motor')) { ✓ } @else { 1 }
            </span>
            <span class="text-xs font-bold uppercase tracking-wider text-marine-500 hidden sm:inline">Elige el motor</span>
          </li>
          <li class="paso justify-center">
            <span class="paso-num" [class.active]="estaActivo('basico')" [class.done]="estaDone('basico')">
              @if (estaDone('basico')) { ✓ } @else { 2 }
            </span>
            <span class="text-xs font-bold uppercase tracking-wider text-marine-500 hidden sm:inline">Información básica</span>
          </li>
          <li class="paso justify-end">
            <span class="paso-num" [class.active]="estaActivo('contenido')" [class.done]="estaDone('contenido')">
              @if (estaDone('contenido')) { ✓ } @else { 3 }
            </span>
            <span class="text-xs font-bold uppercase tracking-wider text-marine-500 hidden sm:inline">Contenido</span>
          </li>
        </ol>

        @if (error()) {
          <p class="mt-4 rounded-lg border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700">{{ error() }}</p>
        }

        <!-- PASO 1 -->
        @if (paso() === 'motor') {
          <div class="mt-4 space-y-4">
            <p class="text-sm text-marine-600">Elige uno de los motores disponibles en la base de datos. Cada uno define una mecánica diferente.</p>
            <div class="grid gap-2 sm:grid-cols-3">
              <div class="sm:col-span-2">
                <input type="text" class="input" [value]="filtroMotor()" (input)="filtroMotor.set($any($event.target).value)" placeholder="Buscar motor…" aria-label="Buscar motor" autocomplete="off" />
              </div>
              <select class="select" [value]="filtroFamilia()" (change)="filtroFamilia.set($any($event.target).value)" aria-label="Familia">
                <option value="">Todas las familias</option>
                <option value="generico">Genéricos (4)</option>
                <option value="especifico">Específicos (46)</option>
                <option value="adicional">Adicionales (46)</option>
              </select>
            </div>
            <div class="grid max-h-[55vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
              @for (m of motoresFiltrados(); track m.id) {
                <button type="button" class="flex flex-col items-start gap-1 rounded-xl border border-surface-200 bg-white p-3 text-left transition-all hover:border-brand-300 hover:bg-brand-50/40 min-h-24" (click)="seleccionarMotor(m)">
                  <span class="flex items-center gap-1.5 text-sm font-bold text-marine-800"><span class="text-base">{{ m.icono || '🎮' }}</span>{{ m.nombre }}</span>
                  @if (m.descripcion) { <span class="line-clamp-2 text-[0.7rem] text-marine-500">{{ m.descripcion }}</span> }
                  <span class="mt-auto flex flex-wrap gap-1 pt-1">
                    <span class="rounded-full bg-surface-100 px-2 py-0.5 text-[0.62rem] font-bold uppercase text-marine-600">{{ m.familia }}</span>
                    <span class="rounded-full bg-surface-100 px-2 py-0.5 font-mono text-[0.6rem] text-marine-500">{{ m.codigo }}</span>
                  </span>
                </button>
              } @empty {
                <p class="col-span-full py-6 text-center text-xs text-marine-500">Ningún motor coincide con el filtro.</p>
              }
            </div>
            <div class="flex justify-end gap-2 border-t border-surface-100 pt-3">
              <button type="button" class="btn btn-outline" (click)="cerrado.emit()">Cancelar</button>
            </div>
          </div>
        }

        <!-- PASO 2 -->
        @if (paso() === 'basico') {
          <form [formGroup]="formBasico" (ngSubmit)="irAContenido()" class="mt-4 space-y-3" aria-label="Datos básicos del minijuego">
            <div class="flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-50 p-3">
              <span class="text-3xl">{{ motorSel()?.icono || '🎮' }}</span>
              <div class="min-w-0">
                <p class="text-sm font-bold text-marine-800">{{ motorSel()?.nombre }}</p>
                <p class="text-xs text-marine-500">{{ motorSel()?.familia }} · {{ motorSel()?.codigo }}</p>
              </div>
            </div>

            <div>
              <label class="label" for="tit">Título del minijuego</label>
              <input id="tit" class="input" formControlName="titulo" placeholder="Ej. Quiz sobre Algoritmos de Ordenamiento" />
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <label class="label" for="dif">Dificultad</label>
                <select id="dif" class="select" formControlName="dificultad">
                  <option value="facil">Fácil</option>
                  <option value="media">Media</option>
                  <option value="dificil">Difícil</option>
                </select>
              </div>
              <div>
                <label class="label" for="xp">Puntos / XP</label>
                <input id="xp" type="number" min="0" class="input" formControlName="xpOtorgado" />
              </div>
              <div>
                <label class="label" for="dur">Tiempo límite total (s)</label>
                <input id="dur" type="number" min="0" class="input" formControlName="tiempoLimiteSeg" placeholder="0 = sin límite" />
              </div>
              <div>
                <label class="label" for="lec">Lección (opcional)</label>
                <select id="lec" class="select" formControlName="leccionId">
                  <option value="">Sin lección</option>
                  @for (l of lecciones(); track l.id) {
                    <option [value]="l.id">U{{ l.unidadNumero }} · {{ l.titulo }}</option>
                  }
                </select>
              </div>
            </div>

            <div>
              <label class="label" for="ins">Instrucciones</label>
              <textarea id="ins" class="textarea" rows="4" formControlName="descripcion" placeholder="Explica qué deben hacer los estudiantes, qué aprenderán y cómo se evalúa…" maxlength="2000"></textarea>
            </div>

            <div class="flex flex-wrap justify-between gap-2 border-t border-surface-100 pt-3">
              <button type="button" class="btn btn-outline" (click)="volverAtras()">Atrás</button>
              <div class="flex gap-2">
                <button type="button" class="btn btn-outline" (click)="cerrado.emit()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="formBasico.invalid">Continuar →</button>
              </div>
            </div>
          </form>
        }

        <!-- PASO 3 -->
        @if (paso() === 'contenido') {
          <div class="mt-4 space-y-3">
            @if (esQuiz()) {
              <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-50/60 border border-brand-200 p-3">
                <div>
                  <p class="text-sm font-bold text-marine-800">Preguntas del Quiz</p>
                  <p class="text-xs text-marine-500">{{ preguntas().length }} pregunta(s) · mínimo 3 válidas.</p>
                </div>
                <button type="button" class="btn btn-primary btn-sm !px-3" (click)="agregarPregunta()">+ Agregar Pregunta</button>
              </div>
              <div class="flex flex-wrap items-center gap-3 rounded-lg border border-surface-100 bg-surface-50 p-3">
                <label class="text-xs font-bold text-marine-600" for="tpp">Segundos por pregunta</label>
                <input id="tpp" type="number" min="5" class="input w-24" [value]="tiempoPreguntaSec()" (input)="tiempoPreguntaSec.set($any($event.target).valueAsNumber || 30)" placeholder="20" />
                <label class="text-xs font-bold text-marine-600" for="npopt">Opciones</label>
                <select id="npopt" class="select w-auto" [value]="opcionesCount()" (change)="setOpcionesCount($any($event.target).valueAsNumber)">
                  <option [value]="2">2 opciones</option>
                  <option [value]="3">3 opciones</option>
                  <option [value]="4">4 opciones</option>
                  <option [value]="5">5 opciones</option>
                  <option [value]="6">6 opciones</option>
                </select>
              </div>

              <div class="max-h-96 space-y-3 overflow-y-auto pr-1">
                @for (p of preguntas(); track $index; let i = $index) {
                  <div class="pregunta-card">
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <span class="pregunta-num">{{ i + 1 }}</span>
                        <p class="text-sm font-semibold text-marine-800">Pregunta {{ i + 1 }}</p>
                      </div>
                      <button type="button" class="text-xs font-bold text-danger-600 hover:underline" (click)="eliminarPregunta(i)" [disabled]="preguntas().length <= 3" title="Eliminar pregunta">Eliminar</button>
                    </div>

                    <label class="label mt-3" [for]="'preg-' + i">Pregunta</label>
                    <input [id]="'preg-' + i" class="input" [value]="p.pregunta" (input)="setPregunta(i, 'pregunta', $any($event.target).value)" placeholder="Escribe la pregunta…" />

                    <span class="label mt-3 text-xs text-marine-600 font-semibold uppercase">Opciones (marca la correcta)</span>
                    <div class="mt-1 grid gap-2 sm:grid-cols-2">
                      @for (op of p.opciones; track $index; let j = $index) {
                        <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-surface-200 px-2 py-1.5" [class.border-brand-500]="p.respuestaCorrecta === j" [class.bg-brand-50]="p.respuestaCorrecta === j">
                          <input type="radio" [name]="'preg-' + i" [checked]="p.respuestaCorrecta === j" (change)="setCorrecta(i, j)" />
                          <input class="w-full bg-transparent outline-none" [value]="op" (input)="setOpcion(i, j, $any($event.target).value)" placeholder="Opción {{ j + 1 }}" />
                        </label>
                      }
                    </div>

                    <label class="label mt-3" [for]="'exp-' + i">Explicación</label>
                    <textarea [id]="'exp-' + i" class="textarea" rows="2" [value]="p.explicacion" (input)="setPregunta(i, 'explicacion', $any($event.target).value)" placeholder="Explica por qué esta es la respuesta correcta…"></textarea>
                  </div>
                }
              </div>
            } @else if (esMemoria() || esEmparejamiento()) {
              <div class="flex items-center justify-between gap-2 rounded-xl bg-brand-50/60 border border-brand-200 p-3">
                <div>
                  <p class="text-sm font-bold text-marine-800">{{ esMemoria() ? 'Pares de memoria' : 'Pares de emparejamiento' }}</p>
                  <p class="text-xs text-marine-500">{{ pares().length }} par(es) · mínimo 4 válidos.</p>
                </div>
                <button type="button" class="btn btn-primary btn-sm !px-3" (click)="agregarPar()">+ Agregar Par</button>
              </div>
              <div class="max-h-96 space-y-2 overflow-y-auto pr-1">
                @for (p of pares(); track $index; let i = $index) {
                  <div class="rounded-xl border border-surface-200 p-3">
                    <div class="flex items-center gap-2">
                      <span class="pregunta-num">{{ i + 1 }}</span>
                      <p class="text-xs font-bold uppercase text-marine-400">Par {{ i + 1 }}</p>
                    </div>
                    <div class="mt-2 grid gap-2 sm:grid-cols-2">
                      <div><label class="label text-xs" [for]="'con-' + i">Concepto</label><input [id]="'con-' + i" class="input" [value]="p.concepto" (input)="setPar(i, 'concepto', $any($event.target).value)" placeholder="Ej. Variable" /></div>
                      <div><label class="label text-xs" [for]="'def-' + i">Definición</label><input [id]="'def-' + i" class="input" [value]="p.definicion" (input)="setPar(i, 'definicion', $any($event.target).value)" placeholder="Ej. Espacio de memoria con nombre" /></div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="space-y-3">
                <div class="rounded-xl bg-brand-50/60 border border-brand-200 p-4">
                  <p class="text-sm font-bold text-marine-800">Configura el contenido de {{ motorSel()?.nombre }}</p>
                  <p class="mt-1 text-xs text-marine-500">Ingresa al menos 4 temas/items (uno por línea). Este orden será el que verá el estudiante durante el juego.</p>
                </div>

                <div>
                  <label class="label" for="gen-items">Temas / niveles / tarjetas</label>
                  <textarea id="gen-items" class="textarea" rows="6" [value]="genericItems()" (input)="genericItems.set($any($event.target).value)" placeholder="Tema 1: Definición básica de X&#10;Tema 2: Caso de uso práctico&#10;Tema 3: Ejemplo resuelto&#10;Tema 4: Ejercicio de práctica"></textarea>
                  <p class="mt-1 text-xs text-marine-500">{{ itemsParseados().length }} item(s) — mínimo 4 válidos.</p>
                </div>

                <div>
                  <label class="label" for="gen-json">Configuración avanzada (opcional)</label>
                  <textarea id="gen-json" class="textarea font-mono text-xs" rows="5" [value]="genericJson()" (input)="genericJson.set($any($event.target).value)" placeholder='{ "intentos": 3, "tiempoPorNivel": 60, "aleatorizar": true }'></textarea>
                  @if (genericJsonError(); as err) { <p class="mt-1 text-xs font-medium text-danger-600">JSON inválido: {{ err }}</p> }
                  <p class="mt-1 text-xs text-marine-500">Clave/valor JSON que se pasa al motor — ej. cantidad de intentos, tiempo por nivel, opciones del motor.</p>
                </div>

                <p class="text-xs text-marine-400">Motor: <code>{{ motorSel()?.codigo }}</code> · Familia: <code>{{ motorSel()?.familia }}</code>.</p>
              </div>
            }

            <div class="flex flex-wrap justify-between gap-2 border-t border-surface-100 pt-3">
              <button type="button" class="btn btn-outline" (click)="volverAtras()">← Atrás</button>
              <div class="flex gap-2">
                <button type="button" class="btn btn-outline" (click)="cerrado.emit()">Cancelar</button>
                <button type="button" class="btn btn-primary" [disabled]="!contenidoValido() || publicando()" (click)="publicar()">{{ publicando() ? 'Publicando…' : 'Publicar minijuego' }}</button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class CrearMinijuegoModalComponent implements OnInit {
  private readonly courseService = inject(CourseService);
  private readonly gameService = inject(GameService);
  private readonly fb = inject(FormBuilder);

  /** Curso asignado para el cual crear el minijuego (desde el padre). */
  readonly cursoId = input.required<string>();
  /** Motor preelegido desde el catálogo del padre (no se vuelve a pedir). */
  readonly motorPreseleccionado = input<Motor | null>(null);
  /** Emite cuando el docente cierra y abandona el flujo. */
  readonly cerrado = output<void>();
  /** Emite al padre para que refresque su lista de juegos. */
  readonly creado = output<void>();

  // ─── Estado ───
  protected readonly paso = signal<Paso>('motor');
  protected readonly motorSel = signal<Motor | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly publicando = signal(false);

  protected readonly motores = signal<Motor[]>([]);
  protected readonly lecciones = signal<{ id: string; titulo: string; unidadNumero: number }[]>([]);
  protected readonly filtroMotor = signal('');
  protected readonly filtroFamilia = signal<string>('');
  protected readonly tiempoPreguntaSec = signal<number>(30);

  protected readonly preguntas = signal<PreguntaQuiz[]>([
    { pregunta: '', opciones: ['', '', '', ''], respuestaCorrecta: 0, explicacion: '', tiempoSeg: 20 },
    { pregunta: '', opciones: ['', '', '', ''], respuestaCorrecta: 0, explicacion: '', tiempoSeg: 20 },
    { pregunta: '', opciones: ['', '', '', ''], respuestaCorrecta: 0, explicacion: '', tiempoSeg: 20 },
    { pregunta: '', opciones: ['', '', '', ''], respuestaCorrecta: 0, explicacion: '', tiempoSeg: 20 },
    { pregunta: '', opciones: ['', '', '', ''], respuestaCorrecta: 0, explicacion: '', tiempoSeg: 20 },
  ]);
  protected readonly pares = signal<ParItem[]>(Array.from({ length: 8 }, () => ({ concepto: '', definicion: '' })));
  /** Número de opciones por pregunta (2 a 6). */
  protected readonly opcionesCount = signal<number>(4);
  /** Editor genérico: una línea por item (tema/nivel/tarjeta). */
  protected readonly genericItems = signal<string>('Tema 1\nTema 2\nTema 3\nTema 4');
  /** Configuración JSON avanzada para motores no Quiz/Memoria. */
  protected readonly genericJson = signal<string>('{\n  "intentos": 3,\n  "tiempoPorNivel": 60\n}');

  protected readonly motoresFiltrados = computed(() => {
    const q = this.filtroMotor().trim().toLowerCase();
    const f = this.filtroFamilia();
    return this.motores().filter(
      (m) => (f === '' || m.familia === f) && (q === '' || m.nombre.toLowerCase().includes(q) || (m.descripcion ?? '').toLowerCase().includes(q) || m.codigo.includes(q)),
    );
  });

  // ─── Editor genérico (no quiz/no memoria) ───
  /** Items de la rama genérica, filtrados y trimados. */
  protected readonly itemsParseados = computed(() =>
    this.genericItems().split('\n').map((s) => s.trim()).filter(Boolean),
  );

  /** Error de sintaxis JSON de la rama genérica (null si válido). */
  protected readonly genericJsonError = computed(() => {
    const raw = this.genericJson().trim();
    if (!raw) return null;
    try { JSON.parse(raw); return null; } catch (e) { return e instanceof Error ? e.message : String(e); }
  });

  protected readonly pasoOffset = computed(() => ['motor', 'basico', 'contenido'].indexOf(this.paso()));

  protected estaActivo(s: Paso): boolean { return this.paso() === s; }
  protected estaDone(s: Paso): boolean {
    const orden: Paso[] = ['motor', 'basico', 'contenido'];
    return orden.indexOf(s) < orden.indexOf(this.paso());
  }
  protected tituloCabecera(): string {
    switch (this.paso()) {
      case 'motor': return 'Configurar minijuego';
      case 'basico': return 'Información del minijuego';
      case 'contenido': return 'Contenido del minijuego';
    }
  }

  protected readonly formBasico = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    dificultad: ['facil' as 'facil' | 'media' | 'dificil', Validators.required],
    xpOtorgado: [100, [Validators.required, Validators.min(0)]],
    tiempoLimiteSeg: [600, [Validators.min(0)]],
    leccionId: [''],
  });

  ngOnInit(): void {
    if (this.motorPreseleccionado()) {
      this.seleccionarMotor(this.motorPreseleccionado()!);
    }
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try { this.motores.set(await this.gameService.listarMotores()); } catch { this.motores.set([]); }
    try {
      const est = await this.courseService.obtenerEstructuraGestion(this.cursoId());
      const ls: { id: string; titulo: string; unidadNumero: number }[] = [];
      for (const u of est.unidades) for (const m of u.modulos) for (const l of m.lecciones) {
        ls.push({ id: l.id, titulo: l.titulo, unidadNumero: u.numero });
      }
      this.lecciones.set(ls);
    } catch { this.lecciones.set([]); }
  }

  protected seleccionarMotor(m: Motor): void {
    this.motorSel.set(m);
    this.paso.set('basico');
    // Pre-carga las instrucciones del motor para que el docente sepa qué
    // debe ser el minijuego (el docente edita el texto si lo necesita).
    const texto = INSTRUCCIONES_MOTOR[m.codigo?.toLowerCase() ?? '']
      ?? INSTRUCCIONES_MOTOR[m.codigo ?? '']
      ?? `Juego sobre "${m.nombre}": ${m.descripcion ?? 'juega, descubre y aprende con la mecánica del motor.'}`;
    this.formBasico.patchValue({ descripcion: texto }, { emitEvent: false });
  }

  protected volverAtras(): void {
    if (this.paso() === 'basico') this.paso.set('motor');
    else if (this.paso() === 'contenido') this.paso.set('basico');
  }

  protected irAContenido(): void {
    if (this.formBasico.invalid) return;
    this.paso.set('contenido');
  }

  protected esQuiz(): boolean {
    const c = (this.motorSel()?.codigo ?? '').toLowerCase();
    return /quiz|seleccion-multiple|verdadero-falso|desafio-pensamiento|enigma-matematico|completar-codigo|practica-/.test(c);
  }
  protected esMemoria(): boolean {
    const c = (this.motorSel()?.codigo ?? '').toLowerCase();
    return /simulador-memoria|emparejamiento|memoria|relacionar|crucigrama/.test(c);
  }
  protected esEmparejamiento(): boolean {
    const c = (this.motorSel()?.codigo ?? '').toLowerCase();
    return /simulador-memoria|emparejamiento|memoria|relacionar|crucigrama/.test(c);
  }

  /** Cambia el número de opciones de las preguntas (2 a 6) y ajusta todas las preguntas. */
  protected setOpcionesCount(n: number): void {
    if (!Number.isFinite(n)) return;
    const count = Math.max(2, Math.min(6, Math.trunc(n)));
    this.opcionesCount.set(count);
    this.preguntas.update((arr) =>
      arr.map((p) => {
        const opciones = [...p.opciones];
        if (opciones.length < count) {
          while (opciones.length < count) opciones.push('');
        } else if (opciones.length > count) {
          opciones.length = count;
        }
        return { ...p, opciones };
      }),
    );
  }

  protected agregarPregunta(): void {
    const count = this.opcionesCount();
    this.preguntas.update((p) => [
      ...p,
      { pregunta: '', opciones: Array.from({ length: count }, () => ''), respuestaCorrecta: 0, explicacion: '', tiempoSeg: this.tiempoPreguntaSec() },
    ]);
  }
  protected eliminarPregunta(i: number): void {
    this.preguntas.update((p) => (p.length > 3 ? p.filter((_, idx) => idx !== i) : p));
  }
  protected setPregunta(i: number, campo: 'pregunta' | 'explicacion', v: string): void {
    this.preguntas.update((arr) => arr.map((x, idx) => (idx === i ? { ...x, [campo]: v, tiempoSeg: this.tiempoPreguntaSec() } : x)));
  }
  protected setOpcion(i: number, j: number, v: string): void {
    this.preguntas.update((arr) => arr.map((x, idx) =>
      idx === i ? { ...x, opciones: x.opciones.map((o, k) => (k === j ? v : o)) } : x,
    ));
  }
  protected setCorrecta(i: number, j: number): void {
    this.preguntas.update((arr) => arr.map((x, idx) => (idx === i ? { ...x, respuestaCorrecta: j } : x)));
  }

  protected agregarPar(): void {
    this.pares.update((p) => [...p, { concepto: '', definicion: '' }]);
  }
  protected setPar(i: number, campo: 'concepto' | 'definicion', v: string): void {
    this.pares.update((arr) => arr.map((x, idx) => (idx === i ? { ...x, [campo]: v } : x)));
  }

  protected contenidoValido(): boolean {
    if (this.formBasico.invalid) return false;
    if (this.esQuiz()) {
      return this.preguntas().every((p) => p.pregunta.trim() && p.opciones.every((o) => o.trim()) && p.explicacion.trim());
    }
    if (this.esMemoria() || this.esEmparejamiento()) {
      return this.pares().filter((p) => p.concepto.trim() && p.definicion.trim()).length >= 4;
    }
    // Genérico: requiere al menos 4 items válidos y JSON válido (si está presente).
    return this.itemsParseados().length >= 4 && this.genericJsonError() === null;
  }

  protected async publicar(): Promise<void> {
    if (!this.contenidoValido() || !this.motorSel()) return;
    this.publicando.set(true);
    this.error.set(null);
    try {
      const motor = this.motorSel()!;
      const v = this.formBasico.getRawValue();

      let contenido: unknown;
      if (this.esQuiz()) {
        contenido = { preguntas: this.preguntas().filter((p) => p.pregunta.trim()).map((p) => ({ ...p, tiempoSeg: this.tiempoPreguntaSec() })) };
      } else if (this.esMemoria() || this.esEmparejamiento()) {
        contenido = { pares: this.pares().filter((p) => p.concepto.trim()) };
      } else {
        // Editor genérico: cualquier motor no Quiz/Memoria/Emparejamiento selecciona los temas del juego y pasa una config opcional como JSON.
        const items = this.itemsParseados();
        const rawJson = this.genericJson().trim();
        let extra: Record<string, unknown> = {};
        if (rawJson) { try { extra = JSON.parse(rawJson) as Record<string, unknown>; } catch { /* validación ya hecha */ } }
        contenido = { generico: true, instrucciones: v.descripcion, items, config: extra };
      }

      await this.gameService.crearJuegoDocente({
        cursoId: this.cursoId(),
        motorCodigo: motor.codigo,
        nombre: v.titulo,
        descripcion: v.descripcion,
        dificultad: v.dificultad,
        xpOtorgado: Number(v.xpOtorgado) || 0,
        tiempoLimiteSeg: v.tiempoLimiteSeg === 0 ? null : v.tiempoLimiteSeg,
        contenido,
      });

      this.creado.emit();
      this.cerrado.emit();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo crear el minijuego.');
    } finally {
      this.publicando.set(false);
    }
  }
}
