// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { SolicitudDocente } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

/**
 * Solicitud de acceso docente (solo estudiantes autenticados).
 */
@Component({
  selector: 'app-teacher-request',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="container-app py-10 md:py-14">
      <app-page-header
        titulo="Solicitar acceso docente"
        descripcion="Los docentes se incorporan mediante solicitud y aprobación administrativa. Esta plataforma no permite autoasignarse el rol docente."
      />

      <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="false" (alReintentar)="cargar()">
          <div contenido class="card card-body">
            @if (solicitud(); as s) {
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <h2 class="text-lg font-semibold text-marine-800">Tu solicitud</h2>
                  <app-status-badge [estado]="s.estado" />
                </div>
                <p class="text-sm text-marine-600"><strong>Institución:</strong> {{ s.institucion || '-' }}</p>
                <p class="text-sm text-marine-600"><strong>Especialidad:</strong> {{ s.especialidad || '-' }}</p>
                <p class="text-sm text-marine-600"><strong>Motivo:</strong> {{ s.motivo || '-' }}</p>
                @if (s.motivo_revision) {
                  <p class="text-sm text-marine-600"><strong>Observación:</strong> {{ s.motivo_revision }}</p>
                }
                <p class="text-xs text-marine-400">Si tu solicitud es rechazada, puedes contactar soporte para más información. No es posible autoasignar el rol docente.</p>
              </div>
            } @else {
              <h2 class="text-lg font-semibold text-marine-800">Formulario de solicitud</h2>
              <p class="mt-1 text-sm text-marine-500">Completa y envía tu solicitud para que el administrador pueda revisarla y aprobar tu acceso como docente.</p>
              <form class="mt-4 space-y-4" [formGroup]="form" novalidate>
                <div>
                  <label class="label" for="institucion">Institución</label>
                  <input id="institucion" class="input" formControlName="institucion" [class.border-danger-500]="campoInvalido('institucion')" />
                  @if (campoInvalido('institucion')) { <p class="mt-1 text-xs text-danger-600">Indica tu institución.</p> }
                </div>
                <div>
                  <label class="label" for="especialidad">Especialidad / Área</label>
                  <input id="especialidad" class="input" formControlName="especialidad" [class.border-danger-500]="campoInvalido('especialidad')" />
                  @if (campoInvalido('especialidad')) { <p class="mt-1 text-xs text-danger-600">Indica tu especialidad o Área.</p> }
                </div>
                <div>
                  <label class="label" for="codigoDocente">Código docente (si aplica)</label>
                  <input id="codigoDocente" class="input" formControlName="codigoDocente" />
                </div>
                <div>
                  <label class="label" for="motivo">Motivo de la solicitud</label>
                  <textarea id="motivo" class="textarea min-h-28" formControlName="motivo" [class.border-danger-500]="campoInvalido('motivo')"></textarea>
                  @if (campoInvalido('motivo')) { <p class="mt-1 text-xs text-danger-600">Describe tu motivo o experiencia (mínimo 10 caracteres).</p> }
                </div>
                <div class="rounded-xl border border-surface-200 bg-surface-50 p-3 text-sm" [class.text-success-700]="exito()" [class.text-danger-700]="!exito() && mensaje()" [class.text-marine-600]="!mensaje()">
                  {{ mensaje() || 'Completa el formulario y presiona "Enviar solicitud".' }}
                </div>
                <button type="button" class="btn btn-primary btn-md w-full sm:w-auto" [disabled]="enviando()" (click)="enviar()">
                  {{ enviando() ? 'Enviando solicitud…' : 'Enviar solicitud' }}
                </button>
              </form>
            }
          </div>
        </app-data-panel>

        <aside class="card card-body h-fit bg-surface-50 text-sm text-marine-600 space-y-2">
          <h2 class="text-base font-semibold text-marine-800">Información</h2>
          <ul class="list-disc space-y-1 pl-4">
            <li>Solo estudiantes pueden solicitar acceso como docente.</li>
            <li>La aprobación la realiza un administrador y el cambio de rol lo aplica el backend/base de datos.</li>
            <li>No se aceptan auto-registros como docente o administrador.</li>
          </ul>
          <a routerLink="/soporte" class="link block pt-2">Necesito ayuda</a>
        </aside>
      </div>
    </section>
  `,
})
export class TeacherRequestComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  private readonly fb = inject(FormBuilder);

  protected readonly cargando = signal(true);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly solicitud = signal<SolicitudDocente | null>(null);
  protected readonly mensaje = signal('');
  protected readonly exito = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    institucion: ['', Validators.required],
    especialidad: ['', Validators.required],
    codigoDocente: [''],
    motivo: ['', [Validators.required, Validators.minLength(10)]],
  });

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    this.mensaje.set('');
    try {
      // Si hay una solicitud pendiente guardada localmente (registro con verificación), intenta enviarla.
      const envioPendiente = await this.auth.procesarSolicitudDocentePendiente();
      if (envioPendiente?.mensaje) {
        this.mensaje.set(envioPendiente.mensaje);
        this.exito.set(false);
      } else if (envioPendiente?.ok) {
        // pudo haberse enviado o ya existía; se confirmará al recargar la solicitud
      }
      this.solicitud.set(await this.teacherService.obtenerMiSolicitud(user.id));
      if (!this.solicitud()) {
        this.prefillDesdePendienteLocal();
      } else if (this.solicitud()!.estado === 'pendiente' && !this.mensaje()) {
        this.mensaje.set('Tu solicitud ya fue enviada y está pendiente de revisión por un administrador.');
        this.exito.set(true);
      }
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar tu solicitud.');
    } finally { this.cargando.set(false); }
  }

  private prefillDesdePendienteLocal(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem('inkaquest.pendingTeacherRequest');
      if (!raw) return;
      const p = JSON.parse(raw) as { institucion?: string; especialidad?: string; codigoDocente?: string; motivo?: string };
      this.form.patchValue({
        institucion: p.institucion ?? '',
        especialidad: p.especialidad ?? '',
        codigoDocente: p.codigoDocente ?? '',
        motivo: p.motivo ?? '',
      });
      if (!this.mensaje()) {
        this.mensaje.set('Se recuperaron los datos de tu solicitud pendiente. Revisa y envíala para que el administrador pueda aprobarla.');
        this.exito.set(true);
      }
    } catch {
      /* noop */
    }
  }

  protected campoInvalido(nombre: string): boolean {
    const c = this.form.get(nombre);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  protected async enviar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) {
      this.mensaje.set('Debes iniciar sesión para enviar la solicitud.');
      this.exito.set(false);
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensaje.set('Completa los campos obligatorios (el motivo debe tener al menos 10 caracteres).');
      this.exito.set(false);
      return;
    }
    this.enviando.set(true);
    this.mensaje.set('Enviando tu solicitud, espera un momento…');
    this.exito.set(false);
    try {
      const v = this.form.getRawValue();
      const res = await this.teacherService.solicitarAccesoDocente(user.id, v);
      this.mensaje.set(res.mensaje);
      this.exito.set(res.ok);
      if (res.ok) {
        try { localStorage.removeItem('inkaquest.pendingTeacherRequest'); } catch { /* noop */ }
        await this.cargar();
      }
    } catch (e) {
      this.mensaje.set(e instanceof Error ? e.message : 'No se pudo enviar la solicitud.');
      this.exito.set(false);
    } finally {
      this.enviando.set(false);
    }
  }
}
