// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { CourseService } from '../../../core/services/course.service';
import { Categoria } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-admin-categories',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Categorías" descripcion="Categorías del catálogo de cursos." />
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="categorias().length === 0" (alReintentar)="cargar()">
        <div contenido class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          @for (c of categorias(); track c.id) {
            <article class="card card-body">
              <h2 class="font-semibold text-marine-800">{{ c.nombre }}</h2>
              <p class="text-sm text-marine-500">Slug: {{ c.slug }}</p>
              <p class="mt-1 text-sm text-marine-600">{{ c.descripcion || 'Sin descripción.' }}</p>
              <p class="mt-2 text-xs text-marine-400">Estado: {{ c.activo ? 'Activa' : 'Inactiva' }}</p>
            </article>
          }
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">La creación/edición de categorías puede requerir permisos de administrador y validaciones en backend según políticas RLS.</p>
    </section>
  `,
})
export class CategoriesComponent implements OnInit {
  private readonly courseService = inject(CourseService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly categorias = signal<Categoria[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected async cargar(): Promise<void> {
    this.cargando.set(true); this.error.set(null);
    try { this.categorias.set(await this.courseService.listarCategorias()); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar las categorías.'); }
    finally { this.cargando.set(false); }
  }
}
