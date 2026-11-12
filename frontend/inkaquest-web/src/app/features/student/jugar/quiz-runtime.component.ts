import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import {
  ContenidoQuiz,
  ResultadoPartida,
  estrellasPorPrecision,
} from './contenido-juego.model';

/**
 * Runtime de preguntas tipo quiz.
 *
 * <p>Pregunta con cronómetro por pregunta ({@code tiempoSeg}, por defecto 20 s).
 * Al responder (o agotarse el tiempo) se muestra la explicación. Cada acierto
 * vale 100 puntos. Se necesita ≥ 50 % de aciertos para completar el intento
 * y ganar la recompensa configurada en la actividad.</p>
 */
@Component({
  selector: 'app-quiz-runtime',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-3 text-xs font-semibold text-marine-500">
        <span>Pregunta {{ indice() + 1 }} de {{ total() }}</span>
        <span>Aciertos: {{ aciertos() }} · Errores: {{ errores() }}</span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded-full bg-surface-100" role="progressbar" [attr.aria-valuenow]="progreso() * 100" aria-valuemin="0" aria-valuemax="100">
        <div class="h-2 bg-brand-500 transition-all duration-500" [style.width.%]="progreso() * 100"></div>
      </div>

      <div class="flex items-center justify-between gap-3">
        <p class="text-xs font-bold uppercase tracking-wider text-marine-400">Tiempo por pregunta</p>
        <span class="rounded-full bg-surface-100 px-3 py-1 font-mono text-sm font-bold"
          [class.bg-danger-50]="segundos() <= 5" [class.text-danger-600]="segundos() <= 5">{{ segundos() }}s</span>
      </div>

      <h3 class="text-xl font-extrabold text-marine-800">{{ preguntaActual().pregunta }}</h3>

      <div class="grid gap-2" role="radiogroup" [attr.aria-label]="'Opciones de la pregunta ' + (indice() + 1)">
        @for (op of preguntaActual().opciones; track $index; let i = $index) {
          <button type="button" [class]="claseOpcion(i)"
            [disabled]="respondida() !== null"
            (click)="responder(i)">
            <span [class]="claseLetra(i)">{{ letra(i) }}</span>
            <span class="min-w-0 break-words">{{ op }}</span>
          </button>
        }
      </div>

      @if (respondida() !== null) {
        <div class="rounded-xl border p-4 text-sm"
          [class]="respondida() === preguntaActual().respuestaCorrecta
            ? 'border-success-200 bg-success-50 text-success-700'
            : 'border-danger-200 bg-danger-50 text-danger-700'">
          <p class="font-bold">{{ respondida() === preguntaActual().respuestaCorrecta ? '¡Correcto!' : 'Incorrecto.' }}</p>
          @if (preguntaActual().explicacion) {
            <p class="mt-1 text-marine-700">{{ preguntaActual().explicacion }}</p>
          }
          <div class="mt-3 flex justify-end">
            <button type="button" class="btn btn-primary btn-sm" autofocus (click)="siguiente()">
              {{ esUltima() ? 'Finalizar' : 'Siguiente →' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class QuizRuntimeComponent {
  readonly contenido = input.required<ContenidoQuiz>();
  readonly tiempoLimiteTotalSeg = input<number | null>(null);
  readonly finalizado = output<ResultadoPartida>();

  private readonly destroyRef = inject(DestroyRef);

  protected readonly indice = signal(0);
  protected readonly aciertos = signal(0);
  protected readonly errores = signal(0);
  /** null = pregunta sin responder; -1 = tiempo agotado. */
  protected readonly respondida = signal<number | null>(null);
  protected readonly segundos = signal(20);
  private tiempoTotalMs = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private totalTimer: ReturnType<typeof setInterval> | null = null;

  protected readonly total = computed(() => this.contenido().preguntas.length);
  protected readonly preguntaActual = computed(() => this.contenido().preguntas[this.indice()]);
  protected readonly esUltima = computed(() => this.indice() >= this.contenido().preguntas.length - 1);
  protected readonly progreso = computed(
    () => (this.indice() + (this.respondida() !== null ? 1 : 0)) / this.total(),
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.limpiarTimers());

    // Cronómetro de cada pregunta (empieza cuando el índice cambia o se monta).
    effect(() => {
      const idx = this.indice();
      const p = this.contenido().preguntas[idx];
      this.respondida.set(null);
      this.segundos.set(p.tiempoSeg ?? 20);
      this.iniciarTemporizadorPregunta();
    });

    // Cuenta regresiva global configurada por el docente (una sola vez).
    effect(() => {
      if (this.totalTimer) return;
      const total = this.tiempoLimiteTotalSeg();
      if (!total || total <= 0) return;
      this.totalTimer = setInterval(() => {
        this.tiempoTotalMs += 1000;
        if (this.tiempoTotalMs >= total * 1000) this.forzarFinPorTiempo();
      }, 1000);
    });
  }

  protected letra(i: number): string {
    return String.fromCharCode(65 + i);
  }

  protected claseLetra(i: number): string {
    const base = 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-extrabold';
    if (this.respondida() === null) return base + ' border-marine-200 text-marine-600';
    if (i === this.preguntaActual().respuestaCorrecta) return base + ' border-success-400 bg-success-100 text-success-700';
    if (i === this.respondida()) return base + ' border-danger-400 bg-danger-100 text-danger-700';
    return base + ' border-marine-200 text-marine-400';
  }

  protected claseOpcion(i: number): string {
    const base = 'flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all';
    if (this.respondida() === null) {
      return base + ' border-surface-200 bg-white hover:border-brand-400 hover:bg-brand-50/40 text-marine-800';
    }
    if (i === this.preguntaActual().respuestaCorrecta) return base + ' border-success-400 bg-success-50 text-success-800';
    if (i === this.respondida()) return base + ' border-danger-400 bg-danger-50 text-danger-800';
    return base + ' border-surface-100 bg-surface-50 text-marine-400';
  }

  protected responder(i: number): void {
    if (this.respondida() !== null) return;
    if (i === this.preguntaActual().respuestaCorrecta) this.aciertos.update((n) => n + 1);
    else this.errores.update((n) => n + 1);
    this.respondida.set(i);
    this.limpiarTemporizadorPregunta();
  }

  protected siguiente(): void {
    if (this.respondida() === null) return;
    if (this.esUltima()) {
      this.terminar();
      return;
    }
    this.indice.update((i) => i + 1);
  }

  private iniciarTemporizadorPregunta(): void {
    this.limpiarTemporizadorPregunta();
    this.timer = setInterval(() => {
      const actual = this.segundos() - 1;
      if (actual <= 0) {
        this.segundos.set(0);
        // Tiempo agotado: cuenta como error y se revela la respuesta.
        this.errores.update((n) => n + 1);
        this.respondida.set(-1);
        this.limpiarTemporizadorPregunta();
      } else {
        this.segundos.set(actual);
      }
    }, 1000);
  }

  private limpiarTemporizadorPregunta(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private limpiarTimers(): void {
    this.limpiarTemporizadorPregunta();
    if (this.totalTimer) {
      clearInterval(this.totalTimer);
      this.totalTimer = null;
    }
  }

  private forzarFinPorTiempo(): void {
    const pendientes = this.contenido().preguntas.length - (this.aciertos() + this.errores());
    this.errores.update((n) => n + Math.max(0, pendientes));
    this.terminar();
  }

  private terminar(): void {
    this.limpiarTimers();
    const total = this.total();
    const aciertos = this.aciertos();
    const errores = this.errores();
    const precision = total > 0 ? Math.round((aciertos / total) * 100) : 0;
    const puntaje = aciertos * 100;
    const completado = precision >= 50;
    this.finalizado.emit({
      puntaje,
      puntajeMaximo: total * 100,
      precision,
      completitud: 100,
      aciertos,
      errores,
      estrellas: estrellasPorPrecision(precision),
      completado,
      desglose: { preguntas: total, aciertos, errores, tiempoTotalSeg: this.tiempoTotalMs / 1000 },
    });
  }
}
