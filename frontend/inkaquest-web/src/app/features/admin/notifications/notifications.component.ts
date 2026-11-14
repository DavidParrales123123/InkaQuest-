// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AdminService } from '../../../core/services/admin.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { Notificacion } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

type Segmento = 'todos' | 'estudiantes' | 'docentes' | 'administradores' | 'usuario';
type Pestana = 'enviar' | 'registro';

const SEGMENTOS: Array<{ id: Segmento; etiqueta: string; nota: string }> = [
  { id: 'todos', etiqueta: 'Todos', nota: 'Todos los perfiles activos' },
  { id: 'estudiantes', etiqueta: 'Estudiantes', nota: 'Solo estudiantes activos' },
  { id: 'docentes', etiqueta: 'Docentes', nota: 'Solo docentes activos' },
  { id: 'administradores', etiqueta: 'Administradores', nota: 'Solo administradores activos' },
  { id: 'usuario', etiqueta: 'Un usuario', nota: 'Un perfil por correo' },
];

@Component({
  selector: 'app-admin-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Notificaciones" descripcion="Envía avisos in-app al público que elijas y revisa el histórico. Cada envío queda auditado." [acciones]="true">
        <div acciones class="flex flex-wrap items-center gap-2">
          <button type="button" class="btn btn-outline btn-sm" (click)="cargar()" [disabled]="cargando()">Actualizar</button>
        </div>
      </app-page-header>

      <div class="grid gap-3 sm:grid-cols-3">
        <app-stat-card etiqueta="Emitidas" [valor]="notificaciones().length" tono="brand" detalle="Últimas 200 enviadas" />
        <app-stat-card etiqueta="Sin destinatario" [valor]="sinDestino()" tono="info" detalle="Envíos segmentados globales" />
        <app-stat-card etiqueta="Emitidas hoy" [valor]="hoy()" tono="gold" detalle="Según fecha de creación" />
      </div>

      <div class="flex flex-wrap items-center gap-2 border-b border-surface-200" role="tablist" aria-label="Sección de notificaciones">
        <button type="button" role="tab" [attr.aria-selected]="pestana() === 'enviar'" class="border-b-2 px-4 py-2 text-sm font-semibold transition-colors" [class.border-brand-500]="pestana() === 'enviar'" [class.text-brand-700]="pestana() === 'enviar'" [class.border-transparent]="pestana() !== 'enviar'" [class.text-marine-500]="pestana() !== 'enviar'" (click)="pestana.set('enviar')">Enviar nueva</button>
        <button type="button" role="tab" [attr.aria-selected]="pestana() === 'registro'" class="border-b-2 px-4 py-2 text-sm font-semibold transition-colors" [class.border-brand-500]="pestana() === 'registro'" [class.text-brand-700]="pestana() === 'registro'" [class.border-transparent]="pestana() !== 'registro'" [class.text-marine-500]="pestana() !== 'registro'" (click)="pestana.set('registro')">Registro de envíos</button>
      </div>

      @if (pestana() === 'enviar') {
        <div class="grid gap-6 xl:grid-cols-5">
          <form class="card card-body space-y-4 xl:col-span-3" (submit)="enviar($event)">
            <div>
              <label class="label" for="titulo">Título <span aria-hidden="true" class="text-danger-600">*</span></label>
              <input id="titulo" type="text" class="input" maxlength="200" placeholder="Ej.: Mantenimiento programado del aula virtual" [value]="titulo()" (input)="titulo.set($any($event.target).value)" [disabled]="enviando()" />
              <p class="mt-1 text-xs text-marine-400">{{ titulo().length }}/200</p>
            </div>
            <div>
              <label class="label" for="mensaje">Mensaje <span aria-hidden="true" class="text-danger-600">*</span></label>
              <textarea id="mensaje" class="input min-h-[140px]" maxlength="4000" placeholder="Escribe el aviso completo. Admite saltos de línea." [value]="mensaje()" (input)="mensaje.set($any($event.target).value)" [disabled]="enviando()"></textarea>
              <p class="mt-1 text-xs text-marine-400">{{ mensaje().length }}/4000</p>
            </div>

            <fieldset>
              <legend class="label">Destinatarios</legend>
              <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                @for (s of segmentos; track s.id) {
                  <button type="button" class="rounded-xl border p-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-gold-500" [class.border-brand-500]="segmento() === s.id" [class.bg-brand-50]="segmento() === s.id" [class.ring-1]="segmento() === s.id" [class.ring-brand-500]="segmento() === s.id" [class.border-surface-200]="segmento() !== s.id" [class.bg-white]="segmento() !== s.id" [disabled]="enviando()" (click)="seleccionarSegmento(s.id)">
                    <span class="block text-sm font-bold text-marine-800">{{ s.etiqueta }}</span>
                    <span class="mt-0.5 block text-xs text-marine-500">{{ s.nota }}</span>
                  </button>
                }
              </div>
            </fieldset>

            @if (segmento() === 'usuario') {
              <div>
                <label class="label" for="email">Correo del perfil <span aria-hidden="true" class="text-danger-600">*</span></label>
                <input id="email" type="email" class="input" placeholder="nombre@correo.com" [value]="email()" (input)="email.set($any($event.target).value)" [disabled]="enviando()" aria-describedby="email-nota" />
                <p id="email-nota" class="mt-1 text-xs text-marine-400">Debe existir un perfil registrado con exactamente este correo.</p>
              </div>
            }

            <div class="rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm text-marine-700">
              @if (segmento() === 'usuario') {
                Se validará el correo al enviar. Si no existe, el sistema no creará nada.
              } @else if (contando()) {
                Contando destinatarios…
              } @else {
                <strong>{{ conteo() }}</strong> usuario(s) activo(s) recibirán esta notificación.
              }
            </div>

            @if (resultado(); as r) {
              <p class="rounded-lg border p-3 text-sm" [class.border-success-500/40]="r.ok" [class.bg-success-50]="r.ok" [class.text-success-600]="r.ok" [class.border-danger-200]="!r.ok" [class.bg-danger-50]="!r.ok" [class.text-danger-700]="!r.ok" role="alert">{{ r.mensaje }}</p>
            }

            <div class="flex flex-wrap items-center justify-end gap-2 border-t border-surface-200 pt-4">
              <button type="button" class="btn btn-outline" (click)="limpiarFormulario()" [disabled]="enviando()">Limpiar</button>
              <button type="submit" class="btn btn-gold" [disabled]="enviando() || !formularioValido()">
                @if (enviando()) { Enviando… } @else { Enviar notificación }
              </button>
            </div>
          </form>

          <aside class="space-y-4">
            <div class="card card-body">
              <h2 class="text-sm font-bold uppercase tracking-wide text-marine-500">Notas importantes</h2>
              <ul class="mt-2 list-disc space-y-1.5 pl-5 text-sm text-marine-600">
                <li>Las notificaciones son <strong>in-app</strong>: aparecen en el panel del usuario (campana + página «Notificaciones»).</li>
                <li>Se envían solo a perfiles <strong>activos</strong>. Los suspendidos o pendientes no las reciben.</li>
                <li>Cada envío queda <strong>auditado</strong> con tu usuario. Ver en <a routerLink="/admin/auditoria" class="font-semibold text-brand-600 hover:underline">Auditoría →</a></li>
                <li>El correo del destinatario se valida contra la base de datos en el momento del envío.</li>
              </ul>
            </div>
            <div class="card card-body">
              <h2 class="text-sm font-bold uppercase tracking-wide text-marine-500">Canales</h2>
              <p class="mt-2 text-sm text-marine-600">Hoy el envío es in-app. Correo, push y SMS requieren infraestructura de entrega propia; cuando existan, este formulario se ampliará sin cambiar tu trabajo.</p>
            </div>
          </aside>
        </div>
      }

      @if (pestana() === 'registro') {
        <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="notificaciones().length === 0"
          tituloVacio="Aún no hay notificaciones emitidas"
          descripcionVacia="Cuando envíes la primera desde la pestaña «Enviar nueva», aparecerá aquí."
          (alReintentar)="cargar()">
          <div contenido>
            <p class="mb-2 text-xs text-marine-400">Mostrando las últimas {{ notificaciones().length }} notificaciones.</p>
            <div class="table-wrap overflow-x-auto rounded-xl border border-surface-200">
              <table class="table">
                <thead>
                  <tr><th>Fecha</th><th>Título</th><th>Canal</th><th>Destino</th></tr>
                </thead>
                <tbody>
                  @for (n of notificaciones(); track n.id) {
                    <tr>
                      <td class="whitespace-nowrap text-xs text-marine-600">{{ n.creado_en | date: 'medium' }}</td>
                      <td class="font-medium text-marine-800">{{ n.titulo }}</td>
                      <td><span class="badge badge-neutral">{{ n.canal }}</span></td>
                      <td class="text-xs text-marine-500">{{ n.destinatario_id ? 'Individual (' + n.destinatario_id.slice(0, 8) + '…)' : 'Segmentada' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </app-data-panel>
      }
    </section>
  `,
})
export class AdminNotificationsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly confirm = inject(ConfirmService);

  protected readonly segmentos = SEGMENTOS;
  protected readonly pestana = signal<Pestana>('enviar');
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly notificaciones = signal<Notificacion[]>([]);

  protected readonly titulo = signal('');
  protected readonly mensaje = signal('');
  protected readonly segmento = signal<Segmento>('todos');
  protected readonly email = signal('');
  protected readonly enviando = signal(false);
  protected readonly contando = signal(false);
  protected readonly conteo = signal(0);
  protected readonly resultado = signal<{ ok: boolean; mensaje: string } | null>(null);

  protected readonly formularioValido = computed(() =>
    this.titulo().trim().length >= 3
    && this.mensaje().trim().length >= 10
    && (this.segmento() !== 'usuario' || this.email().trim().length >= 5));

  protected readonly sinDestino = computed(() => this.notificaciones().filter((n) => !n.destinatario_id).length);
  protected readonly hoy = computed(() => {
    const inicio = new Date(); inicio.setHours(0, 0, 0, 0);
    return this.notificaciones().filter((n) => new Date(n.creado_en) >= inicio).length;
  });

  ngOnInit(): void { void this.cargar(); void this.refrescarConteo('todos'); }

  protected async seleccionarSegmento(s: Segmento): Promise<void> {
    this.segmento.set(s);
    if (s !== 'usuario') { await this.refrescarConteo(s); }
  }

  private async refrescarConteo(s: Exclude<Segmento, 'usuario'>): Promise<void> {
    this.contando.set(true);
    try { this.conteo.set(await this.adminService.contarDestinatariosNotificacion(s)); }
    finally { this.contando.set(false); }
  }

  protected async enviar(ev: Event): Promise<void> {
    ev.preventDefault();
    if (!this.formularioValido() || this.enviando()) return;
    const detalle = this.segmento() === 'usuario'
      ? `Se enviará al perfil ${this.email().trim()}.`
      : `Se enviará a ${this.conteo()} usuario(s) activos (${SEGMENTOS.find((s) => s.id === this.segmento())?.etiqueta}).`;
    const confirmar = await this.confirm.ask({
      title: 'Enviar notificación',
      mensaje: `${detalle}\n\nEsta acción no se puede deshacer.`,
      textoConfirmar: 'Enviar notificación',
      variante: 'primario',
    });
    if (!confirmar) return;

    this.enviando.set(true);
    this.resultado.set(null);
    const res = await this.adminService.enviarNotificacionAdmin({
      titulo: this.titulo().trim(),
      mensaje: this.mensaje().trim(),
      segmento: this.segmento(),
      email: this.segmento() === 'usuario' ? this.email().trim() : undefined,
    });
    this.resultado.set({ ok: res.ok, mensaje: res.mensaje });
    this.enviando.set(false);
    if (res.ok) {
      this.limpiarFormulario(false);
      await this.cargar();
    }
  }

  protected limpiarFormulario(limpiarResultado = true): void {
    this.titulo.set(''); this.mensaje.set(''); this.email.set('');
    if (limpiarResultado) this.resultado.set(null);
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.notificaciones.set(await this.adminService.listarNotificacionesAdmin()); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el registro de notificaciones.'); }
    finally { this.cargando.set(false); }
  }
}
