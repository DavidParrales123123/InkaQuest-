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
  ContenidoPares,
  ResultadoPartida,
  estrellasPorPrecision,
} from './contenido-juego.model';

interface LadoItem {
  grupo: number;
  texto: string;
  estado: 'nuevo' | 'seleccionado' | 'emparejado';
}

/**
 * Runtime de emparejamiento en dos columnas.
 *
 * <p>El estudiante selecciona un concepto de la columna izquierda y luego su
 * definición en la derecha. Acerto a cerrar todas las parejas para terminar;
 * la precisión refleja los errores cometidos.</p>
 */
@Component({
  selector: 'app-emparejamiento-runtime',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-3 text-xs font-semibold text-marine-500">
        <span>Parejas {{ emparejadas() }} de {{ total() }}</span>
        <span>Errores: {{ errores() }}</span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded-full bg-surface-100" role="progressbar"
        [attr.aria-valuenow]="progreso()" aria-valuemin="0" aria-valuemax="100">
        <div class="h-2 bg-brand-500 transition-all duration-500" [style.width.%]="progreso()"></div>
      </div>
      <p class="text-sm text-marine-600">Selecciona un concepto de la izquierda y luego su definición correcta.</p>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="space-y-2">
          <p class="text-xs font-bold uppercase tracking-wider text-marine-400">Concepto</p>
          @for (c of conceptos(); track c.grupo) {
            <button type="button" [class]="claseItem(c)" [disabled]="c.estado === 'emparejado'" (click)="elegirConcepto(c)">
              <span class="min-w-0 break-words">{{ c.texto }}</span>
              @if (c.estado === 'emparejado') { <span class="ml-auto text-success-600">✓</span> }
            </button>
          }
        </div>
        <div class="space-y-2">
          <p class="text-xs font-bold uppercase tracking-wider text-marine-400">Definición</p>
          @for (d of definiciones(); track d.grupo) {
            <button type="button" [class]="claseItem(d)" [disabled]="d.estado === 'emparejado'" (click)="elegirDefinicion(d)">
              <span class="min-w-0 break-words">{{ d.texto }}</span>
              @if (d.estado === 'emparejado') { <span class="ml-auto text-success-600">✓</span> }
            </button>
          }
        </div>
      </div>

      @if (terminado()) {
        <div class="rounded-xl border border-success-200 bg-success-50 p-4 text-sm text-success-800">
          <p class="font-bold">¡Perfecto! Emparejaste los {{ total() }} pares.</p>
          <div class="mt-3 flex justify-end">
            <button type="button" class="btn btn-primary btn-sm" (click)="terminar()">Finalizar</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .emp-item {
      display: flex; align-items: center; gap: .5rem; width: 100%;
      border-radius: .75rem; border: 1px solid var(--color-surface-200, #d5e6e4);
      background: #fff; padding: .65rem .8rem; text-align: left;
      font-size: .82rem; font-weight: 500; color: #113331;
      transition: border-color .15s ease, background .15s ease;
    }
    .emp-item:not(:disabled):hover { border-color: #12736b; background: #e8f6f4; }
    .emp-item:disabled { cursor: default; opacity: .7; }
    .emp-emp { border-color: #12736b; background: #e8f6f4; color: #0f5d57; }
    .emp-sel { border-color: #f5b43c; background: rgba(245, 180, 60, .18); box-shadow: 0 0 0 2px rgba(245, 180, 60, .35); }
  `],
})
export class EmparejamientoRuntimeComponent {
  readonly contenido = input.required<ContenidoPares>();
  readonly tiempoLimiteTotalSeg = input<number | null>(null);
  readonly finalizado = output<ResultadoPartida>();

  private readonly destroyRef = inject(DestroyRef);

  protected readonly conceptos = signal<LadoItem[]>([]);
  protected readonly definiciones = signal<LadoItem[]>([]);
  protected readonly conceptoSel = signal<number | null>(null);
  protected readonly errores = signal(0);
  protected readonly terminado = signal(false);
  private totalTimer: ReturnType<typeof setInterval> | null = null;
  private tiempoTotalMs = 0;

  protected readonly total = computed(() => this.contenido().pares.length);
  protected readonly emparejadas = computed(
    () => this.conceptos().filter((c) => c.estado === 'emparejado').length,
  );
  protected readonly progreso = computed(() =>
    this.total() === 0 ? 0 : Math.round((this.emparejadas() / this.total()) * 100),
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.totalTimer) clearInterval(this.totalTimer);
    });

    effect(() => {
      const pares = this.contenido().pares;
      const conceptos: LadoItem[] = pares.map((p, i) => ({ grupo: i, texto: p.concepto, estado: 'nuevo' }));
      const definiciones: LadoItem[] = pares.map((p, i) => ({ grupo: i, texto: p.definicion, estado: 'nuevo' }));
      // Desordenar la columna derecha para que no coincida con el concepto.
      for (let i = definiciones.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [definiciones[i], definiciones[j]] = [definiciones[j], definiciones[i]];
      }
      this.conceptos.set(conceptos);
      this.definiciones.set(definiciones);
      this.conceptoSel.set(null);
      this.errores.set(0);
      this.terminado.set(false);
    });

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

  protected claseItem(l: LadoItem): string {
    const base = 'emp-item';
    if (l.estado === 'emparejado') return `${base} emp-emp`;
    return l.grupo === this.conceptoSel() ? `${base} emp-sel` : base;
  }

  protected elegirConcepto(c: LadoItem): void {
    if (c.estado === 'emparejado') return;
    this.conceptoSel.set(this.conceptoSel() === c.grupo ? null : c.grupo);
  }

  protected elegirDefinicion(d: LadoItem): void {
    if (d.estado === 'emparejado') return;
    const sel = this.conceptoSel();
    if (sel === null) return; // Primero un concepto, luego una definición.

    if (sel === d.grupo) {
      // Emparejamiento correcto.
      this.conceptos.set(this.conceptos().map((c) => (c.grupo === sel ? { ...c, estado: 'emparejado' as const } : c)));
      this.definiciones.set(this.definiciones().map((x) => (x.grupo === sel ? { ...x, estado: 'emparejado' as const } : x)));
      this.conceptoSel.set(null);
      if (this.conceptos().every((c) => c.estado === 'emparejado')) {
        this.terminado.set(true);
      }
    } else {
      this.errores.update((e) => e + 1);
      // Parpadear el item equivocado: función lógica de "erro", la UI ya lo muestra como fallo.
      this.conceptoSel.set(null);
    }
  }

  private forzarFinPorTiempo(): void {
    if (this.terminado()) return;
    const total = this.total();
    const ok = this.emparejadas();
    this.emitir({
      puntaje: ok * 100,
      puntajeMaximo: total * 100,
      precision: Math.round((ok / Math.max(1, total + this.errores())) * 100),
      completitud: Math.round((ok / Math.max(1, total)) * 100),
      aciertos: ok,
      errores: this.errores(),
      estrellas: 0,
      completado: false,
      desglose: { motivoFin: 'tiempo_agotado', paresEmparejados: ok, errores: this.errores() },
    });
  }

  protected terminar(): void {
    const total = this.total();
    const ok = this.emparejadas();
    const errores = this.errores();
    const intentos = ok + errores;
    const precision = intentos === 0 ? 0 : Math.round((ok / intentos) * 100);
    const completado = ok === total;
    this.emitir({
      puntaje: ok * 100,
      puntajeMaximo: total * 100,
      precision,
      completitud: Math.round((ok / Math.max(1, total)) * 100),
      aciertos: ok,
      errores,
      estrellas: completado ? estrellasPorPrecision(precision) : 0,
      completado,
      desglose: { paresEmparejados: ok, errores },
    });
  }

  private emitir(r: ResultadoPartida): void {
    if (this.totalTimer) {
      clearInterval(this.totalTimer);
      this.totalTimer = null;
    }
    this.finalizado.emit(r);
  }
}
