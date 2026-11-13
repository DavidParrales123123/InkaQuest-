import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AdminService } from '../../../core/services/admin.service';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-admin-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataPanelComponent, PageHeaderComponent, StatCardComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Reportes" descripcion="Indicadores generales basados en datos disponibles." />
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <app-stat-card etiqueta="Usuarios" [valor]="usuarios()" [icono]="true" tono="brand"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Cursos" [valor]="cursos()" [icono]="true" tono="gold"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Publicados" [valor]="publicados()" [icono]="true" tono="info"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></span></app-stat-card>
        <app-stat-card etiqueta="Acciones auditadas" [valor]="acciones()" [icono]="true" tono="surface"><span icono><svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M10 12h4M10 16h4"/></svg></span></app-stat-card>
      </div>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="false" (alReintentar)="cargar()">
        <div contenido class="card card-body text-sm text-marine-600">
          <p>Los reportes avanzados (ingresos consolidados, embudos, cohortes, exportaciones) requieren endpoints/agregaciones del backend y permisos administrativos adicionales.</p>
          <p class="mt-2">Este panel muestra indicadores básicos calculados desde los registros accesibles vía Supabase/RLS.</p>
        </div>
      </app-data-panel>
    </section>
  `,
})
export class ReportsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly usuarios = signal(0);
  protected readonly cursos = signal(0);
  protected readonly publicados = signal(0);
  protected readonly acciones = signal(0);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try {
      const [u, c, a] = await Promise.all([this.adminService.listarUsuarios({ limite: 1000 }).catch(() => []), this.adminService.listarTodosLosCursos().catch(() => []), this.adminService.listarAuditoria(100).catch(() => [])]);
      this.usuarios.set(u.length); this.cursos.set(c.length); this.publicados.set(c.filter((x) => x.estado === 'publicado').length); this.acciones.set(a.length);
    } catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los reportes.'); }
    finally { this.cargando.set(false); }
  }
}
