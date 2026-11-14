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
import { CommonModule } from '@angular/common';

import {
  ContenidoArrastrar,
  ResultadoPartida,
  estrellasPorPrecision,
} from './contenido-juego.model';

interface ChipEstado {
  texto: string;
  zona: string;
  colocada: string | null;
}

/**
 * Runtime de arrastrar y soltar (HTML5 drag-and-drop con fallback a tocar/elegir).
 *
 * <p>Reglas:</p>
 * <ul>
 *   <li>Pool de chips arriba (arriba)</li>
 *   <li>Zonas a la derecha (debajo de los chips en mobile)</li>
 *   <li>Boton «Comprobar» valida la colocación: si todas las zonas quedan correctas,
 *       termina el juego y registra el resultado. Si hay errores, se cuentan y deja corregir.</li>
 * </ul>
 */
@Component({
  selector: 'app-arrastrar-soltar-runtime',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between gap-3 text-xs font-semibold text-marine-500">
        <span>Colocados {{ colocados() }} de {{ total() }}</span>
        <span>Errores: {{ errores() }}</span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded-full bg-surface-100" role="progressbar"
        [attr.aria-valuenow]="progreso()" aria-valuemin="0" aria-valuemax="100">
        <div class="h-2 bg-brand-500 transition-all duration-500" [style.width.%]="progreso()"></div>
      </div>
      @if (instrucciones()) {
        <p class="text-sm text-marine-600">{{ instrucciones() }}</p>
      } @else {
        <p class="text-sm text-marine-600">Arrastra cada chip a su zona correcta.</p>
      }

      <!-- Banco de chips -->
      @if (bank().length) {
        <div role="region" aria-label="Elementos disponibles" class="flex flex-wrap gap-2 rounded-xl border border-surface-200 bg-surface-50/60 p-3">
          @for (chip of bank(); track chip.texto) {
            <button type="button" class="chip" [class.chip-selected]="textoSeleccionado() === chip.texto"
              draggable="true"
              (click)="seleccionarChip(chip)"
              (dragstart)="onDragStart(chip, $event)"
              (keydown)="onChipKeydown($event)">
              {{ chip.texto }}
            </button>
          }
        </div>
      } @else {
        <p class="rounded-xl border border-brand-200 bg-brand-50/40 p-3 text-sm text-brand-700">Todos los chips colocados. Pulsa «Comprobar» para validar.</p>
      }

      <!-- Zonas -->
      <div class="grid gap-3 sm:grid-cols-2">
        @for (zona of zonasVisibles(); track zona) {
          <div
            role="region"
            [attr.aria-label]="'Zona ' + zona"
            class="rounded-xl border-2 border-dashed p-3 transition-colors"
            [class.border-brand-400]="esObjetivoHover(zona)"
            [class.border-surface-200]="!esObjetivoHover(zona)"
            [class.bg-brand-50/40]="esObjetivoHover(zona)"
            (dragover)="onDragOver($event, zona)"
            (dragleave)="onDragLeave(zona)"
            (drop)="onDrop($event, zona)">
            <p class="text-xs font-bold uppercase tracking-wider text-marine-500">{{ zona }}</p>
            <div class="mt-2 min-h-[3.5rem] space-y-1.5">
              @for (c of chipsEnZona(zona); track c.texto) {
                <button type="button" class="chip chip-placed" (click)="devolverChip(c)" [attr.aria-label]="'Quitar ' + c.texto">
                  {{ c.texto }} <span class="ml-auto text-xs text-marine-400">×</span>
                </button>
              }
              @if (chipsEnZona(zona).length === 0) {
                <p class="text-[0.7rem] text-marine-400">Arrastra aquí los chips que correspondan.</p>
              }
            </div>
          </div>
        }
      </div>

      @if (resultadoFinal()) {
        <button type="button" class="btn btn-primary w-full" (click)="terminar()">Ver resultado ✓</button>
      } @else {
        <div class="flex items-center gap-2">
          <button type="button" class="btn btn-primary" (click)="comprobar()">Comprobar</button>
          <button type="button" class="btn btn-outline" (click)="reiniciar()">Reiniciar</button>
        </div>
      }

      @if (aviso()) {
        <p class="text-xs font-semibold text-warning-500" role="status">{{ aviso() }}</p>
      }
    </div>
  `,
  styles: [`
    .chip { display:inline-flex; align-items:center; gap:.4rem; padding:.4rem .7rem; border-radius:9999px; border:1px solid #d5e6e4; background:#fff; color:#113331; font-size:.8rem; font-weight:600; cursor:grab; transition: border-color .15s ease, background .15s ease, transform .15s ease; }
    .chip:hover { border-color:#12736b; transform: translateY(-1px); }
    .chip:focus-visible { outline: 2px solid #f2a541; outline-offset: 2px; }
    .chip:active { cursor: grabbing; }
    .chip-selected { border-color:#f5b43c; background: rgba(245,180,60,.18); box-shadow: 0 0 0 2px rgba(245,180,60,.3); }
    .chip-placed { cursor:pointer; }
    .chip-placed:hover { border-color:#d6143f; background:#fff5f7; }
  `],
})
export class ArrastrarSoltarRuntimeComponent {
  readonly contenido = input.required<ContenidoArrastrar>();
  readonly tiempoLimiteTotalSeg = input<number | null>(null);
  readonly finalizado = output<ResultadoPartida>();

  private readonly destroyRef = inject(DestroyRef);

  protected readonly chips = signal<ChipEstado[]>([]);
  protected readonly errores = signal(0);
  protected readonly aviso = signal('');
  protected readonly textoSeleccionado = signal<string | null>(null);
  protected readonly dragTargetHover = signal<string | null>(null);
  protected readonly resultadoFinal = signal(false);
  private totalTimer: ReturnType<typeof setInterval> | null = null;
  private tiempoTotalMs = 0;

  protected readonly zonasVisibles = computed(() => this.contenido().zonas);
  protected readonly total = computed(() => this.contenido().items.length);
  protected readonly colocados = computed(() => this.chips().filter((c) => c.colocada !== null).length);
  protected readonly bank = computed(() => this.chips().filter((c) => c.colocada === null));
  protected readonly progreso = computed(() => this.total() === 0 ? 0 : Math.round((this.colocados() / this.total()) * 100));

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.totalTimer) clearInterval(this.totalTimer);
    });

    effect(() => {
      const c = this.contenido();
      this.chips.set(c.items.map((i) => ({ texto: i.texto, zona: i.zona, colocada: null })));
      this.errores.set(0);
      this.resultadoFinal.set(false);
      this.aviso.set('');
      this.textoSeleccionado.set(null);
      this.dragTargetHover.set(null);
    });

    effect(() => {
      const total = this.tiempoLimiteTotalSeg();
      if (!total || total <= 0 || this.totalTimer) return;
      this.totalTimer = setInterval(() => {
        this.tiempoTotalMs += 1000;
        if (this.tiempoTotalMs >= total * 1000) this.forzarFinPorTiempo();
      }, 1000);
    });
  }

  protected chipsEnZona(zona: string): ChipEstado[] {
    return this.chips().filter((c) => c.colocada === zona);
  }

  protected esObjetivoHover(_zona: string): boolean {
    return this.dragTargetHover() === _zona;
  }

  protected seleccionarChip(chip: ChipEstado): void {
    if (chip.colocada !== null) return;
    this.textoSeleccionado.update((actual) => (actual === chip.texto ? null : chip.texto));
    this.aviso.set('');
  }

  protected onChipKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const t = (event.target as HTMLElement).textContent?.trim();
      if (t) this.textoSeleccionado.set(t);
    }
  }

  protected onDragStart(chip: ChipEstado, event: DragEvent): void {
    if (chip.colocada !== null) return;
    event.dataTransfer?.setData('text/plain', chip.texto);
    event.dataTransfer?.setEffectAllowed('move');
    this.textoSeleccionado.set(chip.texto);
  }

  protected onDragOver(event: DragEvent, _zona: string): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dragTargetHover.set(_zona);
  }

  protected onDragLeave(_zona: string): void {
    if (this.dragTargetHover() === _zona) this.dragTargetHover.set(null);
  }

  protected onDrop(event: DragEvent, zona: string): void {
    event.preventDefault();
    this.dragTargetHover.set(null);
    const texto = event.dataTransfer?.getData('text/plain')?.trim() ?? this.textoSeleccionado();
    if (!texto) return;
    this.colocarEnZona(texto, zona);
    this.textoSeleccionado.set(null);
  }

  private colocarEnZona(texto: string, zona: string): void {
    const chips = this.chips();
    const chip = chips.find((c) => c.texto === texto && c.colocada === null);
    if (!chip) return;
    this.chips.set(chips.map((c) => (c.texto === texto ? { ...c, colocada: zona } : c)));
    this.aviso.set('');
  }

  protected devolverChip(chip: ChipEstado): void {
    this.chips.set(this.chips().map((c) => (c.texto === chip.texto ? { ...c, colocada: null } : c)));
    this.aviso.set('');
  }

  protected reiniciar(): void {
    this.chips.set(this.contenido().items.map((i) => ({ texto: i.texto, zona: i.zona, colocada: null })));
    this.errores.set(0);
    this.aviso.set('');
    this.textoSeleccionado.set(null);
    this.resultadoFinal.set(false);
    this.tiempoTotalMs = 0;
  }

  protected comprobar(): void {
    const colocados = this.chips().filter((c) => c.colocada !== null);
    const colocadosCount = colocados.length;
    const total = this.total();
    const porColocar = total - colocadosCount;

    if (colocadosCount === 0) { this.aviso.set('Coloca los chips en las zonas antes de comprobar.'); return; }
    if (porColocar > 0) { this.aviso.set(`Faltan ${porColocar} chip(s) por colocar.`); return; }

    const correct = this.chips().filter((c) => c.colocada === c.zona).length;
    if (correct === total) {
      this.resultadoFinal.set(true);
      this.aviso.set('¡Todo correcto! Pulsa «Ver resultado».');
      return;
    }

    this.errores.set(this.errores() + 1);
    this.aviso.set('Hay chips mal colocados. Revisa cada zona y corrige.');
    // Marco no se queda el estado; que el user tumba/coloca con devolverChip.
  }

  protected terminar(): void {
    const total = this.total();
    const ok = this.chips().filter((c) => c.colocada === c.zona).length;
    const errores = this.errores();
    const intentos = total + errores;
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
      desglose: { colocadosOk: ok, errores, totalChips: total },
    });
  }

  private forzarFinPorTiempo(): void {
    if (this.resultadoFinal()) return;
    const total = this.total();
    const ok = this.chips().filter((c) => c.colocada === c.zona).length;
    this.emitir({
      puntaje: ok * 100,
      puntajeMaximo: total * 100,
      precision: Math.round((ok / Math.max(1, total + this.errores())) * 100),
      completitud: Math.round((ok / Math.max(1, total)) * 100),
      aciertos: ok,
      errores: this.errores(),
      estrellas: 0,
      completado: false,
      desglose: { motivoFin: 'tiempo_agotado', colocadosOk: ok, errores: this.errores() },
    });
  }

  protected instrucciones(): string | null {
    return this.contenido().instrucciones;
  }

  private emitir(r: ResultadoPartida): void {
    if (this.totalTimer) {
      clearInterval(this.totalTimer);
      this.totalTimer = null;
    }
    this.finalizado.emit(r);
  }
}
