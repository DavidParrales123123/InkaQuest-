// @ts-nocheck
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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CertificateService } from '../../../core/services/certificate.service';
import { Certificado, CertificadoCurso } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

/** Estados posibles de la pantalla de verificacion. */
type EstadoVerificacion = 'inicial' | 'buscando' | 'encontrado' | 'no-encontrado';

/**
 * Verificacion publica de certificados.
 *
 * <p>Consulta la tabla {@code certificado}, que es legible por cualquiera
 * (permiso {@code anon}), por lo que la pagina funciona sin sesion. Si la URL
 * trae el parametro {@code :codigo}, la verificacion se hace
 * automaticamente.</p>
 *
 * <p>El nombre del titular <b>no</b> se muestra: el servicio de certificados
 * no expone ese dato en la consulta publica y la RLS no lo entrega a un
 * visitante anonimo. Solo se muestran los datos del certificado.</p>
 */
@Component({
  selector: 'app-certificate-verify',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, SkeletonComponent],
  template: `
    <!-- ================= CABECERA ================= -->
    <section class="bg-marine-gradient relative overflow-hidden text-white">
      <div class="bg-andino-pattern absolute inset-0" aria-hidden="true"></div>

      <div class="container-app relative py-12 md:py-16">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-xs font-semibold tracking-[0.25em] text-gold-400 uppercase">
            Certificados
          </p>
          <h1 class="mt-3 text-white">Verifica un certificado</h1>
          <p class="mt-4 text-marine-100">
            Introduce el código que aparece en el certificado y comprueba que es
            auténtico y que sigue vigente. Esta comprobación es pública: no
            necesitas cuenta.
          </p>
        </div>
      </div>
    </section>

    <section class="container-app py-10 md:py-12">
      <div class="card mx-auto max-w-2xl p-6 shadow-lg md:p-8">
        <h2 class="text-xl">Código de verificación</h2>
        <p class="mt-1.5 text-sm text-marine-500">
          El código es una cadena alfanumérica que acompaña al certificado
          emitido.
        </p>

        <form class="mt-5 space-y-4" [formGroup]="form" (ngSubmit)="verificar()" novalidate>
          <div>
            <label class="label" for="codigo">Código del certificado</label>
            <input
              id="codigo"
              type="text"
              class="input font-mono"
              [class.input-error]="campoInvalido('codigo')"
              formControlName="codigo"
              autocomplete="off"
              spellcheck="false"
              placeholder="Ej.: INKA-2024-A1B2C3"
            />
            @if (campoInvalido('codigo')) {
              <p class="field-error">
                <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" stroke-linecap="round" />
                </svg>
                Introduce el código del certificado para verificarlo.
              </p>
            }
          </div>

          <app-button
            tipo="submit"
            variante="primario"
            tamano="lg"
            [cargando]="buscando()"
            [deshabilitado]="form.invalid"
            class="w-full"
          >
            Verificar certificado
          </app-button>
        </form>
      </div>

      <!-- ================= RESULTADO ================= -->
      <div class="mx-auto mt-8 max-w-2xl">
        @if (buscando()) {
          <div class="card p-6">
            <app-skeleton alto="1.25rem" ancho="45%" />
            <div class="mt-4 space-y-3">
              <app-skeleton alto="1rem" />
              <app-skeleton alto="1rem" ancho="80%" />
              <app-skeleton alto="1rem" ancho="60%" />
            </div>
          </div>
        } @else if (estado() === 'encontrado' && certificado()) {
          <article class="card overflow-hidden">
            <header
              class="flex flex-wrap items-center justify-between gap-3 border-b border-surface-200 px-6 py-4"
              [class.bg-success-50]="certificado()!.estado === 'emitido'"
              [class.bg-danger-50]="certificado()!.estado === 'revocado'"
              [class.bg-warning-50]="certificado()!.estado === 'expirado'"
            >
              <div class="flex items-center gap-3">
                <span
                  class="flex size-10 items-center justify-center rounded-full bg-white text-brand-600"
                >
                  <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <path d="m5 13 4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <div>
                  <h2 class="text-lg font-semibold text-marine-700">Certificado verificado</h2>
                  <p class="text-sm text-marine-500">
                    El código existe en el registro oficial de InkaQuest.
                  </p>
                </div>
              </div>
              <span class="badge" [class.badge-success]="certificado()!.estado === 'emitido'"
                [class.badge-danger]="certificado()!.estado === 'revocado'"
                [class.badge-warning]="certificado()!.estado === 'expirado'">
                {{ etiquetaEstado() }}
              </span>
            </header>

            <dl class="divide-y divide-surface-100">
              <div class="flex items-center justify-between gap-4 px-6 py-4">
                <dt class="text-sm text-marine-500">Código</dt>
                <dd class="font-mono text-sm font-semibold text-marine-700">
                  {{ certificado()!.codigo }}
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4 px-6 py-4">
                <dt class="text-sm text-marine-500">Fecha de emisión</dt>
                <dd class="text-sm font-semibold text-marine-700">{{ fechaEmision() }}</dd>
              </div>
              @if (fechaExpiracion()) {
                <div class="flex items-center justify-between gap-4 px-6 py-4">
                  <dt class="text-sm text-marine-500">Fecha de expiración</dt>
                  <dd class="text-sm font-semibold text-marine-700">{{ fechaExpiracion() }}</dd>
                </div>
              }
              <div class="flex items-center justify-between gap-4 px-6 py-4">
                <dt class="text-sm text-marine-500">Estado</dt>
                <dd class="text-sm font-semibold text-marine-700">{{ etiquetaEstado() }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4 px-6 py-4">
                <dt class="text-sm text-marine-500">Verificado</dt>
                <dd class="text-sm font-semibold text-marine-700">
                  {{ certificado()!.verificado ? 'Sí, con sello de la plataforma' : 'Pendiente de verificación' }}
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4 px-6 py-4">
                <dt class="text-sm text-marine-500">Consultas registradas</dt>
                <dd class="text-sm font-semibold text-marine-700">
                  {{ certificado()!.veces_verificado }}
                </dd>
              </div>
              @if (curso(); as cursoCertificado) {
                <div class="px-6 py-4">
                  <dt class="text-sm text-marine-500">Curso</dt>
                  <dd class="mt-1 text-sm font-semibold text-marine-700">
                    {{ cursoCertificado.titulo_snapshot }}
                  </dd>
                  @if (cursoCertificado.horas) {
                    <dd class="mt-0.5 text-sm text-marine-500">
                      {{ cursoCertificado.horas }} horas de contenido
                    </dd>
                  }
                </div>
              }
            </dl>

            <footer class="border-t border-surface-200 bg-surface-50 px-6 py-4">
              <p class="text-xs leading-relaxed text-marine-500">
                Por protección de datos, la verificación pública no muestra el
                nombre del titular. Si eres el titular, puedes ver el detalle
                completo desde tu panel de certificados.
              </p>
              <a routerLink="/registro" class="btn btn-outline btn-sm mt-3">
                Crear mi cuenta en InkaQuest
              </a>
            </footer>
          </article>
        } @else if (estado() === 'no-encontrado') {
          <div class="card">
            <div class="state-block">
              <div
                class="flex size-14 items-center justify-center rounded-full bg-danger-50 text-danger-600"
              >
                <svg class="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9 9l6 6M15 9l-6 6" stroke-linecap="round" />
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-marine-700">
                No encontramos ese certificado
              </h2>
              <p class="max-w-md text-sm leading-relaxed text-marine-500">
                El código no existe en el registro de InkaQuest. Revisa que
                este bien copiado, sin espacios sobrantes. Si el certificado
                fue revocado o expiró, también puede mostrar este resultado.
              </p>
              <a routerLink="/contacto" class="btn btn-primary btn-md mt-2">
                Reportar una incidencia
              </a>
            </div>
          </div>
        } @else {
          <div class="card bg-surface-50 p-6 text-center">
            <p class="text-sm text-marine-500">
              Introduce un código para comprobar si el certificado es
              auténtico. La consulta se realiza directamente contra el registro
              público de certificados.
            </p>
          </div>
        }
      </div>
    </section>
  `,
})
export class CertificateVerifyComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly certificateService = inject(CertificateService);
  private readonly destroyRef = inject(DestroyRef);

  /** Formulario con el codigo a verificar. */
  protected readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.minLength(4)]],
  });

  /** Certificado encontrado en la base de datos. */
  protected readonly certificado = signal<Certificado | null>(null);
  /** Curso asociado al certificado (titulo congelado al emitirlo). */
  protected readonly curso = signal<CertificadoCurso | null>(null);
  /** Estado de la pantalla. */
  protected readonly estado = signal<EstadoVerificacion>('inicial');
  /** Indica que hay una consulta en curso. */
  protected readonly buscando = signal(false);

  /** Etiqueta legible del estado del certificado. */
  protected readonly etiquetaEstado = computed(() => {
    const certificado = this.certificado();
    switch (certificado?.estado) {
      case 'emitido':
        return 'Emitido';
      case 'revocado':
        return 'Revocado';
      case 'expirado':
        return 'Expirado';
      default:
        return certificado?.estado ?? 'Sin estado';
    }
  });

  /** Fecha de emisión formateada. */
  protected readonly fechaEmision = computed(() => this.formatear(this.certificado()?.emitido_en));

  /** Fecha de expiración formateada (si el certificado expira). */
  protected readonly fechaExpiracion = computed(() => this.formatear(this.certificado()?.expira_en));

  ngOnInit(): void {
    // La ruta puede traer el codigo: en ese caso se verifica al entrar.
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const codigo = params.get('codigo');
      if (codigo) {
        this.form.setValue({ codigo });
        void this.verificar();
      }
    });
  }

  /** Indica si un control es invalido y fue tocado. */
  protected campoInvalido(nombre: string): boolean {
    const control = this.form.get(nombre);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  /** Verifica el certificado indicado en el formulario. */
  protected async verificar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const codigo = this.form.getRawValue().codigo.trim();
    if (!codigo) {
      return;
    }

    this.buscando.set(true);
    this.estado.set('buscando');

    try {
      const certificado = await this.certificateService.verificarPorCodigo(codigo);

      if (!certificado) {
        this.certificado.set(null);
        this.curso.set(null);
        this.estado.set('no-encontrado');
        return;
      }

      this.certificado.set(certificado);
      this.curso.set(await this.certificateService.obtenerCursoCertificado(certificado.id));
      this.estado.set('encontrado');
    } finally {
      this.buscando.set(false);
    }
  }

  /** Formatea una fecha ISO en formato largo en espanol. */
  private formatear(fecha: string | null | undefined): string {
    if (!fecha) {
      return '';
    }
    const fechaIso = new Date(fecha);
    if (Number.isNaN(fechaIso.getTime())) {
      return fecha;
    }
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(fechaIso);
  }
}
