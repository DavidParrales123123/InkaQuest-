import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AdminService } from '../../../core/services/admin.service';
import { EstadoSolicitudDocente, SolicitudDocente } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

const MOTIVO_MINIMO = 10;

const MOTIVOS_SUGERIDOS = [
  { etiqueta: 'Documentación verificada', texto: 'Documentación del solicitante verificada y conforme.' },
  { etiqueta: 'Perfil académico válido', texto: 'Perfil académico y experiencia docente válidos.' },
  { etiqueta: 'Cumple requisitos', texto: 'Cumple todos los requisitos publicados para ser docente.' },
  { etiqueta: 'Falta información', texto: 'Falta información relevante del solicitante (especialidad o contacto).' },
];

@Component({
  selector: 'app-admin-teacher-requests',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ButtonComponent, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Solicitudes docentes" descripcion="Revisa y decide las solicitudes de acceso docente. Cada decisión queda auditada." [acciones]="true">
        <div acciones class="flex flex-wrap items-center gap-2">
          <select class="select min-w-[220px]" [value]="filtro()" (change)="cambiarFiltro($event)" aria-label="Filtrar solicitudes">
            <option value="pendientes">Pendientes / en revisión</option>
            <option value="todas">Todas</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
          <app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button>
        </div>
      </app-page-header>

      @if (mensaje()) {
        <p class="rounded-lg border p-3 text-sm" [class.border-success-500/40]="exito()" [class.bg-success-50]="exito()" [class.text-success-600]="exito()" [class.border-danger-200]="!exito()" [class.bg-danger-50]="!exito()" [class.text-danger-700]="!exito()" role="status">{{ mensaje() }}</p>
      }

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="solicitudes().length === 0" tituloVacio="No hay solicitudes" descripcionVacia="No se encontraron solicitudes con el filtro seleccionado." (alReintentar)="cargar()">
        <div contenido class="space-y-4">
          @for (s of solicitudes(); track s.id) {
            <article class="card card-body border-l-4" [class.border-l-gold-400]="s.estado === 'pendiente' || s.estado === 'en_revision'" [class.border-l-success-500]="s.estado === 'aprobada'" [class.border-l-danger-500]="s.estado === 'rechazada'">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="min-w-0 flex-1 space-y-1.5">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="font-semibold text-marine-800">Solicitud de docente</h2>
                    <app-status-badge [estado]="s.estado" />
                  </div>
                  <p class="text-sm text-marine-600"><strong>Institución:</strong> {{ s.institucion || 'Sin institución' }} · <strong>Especialidad:</strong> {{ s.especialidad || 'Sin especialidad' }}</p>
                  <p class="text-sm leading-relaxed text-marine-700"><strong>Motivo del solicitante:</strong><br /><span class="text-marine-600">{{ s.motivo }}</span></p>
                  @if (s.motivo_revision) { <p class="text-sm text-marine-600"><strong>Revisión:</strong> {{ s.motivo_revision }}</p> }
                  <p class="text-xs text-marine-400">Recibida: {{ s.creado_en | date: 'medium' }} · ID {{ s.id.slice(0, 8) }}…</p>
                </div>

                @if (s.estado === 'pendiente' || s.estado === 'en_revision') {
                  <form class="w-full max-w-md space-y-2 rounded-xl border border-surface-200 bg-surface-50/60 p-3" (submit)="decidir(s.id, 'aprobar', $event)">
                    <label class="text-xs font-bold uppercase tracking-wide text-marine-500" [attr.for]="'motivo-' + s.id">Motivo de la decisión <span class="text-danger-600">*</span></label>
                    <textarea [id]="'motivo-' + s.id" class="input min-h-[84px] text-sm" placeholder="Escribe al menos 10 caracteres. Quedará registrado en auditoría…" maxlength="2000" [value]="motivoDe(s.id)" (input)="setMotivo(s.id, $event)" [disabled]="procesando() === s.id" required></textarea>
                    <p class="text-right text-[0.7rem]" [class.text-danger-600]="motivoDe(s.id).trim().length < 10" [class.text-marine-400]="motivoDe(s.id).trim().length >= 10">
                      {{ motivoDe(s.id).trim().length }}/2000 · mín. 10 caracteres
                    </p>
                    <div class="flex flex-wrap gap-1.5">
                      @for (m of motivosSugeridos; track m.etiqueta) {
                        <button type="button" class="rounded-full border border-surface-200 bg-white px-2.5 py-1 text-[0.7rem] font-semibold text-marine-600 transition-colors hover:border-brand-300 hover:text-brand-700" (click)="setMotivoTexto(s.id, m.texto)" [disabled]="procesando() === s.id">{{ m.etiqueta }}</button>
                      }
                    </div>
                    <div class="flex flex-wrap items-center justify-end gap-2 pt-1">
                      <button type="button" class="btn btn-outline btn-sm" [disabled]="procesando() === s.id || motivoDe(s.id).trim().length < 10" (click)="decidir(s.id, 'rechazar')">
                        {{ procesando() === s.id ? 'Procesando…' : 'Rechazar' }}
                      </button>
                      <button type="submit" class="btn btn-gold btn-sm" [disabled]="procesando() === s.id || motivoDe(s.id).trim().length < 10">
                        {{ procesando() === s.id ? 'Procesando…' : 'Aprobar solicitud' }}
                      </button>
                    </div>
                  </form>
                }
              </div>
            </article>
          }
        </div>
      </app-data-panel>
    </section>
  `,
})
export class TeacherRequestsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly solicitudes = signal<SolicitudDocente[]>([]);
  protected readonly procesando = signal<string | null>(null);
  protected readonly mensaje = signal('');
  protected readonly exito = signal(false);
  protected readonly filtro = signal<'pendientes' | 'todas' | EstadoSolicitudDocente>('pendientes');
  protected readonly motivos = signal<Record<string, string>>({});
  protected readonly motivosSugeridos = MOTIVOS_SUGERIDOS;
  protected readonly motivoMinimo = MOTIVO_MINIMO;

  ngOnInit(): void { void this.cargar(); }

  protected cambiarFiltro(event: Event): void {
    const v = (event.target as HTMLSelectElement).value as 'pendientes' | 'todas' | EstadoSolicitudDocente;
    this.filtro.set(v);
    void this.cargar();
  }

  protected motivoDe(id: string): string { return this.motivos()[id] ?? ''; }
  protected setMotivo(id: string, event: Event): void {
    this.setMotivoTexto(id, (event.target as HTMLTextAreaElement).value);
  }
  protected setMotivoTexto(id: string, texto: string): void {
    this.motivos.set({ ...this.motivos(), [id]: texto });
  }

  private estadosFiltro(): EstadoSolicitudDocente[] {
    const f = this.filtro();
    if (f === 'pendientes') return ['pendiente', 'en_revision'];
    if (f === 'todas') return ['pendiente', 'en_revision', 'aprobada', 'rechazada'];
    return [f];
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.solicitudes.set(await this.adminService.listarSolicitudesDocente(this.estadosFiltro())); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las solicitudes. Verifica permisos/RLS de administrador.'); }
    finally { this.cargando.set(false); }
  }

  /** Decide sobre la solicitud (aprobar o rechazar) con el motivo del formulario. */
  protected async decidir(id: string, accion: 'aprobar' | 'rechazar', evento?: Event): Promise<void> {
    evento?.preventDefault();
    if (this.procesando()) return;
    const motivo = this.motivoDe(id).trim();
    if (motivo.length < MOTIVO_MINIMO) {
      this.exito.set(false);
      this.mensaje.set(`El motivo debe tener al menos ${MOTIVO_MINIMO} caracteres.`);
      return;
    }
    this.procesando.set(id);
    this.mensaje.set('');
    const r = accion === 'aprobar'
      ? await this.adminService.aprobarSolicitud(id, motivo)
      : await this.adminService.rechazarSolicitud(id, motivo);
    this.exito.set(r.ok);
    this.mensaje.set(r.mensaje);
    this.procesando.set(null);
    if (r.ok) {
      const { [id]: _eliminado, ...restantes } = this.motivos();
      this.motivos.set(restantes);
      await this.cargar();
    }
  }
}
