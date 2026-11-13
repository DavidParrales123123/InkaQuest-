// @ts-nocheck
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

interface Carta {
  id: number;
  grupo: number;
  contenido: string;
  encontrada: boolean;
  volteada: boolean;
}

/**
 * Runtime de emparejamiento tipo memoria.
 *
 * <p>Voltea cartas de a dos hasta encontrar todas las parejas. La precisión
 * mide la eficiencia (pocos movimientos para muchos pares). Completar todos
 * los pares da por terminado el intento.</p>
 */
@Component({
  selector: 'app-memoria-runtime',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-3 text-xs font-semibold text-marine-500">
        <span>Pareja {{ paresEncontrados() }} de {{ totalPares() }}</span>
        <span>Movimientos: {{ movimientos() }}</span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded-full bg-surface-100" role="progressbar"
        [attr.aria-valuenow]="progresoEnPuntos()" aria-valuemin="0" aria-valuemax="100">
        <div class="h-2 bg-brand-500 transition-all duration-500" [style.width.%]="progresoEnPuntos()"></div>
      </div>
      <p class="text-sm text-marine-600">Voltea dos cartas a la vez y encuentra las parejas concepto–definición.</p>

      <div class="grid gap-2" [style.grid-template-columns]="'repeat(' + columnas() + ', minmax(0, 1fr))'">
        @for (c of cartas(); track c.id) {
          <button type="button" class="carta-memoria" [class]="claseCarta(c)" (click)="volteando(c)" [disabled]="bloqueado() || c.encontrada || c.volteada"
            [attr.aria-pressed]="c.volteada" [attr.aria-label]="c.volteada || c.encontrada ? c.contenido : 'Carta oculta'">
            <span class="carta-cara">
              @if (c.volteada || c.encontrada) {
                <span class="text-[0.68rem] sm:text-xs font-semibold leading-snug">{{ c.contenido }}</span>
              } @else {
                <span class="text-2xl">?</span>
              }
            </span>
          </button>
        }
      </div>

      @if (terminado()) {
        <div class="rounded-xl border border-success-200 bg-success-50 p-4 text-sm text-success-800">
          <p class="font-bold">¡Completo! Encontraste los {{ totalPares() }} pares.</p>
          <div class="mt-3 flex justify-end">
            <button type="button" class="btn btn-primary btn-sm" (click)="terminar()">Finalizar</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .carta-memoria {
      aspect-ratio: 4 / 3;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.75rem;
      border: 2px solid rgba(28, 42, 74, 0.18);
      background: linear-gradient(145deg, #1b2a4a, #324d7a);
      color: #f5b43c;
      overflow: hidden;
      transition: transform .18s ease, border-color .18s ease, background .18s ease;
      min-height: 4.5rem;
      padding: .5rem;
    }
    .carta-memoria:not(:disabled):hover { transform: translateY(-2px); border-color: #f5b43c; }
    .carta-cara { text-align: center; word-break: break-word; color: #fff; }
    .carta-volteada { background: #fff; border-color: #12736b; }
    .carta-volteada .carta-cara { color: #113331; }
    .carta-encontrada { background: #e8f6f4; border-color: #12736b; }
    .carta-encontrada .carta-cara { color: #0f5d57; }
    @media (max-width: 420px) { .carta-memoria { min-height: 3.5rem; } }
  `],
})
export class MemoriaRuntimeComponent {
  readonly contenido = input.required<ContenidoPares>();
  readonly tiempoLimiteTotalSeg = input<number | null>(null);
  readonly finalizado = output<ResultadoPartida>();

  private readonly destroyRef = inject(DestroyRef);

  protected readonly cartas = signal<Carta[]>([]);
  protected readonly seleccion = signal<Carta[]>([]);
  protected readonly movimientos = signal(0);
  protected readonly bloqueado = signal(false);
  protected readonly terminado = signal(false);
  private desbloqueoTimer: ReturnType<typeof setTimeout> | null = null;
  private totalTimer: ReturnType<typeof setInterval> | null = null;
  private tiempoTotalMs = 0;

  protected readonly totalPares = computed(() => this.contenido().pares.length);
  protected readonly paresEncontrados = computed(
    () => new Set(this.cartas().filter((c) => c.encontrada).map((c) => c.grupo)).size,
  );
  protected readonly progresoEnPuntos = computed(() =>
    this.totalPares() === 0 ? 0 : Math.round((this.paresEncontrados() / this.totalPares()) * 100),
  );
  protected readonly columnas = computed(() => {
    const n = this.cartas().length || 8;
    return n <= 8 ? 4 : n <= 12 ? 6 : n <= 20 ? 5 : 6;
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.desbloqueoTimer) clearTimeout(this.desbloqueoTimer);
      if (this.totalTimer) clearInterval(this.totalTimer);
    });

    effect(() => {
      const pares = this.contenido().pares;
      // Barajado determinístico por montaje (sin Math.random en caliente).
      const paresExpand = pares.flatMap((p, i) => [
        { grupo: i, contenido: p.concepto },
        { grupo: i, contenido: p.definicion },
      ]);
      const cartas: Carta[] = paresExpand.map((x, id) => ({
        id, grupo: x.grupo, contenido: x.contenido, encontrada: false, volteada: false,
      }));
      const barajadas: Carta[] = [];
      for (const c of cartas) barajadas.push(c);
      for (let i = barajadas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [barajadas[i], barajadas[j]] = [barajadas[j], barajadas[i]];
      }
      this.cartas.set(barajadas.map((c, i) => ({ ...c, id: i })));
      this.movimientos.set(0);
      this.terminado.set(false);
      this.seleccion.set([]);
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

  protected claseCarta(c: Carta): string {
    if (c.encontrada) return 'carta-memoria carta-encontrada';
    if (c.volteada) return 'carta-memoria carta-volteada';
    return 'carta-memoria';
  }

  protected volteando(c: Carta): void {
    if (this.bloqueado() || c.encontrada || c.volteada || this.terminado()) return;
    const cartas = this.cartas();
    const actual = cartas.find((x) => x.id === c.id);
    if (!actual) return;

    this.cartas.set(cartas.map((x) => (x.id === c.id ? { ...x, volteada: true } : x)));
    const sel = [...this.seleccion(), { ...actual, volteada: true }];
    this.seleccion.set(sel);
    if (sel.length !== 2) return;

    this.movimientos.update((m) => m + 1);
    this.bloqueado.set(true);
    const [a, b] = sel;

    if (a.grupo === b.grupo && a.id !== b.id) {
      // Pareja correcta.
      setTimeout(() => {
        const conMarca = this.cartas().map((x) =>
          x.grupo === a.grupo ? { ...x, encontrada: true, volteada: true } : x,
        );
        this.cartas.set(conMarca);
        this.seleccion.set([]);
        this.bloqueado.set(false);
        if (conMarca.every((x) => x.encontrada)) {
          this.terminado.set(true);
        }
      }, 350);
    } else {
      // Pareja incorrecta: se vuelven a tapar.
      this.desbloqueoTimer = setTimeout(() => {
        this.cartas.set(this.cartas().map((x) => (x.grupo === a.grupo || x.grupo === b.grupo ? { ...x, volteada: false } : x)));
        this.seleccion.set([]);
        this.bloqueado.set(false);
      }, 900);
    }
  }

  private forzarFinPorTiempo(): void {
    if (this.terminado()) return;
    // Tiempo agotado: se comparte el progreso actual sin XP.
    const total = this.totalPares();
    const encontrados = this.paresEncontrados();
    const precision = Math.min(100, Math.round((encontrados / Math.max(1, total)) * 50));
    this.emitir({
      puntaje: encontrados * 100,
      puntajeMaximo: total * 100,
      precision,
      completitud: Math.round((encontrados / Math.max(1, total)) * 100),
      aciertos: encontrados,
      errores: Math.max(0, this.movimientos() - encontrados),
      estrellas: 0,
      completado: false,
      desglose: { motivoFin: 'tiempo_agotado', paresEncontrados: encontrados, movimientos: this.movimientos() },
    });
  }

  protected terminar(): void {
    const total = this.totalPares();
    const pares = this.paresEncontrados();
    const movimientos = this.movimientos();
    const precision = movimientos === 0
      ? 0
      : Math.min(100, Math.round(((total * 2) / movimientos) * 100));
    const completitud = Math.round((pares / Math.max(1, total)) * 100);
    const completado = pares === total;
    this.emitir({
      puntaje: pares * 100,
      puntajeMaximo: total * 100,
      precision,
      completitud,
      aciertos: pares,
      errores: Math.max(0, movimientos - pares),
      estrellas: completado ? estrellasPorPrecision(precision) : 0,
      completado,
      desglose: { pares, movimientos, paresEncontrados: pares },
    });
  }

  private emitir(r: ResultadoPartida): void {
    if (this.totalTimer) {
      clearInterval(this.totalTimer);
      this.totalTimer = null;
    }
    if (this.desbloqueoTimer) {
      clearTimeout(this.desbloqueoTimer);
      this.desbloqueoTimer = null;
    }
    this.finalizado.emit(r);
  }
}
