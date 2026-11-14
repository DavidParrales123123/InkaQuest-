import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AdminService } from '../../../core/services/admin.service';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-admin-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Panel de administración" descripcion="Visión general ejecutiva del estado de la plataforma." [acciones]="true">
        <div acciones class="flex items-center gap-2 text-xs text-marine-400" aria-hidden="false">
          <span class="hidden sm:inline">Hoy es</span><span class="font-semibold text-marine-600">{{ hoy | date: 'longDate' }}</span>
        </div>
      </app-page-header>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <app-stat-card etiqueta="Usuarios" [valor]="usuarios()" [icono]="true" tono="brand" detalle="Perfiles registrados"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Docentes activos" [valor]="docentesActivos()" [icono]="true" tono="gold" detalle="Con cuenta al día"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Solicitudes pendientes" [valor]="solicitudes()" [icono]="true" tono="gold" detalle="Requieren tu revisión"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="0.5"/><circle cx="3.5" cy="12" r="0.5"/><circle cx="3.5" cy="18" r="0.5"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Cursos publicados" [valor]="cursosPublicados()" [icono]="true" tono="info" detalle="Visibles en catálogo"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Tickets abiertos" [valor]="ticketsAbiertos()" [icono]="true" tono="danger" detalle="Sin resolver en soporte"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M10 12h4M10 16h4"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Registros de auditoría" [valor]="auditoria()" [icono]="true" tono="surface" detalle="Acciones administrativas"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M10 12h4M10 16h4"/></svg></span></app-stat-card>
      </div>

      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="false" (alReintentar)="cargar()">
        <div contenido class="space-y-4">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-base font-bold text-marine-800">Accesos rápidos</h2>
            <span class="text-xs text-marine-400">Ir directo a la sección de trabajo</span>
          </div>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a routerLink="/admin/usuarios" class="card card-body card-hover group">
              <span class="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/></svg></span>
              <h3 class="mt-3 font-semibold text-marine-800">Gestionar usuarios</h3>
              <p class="mt-0.5 text-sm text-marine-500">Suspender, reactivar y administrar cuentas.</p>
            </a>
            <a routerLink="/admin/solicitudes" class="card card-body card-hover group">
              <span class="flex size-10 items-center justify-center rounded-xl bg-gold-50 text-gold-700 transition-colors group-hover:bg-gold-100"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M10 15l2 2 4-4"/></svg></span>
              <h3 class="mt-3 font-semibold text-marine-800">Solicitudes docentes</h3>
              <p class="mt-0.5 text-sm text-marine-500">Aprobar o rechazar acceso de docente, con auditoría.</p>
            </a>
            <a routerLink="/admin/cursos" class="card card-body card-hover group">
              <span class="flex size-10 items-center justify-center rounded-xl bg-info-50 text-info-500 transition-colors group-hover:bg-surface-100"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span>
              <h3 class="mt-3 font-semibold text-marine-800">Cursos</h3>
              <p class="mt-0.5 text-sm text-marine-500">Catálogo, publicación y asignación de docentes.</p>
            </a>
            <a routerLink="/admin/notificaciones" class="card card-body card-hover group">
              <span class="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/></svg></span>
              <h3 class="mt-3 font-semibold text-marine-800">Enviar notificación</h3>
              <p class="mt-0.5 text-sm text-marine-500">Avisa a estudiantes, docentes o todos, auditado.</p>
            </a>
            <a routerLink="/admin/auditoria" class="card card-body card-hover group">
              <span class="flex size-10 items-center justify-center rounded-xl bg-surface-100 text-marine-600 transition-colors group-hover:bg-surface-200"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><circle cx="12" cy="13" r="3"/></svg></span>
              <h3 class="mt-3 font-semibold text-marine-800">Auditoría</h3>
              <p class="mt-0.5 text-sm text-marine-500">Trazabilidad inmutable de cada acción admin.</p>
            </a>
            <a routerLink="/admin/reportes" class="card card-body card-hover group">
              <span class="flex size-10 items-center justify-center rounded-xl bg-info-50 text-info-500 transition-colors group-hover:bg-surface-100"><svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 14 4-4 4 4 6-6"/></svg></span>
              <h3 class="mt-3 font-semibold text-marine-800">Reportes</h3>
              <p class="mt-0.5 text-sm text-marine-500">Indicadores de matrícula, progreso y soporte.</p>
            </a>
          </div>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly usuarios = signal(0);
  protected readonly docentesActivos = signal(0);
  protected readonly solicitudes = signal(0);
  protected readonly cursosPublicados = signal(0);
  protected readonly ticketsAbiertos = signal(0);
  protected readonly auditoria = signal(0);

  protected readonly hoy = new Date();

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const [u, docentes, s, c, tickets, a] = await Promise.all([
        this.adminService.listarUsuarios({ limite: 500 }),
        this.adminService.listarUsuarios({ rol: 'docente', limite: 500 }),
        this.adminService.listarSolicitudesDocente(['pendiente', 'en_revision']),
        this.adminService.listarTodosLosCursos(),
        this.adminService.listarTicketsAdmin(50),
        this.adminService.listarAuditoria(100),
      ]);
      this.usuarios.set(u.length);
      this.docentesActivos.set(docentes.filter((d) => d.estado_cuenta === 'activo').length);
      this.solicitudes.set(s.length);
      this.cursosPublicados.set(c.filter((curso) => curso.estado === 'publicado').length);
      this.ticketsAbiertos.set(tickets.filter((t) => t.estado !== 'cerrado' && t.estado !== 'resuelto').length);
      this.auditoria.set(a.length);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el panel.'); }
    finally { this.cargando.set(false); }
  }
}
