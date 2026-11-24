// @ts-nocheck
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { ForumPanelComponent } from '../../shared/forum-panel/forum-panel.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

interface CursoItem { id: string; titulo: string; }

/** Comunidad del estudiante: foros de sus cursos con temas y respuestas reales. */
@Component({
  selector: 'app-student-community',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ForumPanelComponent, PageHeaderComponent],
  template: `
    <section class="space-y-6">
      <app-page-header titulo="Comunidad" descripcion="Foros de tus cursos: comparte dudas y aprende con tus compañeros y docentes." />
      @if (cargando()) {
        <p class="text-sm text-marine-500">Cargando tus cursos…</p>
      } @else if (error()) {
        <div class="card card-body space-y-2">
          <p class="text-sm text-danger-600">{{ error() }}</p>
          <button type="button" class="btn btn-outline btn-sm" (click)="cargar()">Reintentar</button>
        </div>
      } @else if (cursos().length === 0) {
        <div class="card card-body">
          <p class="text-sm text-marine-500">Aún no tienes cursos matriculados, por lo que no hay comunidades disponibles.</p>
        </div>
      } @else {
        <app-forum-panel [cursos]="cursos()" [usuarioId]="usuarioId()" [puedeModerar]="false" />
      }
    </section>
  `,
})
export class CommunityComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly courseService = inject(CourseService);

  protected readonly cursos = signal<CursoItem[]>([]);
  protected readonly usuarioId = signal('');
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void { void this.cargar(); }

  protected async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const user = this.auth.usuario();
      if (!user) { this.error.set('Debes iniciar sesión.'); return; }
      this.usuarioId.set(user.id);
      const cursos = await this.courseService.listarCursosDeEstudiante(user.id);
      this.cursos.set(cursos.map((c) => ({ id: c.id, titulo: c.titulo })));
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudieron cargar tus cursos.');
    } finally {
      this.cargando.set(false);
    }
  }
}
