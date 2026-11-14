import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { AdminService } from '../../../core/services/admin.service';
import { Categoria } from '../../../core/models/domain.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-categories',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Categorías" descripcion="Categorías del catálogo de cursos. Se muestran todas, incluidas las inactivas." [acciones]="true">
        <div acciones><button type="button" class="btn btn-outline btn-sm" (click)="cargar()" [disabled]="cargando()">Actualizar</button></div>
      </app-page-header>
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="categorias().length === 0" tituloVacio="No hay categorías" descripcionVacia="La creación de categorías está reservada al administrador desde base de datos o a través de un flujo backend autorizado." (alReintentar)="cargar()">
        <div contenido class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          @for (c of categorias(); track c.id) {
            <article class="card card-body transition-shadow hover:shadow-card">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <h2 class="truncate font-semibold text-marine-800">{{ c.nombre }}</h2>
                  <p class="font-mono text-[0.7rem] uppercase tracking-wide text-marine-400">{{ c.slug }}</p>
                </div>
                <app-status-badge [estado]="c.activo ? 'activo' : 'eliminado'" />
              </div>
              <p class="mt-2 text-sm leading-snug text-marine-600">{{ c.descripcion || 'Sin descripción.' }}</p>
              <div class="mt-3 flex items-center justify-between border-t border-surface-200 pt-2 text-xs text-marine-400">
                <span>Orden: {{ c.orden ?? '—' }}</span>
                <span>{{ c.activo ? 'Visible en el catálogo' : 'Oculta' }}</span>
              </div>
            </article>
          }
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">Las categorías inactivas no aparecen en el catálogo público, pero sí aquí para revisión.</p>
    </section>
  `,
})
export class CategoriesComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly categorias = signal<Categoria[]>([]);

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.categorias.set(await this.adminService.listarCategoriasAdmin()); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las categorías.'); }
    finally { this.cargando.set(false); }
  }
}
