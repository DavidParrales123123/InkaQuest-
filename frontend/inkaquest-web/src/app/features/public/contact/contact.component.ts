// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { SupportService } from '../../../core/services/support.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';

/**
 * Pagina de contacto.
 *
 * <p>El envio crea un <b>ticket de soporte real</b> en la tabla
 * {@code ticket} mediante {@link SupportService.crearTicket()}. No se simula
 * ningun envio: si el usuario no esta autenticado, el ticket no puede crearse
 * (la tabla exige un {@code usuario_id}) y la pantalla lo remite al inicio de
 * sesion.</p>
 */
@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent],
  template: `
    <section class="relative overflow-hidden bg-marine-gradient text-white">
      <div class="absolute inset-0 bg-andino-pattern opacity-70" aria-hidden="true"></div>
      <div class="container-app relative py-14 md:py-18">
        <p class="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-[0.18em] text-gold-300 uppercase ring-1 ring-white/15">Contacto</p>
        <h1 class="mt-4 text-white">Hablemos</h1>
        <p class="mt-4 max-w-2xl text-lg text-marine-100">
          Escríbenos y crearemos un ticket de soporte real para que tu consulta quede registrada y puedas darle seguimiento.
        </p>
      </div>
    </section>

    <section class="container-app py-10">
      <div class="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <!-- ================= FORMULARIO ================= -->
        <div class="card card-body">
          <h2 class="text-xl">Envía tu consulta</h2>
          <p class="mt-1.5 text-sm text-marine-500">
            Todos los campos son obligatorios. Respondemos por correo y, si
            tienes cuenta, también desde tu panel de soporte.
          </p>

          @if (!auth.autenticado()) {
            <div class="mt-5 rounded-card border border-warning-500/40 bg-warning-50 p-4">
              <p class="text-sm font-semibold text-marine-700">
                Inicia sesión para enviar tu mensaje
              </p>
              <p class="mt-1 text-sm leading-relaxed text-marine-600">
                El ticket de soporte necesita un usuario asociado: así queda
                registrado a tu nombre y puedes ver su estado y las respuestas.
              </p>
              <a routerLink="/login" class="btn btn-primary btn-md mt-3">
                Iniciar sesión
              </a>
            </div>
          }

          @if (mensaje()) {
            <p
              class="mt-5 rounded-button px-3.5 py-3 text-sm"
              [class.bg-success-50]="exito()"
              [class.text-success-600]="exito()"
              [class.bg-danger-50]="!exito()"
              [class.text-danger-600]="!exito()"
              role="status"
            >
              {{ mensaje() }}
            </p>
          }

          <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="enviar()" novalidate>
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="label" for="nombre">Nombre completo</label>
                <input
                  id="nombre"
                  type="text"
                  class="input"
                  [class.input-error]="campoInvalido('nombre')"
                  formControlName="nombre"
                  autocomplete="name"
                  placeholder="Nombre y apellidos"
                />
                @if (campoInvalido('nombre')) {
                  <p class="field-error">
                    <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" stroke-linecap="round" />
                    </svg>
                    {{ errorControl('nombre') }}
                  </p>
                }
              </div>

              <div>
                <label class="label" for="correo">Correo electrónico</label>
                <input
                  id="correo"
                  type="email"
                  class="input"
                  [class.input-error]="campoInvalido('correo')"
                  formControlName="correo"
                  autocomplete="email"
                  placeholder="tu@universidad.edu.pe"
                />
                @if (campoInvalido('correo')) {
                  <p class="field-error">
                    <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" stroke-linecap="round" />
                    </svg>
                    {{ errorControl('correo') }}
                  </p>
                }
              </div>
            </div>

            <div>
              <label class="label" for="asunto">Asunto</label>
              <input
                id="asunto"
                type="text"
                class="input"
                [class.input-error]="campoInvalido('asunto')"
                formControlName="asunto"
                placeholder="Resume tu consulta en una línea"
              />
              @if (campoInvalido('asunto')) {
                <p class="field-error">
                  <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" stroke-linecap="round" />
                  </svg>
                  {{ errorControl('asunto') }}
                </p>
              }
            </div>

            <div>
              <label class="label" for="mensaje">Mensaje</label>
              <textarea
                id="mensaje"
                class="textarea"
                [class.input-error]="campoInvalido('mensaje')"
                formControlName="mensaje"
                rows="6"
                placeholder="Describe tu consulta con el mayor detalle posible"
              ></textarea>
              @if (campoInvalido('mensaje')) {
                <p class="field-error">
                  <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" stroke-linecap="round" />
                  </svg>
                  {{ errorControl('mensaje') }}
                </p>
              }
            </div>

            @if (auth.autenticado()) {
              <app-button
                tipo="submit"
                variante="primario"
                tamano="lg"
                [cargando]="enviando()"
                [deshabilitado]="form.invalid"
                class="w-full"
              >
                Enviar consulta
              </app-button>
            } @else {
              <app-button
                variante="secundario"
                tamano="lg"
                [deshabilitado]="true"
                class="w-full"
              >
                Inicia sesión para enviar el mensaje
              </app-button>
              <p class="text-center text-xs text-marine-400">
                <a routerLink="/login" class="link">Iniciar sesión</a>
                o
                <a routerLink="/registro" class="link">crear una cuenta</a>
              </p>
            }
          </form>
        </div>

        <!-- ================= DATOS INSTITUCIONALES ================= -->
        <aside class="space-y-5">
          <div class="card card-body">
            <h2 class="text-lg">Datos de contacto</h2>
            <dl class="mt-4 space-y-4 text-sm">
              <div class="flex items-start gap-3">
                <span
                  class="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-100 text-brand-600"
                >
                  <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" stroke-linejoin="round" />
                  </svg>
                </span>
                <div>
                  <dt class="font-semibold text-marine-700">Correo</dt>
                  <dd class="mt-0.5 text-marine-500">
                    <a [href]="'mailto:' + contacto.correo" class="link">{{ contacto.correo }}</a>
                  </dd>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <span
                  class="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-100 text-brand-600"
                >
                  <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" stroke-linejoin="round" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </span>
                <div>
                  <dt class="font-semibold text-marine-700">Dirección</dt>
                  <dd class="mt-0.5 text-marine-500">{{ contacto.direccion }}</dd>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <span
                  class="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-100 text-brand-600"
                >
                  <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <div>
                  <dt class="font-semibold text-marine-700">Horario de atención</dt>
                  <dd class="mt-0.5 text-marine-500">{{ contacto.horario }}</dd>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <span
                  class="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-100 text-brand-600"
                >
                  <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                    <path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1.1 1A16 16 0 0 1 4 5.1 1 1 0 0 1 5 4z" stroke-linejoin="round" />
                  </svg>
                </span>
                <div>
                  <dt class="font-semibold text-marine-700">Telefono</dt>
                  <dd class="mt-0.5 text-marine-500">{{ contacto.telefono }}</dd>
                </div>
              </div>
            </dl>
          </div>

          <div class="card card-body bg-surface-50">
            <h2 class="text-lg">Respuestas rápidas</h2>
            <p class="mt-2 text-sm text-marine-600">
              Antes de escribir, quizá la respuesta ya está en las preguntas
              frecuentes.
            </p>
            <a routerLink="/faq" class="btn btn-outline btn-md mt-4">Ver preguntas frecuentes</a>
          </div>
        </aside>
      </div>
    </section>
  `,
})
export class ContactComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly supportService = inject(SupportService);

  /** Servicio de sesion: define si se puede crear el ticket. */
  protected readonly auth = inject(AuthService);

  /** Datos de contacto de la institucion. */
  protected readonly contacto = {
    correo: 'contacto@inkaquest.edu.pe',
    direccion: 'Av. Universitaria 1350, oficina de Tecnología, Lima, Perú',
    horario: 'Lunes a viernes, de 09:00 a 19:00 (GMT-5)',
    telefono: '+51 1 555 0142',
  } as const;

  /** Formulario reactivo de contacto. */
  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    correo: ['', [Validators.required, Validators.email]],
    asunto: ['', [Validators.required, Validators.minLength(5)]],
    mensaje: ['', [Validators.required, Validators.minLength(20)]],
  });

  /** Estado de envio del ticket. */
  protected readonly enviando = signal(false);
  /** Mensaje de resultado. */
  protected readonly mensaje = signal('');
  /** Indica si el mensaje es de exito. */
  protected readonly exito = signal(false);

  ngOnInit(): void {
    // Se prellenan los datos que ya conocemos del perfil para ahorrar trabajo.
    const perfil = this.auth.perfil();
    if (perfil) {
      const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(' ');
      if (nombre) {
        this.form.patchValue({ nombre });
      }
      if (perfil.email) {
        this.form.patchValue({ correo: perfil.email });
      }
    }
  }

  /** Indica si un control es invalido y fue tocado. */
  protected campoInvalido(nombre: string): boolean {
    const control = this.form.get(nombre);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  /** Mensaje de error de un control. */
  protected errorControl(nombre: string): string {
    const control = this.form.get(nombre);
    if (!control?.errors) {
      return '';
    }
    if (control.errors['required']) {
      return 'Este campo es obligatorio.';
    }
    if (control.errors['email']) {
      return 'Introduce un correo electrónico válido.';
    }
    if (control.errors['minlength']) {
      if (nombre === 'mensaje') {
        return 'Describe tu consulta con al menos 20 caracteres.';
      }
      if (nombre === 'asunto') {
        return 'El asunto necesita al menos 5 caracteres.';
      }
      return 'Escribe tu nombre completo.';
    }
    return 'Revisa este campo.';
  }

  /** Envia la consulta creando un ticket de soporte real. */
  protected async enviar(): Promise<void> {
    if (!this.auth.autenticado()) {
      this.mensaje.set('Debes iniciar sesión para enviar tu consulta.');
      this.exito.set(false);
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensaje.set('Revisa los campos marcados en rojo.');
      this.exito.set(false);
      return;
    }

    const usuario = this.auth.usuario();
    if (!usuario) {
      this.mensaje.set('Tu sesión no está activa. Vuelve a iniciar sesión.');
      this.exito.set(false);
      return;
    }

    this.enviando.set(true);
    this.mensaje.set('');

    try {
      const { asunto, mensaje } = this.form.getRawValue();
      const resultado = await this.supportService.crearTicket(
        usuario.id,
        asunto,
        mensaje,
        'contacto',
        'media',
      );

      this.mensaje.set(
        resultado.ok
          ? `Ticket creado correctamente (referencia ${resultado.ticketId ?? 'sin referencia'}). Te responderemos lo antes posible.`
          : resultado.mensaje,
      );
      this.exito.set(resultado.ok);

      if (resultado.ok) {
        this.form.reset();
      }
    } finally {
      this.enviando.set(false);
    }
  }
}
