import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { FeedbackMessageComponent } from '../../../shared/components/feedback-message/feedback-message.component';

/** Pantalla que se muestra cuando la cuenta del usuario está suspendida. */
@Component({
  selector: 'app-cuenta-suspendida',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, FeedbackMessageComponent],
  template: `
    <section class="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      <div class="card card-body space-y-5 text-center">
        <span class="mx-auto grid size-16 place-items-center rounded-2xl bg-danger-50 text-danger-600" aria-hidden="true">
          <svg class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5h.01"/></svg>
        </span>
        <h1 class="text-2xl font-extrabold text-marine-800">Tu cuenta ha sido suspendida</h1>
        <p class="text-sm leading-relaxed text-marine-600">
          Por ahora no puedes acceder a InkaQuest. Si crees que se trata de un error o ya resolviste el motivo,
          envíanos una solicitud de desbloqueo y el administrador la revisará.
        </p>

        @if (resultado(); as r) {
          <app-feedback-message [mensaje]="r.mensaje" [exito]="r.ok" class="block text-left" />
        }

        <form class="space-y-4 text-left" (ngSubmit)="enviar()">
          <div>
            <label class="label" for="correo">Correo de la cuenta (opcional si ya iniciaste sesión)</label>
            <input id="correo" type="email" class="input" [(ngModel)]="correo" name="correo"
                   placeholder="nombre@correo.com" autocomplete="email" />
          </div>
          <div>
            <label class="label" for="motivo">Motivo de la solicitud <span class="text-danger-600">*</span></label>
            <textarea id="motivo" class="textarea min-h-32" [(ngModel)]="motivo" name="motivo"
                      maxlength="4000" required minlength="10"
                      placeholder="Cuéntanos por qué debería reactivarse tu cuenta (mínimo 10 caracteres)."></textarea>
            <p class="mt-1 text-xs text-marine-400">{{ motivo.length }}/4000</p>
          </div>
          <button type="submit" class="btn btn-primary w-full" [disabled]="enviando() || motivo.trim().length < 10">
            {{ enviando() ? 'Enviando…' : 'Enviar solicitud de desbloqueo' }}
          </button>
        </form>

        <div class="flex flex-wrap items-center justify-center gap-3 border-t border-surface-100 pt-4">
          <button type="button" class="btn btn-outline btn-sm" (click)="cerrarSesion()">Cerrar sesión</button>
          <a routerLink="/login" class="link text-sm">Ir al inicio de sesión</a>
        </div>
      </div>
    </section>
  `,
})
export class CuentaSuspendidaComponent implements OnInit, OnDestroy {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected motivo = '';
  protected correo = this.route.snapshot.queryParamMap.get('email') ?? this.auth.usuario()?.email ?? '';
  protected readonly enviando = signal(false);
  protected readonly resultado = signal<{ ok: boolean; mensaje: string } | null>(null);
  private timerReactivacion: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    // Si el admin reactiva la cuenta mientras esta pantalla sigue abierta,
    // se detecta el cambio y se devuelve al usuario a su panel por rol.
    this.timerReactivacion = setInterval(async () => {
      if (!this.auth.usuario()) return;
      await this.auth.cargarPerfil();
      if (this.auth.cuentaHabilitada()) {
        if (this.timerReactivacion) clearInterval(this.timerReactivacion);
        await this.router.navigateByUrl(this.panelPorRol());
      }
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.timerReactivacion) clearInterval(this.timerReactivacion);
  }

  private panelPorRol(): string {
    if (this.auth.esAdmin()) return '/admin/dashboard';
    if (this.auth.esDocente()) return '/docente/dashboard';
    return '/estudiante/dashboard';
  }

  protected async enviar(): Promise<void> {
    if (this.motivo.trim().length < 10) return;
    this.enviando.set(true);
    this.resultado.set(null);
    try {
      const { data, error } = await this.supabase.client.rpc('solicitar_desbloqueo', {
        p_motivo: this.motivo.trim(),
        p_email: this.correo.trim() || null,
      });
      if (error) {
        this.resultado.set({ ok: false, mensaje: error.message || 'No se pudo enviar la solicitud.' });
        return;
      }
      this.resultado.set({
        ok: true,
        mensaje: (data as any)?.mensaje ?? 'Solicitud enviada. El administrador la revisará.',
      });
      this.motivo = '';
    } catch (e) {
      this.resultado.set({
        ok: false,
        mensaje: e instanceof Error ? e.message : 'No se pudo enviar la solicitud.',
      });
    } finally {
      this.enviando.set(false);
    }
  }

  protected async cerrarSesion(): Promise<void> {
    await this.auth.cerrarSesion();
    await this.router.navigate(['/login']);
  }
}
