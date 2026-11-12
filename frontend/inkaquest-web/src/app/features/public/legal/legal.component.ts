import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { LogoComponent } from '../../../shared/components/logo/logo.component';

import { DocumentoLegal, PAGOS, PRIVACIDAD, TERMINOS } from './legal-documents';

/**
 * Paginas legales (terminos, privacidad y pagos).
 *
 * <p>El documento se selecciona segun el dato {@code tipo} de la ruta. El
 * contenido es editorial estatico: describe las reglas de la propia
 * plataforma, no datos de la base de datos.</p>
 */
@Component({
  selector: 'app-legal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LogoComponent],
  template: `
    <section class="border-b border-surface-200 bg-surface-50">
      <div class="container-app py-12 md:py-16">
        <div class="flex items-center gap-3">
          <app-logo [alto]="40" />
          <p class="text-xs font-semibold tracking-[0.2em] text-brand-600 uppercase">
            Legal
          </p>
        </div>
        <h1 class="mt-4">{{ documento().titulo }}</h1>
        <p class="mt-3 max-w-2xl text-marine-500">{{ documento().resumen }}</p>
        <p class="mt-4 text-xs text-marine-400">
          {{ documento().vigencia }} · Última actualización: 10 de noviembre de 2026
        </p>
      </div>
    </section>

    <section class="container-app py-10">
      <div class="grid gap-10 lg:grid-cols-[16rem_1fr]">
        <!-- ================= INDICE ================= -->
        <nav aria-labelledby="indice-legal" class="lg:sticky lg:top-24 lg:self-start">
          <h2 id="indice-legal" class="text-sm font-semibold text-marine-700">
            Contenido
          </h2>
          <ol class="mt-3 space-y-1.5 text-sm">
            @for (seccion of documento().secciones; track seccion.id; let i = $index) {
              <li>
                <a
                  [href]="'#' + seccion.id"
                  (click)="irASeccion($event, seccion.id)"
                  class="block rounded-button px-2 py-1 text-marine-500 transition-colors hover:bg-surface-100 hover:text-brand-700"
                >
                  {{ i + 1 }}. {{ seccion.titulo }}
                </a>
              </li>
            }
          </ol>

          <div class="mt-6 rounded-card bg-surface-100 p-4 text-sm">
            <p class="font-semibold text-marine-700">Otros documentos</p>
            <ul class="mt-2 space-y-1.5 text-marine-600">
              <li><a routerLink="/terminos" class="link">Términos y condiciones</a></li>
              <li><a routerLink="/privacidad" class="link">Política de privacidad</a></li>
              <li><a routerLink="/pagos" class="link">Pagos y reembolsos</a></li>
            </ul>
          </div>
        </nav>

        <!-- ================= DOCUMENTO ================= -->
        <article class="card card-body">
          @for (seccion of documento().secciones; track seccion.id; let i = $index) {
            <section [id]="seccion.id" class="scroll-mt-24">
              <h2 class="text-xl">
                <span class="text-brand-500">{{ i + 1 }}.</span>
                {{ seccion.titulo }}
              </h2>

              @for (parrafo of seccion.parrafos; track parrafo) {
                <p class="mt-3 leading-relaxed text-marine-600">{{ parrafo }}</p>
              }

              @if (seccion.lista) {
                <ul class="mt-3 space-y-2 text-marine-600">
                  @for (item of seccion.lista; track item) {
                    <li class="flex items-start gap-2.5">
                      <svg class="mt-1 size-4 shrink-0 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                        <path d="m5 13 4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                      <span>{{ item }}</span>
                    </li>
                  }
                </ul>
              }
            </section>

            @if (i < documento().secciones.length - 1) {
              <hr class="my-8 border-surface-200" />
            }
          }

          <footer class="mt-10 rounded-card bg-surface-50 p-5 text-sm text-marine-600">
            <p>
              Ante cualquier duda sobre este documento puedes escribirnos desde la
              <a routerLink="/contacto" class="link">página de contacto</a> o
              consultar las
              <a routerLink="/faq" class="link">preguntas frecuentes</a>.
            </p>
          </footer>
        </article>
      </div>
    </section>
  `,
})
export class LegalComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  /** Tipo de documento solicitado por la ruta. */
  protected readonly tipo = signal<string>('terminos');

  ngOnInit(): void {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      const solicitado = data['tipo'];
      this.tipo.set(typeof solicitado === 'string' ? solicitado : 'terminos');
    });
  }

  /** Documento legal que corresponde al tipo solicitado. */
  protected readonly documento = computed<DocumentoLegal>(() => {
    switch (this.tipo()) {
      case 'privacidad':
        return PRIVACIDAD;
      case 'pagos':
        return PAGOS;
      default:
        return TERMINOS;
    }
  });

  /** Desplaza suavemente la vista a la sección seleccionada. */
  protected irASeccion(evento: Event, id: string): void {
    evento.preventDefault();
    const elemento = document.getElementById(id);
    if (!elemento) {
      return;
    }
    elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (typeof history !== 'undefined' && history.replaceState) {
      history.replaceState(null, '', `#${id}`);
    }
  }
}
