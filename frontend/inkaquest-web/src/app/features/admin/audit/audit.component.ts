// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { AdminService } from '../../../core/services/admin.service';
import { AuditoriaAcceso, RegistroAccion } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

type Pestana = 'acciones' | 'accesos';
type ResultadoFiltro = 'todos' | 'exito' | 'fallo';

@Component({
  selector: 'app-admin-audit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Auditoría" descripcion="Registro de acciones administrativas y accesos. Las entradas son de solo lectura: no se pueden crear ni borrar desde el frontend." [acciones]="true">
        <div acciones class="flex flex-wrap items-center gap-2">
          <button type="button" class="btn btn-outline btn-sm" (click)="cargar()" [disabled]="cargando()">Actualizar</button>
        </div>
      </app-page-header>

      <div class="card card-body border-info-500/30 bg-info-50" role="note">
        <h2 class="text-sm font-semibold text-marine-800">¿De dónde vienen estos datos?</h2>
        <ul class="mt-1 list-disc space-y-1 pl-5 text-sm text-marine-700">
          <li><strong>Acciones:</strong> las escribe el backend (Spring) dentro de la misma transacción, vía <code>AuditoriaService</code>. Se generan al aprobar/rechazar una solicitud de docente o al cambiar el estado de una cuenta.</li>
          <li><strong>Accesos:</strong> los gestionaría el sistema de autenticación (Supabase Auth). Hoy no hay ningún componente que escriba en esta tabla; revísalos en el panel de Supabase → Authentication → Logs.</li>
          <li>Estas dos tablas solo permiten <code>SELECT</code> a administradores; nadie puede editarlas ni borrarlas desde la aplicación.</li>
        </ul>
      </div>

      @if (error()) {
        <p class="rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700" role="alert">{{ error() }}</p>
      }

      <div class="flex flex-wrap items-center gap-2 border-b border-surface-200" role="tablist" aria-label="Tipo de registro">
        <button type="button" role="tab" [attr.aria-selected]="pestana() === 'acciones'" class="border-b-2 px-4 py-2 text-sm font-semibold transition-colors" [class.border-brand-500]="pestana() === 'acciones'" [class.text-brand-700]="pestana() === 'acciones'" [class.border-transparent]="pestana() !== 'acciones'" [class.text-marine-500]="pestana() !== 'acciones'" (click)="seleccionarPestana('acciones')">Acciones ({{ acciones().length }})</button>
        <button type="button" role="tab" [attr.aria-selected]="pestana() === 'accesos'" class="border-b-2 px-4 py-2 text-sm font-semibold transition-colors" [class.border-brand-500]="pestana() === 'accesos'" [class.text-brand-700]="pestana() === 'accesos'" [class.border-transparent]="pestana() !== 'accesos'" [class.text-marine-500]="pestana() !== 'accesos'" (click)="seleccionarPestana('accesos')">Accesos ({{ accesos().length }})</button>
      </div>

      @if (pestana() === 'acciones') {
        <div class="flex flex-wrap items-center gap-2">
          <input type="search" class="input min-w-[220px]" placeholder="Buscar por evento, entidad, acción, correlación…" [value]="busqueda()" (input)="cambiarBusqueda($event)" aria-label="Buscar registros de acciones" />
          <select class="select min-w-[160px]" [value]="accion()" (change)="cambiarAccion($event)" aria-label="Filtrar por acción">
            <option value="todas">Todas las acciones</option>
            @for (a of accionesDisponibles(); track a) { <option [value]="a">{{ a }}</option> }
          </select>
          <select class="select min-w-[140px]" [value]="resultado()" (change)="cambiarResultado($event)" aria-label="Filtrar por resultado">
            <option value="todos">Todos</option>
            <option value="exito">Solo éxitos</option>
            <option value="fallo">Solo fallos</option>
          </select>
          <button type="button" class="btn btn-outline btn-sm" (click)="limpiarFiltros()">Limpiar filtros</button>
        </div>

        <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="accionesFiltradas().length === 0"
          tituloVacio="Aún no hay acciones registradas"
          descripcionVacia="Las solicitudes aprobadas/rechazadas por el administrador y los cambios de estado de cuenta se registran aquí automáticamente. Prueba a aprobar una solicitud en /admin/solicitudes y vuelve a esta página."
          (alReintentar)="cargar()">
          <div contenido class="space-y-3">
            <p class="text-xs text-marine-400">Mostrando {{ accionesPagina().length }} de {{ accionesFiltradas().length }} registros.</p>
            <div class="table-wrap overflow-x-auto rounded-xl border border-surface-200">
              <table class="table">
                <thead>
                  <tr><th>Fecha</th><th>Acción</th><th>Entidad</th><th>Resultado</th><th>Duración</th><th>Correlación</th></tr>
                </thead>
                <tbody>
                  @for (a of accionesPagina(); track a.id) {
                    <tr>
                      <td class="whitespace-nowrap text-xs text-marine-600">{{ a.creado_en | date: 'medium' }}</td>
                      <td><span class="badge badge-neutral">{{ a.accion }}</span></td>
                      <td class="text-sm"><span class="font-medium text-marine-800">{{ a.entidad_tipo || '—' }}</span>{{ a.entidad_id ? ' · ' + a.entidad_id.slice(0, 8) + '…' : '' }}</td>
                      <td>
                        @if (a.exito) { <span class="badge badge-success">Éxito</span> } @else { <span class="badge badge-danger" title="{{ a.mensaje_error || 'Error' }}">Fallo</span> }
                      </td>
                      <td class="text-xs tabular-nums text-marine-600">{{ a.duracion_ms != null ? a.duracion_ms + ' ms' : '—' }}</td>
                      <td class="font-mono text-xs text-marine-500" title="{{ a.correlation_id || '' }}">{{ a.correlation_id ? a.correlation_id.slice(0, 13) + '…' : '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            @if (totalPaginas() > 1) {
              <div class="flex flex-wrap items-center justify-between gap-2 text-sm text-marine-600">
                <span>Página {{ pagina() }} de {{ totalPaginas() }}</span>
                <div class="flex gap-2">
                  <button type="button" class="btn btn-outline btn-sm" (click)="paginaAnterior()" [disabled]="pagina() === 1">Anterior</button>
                  <button type="button" class="btn btn-outline btn-sm" (click)="paginaSiguiente()" [disabled]="pagina() >= totalPaginas()">Siguiente</button>
                </div>
              </div>
            }
          </div>
        </app-data-panel>
      }

      @if (pestana() === 'accesos') {
        <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="accesos().length === 0"
          tituloVacio="Aún no hay accesos registrados"
          descripcionVacia="El sistema de autenticación (Supabase Auth/GoTrue) no escribe en esta tabla. Para auditar inicios de sesión y cierres, usa el panel de tu proyecto Supabase → Authentication → Logs, o configura un webhook de eventos auth (signup/login/logout) hacia una API de registro."
          (alReintentar)="cargar()">
          <div contenido>
            <div class="table-wrap overflow-x-auto rounded-xl border border-surface-200">
              <table class="table">
                <thead><tr><th>Fecha</th><th>Evento</th><th>Email</th><th>IP</th><th>Resultado</th></tr></thead>
                <tbody>
                  @for (a of accesos(); track a.id) {
                    <tr>
                      <td class="whitespace-nowrap text-xs text-marine-600">{{ a.creado_en | date: 'medium' }}</td>
                      <td><span class="badge badge-neutral">{{ a.evento || '—' }}</span></td>
                      <td class="text-sm text-marine-800">{{ a.email || '—' }}</td>
                      <td class="font-mono text-xs text-marine-600">{{ a.ip || '—' }}</td>
                      <td>
                        @if (a.exito) { <span class="badge badge-success">Éxito</span> } @else { <span class="badge badge-danger">Fallo</span> }
                      </td>
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
export class AuditComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly acciones = signal<RegistroAccion[]>([]);
  protected readonly accesos = signal<AuditoriaAcceso[]>([]);

  protected readonly pestana = signal<Pestana>('acciones');
  protected readonly busqueda = signal('');
  protected readonly accion = signal<string>('todas');
  protected readonly resultado = signal<ResultadoFiltro>('todos');
  protected readonly pagina = signal(1);
  protected readonly porPagina = 15;

  protected readonly accionesDisponibles = computed<string[]>(() =>
    Array.from(new Set(this.acciones().map((a) => a.accion).filter(Boolean))).sort());

  protected readonly accionesFiltradas = computed<RegistroAccion[]>(() => {
    const q = this.busqueda().trim().toLowerCase();
    const accion = this.accion();
    const resultado = this.resultado();
    return this.acciones().filter((a) => {
      if (accion !== 'todas' && (a.accion ?? '') !== accion) return false;
      if (resultado === 'exito' && !a.exito) return false;
      if (resultado === 'fallo' && a.exito) return false;
      if (!q) return true;
      return [a.codigo_evento, a.entidad_tipo, a.accion, a.correlation_id, a.agente_usuario, a.ip, a.ruta]
        .some((v) => String(v ?? '').toLowerCase().includes(q));
    });
  });

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.accionesFiltradas().length / this.porPagina)));

  protected readonly accionesPagina = computed<RegistroAccion[]>(() => {
    const pagina = Math.min(this.pagina(), this.totalPaginas());
    const inicio = (pagina - 1) * this.porPagina;
    return this.accionesFiltradas().slice(inicio, inicio + this.porPagina);
  });

  ngOnInit(): void { void this.cargar(); }

  protected seleccionarPestana(p: Pestana): void { this.pestana.set(p); }
  protected cambiarBusqueda(event: Event): void { this.busqueda.set((event.target as HTMLInputElement).value); this.pagina.set(1); }
  protected cambiarAccion(event: Event): void { this.accion.set((event.target as HTMLSelectElement).value); this.pagina.set(1); }
  protected cambiarResultado(event: Event): void { this.resultado.set((event.target as HTMLSelectElement).value as ResultadoFiltro); this.pagina.set(1); }
  protected limpiarFiltros(): void { this.busqueda.set(''); this.accion.set('todas'); this.resultado.set('todos'); this.pagina.set(1); }
  protected paginaAnterior(): void { this.pagina.set(Math.max(1, this.pagina() - 1)); }
  protected paginaSiguiente(): void { this.pagina.set(Math.min(this.totalPaginas(), this.pagina() + 1)); }

  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const [a, b] = await Promise.all([this.adminService.listarAuditoria(100), this.adminService.listarAccesos(100)]);
      this.acciones.set(a); this.accesos.set(b);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar la auditoría.');
    } finally {
      this.cargando.set(false);
    }
  }
}
