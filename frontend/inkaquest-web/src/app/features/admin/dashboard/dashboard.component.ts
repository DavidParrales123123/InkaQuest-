// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminService } from '../../../core/services/admin.service';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-admin-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Panel de administración" descripcion="Visión general de usuarios, solicitudes, cursos y actividad reciente." />
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <app-stat-card etiqueta="Usuarios" [valor]="usuarios()" [icono]="true" tono="brand"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Solicitudes docentes" [valor]="solicitudes()" [icono]="true" tono="gold"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Cursos" [valor]="cursos()" [icono]="true" tono="info"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Registros de auditoría" [valor]="auditoria()" [icono]="true" tono="surface"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M10 12h4M10 16h4"/></svg></span></app-stat-card>
      </div>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="false" (alReintentar)="cargar()">
        <div contenido class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a routerLink="/admin/usuarios" class="card card-body hover:border-brand-300"><h2 class="font-semibold">Gestionar usuarios</h2><p class="text-sm text-marine-500">Cuentas, roles y estados.</p></a>
          <a routerLink="/admin/solicitudes" class="card card-body hover:border-brand-300"><h2 class="font-semibold">Solicitudes docentes</h2><p class="text-sm text-marine-500">Revisar y aprobar/rechazar.</p></a>
          <a routerLink="/admin/cursos" class="card card-body hover:border-brand-300"><h2 class="font-semibold">Cursos</h2><p class="text-sm text-marine-500">Catálogo y estados de publicación.</p></a>
          <a routerLink="/admin/pedidos" class="card card-body hover:border-brand-300"><h2 class="font-semibold">Pedidos y pagos</h2><p class="text-sm text-marine-500">Operación comercial.</p></a>
          <a routerLink="/admin/reportes" class="card card-body hover:border-brand-300"><h2 class="font-semibold">Reportes</h2><p class="text-sm text-marine-500">Indicadores y seguimiento.</p></a>
          <a routerLink="/admin/configuracion" class="card card-body hover:border-brand-300"><h2 class="font-semibold">Configuración</h2><p class="text-sm text-marine-500">Parámetros del sistema.</p></a>
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
  protected readonly solicitudes = signal(0);
  protected readonly cursos = signal(0);
  protected readonly auditoria = signal(0);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const [u, s, c, a] = await Promise.all([
        this.adminService.listarUsuarios({ limite: 500 }).catch(() => []),
        this.adminService.listarSolicitudesDocente(['pendiente', 'en_revision']).catch(() => []),
        this.adminService.listarTodosLosCursos().catch(() => []),
        this.adminService.listarAuditoria(50).catch(() => []),
      ]);
      this.usuarios.set(u.length); this.solicitudes.set(s.length); this.cursos.set(c.length); this.auditoria.set(a.length);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el panel.'); }
    finally { this.cargando.set(false); }
  }
}
