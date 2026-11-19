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

/** Zoom inicial legible: a 1.5x un texto de 10 pt se ve ~15 px en pantalla. */
const ZOOM_INICIAL = 1.5;
const ZOOM_MIN = 0.75;
const ZOOM_MAX = 3;

/**
 * Visor de PDF en el mismo apartado, renderizado en canvas (PDF.js).
 *
 * <p>A diferencia de <iframe>/<object>, no depende del plugin PDF del
 * navegador: funciona también en Safari/iOS y en móvil. La página se dibuja
 * a un zoom legible (no encogida), se puede recorrer con desplazamiento y
 * ofrece un modo lector a pantalla completa tipo plataforma universitaria.</p>
 */
@Component({
  selector: 'app-documento-visor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cerrarConEscape()' },
  template: `
    <div class="w-full overflow-hidden rounded-md border border-surface-200 bg-[#f8f9fa]"
      [class.fixed]="pantallaCompleta()" [class.inset-0]="pantallaCompleta()"
      [class.z-50]="pantallaCompleta()" [class.flex]="pantallaCompleta()"
      [class.flex-col]="pantallaCompleta()" [class.rounded-none]="pantallaCompleta()"
      [class.border-0]="pantallaCompleta()" [class.bg-white]="pantallaCompleta()">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-surface-200 bg-white px-3 py-2">
        <p class="min-w-0 truncate text-xs font-semibold text-marine-700" [title]="nombre()">{{ nombre() }}</p>
        <div class="flex shrink-0 items-center gap-1.5 text-xs text-marine-600">
          <button type="button" class="btn btn-outline btn-sm" [disabled]="cargando() || paginaActual() <= 1" (click)="cambiarPagina(-1)" aria-label="Página anterior">‹</button>
          <span class="tabular-nums">{{ paginaActual() }} / {{ paginas() || '—' }}</span>
          <button type="button" class="btn btn-outline btn-sm" [disabled]="cargando() || paginas() === 0 || paginaActual() >= paginas()" (click)="cambiarPagina(1)" aria-label="Página siguiente">›</button>
          <span class="mx-0.5 h-4 w-px bg-surface-200"></span>
          <button type="button" class="btn btn-outline btn-sm" [disabled]="cargando() || zoom() <= ZOOM_MIN" (click)="cambiarZoom(-0.25)" aria-label="Alejar">−</button>
          <button type="button" class="btn btn-outline btn-sm tabular-nums" [disabled]="cargando()" (click)="restablecerZoom()" title="Restablecer zoom">{{ porcentajeZoom() }}%</button>
          <button type="button" class="btn btn-outline btn-sm" [disabled]="cargando() || zoom() >= ZOOM_MAX" (click)="cambiarZoom(0.25)" aria-label="Acercar">+</button>
          @if (pantallaCompleta()) {
            <button type="button" class="btn btn-outline btn-sm" (click)="salirPantallaCompleta()" aria-label="Cerrar lector">✕</button>
          } @else {
            <button type="button" class="btn btn-outline btn-sm" (click)="entrarPantallaCompleta()" aria-label="Ver a pantalla completa">⛶</button>
          }
        </div>
      </div>

      @if (cargando()) {
        <p class="p-4 text-center text-sm text-marine-500">Cargando documento…</p>
      } @else if (error()) {
        <p class="p-4 text-center text-sm text-danger-600" role="alert">{{ error() }}</p>
      }

      <div class="w-full overflow-auto overscroll-contain" [class.flex-1]="pantallaCompleta()" [class.min-h-0]="pantallaCompleta()">
        <canvas #lienzo class="block"></canvas>
      </div>
      @if (!pantallaCompleta()) {
        <p class="border-t border-surface-200 bg-white px-3 py-1.5 text-[0.7rem] text-marine-400">
          Usa + / − para acercar, desliza para recorrer la página o ⛶ para el lector a pantalla completa.
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly doc = inject(DOCUMENT);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly paginas = signal(0);
  protected readonly paginaActual = signal(1);
  protected readonly zoom = signal(ZOOM_INICIAL);
  protected readonly porcentajeZoom = computed(() => Math.round(this.zoom() * 100));
  protected readonly pantallaCompleta = signal(false);

  private documento: PDFDocumentProxy | null = null;
  private tarea: RenderTask | null = null;
  private overflowAnterior = '';

  constructor() {
    effect(() => {
      const url = this.url();
      if (url) void this.abrir(url);
    });

    this.destroyRef.onDestroy(() => {
      void this.documento?.destroy();
      this.documento = null;
      if (this.pantallaCompleta()) this.doc.body.style.overflow = this.overflowAnterior;
    });
  }

  protected entrarPantallaCompleta(): void {
    this.overflowAnterior = this.doc.body.style.overflow;
    this.doc.body.style.overflow = 'hidden';
    this.pantallaCompleta.set(true);
  }

  protected salirPantallaCompleta(): void {
    this.pantallaCompleta.set(false);
    this.doc.body.style.overflow = this.overflowAnterior;
  }

  protected cerrarConEscape(): void {
    if (this.pantallaCompleta()) this.salirPantallaCompleta();
  }

  protected async abrir(url: string): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    this.paginas.set(0);
    this.paginaActual.set(1);
    this.zoom.set(ZOOM_INICIAL);
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
  }

  protected async cambiarZoom(delta: number): Promise<void> {
    const nuevo = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((this.zoom() + delta) * 100) / 100));
    if (nuevo === this.zoom()) return;
    this.zoom.set(nuevo);
    await this.pintar(this.paginaActual());
  }

  protected async restablecerZoom(): Promise<void> {
    if (this.zoom() === ZOOM_INICIAL) return;
    this.zoom.set(ZOOM_INICIAL);
    await this.pintar(this.paginaActual());
  }

  private async pintar(numero: number): Promise<void> {
    const doc = this.documento;
    const canvas = this.lienzo()?.nativeElement;
    if (!doc || !canvas) return;
    try {
      this.tarea?.cancel();
      const pagina = await doc.getPage(numero);
      const viewport = pagina.getViewport({ scale: this.zoom() });
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
