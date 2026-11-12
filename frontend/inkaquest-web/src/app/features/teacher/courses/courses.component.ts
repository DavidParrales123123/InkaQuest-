import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { TeacherService } from '../../../core/services/teacher.service';
import { Curso, DocenteCurso } from '../../../core/models/domain.models';
import { DataPanelComponent } from '../../../shared/components/data-panel/data-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { imagenDeCurso } from '../../../shared/utilities/curso-imagen.util';

@Component({
  selector: 'app-teacher-courses',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DataPanelComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Mis cursos" descripcion="Cursos que tienes asignados. Gestiona estructura, lecciones, contenidos y materiales desde cada curso." />
      <app-data-panel [cargando]="cargando()" [error]="error()" [vacio]="cursos().length === 0" tituloVacio="Sin cursos asignados" descripcionVacia="Aún no tienes cursos asignados. Un administrador puede asignarte cursos desde la gestión académica." (alReintentar)="cargar()">
        <div contenido class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (c of cursos(); track c.id) {
            <article class="card overflow-hidden">
              <img [src]="imagen(c.curso.slug)" [alt]="c.curso.titulo" class="aspect-[16/9] w-full object-cover" />
              <div class="card-body">
                <div class="flex items-center justify-between gap-2">
                  <h2 class="font-semibold text-marine-800">{{ c.curso.titulo }}</h2>
                  <app-status-badge [estado]="c.curso.estado" />
                </div>
                <p class="mt-1 text-sm text-marine-500 line-clamp-2">{{ c.curso.descripcion }}</p>
                <p class="mt-2 text-xs text-marine-400">Responsable: {{ c.es_responsable ? 'Si' : 'No' }} · {{ c.curso.xp_total }} XP</p>
                <div class="mt-3 grid grid-cols-2 gap-2">
                  <a [routerLink]="['/docente/cursos', c.curso.id]" class="btn btn-primary btn-sm">Gestionar contenido</a>
                  <a routerLink="/docente/minijuegos" class="btn btn-outline btn-sm">Minijuegos</a>
                  <a [routerLink]="['/cursos', c.curso.slug]" class="btn btn-outline btn-sm col-span-2">Ver ficha pública</a>
                </div>
              </div>
            </article>
          }
        </div>
      </app-data-panel>
      <p class="text-xs text-marine-400">En "Gestionar contenido" puedes crear/editar unidades, módulos y lecciones, y subir recursos/materiales (según permisos RLS y asignación).</p>
    </section>
  `,
})
export class CoursesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly teacherService = inject(TeacherService);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly cursos = signal<(DocenteCurso & { curso: Curso })[]>([]);

  ngOnInit(): void { void this.cargar(); }
  protected imagen(slug: string | null): string { return imagenDeCurso(slug); }
  protected async cargar(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) { this.error.set('Debes iniciar sesión.'); this.cargando.set(false); return; }
    this.cargando.set(true); this.error.set(null);
    try { this.cursos.set(await this.teacherService.listarMisCursos(user.id)); }
    catch (e) { this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar los cursos.'); }
    finally { this.cargando.set(false); }
  }
}
