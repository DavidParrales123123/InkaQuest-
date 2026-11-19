import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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

/**
 * Visor de PDF en el mismo apartado, renderizado en canvas (PDF.js).
 *
 * <p>A diferencia de <iframe>/<object>, no depende del plugin PDF del
 * navegador: funciona también en Safari/iOS y en móvil. Las páginas se
 * escalan al ancho disponible y se pueden recorrer sin salir de la vista.</p>
 */
@Component({
  selector: 'app-documento-visor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full overflow-hidden rounded-md border border-surface-200 bg-[#f8f9fa]">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-surface-200 bg-white px-3 py-2">
        <p class="min-w-0 truncate text-xs font-semibold text-marine-700" [title]="nombre()">{{ nombre() }}</p>
        <div class="flex shrink-0 items-center gap-2 text-xs text-marine-600">
          <button type="button" class="btn btn-outline btn-sm" [disabled]="cargando() || paginaActual() <= 1" (click)="cambiarPagina(-1)" aria-label="Página anterior">‹</button>
          <span class="tabular-nums">{{ paginaActual() }} / {{ paginas() || '—' }}</span>
          <button type="button" class="btn btn-outline btn-sm" [disabled]="cargando() || paginas() === 0 || paginaActual() >= paginas()" (click)="cambiarPagina(1)" aria-label="Página siguiente">›</button>
        </div>
      </div>

      @if (cargando()) {
        <p class="p-4 text-center text-sm text-marine-500">Cargando documento…</p>
      } @else if (error()) {
        <p class="p-4 text-center text-sm text-danger-600" role="alert">{{ error() }}</p>
      }

      <div class="w-full overflow-x-auto">
        <canvas #lienzo class="mx-auto block max-w-full"></canvas>
      </div>
    </div>
  `,
})
export class DocumentoVisorComponent {
  readonly url = input.required<string>();
  readonly nombre = input('Documento');

  private readonly lienzo = viewChild<ElementRef<HTMLCanvasElement>>('lienzo');
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly paginas = signal(0);
  protected readonly paginaActual = signal(1);

  private documento: PDFDocumentProxy | null = null;
  private tarea: RenderTask | null = null;
  private timeoutResize: number | null = null;

  constructor() {
    effect(() => {
      const url = this.url();
      if (url) void this.abrir(url);
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.alRedimensionar);
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('resize', this.alRedimensionar);
        if (this.timeoutResize !== null) window.clearTimeout(this.timeoutResize);
        void this.documento?.destroy();
        this.documento = null;
      });
    }
  }

  private readonly alRedimensionar = (): void => {
    if (this.timeoutResize !== null) window.clearTimeout(this.timeoutResize);
    this.timeoutResize = window.setTimeout(() => {
      if (this.documento && !this.cargando()) void this.pintar(this.paginaActual());
    }, 200);
  };

  protected async abrir(url: string): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    this.paginas.set(0);
    this.paginaActual.set(1);
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

  private async pintar(numero: number): Promise<void> {
    const doc = this.documento;
    const canvas = this.lienzo()?.nativeElement;
    if (!doc || !canvas) return;
    try {
      this.tarea?.cancel();
      const pagina = await doc.getPage(numero);
      const base = pagina.getViewport({ scale: 1 });
      const ancho = (canvas.parentElement?.clientWidth ?? window.innerWidth) - 8;
      const escala = Math.min(2, Math.max(0.35, ancho / base.width));
      const viewport = pagina.getViewport({ scale: escala });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const contexto = canvas.getContext('2d');
      if (!contexto) return;
      this.tarea = pagina.render({ canvasContext: contexto, viewport });
      await this.tarea.promise;
    } catch (e) {
      if (e instanceof Error && e.name === 'RenderingCancelledException') return;
      this.error.set(e instanceof Error ? e.message : 'No se pudo mostrar la página.');
    }
  }
}
