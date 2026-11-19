import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * Visor de documentos embebido en la misma página.
 *
 * <p>
 *   El objetivo es que el estudiante no tenga que abrir una pestaña nueva para
 *   ver el material del docente. Se intenta mostrar el archivo dentro de la
 *   lección y, como fallback, se ofrece "Abrir en esta pestaña"
 *   ({@code target="_self"}) y "Descargar".
 * </p>
 *
 * <p>
 *   Nota de senior: los buckets privados de Supabase entregan las firmas con
 *   {@code Content-Disposition: attachment}. Algunos navegadores móviles no
 *   renderizan PDF dentro de {@code <embed>}/{@code <iframe>}; por eso el botón
 *   "Abrir en esta pestaña" es el respaldo garantizado, sin abrir ventana nueva.
 * </p>
 */
@Component({
  selector: 'app-documento-visor',
  standalone: true,
  imports: [],
  template: `
    @if (!url()) { return; }

    <div class="documento-visor rounded-xl border border-surface-200 bg-white p-4 sm:p-6 shadow-sm">
      <div class="mb-3 flex items-center gap-2">
        <svg class="size-5 text-marine-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13l-4-4M6 20l4-4" />
        </svg>
        <span class="font-semibold text-marine-700 truncate">{{ nombre() }}</span>
      </div>

      <div class="visor-contenido min-h-[300px] flex flex-col items-center justify-center bg-surface-50 rounded-lg border border-surface-200">
        @if (esPdf()) {
          <embed
            class="w-full max-w-full h-[500px] sm:h-[650px] rounded-lg"
            type="application/pdf"
            [src]="urlSegura()"
            title="Vista previa de {{ nombre() }}"
          />
        } @else if (esImagen()) {
          <img
            class="w-full max-w-full h-auto max-h-[650px] object-contain rounded-lg"
            [src]="urlSegura()"
            alt="{{ nombre() }}"
          />
        } @else {
          <iframe
            class="w-full max-w-full h-[500px] sm:h-[650px] rounded-lg border border-surface-200"
            [src]="urlSegura()"
            title="Vista previa de {{ nombre() }}"
          ></iframe>
          <p class="mt-2 text-xs text-marine-400">Vista previa limitada para este tipo de archivo.</p>
        }
      </div>

      <div class="mt-4 flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        <a
          [href]="url()"
          target="_self"
          rel="noopener"
          class="btn btn-outline btn-sm shrink-0 flex items-center gap-2"
        >
          Abrir en esta pestaña
        </a>
        <a
          [href]="url()"
          download
          class="btn btn-outline btn-sm shrink-0 flex items-center gap-2 text-marine-600 hover:bg-surface-100"
        >
          Descargar
        </a>
      </div>
    </div>
  `,
  styles: [
    `
      .documento-visor embed {
        display: block;
        width: 100%;
      }
    `,
  ],
})
export class DocumentoVisorComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly url = input<string | null>(null);
  readonly mimeType = input<string | null>(null);
  readonly nombre = input<string>('Documento');

  protected readonly urlSegura = computed(() => {
    const u = this.url();
    return u ? this.sanitizer.bypassSecurityTrustResourceUrl(u) : null;
  });

  protected readonly esPdf = computed(() => {
    const mime = (this.mimeType() || '').toLowerCase();
    const nombre = this.nombre().toLowerCase();
    return mime === 'application/pdf' || nombre.endsWith('.pdf');
  });

  protected readonly esImagen = computed(() => {
    const mime = (this.mimeType() || '').toLowerCase();
    return mime.startsWith('image/');
  });
}
