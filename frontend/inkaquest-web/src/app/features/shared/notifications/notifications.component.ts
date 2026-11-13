// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AuthService } from '../../../core/services/auth.service';
import { NotificacionCompleta, NotificationService } from '../../../core/services/notification.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

/**
 * Centro de notificaciones del usuario.
 *
 * <p>Muestra las notificaciones dirigidas al usuario (contenido + estado de
 * lectura desde {@code notificacion_destinatario}). Las notificaciones
 * generales sin destinatario visible por RLS se omiten por seguridad.</p>
 */
@Component({
  selector: 'app-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ButtonComponent, DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-6">
      <app-page-header
        titulo="Notificaciones"
        descripcion="Avisos y actualizaciones de tu cuenta, cursos y actividad en la plataforma."
        [acciones]="true"
      >
        <div acciones class="flex items-center gap-2">
          <app-button
            variante="contorno"
            tamano="sm"
            [deshabilitado]="cargando() || noLeidas() === 0"
            (alPulsar)="marcarTodas()"
          >
            Marcar todas como leidas
          </app-button>
          <app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button>
        </div>
      </app-page-header>

      <div class="grid gap-4 sm:grid-cols-2">
        <app-stat-card etiqueta="Total" [valor]="notificaciones().length" detalle="Notificaciones visibles" [icono]="true" tono="brand">
          <span icono>
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" stroke-linejoin="round" />
              <path d="M10.3 20a2 2 0 0 0 3.4 0" stroke-linecap="round" />
            </svg>
          </span>
        </app-stat-card>
        <app-stat-card etiqueta="Sin leer" [valor]="noLeidas()" detalle="Pendientes de revision" [icono]="true" tono="gold">
          <span icono>
            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4l2.5 2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </app-stat-card>
      </div>

      <app-data-panel
        [cargando]="cargando()"
        [error]="error()"
        [vacio]="notificaciones().length === 0"
        tituloVacio="No tienes notificaciones"
        descripcionVacia="Cuando haya actividad relevante en tu cuenta o cursos, los avisos apareceran aqui."
        (alReintentar)="cargar()"
      >
        <div contenido class="space-y-3">
          @for (n of notificaciones(); track n.id) {
            <article
              class="card card-body flex flex-col gap-2 border-l-4 sm:flex-row sm:items-start sm:justify-between"
              [class.border-l-brand-500]="!n.leida_en"
              [class.border-l-surface-200]="!!n.leida_en"
            >
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-base font-semibold text-marine-800">{{ n.titulo }}</h3>
                  @if (!n.leida_en) {
                    <span class="badge badge-gold">Nueva</span>
                  }
                  <span class="badge badge-neutral">{{ n.canal }}</span>
                </div>
                <p class="mt-1 text-sm text-marine-600 whitespace-pre-line">{{ n.mensaje }}</p>
                <p class="mt-2 text-xs text-marine-400">
                  {{ (n.enviada_en || n.creado_en) | date: 'medium' }}
                  @if (n.leida_en) {
                    · Leída {{ n.leida_en | date: 'short' }}
                  }
                </p>
              </div>
              @if (!n.leida_en) {
                <div class="shrink-0">
                  <app-button variante="contorno" tamano="sm" (alPulsar)="marcarLeida(n)">Marcar leída</app-button>
                </div>
              }
            </article>
          }
          <p class="text-xs text-marine-400">
            Nota: las notificaciones generales sin destinatario individual visible por politicas de acceso pueden no mostrarse aqui.
          </p>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class NotificationsComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly notificaciones = signal<NotificacionCompleta[]>([]);

  protected readonly noLeidas = computed(() => this.notificaciones().filter((n) => !n.leida_en).length);

  ngOnInit(): void {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    const usuario = this.auth.usuario();
    if (!usuario) {
      this.error.set('Debes iniciar sesión para ver tus notificaciones.');
      this.cargando.set(false);
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.notificaciones.set(await this.notifications.listarNotificaciones(usuario.id));
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las notificaciones.');
    } finally {
      this.cargando.set(false);
    }
  }

  protected async marcarLeida(n: NotificacionCompleta): Promise<void> {
    if (!n.destinatario_id) return;
    const res = await this.notifications.marcarLeida(n.destinatario_id);
    if (res.ok) {
      await this.cargar();
    }
  }

  protected async marcarTodas(): Promise<void> {
    const usuario = this.auth.usuario();
    if (!usuario) return;
    const res = await this.notifications.marcarTodasLeidas(usuario.id);
    if (res.ok) {
      await this.cargar();
    }
  }
}
