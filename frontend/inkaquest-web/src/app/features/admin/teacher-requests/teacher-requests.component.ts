import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AdminService } from '../../../core/services/admin.service';
import { EstadoSolicitudDocente, SolicitudDocente } from '../../../core/models/domain.models';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-teacher-requests',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ButtonComponent, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Solicitudes docentes" descripcion="Revisa y gestiona las solicitudes de acceso docente enviadas por estudiantes." [acciones]="true">
        <div acciones class="flex flex-wrap items-center gap-2">
          <select class="select min-w-[220px]" [value]="filtro()" (change)="cambiarFiltro($event)">
            <option value="pendientes">Pendientes / en revisión</option>
            <option value="todas">Todas</option>
            <option value="aprobada">Aprobadas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
          <app-button variante="contorno" tamano="sm" (alPulsar)="cargar()">Actualizar</app-button>
        </div>
      </app-page-header>
      @if (mensaje()) { <p class="text-sm" [class.text-success-600]="exito()" [class.text-danger-600]="!exito()">{{ mensaje() }}</p> }
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="solicitudes().length === 0" tituloVacio="No hay solicitudes" descripcionVacia="No se encontraron solicitudes con el filtro seleccionado. Si un usuario recién se registró como docente, debe haber iniciado sesión para que la solicitud se envíe." (alReintentar)="cargar()">
        <div contenido class="space-y-4">
          @for (s of solicitudes(); track s.id) {
            <article class="card card-body">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div class="flex flex-wrap items-center gap-2"><h2 class="font-semibold text-marine-800">Solicitud {{ s.id.slice(0,8) }}…</h2><app-status-badge [estado]="s.estado" /></div>
                  <p class="mt-1 text-sm text-marine-600"><strong>Usuario:</strong> <span class="font-mono text-xs">{{ s.usuario_id }}</span></p>
                  <p class="mt-1 text-sm text-marine-600"><strong>Institución:</strong> {{ s.institucion || '-' }} · <strong>Especialidad:</strong> {{ s.especialidad || '-' }}</p>
                  <p class="mt-1 text-sm text-marine-600"><strong>Motivo:</strong> {{ s.motivo }}</p>
                  @if (s.motivo_revision) { <p class="mt-1 text-sm text-marine-600"><strong>Revisión:</strong> {{ s.motivo_revision }}</p> }
                  <p class="mt-1 text-xs text-marine-400">Creada: {{ s.creado_en | date: 'medium' }}</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  @if (s.estado === 'pendiente' || s.estado === 'en_revision') {
                    <app-button variante="primario" tamano="sm" [deshabilitado]="procesando() === s.id" (alPulsar)="aprobar(s.id)">Aprobar</app-button>
                    <app-button variante="contorno" tamano="sm" [deshabilitado]="procesando() === s.id" (alPulsar)="rechazar(s.id)">Rechazar</app-button>
                  }
                </div>
              </div>
              <p class="mt-3 text-xs text-marine-400">La aprobación y el rechazo se ejecutan en el backend y quedan registrados en el registro de acciones de auditoría (<code>/admin/auditoria</code>).</p>
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

  ngOnInit(): void { void this.cargar(); }

  protected cambiarFiltro(event: Event): void {
    const v = (event.target as HTMLSelectElement).value as 'pendientes' | 'todas' | EstadoSolicitudDocente;
    this.filtro.set(v);
    void this.cargar();
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
  protected async aprobar(id: string): Promise<void> {
    const motivo = typeof window !== 'undefined'
      ? window.prompt('Motivo de la aprobación (se registra en auditoría):', 'Solicitud aprobada tras revisión del administrador.')
      : 'Solicitud aprobada tras revisión del administrador.';
    if (motivo === null) return; // cancelado
    this.procesando.set(id);
    const r = await this.adminService.aprobarSolicitud(id, motivo ?? undefined);
    this.mensaje.set(r.mensaje);
    this.exito.set(r.ok);
    this.procesando.set(null);
    if (r.ok) await this.cargar();
  }
  protected async rechazar(id: string): Promise<void> {
    const motivo = typeof window !== 'undefined'
      ? window.prompt('Indica el motivo del rechazo:', 'Solicitud rechazada por el administrador.')
      : 'Solicitud rechazada por el administrador.';
    if (motivo === null) return; // cancelado
    this.procesando.set(id);
    const r = await this.adminService.rechazarSolicitud(id, motivo);
    this.mensaje.set(r.mensaje);
    this.exito.set(r.ok);
    this.procesando.set(null);
    if (r.ok) await this.cargar();
  }
}
