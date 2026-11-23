import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AdminService } from '../../../core/services/admin.service';
import { SupportService, TicketDetalle } from '../../../core/services/support.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { Ticket } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-support',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Soporte" descripcion="Revisa la razón de cada solicitud, responde al usuario y cierra los tickets atendidos." [acciones]="true">
        <div acciones><button type="button" class="btn btn-outline btn-sm" (click)="cargar()">Actualizar</button></div>
      </app-page-header>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="tickets().length === 0"
        tituloVacio="No hay tickets" descripcionVacia="Cuando un usuario envíe una solicitud de soporte, aparecerá aquí."
        (alReintentar)="cargar()">
        <div contenido class="table-wrap">
          <div class="overflow-x-auto"><table class="table">
            <thead><tr><th>Asunto</th><th>Categoría</th><th>Razón</th><th>Prioridad</th><th>Estado</th><th>Creado</th><th></th></tr></thead>
            <tbody>
              @for (t of tickets(); track t.id) {
                <tr>
                  <td class="font-medium text-marine-800">{{ t.asunto }}</td>
                  <td class="text-xs text-marine-500">
                    @if (t.categoria === 'desbloqueo') {
                      <span class="badge badge-warning">Desbloqueo</span>
                    } @else {
                      {{ t.categoria || 'general' }}
                    }
                  </td>
                  <td class="max-w-xs truncate text-xs text-marine-600" [title]="t.descripcion">{{ t.descripcion || '—' }}</td>
                  <td>{{ t.prioridad }}</td>
                  <td><app-status-badge [estado]="t.estado" /></td>
                  <td class="whitespace-nowrap text-xs text-marine-600">{{ t.creado_en | date: 'medium' }}</td>
                  <td><button type="button" class="btn btn-outline btn-sm" (click)="verDetalle(t)">Ver detalle</button></td>
                </tr>
              }
            </tbody>
          </table></div>
        </div>
      </app-data-panel>

      @if (cargandoDetalle()) {
        <div class="card card-body"><p class="text-sm text-marine-500">Cargando detalle…</p></div>
      } @else if (detalle(); as d) {
        <div class="card card-body space-y-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 class="text-lg font-extrabold text-marine-800">{{ d.asunto }}</h2>
              <p class="mt-1 flex flex-wrap items-center gap-2 text-sm text-marine-500">
                <app-status-badge [estado]="d.estado" />
                <span>{{ d.categoria || 'General' }} · {{ d.prioridad }} · {{ d.creado_en | date: 'medium' }}</span>
              </p>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" (click)="cerrarDetalle()">Cerrar panel</button>
          </div>

          <div>
            <p class="label">Razón del usuario</p>
            <p class="whitespace-pre-wrap rounded-xl bg-surface-50 p-4 text-sm leading-relaxed text-marine-700">{{ d.descripcion || 'Sin descripción' }}</p>
          </div>

          @if (d.respuestas.length > 0) {
            <div class="space-y-2">
              <p class="label">Historial de mensajes</p>
              @for (r of d.respuestas; track r.id) {
                <div class="rounded-xl border border-surface-200 p-3 text-sm">
                  <p class="text-xs text-marine-400">{{ r.creado_en | date: 'medium' }}{{ r.es_interna ? ' · Nota interna' : '' }}</p>
                  <p class="mt-1 whitespace-pre-wrap text-marine-700">{{ r.cuerpo }}</p>
                </div>
              }
            </div>
          }

          @if (d.categoria === 'desbloqueo') {
            <div class="rounded-xl border border-gold-300 bg-gold-50 p-3">
              <p class="text-sm font-semibold text-gold-800">Solicitud de desbloqueo de cuenta</p>
              <p class="mt-1 text-xs text-marine-600">Si decides reactivarla, la cuenta vuelve a su panel según su rol (estudiante o docente) y se levanta el bloqueo de acceso.</p>
              <button type="button" class="btn btn-primary btn-sm mt-3" [disabled]="procesando()" (click)="reactivarCuenta(d)">
                {{ procesando() ? 'Procesando…' : 'Reactivar cuenta' }}
              </button>
            </div>
          }

          @if (d.estado !== 'cerrado') {
            <div class="space-y-2 border-t border-surface-200 pt-4">
              <label class="label" for="respuesta-admin">Responder al usuario</label>
              <textarea id="respuesta-admin" class="textarea min-h-24" maxlength="4000"
                placeholder="Explica la corrección o solicita más información…"
                [value]="respuesta()" (input)="respuesta.set($any($event.target).value)" [disabled]="procesando()"></textarea>
              <div class="flex flex-wrap gap-2">
                <button type="button" class="btn btn-gold btn-sm" [disabled]="procesando() || respuesta().trim().length < 3" (click)="responder()">
                  {{ procesando() ? 'Enviando…' : 'Enviar respuesta' }}
                </button>
                <button type="button" class="btn btn-outline btn-sm" [disabled]="procesando()" (click)="cerrarTicket()">
                  {{ procesando() ? 'Procesando…' : 'Cerrar ticket' }}
                </button>
              </div>
            </div>
          } @else {
            <p class="text-sm text-marine-500">Este ticket está cerrado.</p>
          }

          @if (mensaje()) {
            <p class="rounded-lg border p-3 text-sm" role="alert"
              [class.border-success-500/40]="exito()" [class.bg-success-50]="exito()" [class.text-success-600]="exito()"
              [class.border-danger-200]="!exito()" [class.bg-danger-50]="!exito()" [class.text-danger-700]="!exito()">{{ mensaje() }}</p>
          }
        </div>
      }
    </section>
  `,
})
export class SupportComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly support = inject(SupportService);
  private readonly confirm = inject(ConfirmService);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly tickets = signal<Ticket[]>([]);
  protected readonly detalle = signal<TicketDetalle | null>(null);
  protected readonly cargandoDetalle = signal(false);
  protected readonly procesando = signal(false);
  protected readonly respuesta = signal('');
  protected readonly mensaje = signal('');
  protected readonly exito = signal(false);

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.tickets.set(await this.adminService.listarTicketsAdmin(200)); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los tickets.'); }
    finally { this.cargando.set(false); }
  }

  protected async verDetalle(t: Ticket): Promise<void> {
    this.cargandoDetalle.set(true);
    this.respuesta.set('');
    try { this.detalle.set(await this.support.obtenerTicket(t.id)); }
    catch (e) {
      this.detalle.set(null);
      this.exito.set(false);
      this.mensaje.set(e instanceof Error ? e.message : 'No se pudo cargar el detalle del ticket.');
    } finally { this.cargandoDetalle.set(false); }
  }

  protected cerrarDetalle(): void {
    this.detalle.set(null);
    this.mensaje.set('');
  }

  protected async responder(): Promise<void> {
    const d = this.detalle();
    const cuerpo = this.respuesta().trim();
    if (!d || cuerpo.length < 3 || this.procesando()) return;
    this.procesando.set(true);
    const res = await this.support.responder(d.id, cuerpo);
    if (res.ok) {
      this.respuesta.set('');
      await this.verDetalle(d);
      await this.cargar();
    }
    this.procesando.set(false);
    this.exito.set(res.ok);
    this.mensaje.set(res.mensaje);
  }

  protected async cerrarTicket(): Promise<void> {
    const d = this.detalle();
    if (!d || this.procesando()) return;
    this.procesando.set(true);
    const res = await this.support.cerrarTicket(d.id);
    if (res.ok) {
      await this.verDetalle(d);
      await this.cargar();
    }
    this.procesando.set(false);
    this.exito.set(res.ok);
    this.mensaje.set(res.mensaje);
  }

  /** Decide a favor del usuario: reactiva la cuenta desde el propio ticket. */
  protected async reactivarCuenta(d: TicketDetalle): Promise<void> {
    if (!d.usuario_id || this.procesando()) return;
    const ok = await this.confirm.ask({
      title: 'Reactivar cuenta',
      mensaje: '¿Aceptar la solicitud y reactivar la cuenta? El usuario podrá volver a entrar según su rol.',
      textoConfirmar: 'Reactivar cuenta',
      variante: 'primario',
    });
    if (!ok) return;
    this.procesando.set(true);
    const res = await this.adminService.cambiarEstadoCuenta(d.usuario_id, 'activo');
    this.exito.set(res.ok);
    this.mensaje.set(res.ok
      ? 'Cuenta reactivada. El usuario ya puede iniciar sesión y vuelve a su panel según su rol.'
      : res.mensaje);
    if (res.ok) await this.cargar();
    this.procesando.set(false);
  }
}
