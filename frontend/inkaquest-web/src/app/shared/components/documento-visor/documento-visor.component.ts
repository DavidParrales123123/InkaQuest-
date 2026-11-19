import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ElementRef } from '@angular/core';

import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

// Worker local servido como asset de Angular (sin CDN externo).
pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdfjs/pdf.worker.min.mjs';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

/**
 * Visor profesional de PDF renderizado en canvas (PDF.js).
 *
 * <p>Responsivo de verdad: por defecto la página se ajusta al ancho del
 * contenedor (ni recortada ni diminuta), con un límite de altura para que no
 * deforme el layout. El zoom es controlado (+/−, pellizco y reinicio a
 * "Ajustar") y el modo lector ocupa la pantalla completa en móvil. No depende
 * del plugin nativo, así que funciona también en Safari/iOS.</p>
 */
@Component({
  selector: 'app-documento-visor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cerrarConEscape()' },
  template: `
    <div class="w-full overflow-hidden rounded-lg border border-surface-200 bg-white"
      [class.shadow-sm]="!pantallaCompleta()" [class.shadow-none]="pantallaCompleta()"      [class.fixed]="pantallaCompleta()" [class.inset-0]="pantallaCompleta()"
      [class.z-50]="pantallaCompleta()" [class.flex]="pantallaCompleta()"
      [class.flex-col]="pantallaCompleta()" [class.rounded-none]="pantallaCompleta()"
      [class.border-0]="pantallaCompleta()" [class.shadow-none]="pantallaCompleta()">
      <!-- Barra de herramientas -->
      <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-surface-200 bg-surface-50 px-3 py-2">
        <p class="hidden min-w-0 truncate text-xs font-semibold text-marine-700 sm:block sm:max-w-[45%]" [title]="nombre()">
          {{ nombre() }}
        </p>
        <div class="flex shrink-0 items-center gap-1 text-xs text-marine-600">
          <button type="button" class="btn btn-outline btn-sm" [disabled]="cargando() || paginaActual() <= 1" (click)="cambiarPagina(-1)" aria-label="Página anterior">‹</button>
          <span class="min-w-12 text-center tabular-nums">{{ paginaActual() }} / {{ paginas() || '—' }}</span>
          <button type="button" class="btn btn-outline btn-sm" [disabled]="cargando() || paginas() === 0 || paginaActual() >= paginas()" (click)="cambiarPagina(1)" aria-label="Página siguiente">›</button>
        </div>
        <div class="flex shrink-0 items-center gap-1 text-xs text-marine-600 sm:ml-auto">
          <button type="button" class="btn btn-outline btn-sm" [disabled]="cargando() || zoom() <= ZOOM_MIN" (click)="alejar()" aria-label="Alejar">−</button>
          <button type="button" class="btn btn-outline btn-sm min-w-14 tabular-nums" [disabled]="cargando()" (click)="ajustarAncho()" [title]="autoAjuste() ? 'Ajustado al ancho' : 'Ajustar al ancho'">
            {{ autoAjuste() ? 'Ajustar' : porcentajeZoom() + '%' }}
          </button>
          <button type="button" class="btn btn-outline btn-sm" [disabled]="cargando() || zoom() >= ZOOM_MAX" (click)="acercar()" aria-label="Acercar">+</button>
          @if (pantallaCompleta()) {
            <button type="button" class="btn btn-outline btn-sm" (click)="salirPantallaCompleta()" aria-label="Cerrar lector">✕</button>
          } @else {
            <button type="button" class="btn btn-outline btn-sm" (click)="entrarPantallaCompleta()" aria-label="Ver a pantalla completa">⛶</button>
          }
        </div>
      </div>

      @if (cargando()) {
        <div class="flex min-h-48 items-center justify-center px-4 py-10">
          <p class="text-sm text-marine-500">Cargando documento…</p>
        </div>
      } @else if (error()) {
        <div class="flex min-h-32 items-center justify-center px-4 py-8 text-center">
          <p class="text-sm text-danger-600" role="alert">{{ error() }}</p>
        </div>
      }

      <div #contenedor class="w-full overflow-auto overscroll-contain bg-[#f8f9fa]"
        [style.maxHeight]="pantallaCompleta() ? 'none' : '70vh'" [class.flex-1]="pantallaCompleta()" [class.min-h-0]="pantallaCompleta()"
        (touchstart)="alTocar($event)" (touchmove)="alMover($event)" (touchend)="alSoltar()">
        <div class="flex w-full justify-center py-2">
          <canvas #lienzo class="block rounded-sm bg-white shadow-sm"></canvas>
        </div>
      </div>

      @if (!pantallaCompleta()) {
        <p class="border-t border-surface-200 bg-white px-3 py-1.5 text-[0.7rem] text-marine-400">
          Ajustado al ancho · usa + / − o pellizca para acercar · ⛶ para leer a pantalla completa
        </p>
      }
    </div>
  `,
})
export class DocumentoVisorComponent {
  readonly url = input.required<string>();
  readonly nombre = input('Documento');

  protected readonly ZOOM_MIN = ZOOM_MIN;
  protected readonly ZOOM_MAX = ZOOM_MAX;

  private readonly lienzo = viewChild<ElementRef<HTMLCanvasElement>>('lienzo');
  private readonly contenedor = viewChild<ElementRef<HTMLElement>>('contenedor');
  private readonly destroyRef = inject(DestroyRef);
  private readonly doc = inject(DOCUMENT);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly paginas = signal(0);
  protected readonly paginaActual = signal(1);
  protected readonly zoom = signal(1);
  protected readonly autoAjuste = signal(true);
  protected readonly porcentajeZoom = computed(() => Math.round(this.zoom() * 100));
  protected readonly pantallaCompleta = signal(false);

  private documento: PDFDocumentProxy | null = null;
  private tarea: RenderTask | null = null;
  private overflowAnterior = '';
  private timeoutResize: number | null = null;
  private distanciaInicial = 0;
  private ultimaDistancia = 0;
  private zoomInicial = 1;

  constructor() {
    effect(() => {
      const url = this.url();
      if (url) void this.abrir(url);
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.alRedimensionar);
    }
    this.destroyRef.onDestroy(() => {
      if (typeof window !== 'undefined') window.removeEventListener('resize', this.alRedimensionar);
      if (this.timeoutResize !== null) window.clearTimeout(this.timeoutResize);
      void this.documento?.destroy();
      this.documento = null;
      if (this.pantallaCompleta()) this.doc.body.style.overflow = this.overflowAnterior;
    });
  }

  private readonly alRedimensionar = (): void => {
    if (this.timeoutResize !== null) window.clearTimeout(this.timeoutResize);
    this.timeoutResize = window.setTimeout(() => {
      if (this.documento && !this.cargando() && this.autoAjuste()) void this.pintar(this.paginaActual());
    }, 200);
  };

  protected entrarPantallaCompleta(): void {
    this.overflowAnterior = this.doc.body.style.overflow;
    this.doc.body.style.overflow = 'hidden';
    this.pantallaCompleta.set(true);
    void this.pintar(this.paginaActual());
  }

  protected salirPantallaCompleta(): void {
    this.pantallaCompleta.set(false);
    this.doc.body.style.overflow = this.overflowAnterior;
    void this.pintar(this.paginaActual());
  }

  protected cerrarConEscape(): void {
    if (this.pantallaCompleta()) this.salirPantallaCompleta();
  }

  protected async abrir(url: string): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    this.paginas.set(0);
    this.paginaActual.set(1);
    this.autoAjuste.set(true);
    try {
      this.tarea?.cancel();
      void this.documento?.destroy();
      this.documento = await pdfjsLib.getDocument({ url }).promise;
      this.paginas.set(this.documento.numPages);
      await this.pintar(1);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo abrir el documento.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async cambiarPagina(delta: number): Promise<void> {
    const destino = this.paginaActual() + delta;
    if (destino < 1 || destino > this.paginas() || this.cargando()) return;
    this.paginaActual.set(destino);
    await this.pintar(destino);
    this.contenedor()?.nativeElement.scrollTo(0, 0);
  }

  protected async acercar(): Promise<void> {
    await this.aplicarZoom(Math.min(ZOOM_MAX, Math.round(this.zoom() * 1.25 * 100) / 100));
  }

  protected async alejar(): Promise<void> {
    await this.aplicarZoom(Math.max(ZOOM_MIN, Math.round(this.zoom() / 1.25 * 100) / 100));
  }

  protected async ajustarAncho(): Promise<void> {
    this.autoAjuste.set(true);
    await this.pintar(this.paginaActual());
  }

  private async aplicarZoom(valor: number): Promise<void> {
    this.autoAjuste.set(false);
    this.zoom.set(valor);
    await this.pintar(this.paginaActual());
  }

  protected alTocar(e: TouchEvent): void {
    if (e.touches.length !== 2) return;
    this.distanciaInicial = this.distancia(e.touches);
    this.ultimaDistancia = this.distanciaInicial;
    this.zoomInicial = this.zoom();
  }

  protected alMover(e: TouchEvent): void {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    this.ultimaDistancia = this.distancia(e.touches);
  }

  protected async alSoltar(): Promise<void> {
    if (this.distanciaInicial <= 0 || this.ultimaDistancia <= 0) return;
    const ratio = this.ultimaDistancia / this.distanciaInicial;
    this.distanciaInicial = 0;
    this.ultimaDistancia = 0;
    if (Math.abs(ratio - 1) < 0.08) return;
    await this.aplicarZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(this.zoomInicial * ratio * 100) / 100)));
  }

  private distancia(touches: TouchList): number {
    const a = touches[0];
    const b = touches[1];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  private async pintar(numero: number): Promise<void> {
    const doc = this.documento;
    const canvas = this.lienzo()?.nativeElement;
    if (!doc || !canvas) return;
    try {
      this.tarea?.cancel();
      const pagina = await doc.getPage(numero);
      const base = pagina.getViewport({ scale: 1 });
      const ancho = this.contenedor()?.nativeElement.clientWidth ?? window.innerWidth;
      const escala = this.autoAjuste()
        ? Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(((ancho - 16) / base.width) * 100) / 100))
        : this.zoom();
      this.zoom.set(escala);
      const viewport = pagina.getViewport({ scale: escala });
      // Doble resolución en pantallas de alta densidad para texto nítido.
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const contexto = canvas.getContext('2d');
      if (!contexto) return;
      contexto.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.tarea = pagina.render({ canvasContext: contexto, viewport });
      await this.tarea.promise;
    } catch (e) {
      if (e instanceof Error && e.name === 'RenderingCancelledException') return;
      this.error.set(e instanceof Error ? e.message : 'No se pudo mostrar la página.');
    }
  }
}
