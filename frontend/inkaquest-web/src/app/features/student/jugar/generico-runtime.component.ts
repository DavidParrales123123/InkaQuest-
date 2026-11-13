// @ts-nocheck
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

import {
  ContenidoGenerico,
  ResultadoPartida,
} from './contenido-juego.model';

/**
 * Runtime de contenido genérico (tarjetas de estudio).
 *
 * <p>Usado por motores que no son quiz/memoria/emparejamiento. Recorre los
 * temas/items definidos por el docente en orden, con una tarjeta por item.
 * Al terminar, puntúa el 100 % a favor del estudiante y registra el intento.</p>
 */
@Component({
  selector: 'app-generico-runtime',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-3 text-xs font-semibold text-marine-500">
        <span>Tema {{ indice() + 1 }} de {{ total() }}</span>
        <span>{{ total() - indice() - 1 > 0 ? (total() - indice() - 1) + ' restante(s)' : 'Último tema' }}</span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded-full bg-surface-100" role="progressbar"
        [attr.aria-valuenow]="progreso()" aria-valuemin="0" aria-valuemax="100">
        <div class="h-2 bg-brand-500 transition-all duration-500" [style.width.%]="progreso()"></div>
      </div>

      <article class="rounded-2xl border border-brand-200 bg-brand-50/50 p-5">
        <p class="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-brand-700">Tema {{ indice() + 1 }}</p>
        <p class="mt-2 whitespace-pre-wrap text-lg font-semibold leading-snug text-marine-800">{{ itemActual() }}</p>
      </article>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <button type="button" class="btn btn-outline" [disabled]="indice() === 0" (click)="anterior()">← Anterior</button>
        @if (esUltimo()) {
          <button type="button" class="btn btn-primary" (click)="siguienteYFinalizar()">Marcar como estudiado y finalizar ✓</button>
        } @else {
          <button type="button" class="btn btn-primary" (click)="siguiente()">Siguiente →</button>
        }
      </div>
    </div>
  `,
})
export class GenericoRuntimeComponent {
  readonly contenido = input.required<ContenidoGenerico>();
  readonly finalizado = output<ResultadoPartida>();

  protected readonly indice = signal(0);

  protected readonly total = computed(() => this.contenido().items.length);
  protected readonly itemActual = computed(() => this.contenido().items[this.indice()]);
  protected readonly esUltimo = computed(() => this.indice() >= this.total() - 1);
  protected readonly progreso = computed(
    () => Math.round(((this.indice() + 1) / this.total()) * 100),
  );

  protected anterior(): void {
    this.indice.update((i) => Math.max(0, i - 1));
  }

  protected siguiente(): void {
    if (!this.esUltimo()) this.indice.update((i) => i + 1);
  }

  protected siguienteYFinalizar(): void {
    const total = this.total();
    this.finalizado.emit({
      puntaje: total * 100,
      puntajeMaximo: total * 100,
      precision: 100,
      completitud: 100,
      aciertos: total,
      errores: 0,
      estrellas: 3,
      completado: true,
      desglose: { temasEstudiados: total, instrucciones: this.contenido().instrucciones, config: this.contenido().config },
    });
  }
}
