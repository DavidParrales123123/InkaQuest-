import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { mensajeErrorContrasena, validarContrasenaSegura } from '../../../core/validators/contrasena.validator';

/**
 * Creación de cuenta.
 *
 * <p>Permite registrarse como estudiante o como docente. El registro crea la
 * cuenta base (perfil estudiante vía Supabase/Auth). Si se elige docente y la
 * sesión queda activa, se envía la solicitud de acceso docente para revisión
 * administrativa; el rol no se autoasigna. Si se requiere verificación de
 * correo, la solicitud docente debe completarse tras iniciar sesión.</p>
 */
@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-page" aria-labelledby="register-title">
      <div class="auth-panel">
        <a routerLink="/" class="auth-back" aria-label="Volver al inicio">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Volver al inicio
        </a>
        <div class="auth-card">
          <a routerLink="/" class="auth-brand" aria-label="Ir al inicio de InkaQuest">
            <img src="/assets/images/brand/logo.png" alt="" width="40" height="40" />
            <span><strong>InkaQuest</strong><small>Crea tu cuenta</small></span>
          </a>

          <p class="auth-kicker">Empieza tu camino</p>
          <h1 id="register-title" class="auth-title">Crea tu cuenta.</h1>
          <p class="auth-subtitle">Elige tu perfil y completa los datos. La activación de rol docente siempre requiere aprobación administrativa.</p>

          @if (mensaje()) {
            <p class="auth-alert" [class.auth-success]="exito()" role="status">{{ mensaje() }}</p>
          }

          <form class="auth-form" [formGroup]="form" (ngSubmit)="enviar()" novalidate>
            <div class="auth-field">
              <label class="label mb-1.5" style="margin-bottom:0.4rem">Tipo de cuenta</label>
              <div class="grid grid-cols-2 gap-2">
                <button type="button" class="rounded-xl border px-3 py-2.5 text-sm font-extrabold transition-all"
                  [class.border-brand-500]="form.controls.tipoCuenta.value === 'estudiante'"
                  [class.bg-brand-50]="form.controls.tipoCuenta.value === 'estudiante'"
                  [class.text-brand-700]="form.controls.tipoCuenta.value === 'estudiante'"
                  [class.border-surface-300]="form.controls.tipoCuenta.value !== 'estudiante'"
                  [class.text-marine-600]="form.controls.tipoCuenta.value !== 'estudiante'"
                  (click)="seleccionarTipo('estudiante')">Alumno</button>
                <button type="button" class="rounded-xl border px-3 py-2.5 text-sm font-extrabold transition-all"
                  [class.border-brand-500]="form.controls.tipoCuenta.value === 'docente'"
                  [class.bg-brand-50]="form.controls.tipoCuenta.value === 'docente'"
                  [class.text-brand-700]="form.controls.tipoCuenta.value === 'docente'"
                  [class.border-surface-300]="form.controls.tipoCuenta.value !== 'docente'"
                  [class.text-marine-600]="form.controls.tipoCuenta.value !== 'docente'"
                  (click)="seleccionarTipo('docente')">Docente</button>
              </div>
              <p class="field-error" aria-hidden="true">&nbsp;</p>
            </div>

            <div class="auth-field">
              <label for="nombre">Nombre completo</label>
              <input id="nombre" type="text" autocomplete="name" formControlName="nombre" placeholder="Nombres y apellidos"
                [attr.aria-invalid]="campoInvalido('nombre') ? true : null" [class.border-danger-500]="campoInvalido('nombre')" />
              <p class="field-error" aria-live="polite">{{ campoInvalido('nombre') ? errorControl('nombre') : '\u00A0' }}</p>
            </div>

            <div class="grid gap-2 sm:grid-cols-2">
              <div class="auth-field">
                <label class="label mb-1.5" style="margin-bottom:0.4rem">Sexo</label>
                <div class="grid grid-cols-2 gap-2">
                  <button type="button" class="rounded-xl border px-3 py-2.5 text-sm font-extrabold transition-all"
                    [class.border-brand-500]="form.controls.genero.value === 'masculino'"
                    [class.bg-brand-50]="form.controls.genero.value === 'masculino'"
                    [class.text-brand-700]="form.controls.genero.value === 'masculino'"
                    [class.border-surface-300]="form.controls.genero.value !== 'masculino'"
                    [class.text-marine-600]="form.controls.genero.value !== 'masculino'"
                    (click)="form.controls.genero.setValue('masculino'); form.controls.genero.markAsTouched()">Masculino</button>
                  <button type="button" class="rounded-xl border px-3 py-2.5 text-sm font-extrabold transition-all"
                    [class.border-brand-500]="form.controls.genero.value === 'femenino'"
                    [class.bg-brand-50]="form.controls.genero.value === 'femenino'"
                    [class.text-brand-700]="form.controls.genero.value === 'femenino'"
                    [class.border-surface-300]="form.controls.genero.value !== 'femenino'"
                    [class.text-marine-600]="form.controls.genero.value !== 'femenino'"
                    (click)="form.controls.genero.setValue('femenino'); form.controls.genero.markAsTouched()">Femenino</button>
                </div>
                <p class="field-error" aria-live="polite">{{ campoInvalido('genero') ? errorControl('genero') : '\u00A0' }}</p>
              </div>

              <div class="auth-field">
                <label for="fechaNacimiento">Fecha de nacimiento</label>
                <input id="fechaNacimiento" type="date" formControlName="fechaNacimiento" [attr.max]="fechaMaximaNacimiento"
                  [attr.aria-invalid]="campoInvalido('fechaNacimiento') ? true : null" [class.border-danger-500]="campoInvalido('fechaNacimiento')" />
                <p class="field-error" aria-live="polite">{{ campoInvalido('fechaNacimiento') ? errorControl('fechaNacimiento') : '\u00A0' }}</p>
              </div>
            </div>

            <div class="auth-field">
              <label for="email">Correo electrónico</label>
              <input id="email" type="email" autocomplete="email" formControlName="email"
                [placeholder]="form.controls.tipoCuenta.value === 'docente' ? 'correo@universidad.edu.pe' : 'tu@correo.com'"
                [attr.aria-invalid]="campoInvalido('email') ? true : null" [class.border-danger-500]="campoInvalido('email')" />
              <p class="field-error" aria-live="polite">{{ campoInvalido('email') ? errorControl('email') : '\u00A0' }}</p>
            </div>

            @if (form.controls.tipoCuenta.value === 'docente') {
              <div class="rounded-2xl border border-surface-200 bg-surface-50 p-4">
                <p class="text-sm font-extrabold text-marine-700">Información docente</p>
                <p class="mt-1 text-xs text-marine-500">Se enviará como solicitud para revisión. No otorga rol docente automático.</p>
                <div class="mt-3 grid gap-2">
                  <div class="auth-field">
                    <label for="institucion">Institución / universidad</label>
                    <input id="institucion" type="text" formControlName="institucion" placeholder="Ej. Universidad Nacional…" [attr.aria-invalid]="campoInvalido('institucion') ? true : null" [class.border-danger-500]="campoInvalido('institucion')" />
                    <p class="field-error" aria-live="polite">{{ campoInvalido('institucion') ? 'Indica tu institución.' : '\u00A0' }}</p>
                  </div>
                  <div class="grid gap-2 sm:grid-cols-2">
                    <div class="auth-field">
                      <label for="especialidad">Especialidad / Área</label>
                      <input id="especialidad" type="text" formControlName="especialidad" placeholder="Ej. Algoritmos, BD…" [attr.aria-invalid]="campoInvalido('especialidad') ? true : null" [class.border-danger-500]="campoInvalido('especialidad')" />
                      <p class="field-error" aria-live="polite">{{ campoInvalido('especialidad') ? 'Indica tu especialidad.' : '\u00A0' }}</p>
                    </div>
                    <div class="auth-field">
                      <label for="codigoDocente">Código docente (opcional)</label>
                      <input id="codigoDocente" type="text" formControlName="codigoDocente" placeholder="Si aplica" />
                      <p class="field-error" aria-hidden="true">&nbsp;</p>
                    </div>
                  </div>
                  <div class="auth-field">
                    <label for="motivo">Motivo / experiencia</label>
                    <textarea id="motivo" class="min-h-24" formControlName="motivo" placeholder="Describe brevemente tu experiencia y los cursos que te gustaría impartir." [attr.aria-invalid]="campoInvalido('motivo') ? true : null" [class.border-danger-500]="campoInvalido('motivo')"></textarea>
                    <p class="field-error" aria-live="polite">{{ campoInvalido('motivo') ? 'Describe tu motivo o experiencia (mín. 10 caracteres).' : '\u00A0' }}</p>
                  </div>
                </div>
              </div>
            }

            <div class="grid gap-2 sm:grid-cols-2">
              <div class="auth-field">
                <label for="password">Contraseña</label>
                <input id="password" type="password" autocomplete="new-password" formControlName="password" placeholder="Mínimo 8 caracteres, una mayúscula y un símbolo" [attr.aria-invalid]="campoInvalido('password') ? true : null" [class.border-danger-500]="campoInvalido('password')" />
                <p class="field-error" aria-live="polite">{{ campoInvalido('password') ? errorControl('password') : '\u00A0' }}</p>
              </div>
              <div class="auth-field">
                <label for="confirmar">Repetir contraseña</label>
                <input id="confirmar" type="password" autocomplete="new-password" formControlName="confirmar" placeholder="Repite tu contraseña" [attr.aria-invalid]="campoInvalido('confirmar') || (form.errors?.['contrasenas'] && form.get('confirmar')?.touched) ? true : null" [class.border-danger-500]="campoInvalido('confirmar') || (form.errors?.['contrasenas'] && form.get('confirmar')?.touched)" />
                <p class="field-error" aria-live="polite">{{ (campoInvalido('confirmar') || (form.errors?.['contrasenas'] && form.get('confirmar')?.touched)) ? (errorControl('confirmar') || 'Las contraseñas no coinciden.') : '\u00A0' }}</p>
              </div>
            </div>

            <div class="pt-1">
              <label class="flex items-start gap-2.5 text-sm text-marine-600">
                <input id="terminos" type="checkbox" class="checkbox mt-0.5" formControlName="terminos" />
                <span>Acepto los <a routerLink="/terminos" class="link">términos y condiciones</a> y la <a routerLink="/privacidad" class="link">política de privacidad</a>.</span>
              </label>
              <p class="field-error" aria-live="polite">{{ campoInvalido('terminos') ? 'Debes aceptar los términos para continuar.' : '\u00A0' }}</p>
            </div>

            <button class="auth-submit mt-1" type="submit" [disabled]="cargando()">
              {{ cargando() ? 'Creando cuenta…' : (form.controls.tipoCuenta.value === 'docente' ? 'Crear cuenta y enviar solicitud' : 'Crear cuenta') }}
            </button>
          </form>

          <div class="auth-footer">
            <p class="auth-note">
              @if (form.controls.tipoCuenta.value === 'docente') {
                Se creará tu cuenta y se registrará tu solicitud docente para aprobación de un administrador.
              } @else {
                Acceso inmediato a cursos, retos y seguimiento de tu progreso.
              }
            </p>
            <p class="auth-switch">¿Ya tienes cuenta? <a routerLink="/login">Iniciar sesión</a></p>
          </div>
        </div>
      </div>

      <aside class="auth-aside" aria-hidden="true">
        <div class="auth-aside__content">
          <p class="auth-aside__label">Únete a InkaQuest</p>
          <h2>{{ form.controls.tipoCuenta.value === 'docente' ? 'Comparte tu experiencia.' : 'Empieza con una base sólida.' }}</h2>
          <p>
            @if (form.controls.tipoCuenta.value === 'docente') {
              Regístrate como docente para solicitar acceso y gestionar contenidos cuando un administrador apruebe tu perfil.
            } @else {
              Accede a rutas por categorías, lecciones y retos evaluados con seguimiento real de tu avance.
            }
          </p>
          <div class="auth-aside__art">
            <img src="/assets/images/brand/logo.png" alt="" width="420" height="420" loading="lazy" />
          </div>
        </div>
      </aside>
    </section>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly teacher = inject(TeacherService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group(
    {
      tipoCuenta: ['estudiante' as 'estudiante' | 'docente'],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      genero: ['' as '' | 'masculino' | 'femenino', [Validators.required, this.validarGenero()]],
      fechaNacimiento: ['', [Validators.required, this.validarFechaNacimiento()]],
      email: ['', [Validators.required, Validators.email]],
      institucion: [''],
      especialidad: [''],
      codigoDocente: [''],
      motivo: [''],
      password: ['', [Validators.required, Validators.minLength(8), validarContrasenaSegura]],
      confirmar: ['', [Validators.required]],
      terminos: [false, [Validators.requiredTrue]],
    },
    { validators: [this.coincidenPasswords()] },
  );

  protected readonly cargando = signal(false);
  protected readonly mensaje = signal('');
  protected readonly exito = signal(false);
  protected readonly fechaMaximaNacimiento = new Date().toISOString().slice(0, 10);

  constructor() {
    this.actualizarValidadoresDocente();
  }

  protected seleccionarTipo(tipo: 'estudiante' | 'docente'): void {
    this.form.controls.tipoCuenta.setValue(tipo);
    this.actualizarValidadoresDocente();
  }

  private actualizarValidadoresDocente(): void {
    const esDocente = this.form.controls.tipoCuenta.value === 'docente';
    const inst = this.form.controls.institucion;
    const esp = this.form.controls.especialidad;
    const mot = this.form.controls.motivo;
    if (esDocente) {
      inst.setValidators([Validators.required, Validators.minLength(3)]);
      esp.setValidators([Validators.required, Validators.minLength(3)]);
      mot.setValidators([Validators.required, Validators.minLength(10)]);
    } else {
      inst.clearValidators();
      esp.clearValidators();
      mot.clearValidators();
      inst.setValue('');
      esp.setValue('');
      mot.setValue('');
      this.form.controls.codigoDocente.setValue('');
    }
    inst.updateValueAndValidity({ emitEvent: false });
    esp.updateValueAndValidity({ emitEvent: false });
    mot.updateValueAndValidity({ emitEvent: false });
  }

  private coincidenPasswords() {
    return (grupo: { get(campo: string): { value: string } | null }): Record<string, boolean> | null => {
      const password = grupo.get('password')?.value;
      const confirmar = grupo.get('confirmar')?.value;
      if (!password || !confirmar) return null;
      return password === confirmar ? null : { contrasenas: true };
    };
  }

  private validarGenero() {
    return (control: AbstractControl): ValidationErrors | null => {
      const valor = String(control.value ?? '').trim();
      if (!valor) return null; // required se encarga
      return valor === 'masculino' || valor === 'femenino' ? null : { generoInvalido: true };
    };
  }

  private validarFechaNacimiento() {
    return (control: AbstractControl): ValidationErrors | null => {
      const valor = String(control.value ?? '').trim();
      if (!valor) return null; // required se encarga
      if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return { fechaFormato: true };

      const fecha = new Date(`${valor}T00:00:00`);
      if (Number.isNaN(fecha.getTime())) return { fechaInvalida: true };

      const [y, m, d] = valor.split('-').map(Number);
      if (fecha.getFullYear() !== y || fecha.getMonth() + 1 !== m || fecha.getDate() !== d) {
        return { fechaInvalida: true };
      }

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fecha > hoy) return { fechaFutura: true };

      const edad = this.calcularEdad(fecha, hoy);
      if (edad < 17) return { edadMinima: true };
      if (edad > 120) return { edadMaxima: true };

      return null;
    };
  }

  private calcularEdad(fechaNacimiento: Date, hoy: Date): number {
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  protected campoInvalido(nombre: string): boolean {
    const control = this.form.get(nombre);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  protected errorControl(nombre: string): string {
    const control = this.form.get(nombre);
    if (!control?.errors) return '';
    if (nombre === 'password') {
      for (const key of Object.keys(control.errors)) {
        const msg = mensajeErrorContrasena(key);
        if (msg) return msg;
      }
    }
    if (control.errors['required']) {
      if (nombre === 'genero') return 'Selecciona tu sexo.';
      if (nombre === 'fechaNacimiento') return 'Selecciona tu fecha de nacimiento.';
      return 'Este campo es obligatorio.';
    }
    if (control.errors['generoInvalido']) return 'Selecciona una opción válida (Masculino o Femenino).';
    if (control.errors['fechaFormato'] || control.errors['fechaInvalida']) return 'Ingresa una fecha de nacimiento válida.';
    if (control.errors['fechaFutura']) return 'La fecha de nacimiento no puede ser futura.';
    if (control.errors['edadMinima']) return 'Debes tener al menos 17 años para registrarte.';
    if (control.errors['edadMaxima']) return 'Ingresa una fecha de nacimiento válida.';
    if (control.errors['email']) return 'Introduce un correo electrónico válido.';
    if (control.errors['minlength']) {
      if (nombre === 'nombre') return 'Escribe tu nombre completo.';
      if (nombre === 'password') return 'La contraseña debe tener al menos 8 caracteres.';
      if (nombre === 'motivo') return 'Describe tu motivo o experiencia (mín. 10 caracteres).';
      return 'Completa este campo con más detalle.';
    }
    if (this.form.errors?.['contrasenas'] && nombre === 'confirmar') return 'Las contraseñas no coinciden.';
    return 'Revisa este campo.';
  }

  protected async enviar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensaje.set('Revisa los campos marcados.');
      this.exito.set(false);
      return;
    }

    this.cargando.set(true);
    this.mensaje.set('');

    try {
      const v = this.form.getRawValue();
      const resultado = await this.auth.registrar(
        v.email,
        v.password,
        v.nombre,
        v.genero || null,
        v.fechaNacimiento || null,
      );

      if (!resultado.ok) {
        this.mensaje.set(resultado.mensaje);
        this.exito.set(false);
        return;
      }

      const quiereDocente = v.tipoCuenta === 'docente';
      const usuarioId = this.auth.usuario()?.id ?? null;

      if (quiereDocente && !resultado.requiereVerificacion && usuarioId) {
        const solicitud = await this.teacher.solicitarAccesoDocente(usuarioId, {
          institucion: v.institucion,
          especialidad: v.especialidad,
          codigoDocente: v.codigoDocente,
          motivo: v.motivo,
        });
        try {
          localStorage.removeItem('inkaquest.pendingTeacherRequest');
        } catch {
          /* noop */
        }
        this.mensaje.set(
          solicitud.ok
            ? 'Cuenta creada y solicitud docente enviada. Entrarás como estudiante hasta que un administrador apruebe tu solicitud.'
            : `Cuenta creada, pero no se pudo enviar la solicitud docente: ${solicitud.mensaje}. Puedes enviarla desde "Solicitar acceso docente" al iniciar sesión.`,
        );
        this.exito.set(true);
        await this.router.navigate(['/estudiante/dashboard']);
        return;
      }

      if (quiereDocente && resultado.requiereVerificacion) {
        try {
          localStorage.setItem(
            'inkaquest.pendingTeacherRequest',
            JSON.stringify({
              institucion: v.institucion,
              especialidad: v.especialidad,
              codigoDocente: v.codigoDocente,
              motivo: v.motivo,
            }),
          );
          this.mensaje.set(
            'Cuenta creada. Verifica tu correo e inicia sesión: tu solicitud docente se enviará automáticamente para revisión del administrador (entrarás como estudiante hasta que sea aprobada).',
          );
        } catch {
          this.mensaje.set(
            'Cuenta creada. Verifica tu correo, inicia sesión y envía tu solicitud docente desde "Solicitar acceso docente".',
          );
        }
        this.exito.set(true);
        return;
      }

      this.mensaje.set(resultado.mensaje);
      this.exito.set(true);
      if (!resultado.requiereVerificacion) {
        await this.router.navigate(['/estudiante/dashboard']);
      }
    } finally {
      this.cargando.set(false);
    }
  }
}
